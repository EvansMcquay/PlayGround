export const TrickType = {
  CROSSOVER: 'crossover',
  BEHIND_BACK: 'behind_back',
  SPIN_MOVE: 'spin_move',
  HESITATION: 'hesitation',
  IN_AND_OUT: 'in_and_out',
  SHAMGOD: 'shamgod',
  BETWEEN_LEGS_DRIBBLE: 'between_legs_dribble',
  ANKLE_BREAKER: 'ankle_breaker',
  STEAL: 'steal',
  BLOCK: 'block',
  NO_LOOK_PASS: 'no_look_pass',
  ALLEY_OOP_PASS: 'alley_oop_pass',
  DUNK: 'dunk',
  GREEN_SHOT: 'green_shot',
  DEEP_THREE: 'deep_three',
};

export const TrickDifficulty = {
  [TrickType.CROSSOVER]: 10,
  [TrickType.BEHIND_BACK]: 15,
  [TrickType.SPIN_MOVE]: 20,
  [TrickType.HESITATION]: 12,
  [TrickType.IN_AND_OUT]: 15,
  [TrickType.SHAMGOD]: 30,
  [TrickType.BETWEEN_LEGS_DRIBBLE]: 25,
  [TrickType.ANKLE_BREAKER]: 40,
  [TrickType.STEAL]: 20,
  [TrickType.BLOCK]: 25,
  [TrickType.NO_LOOK_PASS]: 18,
  [TrickType.ALLEY_OOP_PASS]: 22,
  [TrickType.DUNK]: 30,
  [TrickType.GREEN_SHOT]: 15,
  [TrickType.DEEP_THREE]: 20,
};

export const TrickNames = {
  [TrickType.CROSSOVER]: 'CROSSOVER',
  [TrickType.BEHIND_BACK]: 'BEHIND THE BACK',
  [TrickType.SPIN_MOVE]: 'SPIN MOVE',
  [TrickType.HESITATION]: 'HESITATION',
  [TrickType.IN_AND_OUT]: 'IN & OUT',
  [TrickType.SHAMGOD]: 'SHAMGOD',
  [TrickType.BETWEEN_LEGS_DRIBBLE]: 'BTL DRIBBLE',
  [TrickType.ANKLE_BREAKER]: 'ANKLE BREAKER',
  [TrickType.STEAL]: 'PICKPOCKET',
  [TrickType.BLOCK]: 'REJECTED',
  [TrickType.NO_LOOK_PASS]: 'NO-LOOK DIME',
  [TrickType.ALLEY_OOP_PASS]: 'ALLEY-OOP PASS',
  [TrickType.DUNK]: 'SLAM',
  [TrickType.GREEN_SHOT]: 'GREEN RELEASE',
  [TrickType.DEEP_THREE]: 'LOGO RANGE',
};

export class ComboHypeSystem {
  constructor(engine) {
    this.engine = engine;
    
    this.combo = {
      current: 0,
      max: 0,
      multiplier: 1.0,
      tricks: [],
      timer: 0,
      window: 3.0,
      decayRate: 0.5,
    };
    
    this.hype = {
      home: 0,
      away: 0,
      max: 100,
      legendThreshold: 100,
      legendDuration: 15,
      legendActive: { home: false, away: false },
      legendTimer: { home: 0, away: 0 },
      decayRate: 2.0,
      crowdIntensity: 0,
    };
    
    this.legendMode = {
      active: false,
      character: null,
      team: null,
      timer: 0,
      effects: [],
    };
    
    this.trickHistory = [];
    this.showTrickUI = true;
    this.lastTrickTime = 0;
    
    this.milestones = [
      { hype: 25, reward: 'confidence', name: 'FEELING IT' },
      { hype: 50, reward: 'momentum', name: 'ON FIRE' },
      { hype: 75, reward: 'dominance', name: 'UNSTOPPABLE' },
      { hype: 100, reward: 'legend', name: 'LEGEND MODE' },
    ];
  }

  addTrick(character, trickType, quality = 1.0) {
    const now = this.engine.clock.getElapsedTime();
    const difficulty = TrickDifficulty[trickType] || 10;
    const name = TrickNames[trickType] || trickType.toUpperCase();
    
    const baseHype = difficulty * quality;
    const comboBonus = this.combo.current > 0 ? this.combo.multiplier * 5 : 0;
    const streakBonus = this.getStreakBonus();
    const totalHype = Math.round(baseHype + comboBonus + streakBonus);
    
    this.combo.current++;
    this.combo.max = Math.max(this.combo.max, this.combo.current);
    this.combo.multiplier = 1 + this.combo.current * 0.15;
    this.combo.timer = this.combo.window;
    this.combo.tricks.push({ type: trickType, name, time: now, hype: totalHype });
    
    if (this.combo.tricks.length > 10) this.combo.tricks.shift();
    
    this.addHype(character, totalHype);
    this.lastTrickTime = now;
    this.trickHistory.push({ character, trickType, name, hype: totalHype, time: now, combo: this.combo.current });
    
    this.checkMilestones(character);
    
    this.showTrickCallout(name, this.combo.current, this.combo.multiplier);
    
    return { hype: totalHype, combo: this.combo.current, multiplier: this.combo.multiplier };
  }

  addHype(character, amount) {
    const isHome = character.isHome;
    const key = isHome ? 'home' : 'away';
    
    this.hype[key] = Math.min(this.hype.max, this.hype[key] + amount);
    this.hype.crowdIntensity = Math.max(this.hype.home, this.hype.away) / 100;
    
    if (this.hype[key] >= this.hype.legendThreshold && !this.hype.legendActive[key]) {
      this.activateLegendMode(character);
    }
  }

  getStreakBonus() {
    if (this.combo.current >= 8) return 25;
    if (this.combo.current >= 5) return 15;
    if (this.combo.current >= 3) return 8;
    return 0;
  }

  checkMilestones(character) {
    const isHome = character.isHome;
    const key = isHome ? 'home' : 'away';
    const hype = this.hype[key];
    
    this.milestones.forEach(m => {
      if (hype >= m.hype && !this.hype[`milestone_${m.reward}_${key}`]) {
        this.hype[`milestone_${m.reward}_${key}`] = true;
        this.triggerMilestone(character, m);
      }
    });
  }

  triggerMilestone(character, milestone) {
    const messages = {
      confidence: 'FEELING IT! 🔥',
      momentum: 'ON FIRE! 🔥🔥',
      dominance: 'UNSTOPPABLE! 🔥🔥🔥',
      legend: 'LEGEND MODE ACTIVATED! 👑',
    };
    
    this.engine.showMessage?.(messages[milestone.reward] || milestone.name, 2000);
    
    if (this.engine.audio) {
      this.engine.audio.playMilestone(milestone.reward);
    }
    
    if (this.engine.cameraController) {
      this.engine.cameraController.triggerMilestoneFlash(milestone.reward);
    }
  }

  activateLegendMode(character) {
    const isHome = character.isHome;
    const key = isHome ? 'home' : 'away';
    
    this.hype.legendActive[key] = true;
    this.hype.legendTimer[key] = this.hype.legendDuration;
    this.legendMode.active = true;
    this.legendMode.character = character;
    this.legendMode.team = key;
    this.legendMode.timer = this.hype.legendDuration;
    
    character.state.legendMode = true;
    character.legendModeStartTime = this.engine.clock.getElapsedTime();
    
    this.engine.showMessage?.('👑 LEGEND MODE! 👑', 3000);
    
    if (this.engine.audio) {
      this.engine.audio.playAirhorn();
      this.engine.audio.playLegendMusic();
    }
    
    if (this.engine.cameraController) {
      this.engine.cameraController.enableLegendMode(character);
    }
    
    if (this.engine.particleSystem) {
      this.engine.particleSystem.spawnLegendAura(character);
    }
  }

  update(dt) {
    if (this.combo.timer > 0) {
      this.combo.timer -= dt;
      if (this.combo.timer <= 0) {
        this.resetCombo();
      }
    }
    
    const decay = this.hype.decayRate * dt;
    this.hype.home = Math.max(0, this.hype.home - decay);
    this.hype.away = Math.max(0, this.hype.away - decay);
    this.hype.crowdIntensity = Math.max(this.hype.home, this.hype.away) / 100;
    
    if (this.legendMode.active) {
      this.legendMode.timer -= dt;
      this.hype.legendTimer[this.legendMode.team] = this.legendMode.timer;
      
      if (this.legendMode.timer <= 0) {
        this.deactivateLegendMode();
      }
    }
    
    if (this.hype.legendActive.home && this.hype.legendTimer.home <= 0) {
      this.hype.legendActive.home = false;
      const char = this.getHomeLegendCharacter();
      if (char) char.state.legendMode = false;
    }
    if (this.hype.legendActive.away && this.hype.legendTimer.away <= 0) {
      this.hype.legendActive.away = false;
      const char = this.getAwayLegendCharacter();
      if (char) char.state.legendMode = false;
    }
  }

  getHomeLegendCharacter() {
    return this.engine.matchManager?.homeTeam?.find(c => c.state.legendMode);
  }

  getAwayLegendCharacter() {
    return this.engine.matchManager?.awayTeam?.find(c => c.state.legendMode);
  }

  deactivateLegendMode() {
    this.legendMode.active = false;
    if (this.legendMode.character) {
      this.legendMode.character.state.legendMode = false;
    }
    this.legendMode.character = null;
    this.legendMode.team = null;
    this.legendMode.timer = 0;
    
    this.engine.showMessage?.('Legend mode faded...', 1500);
    
    if (this.engine.audio) {
      this.engine.audio.stopLegendMusic();
    }
    
    if (this.engine.cameraController) {
      this.engine.cameraController.disableLegendMode();
    }
  }

  resetCombo() {
    this.combo.current = 0;
    this.combo.multiplier = 1.0;
    this.combo.tricks = [];
    this.combo.timer = 0;
  }

  showTrickCallout(name, comboCount, multiplier) {
    if (!this.showTrickUI) return;
    
    let msg = name;
    if (comboCount >= 2) {
      msg = `${name} x${comboCount}!`;
    }
    if (comboCount >= 5) {
      msg = `🔥 ${msg} 🔥`;
    }
    if (comboCount >= 8) {
      msg = `⚡ ${msg} ⚡`;
    }
    
    this.engine.showMessage?.(msg, comboCount >= 5 ? 2000 : 1200);
  }

  onShotMade(character, isGreen, isThree, isDunk) {
    if (isDunk) return;
    
    if (isGreen) this.addTrick(character, TrickType.GREEN_SHOT, 1.5);
    if (isThree) this.addTrick(character, TrickType.DEEP_THREE, 1.3);
  }

  onDunk(character, dunkType) {
    const difficulty = this.getDunkDifficulty(dunkType);
    this.addTrick(character, TrickType.DUNK, difficulty / 30);
  }

  onSteal(character) {
    this.addTrick(character, TrickType.STEAL, 1.2);
  }

  onBlock(character) {
    this.addTrick(character, TrickType.BLOCK, 1.3);
  }

  onAnkleBreaker(character) {
    this.addTrick(character, TrickType.ANKLE_BREAKER, 1.5);
  }

  onAlleyOopPass(character) {
    this.addTrick(character, TrickType.ALLEY_OOP_PASS, 1.2);
  }

  onNoLookPass(character) {
    this.addTrick(character, TrickType.NO_LOOK_PASS, 1.1);
  }

  getDunkDifficulty(dunkType) {
    const difficulties = {
      tomahawk: 60, windmill: 75, dunk_360: 80, dunk_720: 95,
      between_legs: 85, double_clutch: 82, cartwheel: 88,
      backflip: 92, free_throw_line: 90, alley_oop: 70,
      self_alley_oop: 93, reverse: 70, elbow_hang: 78,
      rock_the_cradle: 80, honey_dip: 85,
    };
    return difficulties[dunkType] || 60;
  }

  getCombo() {
    return { ...this.combo };
  }

  getHype(team) {
    return team === 'home' ? this.hype.home : this.hype.away;
  }

  getHypePercent(team) {
    const hype = this.getHype(team);
    return hype / this.hype.max;
  }

  isLegendModeActive(team) {
    return this.hype.legendActive[team] || false;
  }

  getLegendTimeRemaining(team) {
    return this.hype.legendTimer[team] || 0;
  }

  getLegendCharacter() {
    return this.legendMode.character;
  }

  forceLegendMode(character) {
    this.activateLegendMode(character);
  }

  getUIState() {
    return {
      combo: this.combo.current,
      maxCombo: this.combo.max,
      multiplier: this.combo.multiplier.toFixed(1),
      hypeHome: Math.round(this.hype.home),
      hypeAway: Math.round(this.hype.away),
      legendHome: this.hype.legendActive.home,
      legendAway: this.hype.legendActive.away,
      legendTimeHome: Math.max(0, Math.ceil(this.hype.legendTimer.home)),
      legendTimeAway: Math.max(0, Math.ceil(this.hype.legendTimer.away)),
      crowdIntensity: this.hype.crowdIntensity,
      recentTricks: this.combo.tricks.slice(-3),
    };
  }

  dispose() {
    this.resetCombo();
    this.hype = { home: 0, away: 0, max: 100, legendThreshold: 100, legendDuration: 15 };
    this.legendMode = { active: false };
  }
}