import * as THREE from 'three';
import { Basketball } from '../components/Basketball.js';
import { StreetCourt } from '../components/Court.js';
import { OpponentAI } from './OpponentAI.js';

export const MatchPhase = {
  MENU: 'menu',
  INTRO: 'intro',
  TIP_OFF: 'tip_off',
  PLAY: 'play',
  DEAD_BALL: 'dead_ball',
  REPLAY: 'replay',
  GAME_OVER: 'game_over',
};

export const MatchRules = {
  STREET_1V1: { target: 11, winBy2: false, timeLimit: 0, makeItTakeIt: true, teamSize: 1 },
  STREET_2V2: { target: 15, winBy2: false, timeLimit: 0, makeItTakeIt: false, teamSize: 2 },
  STREET_3V3: { target: 21, winBy2: true, timeLimit: 0, makeItTakeIt: false, teamSize: 3 },
  TIMED_1V1: { target: 0, winBy2: false, timeLimit: 300, makeItTakeIt: true, teamSize: 1 },
  TIMED_3V3: { target: 0, winBy2: false, timeLimit: 600, makeItTakeIt: false, teamSize: 3 },
};

export class MatchManager {
  constructor(engine) {
    this.engine = engine;
    this.phase = MatchPhase.MENU;
    this.rules = MatchRules.STREET_3V3;
    
    this.court = null;
    this.ball = null;
    this.homeTeam = [];
    this.awayTeam = [];
    this.allPlayers = [];
    
    this.userCharacter = null;
    this.userIndex = 0;
    
    this.score = { home: 0, away: 0 };
    this.possession = 'home';
    this.lastScoreTeam = null;
    this.lastTouch = null;
    
    this.clock = 0;
    this.shotClock = 24;
    this.shotClockMax = 24;
    this.shotClockRunning = false;
    
    this.tipOffTimer = 0;
    this.deadBallTimer = 0;
    this.replayTimer = 0;
    
    this.difficulty = 1.0;
    this.quarter = 1;
    this.maxQuarters = 1;
    
    this.gameStartTime = 0;
    this.matchStats = {
      home: { fgm: 0, fga: 0, tpm: 0, dunks: 0, steals: 0, blocks: 0, turnovers: 0 },
      away: { fgm: 0, fga: 0, tpm: 0, dunks: 0, steals: 0, blocks: 0, turnovers: 0 },
    };
    
    this.aiControllers = new Map();
    this.eventCallbacks = new Map();
  }

  async initialize(rules = MatchRules.STREET_3V3, userCharId = 'kai_cenat', difficulty = 1.0, venueId = 'cage_nyc') {
    this.rules = rules;
    this.difficulty = difficulty;
    this.venueId = venueId;

    this.court = new StreetCourt();
    await this.court.build(this.engine, venueId);
    
    this.ball = new Basketball();
    this.ball.mesh = this.ball.createMesh(this.ball.createProceduralMaterial());
    this.engine.scene.add(this.ball.mesh);
    
    await this.createTeams(userCharId);
    this.setupAI();
    this.positionPlayersForTipOff();
    
    this.phase = MatchPhase.INTRO;
    this.startIntroSequence();
    
    return this;
  }

  async createTeams(userCharId) {
    const roster = this.engine.characterRoster;
    const count = this.rules.teamSize || (this.rules.target <= 11 ? 1 : 3);
    
    const userChar = await roster.loadCharacter(userCharId);
    if (!userChar) throw new Error(`Character ${userCharId} not found`);
    
    this.userCharacter = await roster.createPlayerInstance(userCharId, 'home');
    this.userCharacter.isHome = true;
    this.userCharacter.engine = this.engine;
    this.homeTeam.push(this.userCharacter);
    this.engine.scene.add(this.userCharacter.root);
    
    const allIds = roster.getAllPlayableData().map(d => d.id).filter(id => id !== userCharId);
    const pickUnique = (used) => {
      const avail = allIds.filter(id => !used.has(id));
      const id = avail[Math.floor(Math.random() * avail.length)];
      used.add(id);
      return id;
    };
    const used = new Set([userCharId]);
    for (let i = 1; i < count; i++) {
      const instance = await roster.createPlayerInstance(pickUnique(used), 'home');
      instance.isHome = true;
      instance.engine = this.engine;
      this.homeTeam.push(instance);
      this.engine.scene.add(instance.root);
    }

    for (let i = 0; i < count; i++) {
      const instance = await roster.createPlayerInstance(pickUnique(used), 'away');
      instance.isHome = false;
      instance.engine = this.engine;
      this.awayTeam.push(instance);
      this.engine.scene.add(instance.root);
    }
    
    this.allPlayers = [...this.homeTeam, ...this.awayTeam];
  }

  setupAI() {
    this.allPlayers.forEach(p => {
      if (p !== this.userCharacter) {
        const ai = new OpponentAI(p, this);
        this.aiControllers.set(p.id, ai);
      }
    });
  }

  positionPlayersForTipOff() {
    const centerCourt = new THREE.Vector3(0, 0, 0);
    const radius = 2.5;
    
    this.allPlayers.forEach((p, i) => {
      const angle = (i / this.allPlayers.length) * Math.PI * 2;
      const side = p.isHome ? 1 : -1;
      p.position.set(
        Math.cos(angle) * radius * side,
        0,
        Math.sin(angle) * radius
      );
      p.velocity.set(0, 0, 0);
      p.state.grounded = true;
      p.state.hasBall = false;
      p.root.position.copy(p.position);
    });
    
    this.ball.position.set(0, 4, 0);
    this.ball.velocity.set(0, 0, 0);
    this.ball.state = 'loose';
    this.ball.holder = null;
  }

  startIntroSequence() {
    this.engine.cameraController.setMode('intro');
    
    this.allPlayers.forEach((p, i) => {
      if (p.animationController) {
        setTimeout(() => {
          p.animationController.play('intro_confident', { layer: 0, clampWhenFinished: true });
        }, i * 300);
      }
    });
    
    setTimeout(() => {
      this.startTipOff();
    }, 3000);
  }

  startTipOff() {
    this.phase = MatchPhase.TIP_OFF;
    this.tipOffTimer = 2.0;
    
    this.engine.cameraController.setMode('gameplay');
    this.engine.cameraController.setTarget(this.userCharacter);
    
    const centers = this.allPlayers.filter(p => p.attributes.vertical > 80);
    centers.forEach(c => {
      if (c.jumpV === 0 && c.jumpY === 0) {
        c.jumpV = 6 + Math.random() * 2;
      }
    });
    
    this.engine.showMessage?.('TIP OFF! 🏀', 1500);
    this.engine.audio?.playWhistle?.();
  }

  startPlay() {
    this.phase = MatchPhase.PLAY;
    this.shotClock = this.shotClockMax;
    this.shotClockRunning = true;
    this.gameStartTime = this.engine.clock.getElapsedTime();
    
    this.engine.hypeSystem?.resetCombo?.();
  }

  update(dt) {
    if (this.phase === MatchPhase.MENU || this.phase === MatchPhase.GAME_OVER) return;
    
    if (this.phase === MatchPhase.TIP_OFF) {
      this.updateTipOff(dt);
    } else if (this.phase === MatchPhase.PLAY) {
      this.updatePlay(dt);
    } else if (this.phase === MatchPhase.DEAD_BALL) {
      this.updateDeadBall(dt);
    } else if (this.phase === MatchPhase.REPLAY) {
      this.updateReplay(dt);
    }
    
    this.updateAI(dt);
    this.updateBall(dt);
    this.updateClocks(dt);
    this.checkGameEnd();
  }

  updateTipOff(dt) {
    this.tipOffTimer -= dt;
    
    this.allPlayers.forEach(p => {
      if (p.jumpV !== 0 || p.jumpY > 0) {
        p.jumpY += p.jumpV * dt;
        p.jumpV += this.ball.gravity * dt;
        if (p.jumpY <= 0) { p.jumpY = 0; p.jumpV = 0; }
      }
    });
    
    this.ball.velocity.y += this.ball.gravity * dt;
    this.ball.position.addScaledVector(this.ball.velocity, dt);
    
    if (this.ball.position.y <= this.ball.radius) {
      this.ball.position.y = this.ball.radius;
      this.ball.velocity.y = Math.abs(this.ball.velocity.y) * 0.6;
    }
    
    if (this.tipOffTimer <= 0) {
      this.awardTipOff();
    }
  }

  awardTipOff() {
    const homeJumper = this.homeTeam.find(p => p.attributes.vertical > 75);
    const awayJumper = this.awayTeam.find(p => p.attributes.vertical > 75);
    
    let winner = Math.random() < 0.5 ? homeJumper : awayJumper;
    if (!winner) winner = this.homeTeam[0];
    
    this.ball.state = 'held';
    this.ball.holder = winner;
    winner.state.hasBall = true;
    this.possession = winner.isHome ? 'home' : 'away';
    this.lastTouch = winner;
    
    this.startPlay();
  }

  updatePlay(dt) {
    this.allPlayers.forEach(p => {
      p.update?.(dt);
    });
    
    if (this.userCharacter) {
      this.handleUserInput(dt);
    }
  }

  handleUserInput(dt) {
    const input = this.engine.inputManager;
    if (!input) return;
    
    const u = this.userCharacter;
    
    if (input.isPressed('Space') && u.state.hasBall && !u.state.dunking) {
      if (!u.shotCharging) {
        u.shotCharging = true;
        u.shotCharge = 0;
      }
    }
    
    if (input.wasReleased('Space') && u.shotCharging) {
      u.shotCharging = false;
      if (u.shootBall) u.shootBall(u.shotCharge);
      u.shotCharge = 0;
    }
    
    if (u.shotCharging) {
      u.shotCharge = Math.min(1, u.shotCharge + dt * 1.2);
    }
    
    if (input.wasPressed?.('KeyJ') && u.state.hasBall) u.doTrickMove?.('crossover');
    if (input.wasPressed?.('KeyK') && u.state.hasBall) u.doTrickMove?.('behind_back');
    if (input.wasPressed?.('KeyL') && u.state.hasBall) u.doTrickMove?.('spin');
    if (input.wasPressed?.('KeyH') && u.state.hasBall) u.doTrickMove?.('hesitation');
    
    if (input.isPressed('KeyQ') && u.state.hasBall) {
      const target = this.findOpenTeammate(u);
      if (target && u.passBall) u.passBall(target);
    }
    
    if (input.isPressed('KeyT') && u.state.hasBall) {
      const target = this.findCuttingTeammate(u);
      if (target && u.throwAlleyOop) u.throwAlleyOop(target);
    }
    
    if (input.isPressed('KeyE') && !u.state.hasBall) {
      u.trySteal?.();
    }
    
    if (input.isPressed('Space') && !u.state.hasBall && u.jumpY === 0) {
      u.jumpV = 5;
      u.contestT = 1.0;
    }
    
    this.handleMovementInput(u, input);
  }

  handleMovementInput(character, input) {
    let moveX = 0, moveZ = 0;
    
    if (input.isPressed('KeyW') || input.isPressed('ArrowUp')) moveZ -= 1;
    if (input.isPressed('KeyS') || input.isPressed('ArrowDown')) moveZ += 1;
    if (input.isPressed('KeyA') || input.isPressed('ArrowLeft')) moveX -= 1;
    if (input.isPressed('KeyD') || input.isPressed('ArrowRight')) moveX += 1;
    
    const sprint = input.isPressed('ShiftLeft') || input.isPressed('ShiftRight');
    
    if (moveX !== 0 || moveZ !== 0) {
      const cam = this.engine.cameraController;
      const cos = Math.cos(-cam.yaw), sin = Math.sin(-cam.yaw);
      const worldX = moveX * cos - moveZ * sin;
      const worldZ = moveX * sin + moveZ * cos;
      
      const dir = new THREE.Vector3(worldX, 0, worldZ).normalize();
      character.faceDirection.lerp(dir, 0.2).normalize();
      
      const speed = character.attributes.speed * (sprint ? 1.25 : 0.85) * (0.7 + character.stamina * 0.3);
      character.velocity.x += worldX * 25 * dt;
      character.velocity.z += moveZ * 25 * dt;
      
      const sp = character.velocity.length();
      if (sp > speed) character.velocity.multiplyScalar(speed / sp);
      
      if (sprint) character.stamina = Math.max(0.1, character.stamina - 0.01);
    } else {
      character.velocity.multiplyScalar(0.9);
      character.stamina = Math.min(1, character.stamina + 0.005);
    }
  }

  findOpenTeammate(character) {
    const teammates = this.getTeammates(character);
    let best = null, bestScore = -1;
    
    teammates.forEach(t => {
      const defender = this.getNearestDefender(t);
      const dist = defender ? t.position.distanceTo(defender.position) : 10;
      const score = dist - t.position.distanceTo(character.position) * 0.1;
      if (score > bestScore) { bestScore = score; best = t; }
    });
    
    return best;
  }

  findCuttingTeammate(character) {
    const teammates = this.getTeammates(character);
    const rimSide = this.getTargetRimSide(character);
    const rimPos = this.court.getRimPosition(rimSide);
    
    return teammates.find(t => 
      t.position.distanceTo(rimPos) < 6 && 
      t.velocity.length() > 3
    );
  }

  getTargetRimSide(character) {
    return Math.abs(character.position.x - 12.7) < Math.abs(character.position.x + 12.7) ? 'east' : 'west';
  }

  updateAI(dt) {
    this.aiControllers.forEach((ai, char) => {
      ai.update(dt);
    });
  }

  updateBall(dt) {
    this.ball.update(dt, this.court);
    
    if (this.ball.state === 'held' && this.ball.holder) {
      this.lastTouch = this.ball.holder;
      if (!this.shotClockRunning) {
        this.shotClock = this.shotClockMax;
        this.shotClockRunning = true;
      }
    }
    
    if (this.ball.shotInfo && this.ball.shotInfo.counted) {
      this.onShotMade(this.ball.shotInfo);
    }
  }

  updateClocks(dt) {
    if (this.rules.timeLimit > 0) {
      this.clock -= dt;
      if (this.clock <= 0) this.endGame();
    }
    
    if (this.shotClockRunning) {
      this.shotClock -= dt;
      if (this.shotClock <= 0) {
        this.shotClockViolation();
      }
    }
  }

  onShotMade(info) {
    const shooter = info.shooter;
    const isHome = shooter.isHome;
    const pts = info.isThree ? 2 : 1;
    
    this.score[isHome ? 'home' : 'away'] += pts;
    this.lastScoreTeam = isHome ? 'home' : 'away';
    
    this.matchStats[isHome ? 'home' : 'away'].fgm++;
    this.matchStats[isHome ? 'home' : 'away'].fga++;
    if (info.isThree) this.matchStats[isHome ? 'home' : 'away'].tpm++;
    if (info.isDunk) this.matchStats[isHome ? 'home' : 'away'].dunks++;
    
    if (shooter === this.userCharacter) {
      this.engine.hypeSystem?.onShotMade?.(shooter, info.green, info.isThree, info.isDunk);
    }
    
    this.engine.showMessage?.(info.isDunk ? 'SLAM! 🔨' : info.isThree ? 'DEUCE! 🎯' : info.green ? 'GREEN! 💦' : 'BUCKET!', 1200);
    
    this.startDeadBall();
  }

  shotClockViolation() {
    this.engine.showMessage?.('SHOT CLOCK VIOLATION ⏰', 1500);
    this.engine.audio?.playWhistle?.();
    this.turnover(!this.ball.holder?.isHome);
  }

  turnover(toTeam) {
    this.possession = toTeam ? 'home' : 'away';
    this.startDeadBall();
  }

  startDeadBall() {
    this.phase = MatchPhase.DEAD_BALL;
    this.deadBallTimer = 1.5;
    this.shotClockRunning = false;
    this.shotClock = this.shotClockMax;
    
    this.allPlayers.forEach(p => {
      p.velocity.multiplyScalar(0.5);
    });
    
    if (this.checkGameEnd()) return;
    
    if (this.rules.makeItTakeIt) {
      this.possession = this.lastScoreTeam;
    } else {
      this.possession = this.lastScoreTeam === 'home' ? 'away' : 'home';
    }
  }

  updateDeadBall(dt) {
    this.deadBallTimer -= dt;
    
    if (this.deadBallTimer <= 0) {
      this.inboundBall();
    }
  }

  inboundBall() {
    const inbounder = this.possession === 'home' ? this.homeTeam[0] : this.awayTeam[0];
    
    this.allPlayers.forEach(p => {
      p.state.hasBall = false;
    });
    
    this.ball.state = 'held';
    this.ball.holder = inbounder;
    inbounder.state.hasBall = true;
    this.lastTouch = inbounder;
    
    if (this.possession === 'home' && inbounder !== this.userCharacter) {
      this.userCharacter = inbounder;
      this.engine.cameraController.setTarget(this.userCharacter);
    }
    
    this.phase = MatchPhase.PLAY;
    this.shotClockRunning = true;
  }

  checkGameEnd() {
    const target = this.rules.target;
    const homeScore = this.score.home;
    const awayScore = this.score.away;
    
    if (target > 0) {
      if (homeScore >= target || awayScore >= target) {
        if (this.rules.winBy2 && Math.abs(homeScore - awayScore) < 2) {
          return false;
        }
        this.endGame();
        return true;
      }
    } else if (this.clock <= 0) {
      this.endGame();
      return true;
    }
    
    return false;
  }

  endGame() {
    this.phase = MatchPhase.GAME_OVER;
    this.engine.showMessage?.('GAME OVER! 🏁', 3000);
    
    const winner = this.score.home > this.score.away ? 'home' : 'away';
    const mvp = this.calculateMVP();
    
    this.engine.uiManager?.showGameOver?.({
      winner,
      score: this.score,
      mvp,
      stats: this.matchStats,
    });
  }

  calculateMVP() {
    let best = null, bestScore = -1;
    
    this.allPlayers.forEach(p => {
      const score = p.stats.pts * 2 + p.stats.ast + p.stats.stl * 2 + p.stats.blk * 2 + p.stats.dunk * 3;
      if (score > bestScore) { bestScore = score; best = p; }
    });
    
    return best;
  }

  getTeammates(character) {
    return character.isHome ? this.homeTeam : this.awayTeam;
  }

  getOpponents(character) {
    return character.isHome ? this.awayTeam : this.homeTeam;
  }

  getNearestDefender(character) {
    const opponents = this.getOpponents(character);
    let nearest = null, minDist = Infinity;
    
    opponents.forEach(opp => {
      const dist = character.position.distanceTo(opp.position);
      if (dist < minDist) { minDist = dist; nearest = opp; }
    });
    
    return nearest;
  }

  updateReplay(dt) {
    this.replayTimer -= dt;
    if (this.replayTimer <= 0) {
      this.phase = MatchPhase.PLAY;
    }
  }

  triggerReplay(clipData) {
    if (this.phase !== MatchPhase.PLAY) return;
    this.phase = MatchPhase.REPLAY;
    this.replayTimer = 3;
    this.engine.cameraController.startReplay(clipData, 3);
  }

  onSteal(stealer) {
    this.matchStats[stealer.isHome ? 'home' : 'away'].steals++;
    if (stealer === this.userCharacter) {
      this.engine.hypeSystem?.onSteal?.(stealer);
    }
  }

  onBlock(blocker) {
    this.matchStats[blocker.isHome ? 'home' : 'away'].blocks++;
    if (blocker === this.userCharacter) {
      this.engine.hypeSystem?.onBlock?.(blocker);
    }
  }

  onTurnover(team) {
    this.matchStats[team].turnovers++;
  }

  onDunk(dunker) {
    this.matchStats[dunker.isHome ? 'home' : 'away'].dunks++;
  }

  getState() {
    return {
      phase: this.phase,
      score: { ...this.score },
      possession: this.possession,
      clock: this.clock,
      shotClock: Math.ceil(this.shotClock),
      quarter: this.quarter,
      userCharacter: this.userCharacter?.id,
    };
  }

  dispose() {
    this.aiControllers.forEach(ai => ai.dispose());
    this.aiControllers.clear();
    this.court?.dispose();
    this.ball?.dispose();
    this.allPlayers.forEach(p => {
      this.engine.scene.remove(p.root);
      p.dispose();
    });
  }
}