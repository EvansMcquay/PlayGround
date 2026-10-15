import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { AssetManager } from './core/AssetManager.js';
import { InputManager } from './core/InputManager.js';
import { AudioSystem } from './core/AudioSystem.js';
import { CharacterRoster } from './characters/CharacterRoster.js';
import { Basketball } from './components/Basketball.js';
import { StreetCourt } from './components/Court.js';
import { MatchManager, MatchRules } from './systems/MatchManager.js';
import { DunkTrickSystem } from './systems/DunkTrickSystem.js';
import { ComboHypeSystem } from './systems/ComboHypeSystem.js';
import { CameraController } from './systems/CameraController.js';
import { OpponentAI } from './systems/OpponentAI.js';
import { UIManager } from './ui/UIManager.js';

class StreetLegendsGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.engine = null;
    this.assetManager = null;
    this.inputManager = null;
    this.audioSystem = null;
    this.characterRoster = null;
    this.matchManager = null;
    this.dunkSystem = null;
    this.hypeSystem = null;
    this.cameraController = null;
    this.uiManager = null;
    
    this.phase = 'loading';
    this.loadingProgress = 0;
    this.lastTime = 0;
    this.running = false;
  }

  async init() {
    this.showLoading('Initializing engine...');
    
    this.engine = new Engine(this.canvas);
    this.engine.game = this;
    
    this.assetManager = new AssetManager(this.engine);
    this.engine.assetManager = this.assetManager;
    
    this.inputManager = new InputManager();
    this.engine.inputManager = this.inputManager;
    
    this.audioSystem = new AudioSystem();
    this.audioSystem.engine = this;
    this.engine.audio = this.audioSystem;
    await this.audioSystem.init();
    
    this.uiManager = new UIManager(this.engine);
    this.engine.uiManager = this.uiManager;
    this.uiManager.createMenu();
    
    this.cameraController = new CameraController(this.engine.camera, this.engine);
    this.engine.cameraController = this.cameraController;
    
    this.characterRoster = new CharacterRoster(this.engine);
    this.engine.characterRoster = this.characterRoster;
    await this.characterRoster.initialize();
    // menu is created before the roster loads — repopulate cards now
    this.uiManager.populateRoster?.();
    
    this.hypeSystem = new ComboHypeSystem(this.engine);
    this.engine.hypeSystem = this.hypeSystem;
    
    this.showLoading('Loading court & systems...');
    
    this.matchManager = new MatchManager(this.engine);
    this.engine.matchManager = this.matchManager;
    
    this.dunkSystem = null;
    
    this.setupGlobalEvents();
    this.hideLoading();
    
    this.phase = 'menu';
    this.running = true;
    this.gameLoop();
    
    console.log('STREET LEGENDS initialized successfully!');
    return this;
  }

  setupGlobalEvents() {
    window.addEventListener('resize', () => this.onResize());
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
      else this.resume();
    });
    
    this.canvas.addEventListener('click', () => {
      if (this.audioSystem.ctx?.state === 'suspended') {
        this.audioSystem.ctx.resume();
      }
    });
  }

  onResize() {
    this.engine.onResize();
    this.cameraController?.onResize?.();
  }

  async startMatch(characterId = 'kai_cenat', mode = '3v3', difficulty = 1.0, venueId = 'cage_nyc') {
    this.showLoading('Setting up the cage...');

    this.uiManager.hide('menu');
    this.uiManager.show('scoreboard');
    this.uiManager.show('ticker');
    this.uiManager.show('hype');
    this.uiManager.show('stamina');
    this.uiManager.show('controls-hint');
    this.uiManager.show('combo-display');
    this.uiManager.show('player-indicator');

    const base = mode === '1v1' ? MatchRules.STREET_1V1 : mode === '2v2' ? MatchRules.STREET_2V2 : MatchRules.STREET_3V3;
    const rules = { ...base };

    await this.matchManager.initialize(rules, characterId, difficulty, venueId);
    this.matchManager.mode = mode;
    
    this.userCharacter = this.matchManager.userCharacter;
    this.setupDunkSystem();
    this.setupPlayerDunkSystems();
    
    this.cameraController.setTarget(this.userCharacter);
    this.uiManager.updatePlayerIndicator(this.userCharacter);
    
    this.phase = 'play';
    this.hideLoading();
  }

  setupDunkSystem() {
    if (this.userCharacter) {
      this.dunkSystem = new DunkTrickSystem(
        this.userCharacter, 
        this.matchManager.ball, 
        this.matchManager.court
      );
      this.userCharacter.dunkSystem = this.dunkSystem;
      this.engine.dunkSystem = this.dunkSystem;
    }
  }

  setupPlayerDunkSystems() {
    this.matchManager.allPlayers.forEach(p => {
      if (p !== this.userCharacter) {
        p.dunkSystem = new DunkTrickSystem(p, this.matchManager.ball, this.matchManager.court);
      }
    });
  }

  gameLoop = () => {
    if (!this.running) return;
    
    const now = performance.now();
    const dt = Math.min(0.033, (now - this.lastTime) / 1000);
    this.lastTime = now;
    
    // Consume input BEFORE snapshotting previous-keys so wasPressed /
    // wasReleased edge detection sees keys that arrived between frames.
    if (this.phase === 'play' && !this.paused) {
      this.update(dt);
    }

    this.inputManager.update();

    this.render();
    
    requestAnimationFrame(this.gameLoop);
  }

  update(dt) {
    this.matchManager.update(dt);
    this.hypeSystem.update(dt);
    this.cameraController.update(dt);
    
    if (this.dunkSystem) {
      this.dunkSystem.update(dt);
    }
    
    this.matchManager.allPlayers.forEach(p => {
      if (p.dunkSystem) p.dunkSystem.update(dt);
    });
    
    this.court?.update?.(this.engine.clock.getElapsedTime(), this.hypeSystem.hype.crowdIntensity);
    
    this.updateUI();
  }

  updateUI() {
    const state = this.matchManager.getState();
    const hype = this.hypeSystem.getUIState();
    const legendOn = !!(hype.legendHome || hype.legendAway);
    if (legendOn !== this._legendShown) {
      this._legendShown = legendOn;
      this.uiManager.showLegendBanner(legendOn);
    }
    
    const ts = this.matchManager.rules.teamSize;
    const modeLabel = this.matchManager.mode || (ts === 1 ? '1v1' : ts === 2 ? '2v2' : '3v3');
    this.uiManager.updateScoreboard(state.score, state.possession, this.matchManager.rules.target, modeLabel);
    this.uiManager.updateHypeMeter(
      hype.hypeHome, hype.hypeAway,
      hype.legendHome, hype.legendAway,
      hype.legendTimeHome, hype.legendTimeAway
    );
    
    if (this.userCharacter) {
      if (this.userCharacter.shotCharging) {
        this.uiManager.showShotMeter(true);
        this.uiManager.updateShotMeter(
          this.userCharacter.shotCharge,
          { center: 0.7, width: 0.15 }
        );
      } else {
        this.uiManager.showShotMeter(false);
      }
      this.uiManager.updateStamina(this.userCharacter.stamina);
      this.uiManager.updateComboDisplay(hype.combo, hype.multiplier, hype.recentTricks);
    }
  }

  render() {
    this.engine.renderer.render(this.engine.scene, this.engine.camera);
  }

  showLoading(text) {
    this.loadingProgress += 10;
    const loading = document.getElementById('loading');
    if (loading) {
      loading.querySelector('p').textContent = text;
      loading.style.display = 'flex';
    }
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }

  setPhase(phase) {
    this.phase = phase;
    
    if (phase === 'menu') {
      this.uiManager.show('menu');
      this.uiManager.hide('scoreboard');
      this.uiManager.hide('ticker');
      this.uiManager.hide('hype');
      this.uiManager.hide('stamina');
      this.uiManager.hide('controls-hint');
      this.uiManager.hide('combo-display');
      this.uiManager.hide('player-indicator');
      this.uiManager.hide('legend-banner');
      this.cameraController.setMode('menu');
    }
  }

  pause() {
    this.paused = true;
    this.uiManager.showPauseMenu();
  }

  resume() {
    this.paused = false;
    this.uiManager.hidePauseMenu();
  }

  dispose() {
    this.running = false;
    this.matchManager?.dispose();
    this.characterRoster?.dispose();
    this.audioSystem?.dispose();
    this.inputManager?.dispose();
    this.uiManager?.dispose();
    this.engine?.dispose();
  }
}

let game = null;

async function startGame() {
  try {
    game = new StreetLegendsGame();
    await game.init();
    window.game = game;
  } catch (e) {
    console.error('Failed to start game:', e);
    const err = document.getElementById('errbox');
    if (err) {
      err.textContent = 'Error: ' + e.message;
      err.classList.remove('hidden');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  startGame();
}

export { StreetLegendsGame };