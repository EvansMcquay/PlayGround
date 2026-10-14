export class UIManager {
  constructor(engine) {
    this.engine = engine;
    this.elements = {};
    this.visible = true;
    this.animations = new Map();
    
    this.createUI();
  }

  createUI() {
    const container = document.getElementById('app');
    if (!container) return;
    
    this.createScoreboard();
    this.createHypeMeter();
    this.createShotMeter();
    this.createStaminaBar();
    this.createGameMessage();
    this.createControlsHint();
    this.createTicker();
    this.createLegendBanner();
    this.createComboDisplay();
    this.createPlayerIndicator();
  }

  createScoreboard() {
    const sb = document.createElement('div');
    sb.id = 'scoreboard';
    sb.className = 'hidden';
    sb.innerHTML = `
      <div class="sb-team home">
        <span id="sb-home-abbr">UPT</span>
        <span id="sb-home-score">0</span>
      </div>
      <div class="sb-mid">
        <div id="sb-target">FIRST TO 21</div>
        <div id="sb-quarter">3v3</div>
      </div>
      <div class="sb-team away">
        <span id="sb-away-score">0</span>
        <span id="sb-away-abbr">DNT</span>
      </div>
    `;
    document.getElementById('app').appendChild(sb);
    this.elements.scoreboard = sb;
  }

  createHypeMeter() {
    const hype = document.createElement('div');
    hype.id = 'hype';
    hype.className = 'hidden';
    hype.innerHTML = `
      <div id="hype-label">🔥 HYPE</div>
      <div id="hype-bar"><div id="hype-fill"></div></div>
      <div id="hype-home" class="hype-team home">UPT: 0%</div>
      <div id="hype-away" class="hype-team away">DNT: 0%</div>
    `;
    document.getElementById('app').appendChild(hype);
    this.elements.hype = hype;
  }

  createShotMeter() {
    const sm = document.createElement('div');
    sm.id = 'shotmeter';
    sm.className = 'hidden';
    sm.innerHTML = `
      <div id="shotmeter-bar">
        <div id="shotmeter-fill"></div>
        <div id="shotmeter-green"></div>
      </div>
      <div id="shotmeter-label">RELEASE</div>
    `;
    document.getElementById('app').appendChild(sm);
    this.elements.shotMeter = sm;
  }

  createStaminaBar() {
    const stam = document.createElement('div');
    stam.id = 'stamina';
    stam.className = 'hidden';
    stam.innerHTML = `
      <div id="stamina-fill"></div>
      <span>STAMINA</span>
    `;
    document.getElementById('app').appendChild(stam);
    this.elements.stamina = stam;
  }

  createGameMessage() {
    const msg = document.createElement('div');
    msg.id = 'game-msg';
    msg.className = 'hidden';
    document.getElementById('app').appendChild(msg);
    this.elements.gameMsg = msg;
  }

  createControlsHint() {
    const hint = document.createElement('div');
    hint.id = 'controls-hint';
    hint.className = 'hidden';
    hint.innerHTML = `
      <b>WASD</b> Move &nbsp; <b>SHIFT</b> Sprint &nbsp; <b>SPACE</b> Shoot/Jump &nbsp; 
      <b>J</b> Crossover &nbsp; <b>Q</b> Pass &nbsp; <b>T</b> Alley-Oop &nbsp; 
      <b>E</b> Steal/Block &nbsp; <b>TAB</b> Switch &nbsp; <b>M</b> Mute
    `;
    document.getElementById('app').appendChild(hint);
    this.elements.controlsHint = hint;
  }

  createTicker() {
    const ticker = document.createElement('div');
    ticker.id = 'ticker';
    ticker.className = 'hidden';
    ticker.innerHTML = `<span id="ticker-text">Welcome to the Cage</span>`;
    document.getElementById('app').appendChild(ticker);
    this.elements.ticker = ticker;
  }

  createLegendBanner() {
    const banner = document.createElement('div');
    banner.id = 'legend-banner';
    banner.className = 'hidden';
    banner.textContent = '👑 LEGEND MODE 👑';
    document.getElementById('app').appendChild(banner);
    this.elements.legendBanner = banner;
  }

  createComboDisplay() {
    const combo = document.createElement('div');
    combo.id = 'combo-display';
    combo.className = 'hidden';
    combo.innerHTML = `
      <div id="combo-counter" class="combo-counter">0</div>
      <div id="combo-multiplier" class="combo-multiplier">x1.0</div>
      <div id="combo-tricks" class="combo-tricks"></div>
    `;
    document.getElementById('app').appendChild(combo);
    this.elements.comboDisplay = combo;
  }

  createPlayerIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'player-indicator';
    indicator.className = 'hidden';
    indicator.innerHTML = `
      <div id="indicator-name"></div>
      <div id="indicator-stats"></div>
    `;
    document.getElementById('app').appendChild(indicator);
    this.elements.playerIndicator = indicator;
  }

  show(elementId) {
    const el = this.elements[elementId] || document.getElementById(elementId);
    if (el) el.classList.remove('hidden');
  }

  hide(elementId) {
    const el = this.elements[elementId] || document.getElementById(elementId);
    if (el) el.classList.add('hidden');
  }

  updateScoreboard(score, possession, target, mode) {
    const homeScore = document.getElementById('sb-home-score');
    const awayScore = document.getElementById('sb-away-score');
    const targetEl = document.getElementById('sb-target');
    const quarterEl = document.getElementById('sb-quarter');
    
    if (homeScore) homeScore.textContent = score.home;
    if (awayScore) awayScore.textContent = score.away;
    if (targetEl) targetEl.textContent = target > 0 ? `FIRST TO ${target}` : `${Math.floor(target / 60)}:${String(target % 60).padStart(2, '0')}`;
    if (quarterEl) quarterEl.textContent = mode;
  }

  updateHypeMeter(home, away, legendHome, legendAway, legendTimeHome, legendTimeAway) {
    const fill = document.getElementById('hype-fill');
    const homeEl = document.getElementById('hype-home');
    const awayEl = document.getElementById('hype-away');
    
    if (fill) fill.style.height = `${Math.max(home, away)}%`;
    if (homeEl) homeEl.textContent = `UPT: ${Math.round(home)}%${legendHome ? ' 👑' : ''}`;
    if (awayEl) awayEl.textContent = `DNT: ${Math.round(away)}%${legendAway ? ' 👑' : ''}`;
    
    if (legendHome && legendTimeHome > 0) {
      homeEl.textContent += ` (${Math.ceil(legendTimeHome)}s)`;
    }
    if (legendAway && legendTimeAway > 0) {
      awayEl.textContent += ` (${Math.ceil(legendTimeAway)}s)`;
    }
  }

  updateShotMeter(charge, greenWindow) {
    const fill = document.getElementById('shotmeter-fill');
    const green = document.getElementById('shotmeter-green');
    
    if (fill) fill.style.height = `${charge * 100}%`;
    if (green && greenWindow) {
      green.style.bottom = `${(greenWindow.center - greenWindow.width / 2) * 100}%`;
      green.style.height = `${greenWindow.width * 100}%`;
    }
  }

  showShotMeter(show) {
    const sm = document.getElementById('shotmeter');
    if (sm) sm.classList.toggle('hidden', !show);
  }

  updateStamina(stamina) {
    const fill = document.getElementById('stamina-fill');
    if (fill) fill.style.width = `${stamina * 100}%`;
  }

  showMessage(text, duration = 1500) {
    const msg = this.elements.gameMsg;
    if (!msg) return;
    
    msg.textContent = text;
    msg.classList.remove('hidden');
    
    this.animate(msg, 'popIn', 300);
    
    clearTimeout(msg.hideTimer);
    msg.hideTimer = setTimeout(() => {
      this.animate(msg, 'popOut', 300).then(() => msg.classList.add('hidden'));
    }, duration);
  }

  updateTicker(text) {
    const tickerText = document.getElementById('ticker-text');
    if (tickerText) tickerText.textContent = text;
  }

  showLegendBanner(show) {
    const banner = this.elements.legendBanner;
    if (banner) {
      banner.classList.toggle('hidden', !show);
      if (show) this.animate(banner, 'pulse', 1000);
    }
  }

  updateComboDisplay(combo, multiplier, tricks) {
    const counter = document.getElementById('combo-counter');
    const mult = document.getElementById('combo-multiplier');
    const tricksEl = document.getElementById('combo-tricks');
    
    if (counter) counter.textContent = combo;
    if (mult) mult.textContent = `x${multiplier.toFixed(1)}`;
    if (tricksEl && tricks.length > 0) {
      tricksEl.innerHTML = tricks.map(t => `<span class="trick-tag">${t.name}</span>`).join('');
    }
    
    if (combo >= 3) {
      this.show('combo-display');
      if (combo >= 5) counter.classList.add('combo-fire');
      if (combo >= 8) counter.classList.add('combo-lightning');
    } else {
      this.hide('combo-display');
      counter.classList.remove('combo-fire', 'combo-lightning');
    }
  }

  updatePlayerIndicator(character) {
    const nameEl = document.getElementById('indicator-name');
    const statsEl = document.getElementById('indicator-stats');
    
    if (nameEl) nameEl.textContent = character.name;
    if (statsEl) {
      statsEl.innerHTML = `
        <span>${character.attributes.speed.toFixed(1)} SPD</span>
        <span>${character.attributes.dunk.toFixed(0)} DNK</span>
        <span>${character.attributes.shoot.toFixed(0)} SHT</span>
        <span>${character.attributes.handles.toFixed(0)} HND</span>
        <span>${character.attributes.defense.toFixed(0)} DEF</span>
      `;
    }
  }

  showGameOver(data) {
    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.innerHTML = `
      <div class="game-over-modal">
        <h1>${data.winner === 'home' ? 'UPTOWN WINS! 🏆' : 'DOWNTOWN WINS! 🏆'}</h1>
        <div class="final-score">${data.score.home} - ${data.score.away}</div>
        <div class="mvp">👑 MVP: ${data.mvp?.name || 'N/A'} (${data.mvp?.stats.pts || 0} PTS)</div>
        <div class="stats">
          ${this.formatTeamStats('UPT', data.stats.home)}
          ${this.formatTeamStats('DNT', data.stats.away)}
        </div>
        <div class="game-over-buttons">
          <button id="btn-rematch">🔥 REMATCH</button>
          <button id="btn-menu" class="ghost">MENU</button>
        </div>
      </div>
    `;
    document.getElementById('app').appendChild(overlay);
    
    document.getElementById('btn-rematch')?.addEventListener('click', () => {
      this.engine.matchManager?.initialize?.(this.engine.matchManager.rules, this.engine.matchManager.userCharacter?.id, this.engine.matchManager.difficulty);
      overlay.remove();
    });
    
    document.getElementById('btn-menu')?.addEventListener('click', () => {
      this.engine.setPhase('menu');
      overlay.remove();
    });
  }

  formatTeamStats(abbr, stats) {
    return `
      <div class="team-stats">
        <h3>${abbr}</h3>
        <div>FG: ${stats.fgm}/${stats.fga}</div>
        <div>3PT: ${stats.tpm}</div>
        <div>DUNKS: ${stats.dunks}</div>
        <div>STL: ${stats.steals} | BLK: ${stats.blocks} | TO: ${stats.turnovers}</div>
      </div>
    `;
  }

  createMenu() {
    const menu = document.createElement('div');
    menu.id = 'menu';
    menu.innerHTML = `
      <div class="menu-card wide">
        <div class="logo-row"><span class="ball">🏀</span><h1>STREET <span>LEGENDS</span></h1></div>
        <p class="tagline">NYC Night Streetball • Arcade 1v1 & 3v3 • Hype-fueled Legend Mode</p>
        
        <div class="mode-row">
          <button id="mode-1v1" class="mode-btn">1v1 BATTLE</button>
          <button id="mode-3v3" class="mode-btn selected">3v3 SHOWDOWN</button>
        </div>
        
        <label class="sec-label">CHOOSE YOUR LEGEND</label>
        <div id="roster" class="roster-grid"></div>
        
        <div class="menu-grid">
          <div>
            <label>TARGET SCORE</label>
            <select id="opt-target"><option value="11">11 (Quick)</option><option value="21" selected>21 (Classic)</option></select>
          </div>
          <div>
            <label>DIFFICULTY</label>
            <select id="opt-diff"><option value="0.8">Rookie</option><option value="1.0" selected>Pro</option><option value="1.25">Street King</option></select>
          </div>
        </div>
        
        <div class="btn-row">
          <button id="btn-play">🔥 &nbsp;RUN IT</button>
          <button id="btn-howto" class="ghost">CONTROLS</button>
        </div>
        
        <div id="howto" class="hidden">
          <p><b>WASD / Arrows</b> — move &nbsp; <b>SHIFT</b> — sprint &nbsp; <b>Mouse drag</b> — camera, <b>wheel</b> — zoom, <b>R</b> — reset cam</p>
          <p><b>SPACE (hold → release)</b> — shoot. Release in the green for a guaranteed bucket. Drive + shoot close = monster dunk.</p>
          <p><b>J</b> — crossover (break ankles!), <b>Q</b> — pass, <b>T</b> — alley-oop lob, <b>E</b> — steal / block.</p>
          <p>Fill the <b>🔥 HYPE</b> meter with crossovers, dunks, greens and blocks to unlock <b>LEGEND MODE</b>. Inside arc = 1 pt, outside = 2 pts. No out of bounds — the cage keeps it in!</p>
        </div>
        <p class="foot">Fan-made arcade hoops game. Built with Three.js + WebAudio.</p>
      </div>
    `;
    document.getElementById('app').appendChild(menu);
    this.elements.menu = menu;
    
    this.populateRoster();
    this.bindMenuEvents();
  }

  populateRoster() {
    const roster = this.engine.characterRoster;
    const container = document.getElementById('roster');
    if (!container || !roster) return;
    
    container.innerHTML = '';
    
    const allChars = [...roster.getStreamerLegends(), ...roster.getOriginalLegends()];
    
    allChars.forEach((data, i) => {
      const card = document.createElement('div');
      card.className = 'legend-card' + (i === 0 ? ' selected' : '');
      card.dataset.id = data.id;
      
      const bar = (v) => `<div class="bar"><i style="width:${v}%"></i></div>`;
      
      card.innerHTML = `
        <h3>#${data.num || 0} ${data.name}</h3>
        <div class="aka">${data.aka}</div>
        <div class="bars">
          SPD${bar(data.attributes.speed * 10)}
          DNK${bar(data.attributes.dunk)}
          SHT${bar(data.attributes.shoot)}
          HND${bar(data.attributes.handles)}
          DEF${bar(data.attributes.defense)}
        </div>
        <div class="special">⭐ ${data.signatureDunk.replace(/_/g, ' ').toUpperCase()}</div>
      `;
      
      card.addEventListener('click', () => {
        document.querySelectorAll('.legend-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedCharacterId = data.id;
        this.engine.audio?.blip?.(600 + i * 80, 0.1, 'square', 0.1);
      });
      
      container.appendChild(card);
    });
    
    this.selectedCharacterId = allChars[0]?.id;
  }

  bindMenuEvents() {
    const mode1v1 = document.getElementById('mode-1v1');
    const mode3v3 = document.getElementById('mode-3v3');
    const btnPlay = document.getElementById('btn-play');
    const btnHowto = document.getElementById('btn-howto');
    const howto = document.getElementById('howto');
    
    mode1v1?.addEventListener('click', () => {
      this.selectedMode = '1v1';
      mode1v1.classList.add('selected');
      mode3v3.classList.remove('selected');
      document.getElementById('opt-target').value = '11';
    });
    
    mode3v3?.addEventListener('click', () => {
      this.selectedMode = '3v3';
      mode3v3.classList.add('selected');
      mode1v1.classList.remove('selected');
      document.getElementById('opt-target').value = '21';
    });
    
    btnPlay?.addEventListener('click', () => this.startGame());
    btnHowto?.addEventListener('click', () => howto.classList.toggle('hidden'));
  }

  startGame() {
    const target = parseInt(document.getElementById('opt-target').value, 10);
    const diff = parseFloat(document.getElementById('opt-diff').value);
    const mode = this.selectedMode || '3v3';
    const charId = this.selectedCharacterId || 'kai_cenat';
    
    const rules = mode === '1v1' ? { ...MatchRules.STREET_1V1, target } : { ...MatchRules.STREET_3V3, target };
    
    this.hide('menu');
    this.show('scoreboard');
    this.show('ticker');
    this.show('hype');
    this.show('stamina');
    this.show('controls-hint');
    this.show('combo-display');
    this.show('player-indicator');
    
    this.engine.matchManager.initialize(rules, charId, diff);
    this.engine.setPhase('play');
  }

  showPauseMenu() {
    const pause = document.createElement('div');
    pause.id = 'pause';
    pause.innerHTML = `
      <div class="menu-card small">
        <h2>PAUSED</h2>
        <div class="btn-row">
          <button id="btn-resume">RESUME</button>
          <button id="btn-quit" class="ghost">QUIT</button>
        </div>
        <div class="cam-row"><label><input type="checkbox" id="opt-autocam" checked /> Broadcast auto-follow cam</label></div>
      </div>
    `;
    document.getElementById('app').appendChild(pause);
    this.elements.pause = pause;
    
    document.getElementById('btn-resume')?.addEventListener('click', () => this.engine.setPhase('play'));
    document.getElementById('btn-quit')?.addEventListener('click', () => this.quitToMenu());
  }

  hidePauseMenu() {
    this.elements.pause?.remove();
    this.elements.pause = null;
  }

  quitToMenu() {
    this.engine.matchManager.dispose();
    this.engine.setPhase('menu');
    this.show('menu');
    this.hide('scoreboard');
    this.hide('ticker');
    this.hide('hype');
    this.hide('stamina');
    this.hide('controls-hint');
    this.hide('combo-display');
    this.hide('player-indicator');
    this.hide('legend-banner');
  }

  animate(element, animation, duration) {
    return new Promise(resolve => {
      element.classList.add(`anim-${animation}`);
      setTimeout(() => {
        element.classList.remove(`anim-${animation}`);
        resolve();
      }, duration);
    });
  }

  dispose() {
    Object.values(this.elements).forEach(el => el?.remove());
    this.elements = {};
  }
}

export const MatchRules = {
  STREET_1V1: { target: 11, winBy2: false, timeLimit: 0, makeItTakeIt: true },
  STREET_3V3: { target: 21, winBy2: true, timeLimit: 0, makeItTakeIt: false },
};