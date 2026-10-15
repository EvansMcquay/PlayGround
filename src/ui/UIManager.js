import { MatchRules as EngineMatchRules } from '../systems/MatchManager.js';

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

    // index.html ships static shells for these IDs — remove them so the
    // nodes UIManager builds below stay unique (duplicate IDs break
    // getElementById lookups for messages, meters, and hints).
    ['scoreboard', 'hype', 'shotmeter', 'stamina', 'game-msg', 'controls-hint',
     'ticker', 'legend-banner', 'combo-display', 'player-indicator'
    ].forEach(id => document.getElementById(id)?.remove());

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
      <b>J</b> Cross &nbsp; <b>K</b> Behind-back &nbsp; <b>L</b> Spin &nbsp; <b>H</b> Hezi &nbsp;
      <b>Q</b> Pass &nbsp; <b>T</b> Alley-Oop &nbsp;
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
    const kotc = this.engine.kotc;
    const won = data.winner === 'home';
    const lastStage = kotc ? kotc.stage >= kotc.stages.length - 1 : true;
    const kotcDone = kotc && won && lastStage;
    const kotcNext = kotc && won && !lastStage;
    const kotcOut = kotc && !won;
    const title = kotcDone
      ? '👑 KING OF THE COURT! 👑'
      : kotcNext
        ? `ROUND ${kotc.stage + 1} CLEARED! 👑`
        : kotcOut
          ? 'DETHRONED 👑💔'
          : (data.winner === 'home' ? 'UPTOWN WINS! 🏆' : 'DOWNTOWN WINS! 🏆');
    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.innerHTML = `
      <div class="game-over-modal">
        <h1>${title}</h1>
        ${kotc ? `<div class="aka">KING OF THE COURT — ROUND ${Math.min(kotc.stage + 1, kotc.stages.length)}/3</div>` : ''}
        <div class="final-score">${data.score.home} - ${data.score.away}</div>
        <div class="mvp">👑 MVP: ${data.mvp?.name || 'N/A'} (${data.mvp?.stats.pts || 0} PTS)</div>
        <div class="stats">
          ${this.formatTeamStats('UPT', data.stats.home)}
          ${this.formatTeamStats('DNT', data.stats.away)}
        </div>
        <div class="game-over-buttons">
          ${kotcNext ? '<button id="btn-kotc-next">👑 NEXT ROUND</button>' : ''}
          <button id="btn-rematch">🔥 REMATCH</button>
          <button id="btn-menu" class="ghost">MENU</button>
        </div>
      </div>
    `;
    document.getElementById('app').appendChild(overlay);

    document.getElementById('btn-kotc-next')?.addEventListener('click', () => {
      kotc.stage++;
      const mm = this.engine.matchManager;
      overlay.remove();
      mm.initialize(mm.rules, kotc.charId, kotc.stages[kotc.stage], kotc.venueId);
      this.engine.showMessage?.(`👑 KOTC ROUND ${kotc.stage + 1}/3 — RIVALS AT ${kotc.stages[kotc.stage].toFixed(2)}x`, 2200);
    });

    document.getElementById('btn-rematch')?.addEventListener('click', () => {
      if (kotc) kotc.stage = Math.max(0, kotc.stage);
      this.engine.matchManager?.initialize?.(
        this.engine.matchManager.rules,
        this.engine.matchManager.userCharacter?.id,
        kotc ? kotc.stages[kotc.stage] : this.engine.matchManager.difficulty,
        this.engine.matchManager.venueId || 'cage_nyc'
      );
      overlay.remove();
    });

    document.getElementById('btn-menu')?.addEventListener('click', () => {
      this.engine.kotc = null;
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
          <button id="mode-2v2" class="mode-btn">2v2 RUN</button>
          <button id="mode-3v3" class="mode-btn selected">3v3 SHOWDOWN</button>
        </div>
        <div class="mode-row">
          <button id="mode-kotc" class="mode-btn">👑 KING OF THE COURT: OFF</button>
        </div>

        <label class="sec-label">CHOOSE YOUR LEGEND (fictional stand-ins — not real likenesses)</label>
        <div id="roster-streamers-label" class="sec-label">STREAMERS</div>
        <div id="roster-streamers" class="roster-grid"></div>
        <div id="roster-rappers-label" class="sec-label">RAPPERS</div>
        <div id="roster-rappers" class="roster-grid"></div>
        <div id="roster-og-label" class="sec-label">ORIGINAL LEGENDS</div>
        <div id="roster-og" class="roster-grid"></div>

        <div class="menu-grid">
          <div>
            <label>TARGET SCORE</label>
            <select id="opt-target"><option value="11">11 (Quick)</option><option value="15">15 (2v2)</option><option value="21" selected>21 (Classic)</option></select>
          </div>
          <div>
            <label>DIFFICULTY</label>
            <select id="opt-diff"><option value="0.8">Rookie</option><option value="1.0" selected>Pro</option><option value="1.25">Street King</option></select>
          </div>
          <div>
            <label>VENUE</label>
            <select id="opt-venue"></select>
          </div>
          <div>
            <label>&nbsp;</label>
            <div class="foot" id="venue-desc"></div>
          </div>
        </div>
        
        <div class="btn-row">
          <button id="btn-play">🔥 &nbsp;RUN IT</button>
          <button id="btn-howto" class="ghost">CONTROLS</button>
        </div>
        
        <div id="howto" class="hidden">
          <p><b>WASD / Arrows</b> — move &nbsp; <b>SHIFT</b> — sprint &nbsp; <b>Mouse drag</b> — camera, <b>wheel</b> — zoom, <b>R</b> — reset cam</p>
          <p><b>SPACE (hold → release)</b> — shoot. Release in the green for a guaranteed bucket. Drive + shoot close = monster dunk.</p>
          <p><b>J</b> — crossover &nbsp; <b>K</b> — behind-the-back &nbsp; <b>L</b> — spin &nbsp; <b>H</b> — hesitation &nbsp; <b>Q</b> — pass, <b>T</b> — alley-oop lob, <b>E</b> — steal / block.</p>
          <p>Chain tricks to build <b>combo multipliers</b>. Fill the <b>🔥 HYPE</b> meter with crossovers, dunks, greens and blocks to unlock <b>LEGEND MODE</b>. Inside arc = 1 pt, outside = 2 pts. No out of bounds — the cage keeps it in!</p>
          <p><b>King of the Court:</b> win 3 straight with rising difficulty to take the crown.</p>
        </div>
        <p class="foot">Fan-made arcade hoops game. All celebrities are fictional stand-ins, not real likenesses. Built with Three.js + WebAudio.</p>
      </div>
    `;
    document.getElementById('app').appendChild(menu);
    this.elements.menu = menu;
    
    this.populateRoster();
    this.bindMenuEvents();
  }

  populateRoster() {
    const roster = this.engine.characterRoster;
    if (!roster) return;

    const bar = (v) => `<div class="bar"><i style="width:${Math.min(100, v)}%"></i></div>`;
    const groups = [
      ['roster-streamers', roster.getStreamerData?.() || []],
      ['roster-rappers', roster.getRapperData?.() || []],
      ['roster-og', roster.getOriginalData?.() || []],
    ];
    let first = true;
    let idx = 0;
    for (const [elId, list] of groups) {
      const container = document.getElementById(elId);
      if (!container) continue;
      container.innerHTML = '';
      if (!list.length) { document.getElementById(elId + '-label')?.classList.add('hidden'); continue; }
      list.forEach((data) => {
        const card = document.createElement('div');
        card.className = 'legend-card' + (first ? ' selected' : '');
        card.dataset.id = data.id;
        first = false;

        card.innerHTML = `
          <h3>#${data.num ?? 0} ${data.name}</h3>
          <div class="aka">${data.aka || ''}</div>
          <div class="bars">
            SPD${bar((data.attributes?.speed || 7) * 10)}
            DNK${bar(data.attributes?.dunk || 70)}
            SHT${bar(data.attributes?.shoot || 70)}
            HND${bar(data.attributes?.handles || 70)}
            DEF${bar(data.attributes?.defense || 70)}
          </div>
          <div class="special">⭐ ${(data.signatureMove || data.signatureDunk || '').replace(/_/g, ' ').toUpperCase()}</div>
          <div class="aka">${data.bio || ''}</div>
        `;

        card.addEventListener('click', () => {
          document.querySelectorAll('.legend-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.selectedCharacterId = data.id;
          this.engine.audio?.blip?.(600 + (idx++ * 37), 0.1, 'square', 0.1);
        });

        container.appendChild(card);
      });
    }

    this.selectedCharacterId = groups[0]?.[1]?.[0]?.id || 'kai_cenat';
  }

  bindMenuEvents() {
    const mode1v1 = document.getElementById('mode-1v1');
    const mode2v2 = document.getElementById('mode-2v2');
    const mode3v3 = document.getElementById('mode-3v3');
    const modeKotc = document.getElementById('mode-kotc');
    const btnPlay = document.getElementById('btn-play');
    const btnHowto = document.getElementById('btn-howto');
    const howto = document.getElementById('howto');
    const venueSel = document.getElementById('opt-venue');
    const venueDesc = document.getElementById('venue-desc');

    const setMode = (mode) => {
      this.selectedMode = mode;
      mode1v1?.classList.toggle('selected', mode === '1v1');
      mode2v2?.classList.toggle('selected', mode === '2v2');
      mode3v3?.classList.toggle('selected', mode === '3v3');
      const t = document.getElementById('opt-target');
      if (t) t.value = mode === '1v1' ? '11' : mode === '2v2' ? '15' : '21';
    };
    mode1v1?.addEventListener('click', () => setMode('1v1'));
    mode2v2?.addEventListener('click', () => setMode('2v2'));
    mode3v3?.addEventListener('click', () => setMode('3v3'));
    this.kingOfCourt = false;
    modeKotc?.addEventListener('click', () => {
      this.kingOfCourt = !this.kingOfCourt;
      modeKotc.textContent = this.kingOfCourt ? '👑 KING OF THE COURT: ON (best of ladder)' : '👑 KING OF THE COURT: OFF';
      modeKotc.classList.toggle('selected', this.kingOfCourt);
    });

    // venues (import-free: read from court module via engine after init)
    const fillVenues = () => {
      if (!venueSel || venueSel.options.length) return;
      const list = this.engine.matchManager?.VENUES || this.engine.courtVenues || null;
      const venues = list || [
        { id: 'cage_nyc', name: 'The Cage • NYC Night', desc: 'Chain-link, floodlights, neon. The classic.' },
        { id: 'rooftop_ny', name: 'Rooftop • NYC Sunset', desc: 'Golden-hour skyline ball above the city.' },
        { id: 'atl_night', name: 'Atlanta • Night Drive', desc: 'Humid ATL night, green-and-gold glow.' },
        { id: 'chi_hood', name: 'Chicago • Neighborhood', desc: 'Windy-city park court, red-and-black grit.' },
        { id: 'mia_neon', name: 'Miami • Neon Beach', desc: 'Pastel neon and palm-night vibes.' },
        { id: 'mansion', name: 'Streamer Mansion • Indoor', desc: 'Private indoor court, LED strips.' },
      ];
      venues.forEach(v => {
        const o = document.createElement('option');
        o.value = v.id; o.textContent = v.name; o.dataset.desc = v.desc || '';
        venueSel.appendChild(o);
      });
      const sync = () => { if (venueDesc) venueDesc.textContent = venueSel.selectedOptions[0]?.dataset.desc || ''; };
      venueSel.addEventListener('change', sync); sync();
    };
    fillVenues();

    btnPlay?.addEventListener('click', () => this.startGame());
    btnHowto?.addEventListener('click', () => howto.classList.toggle('hidden'));
  }

  startGame() {
    const target = parseInt(document.getElementById('opt-target').value, 10);
    const diff = parseFloat(document.getElementById('opt-diff').value);
    const mode = this.selectedMode || '3v3';
    const charId = this.selectedCharacterId || 'kai_cenat';
    const venueId = document.getElementById('opt-venue')?.value || 'cage_nyc';

    const base = mode === '1v1' ? MatchRules.STREET_1V1 : mode === '2v2' ? MatchRules.STREET_2V2 : MatchRules.STREET_3V3;
    const rules = { ...base, target };
    // King of the Court: ladder of 3, difficulty ramps 0.85 → base → base+0.2
    if (this.kingOfCourt) {
      this.engine.kotc = { stage: 0, stages: [Math.min(diff, 0.85), diff, Math.min(diff + 0.2, 1.5)], charId, mode, venueId, target };
      this.engine.kotc.diff = this.engine.kotc.stages[0];
    } else {
      this.engine.kotc = null;
    }
    
    this.hide('menu');
    this.show('scoreboard');
    this.show('ticker');
    this.show('hype');
    this.show('stamina');
    this.show('controls-hint');
    this.show('combo-display');
    this.show('player-indicator');

    const playDiff = this.engine.kotc ? this.engine.kotc.stages[0] : diff;
    if (this.engine.kotc) {
      this.engine.showMessage?.(`👑 KOTC ROUND 1/3 — RIVALS AT ${(playDiff).toFixed(2)}x`, 2200);
    }
    this.engine.matchManager.initialize(rules, charId, playDiff, venueId);
    this.engine.matchManager.mode = mode;
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

// Single source of truth lives in MatchManager; re-exported for legacy imports.
export const MatchRules = EngineMatchRules;