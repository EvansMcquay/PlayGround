import * as THREE from 'three';

export const DunkType = {
  TOMOHAWK: 'tomahawk',
  WINDMILL: 'windmill',
  DUNK_360: 'dunk_360',
  DUNK_720: 'dunk_720',
  BETWEEN_LEGS: 'between_legs',
  DOUBLE_CLUTCH: 'double_clutch',
  CARTWHEEL: 'cartwheel',
  BACKFLIP: 'backflip',
  FREE_THROW_LINE: 'free_throw_line',
  ALLEY_OOP: 'alley_oop',
  SELF_ALLEY_OOP: 'self_alley_oop',
  REVERSE: 'reverse',
  ELBOW_HANG: 'elbow_hang',
  ROCK_THE_CRADLE: 'rock_the_cradle',
  HONEY_DIP: 'honey_dip',
};

export const DunkPhase = {
  APPROACH: 'approach',
  TAKEOFF: 'takeoff',
  ASCENT: 'ascent',
  PEAK: 'peak',
  TRICK: 'trick',
  FINISH: 'finish',
  LANDING: 'landing',
};

export class DunkTrickSystem {
  constructor(character, basketball, court) {
    this.character = character;
    this.ball = basketball;
    this.court = court;
    this.engine = character.engine;
    
    this.activeDunk = null;
    this.dunkQueue = [];
    this.dunkStartTime = 0;
    this.dunkDuration = 0;
    this.currentPhase = null;
    this.phaseProgress = 0;
    
    this.takeoffPosition = new THREE.Vector3();
    this.takeoffVelocity = new THREE.Vector3();
    this.peakHeight = 0;
    this.targetRim = null;
    this.targetRimSide = null;
    
    this.handIKTarget = new THREE.Vector3();
    this.ballAttachPoint = new THREE.Vector3();
    this.ballAttached = false;
    
    this.slowMotion = false;
    this.slowMoFactor = 1.0;
    this.cameraShake = 0;
    
    this.dunkDefinitions = this.createDunkDefinitions();
  }

  createDunkDefinitions() {
    return {
      [DunkType.TOMOHAWK]: {
        name: 'Tomahawk',
        difficulty: 60,
        minVertical: 65,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.3, anim: 'dunk_tomahawk_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.15, anim: 'dunk_tomahawk_takeoff' },
          { phase: DunkPhase.ASCENT, duration: 0.4, anim: 'dunk_tomahawk_ascent' },
          { phase: DunkPhase.TRICK, duration: 0.35, anim: 'dunk_tomahawk_windup' },
          { phase: DunkPhase.FINISH, duration: 0.25, anim: 'dunk_tomahawk_slam' },
          { phase: DunkPhase.LANDING, duration: 0.3, anim: 'dunk_landing' },
        ],
        ballRelease: 0.85,
        hangTime: 1.45,
      },
      [DunkType.WINDMILL]: {
        name: 'Windmill',
        difficulty: 75,
        minVertical: 75,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.3, anim: 'dunk_windmill_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.15, anim: 'dunk_windmill_takeoff' },
          { phase: DunkPhase.ASCENT, duration: 0.35, anim: 'dunk_windmill_ascent' },
          { phase: DunkPhase.TRICK, duration: 0.5, anim: 'dunk_windmill_full_circle' },
          { phase: DunkPhase.FINISH, duration: 0.3, anim: 'dunk_windmill_slam' },
          { phase: DunkPhase.LANDING, duration: 0.35, anim: 'dunk_landing' },
        ],
        ballRelease: 0.9,
        hangTime: 1.65,
      },
      [DunkType.DUNK_360]: {
        name: '360° Dunk',
        difficulty: 80,
        minVertical: 80,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.25, anim: 'dunk_360_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.15, anim: 'dunk_360_takeoff' },
          { phase: DunkPhase.ASCENT, duration: 0.3, anim: 'dunk_360_ascent' },
          { phase: DunkPhase.TRICK, duration: 0.6, anim: 'dunk_360_spin' },
          { phase: DunkPhase.FINISH, duration: 0.25, anim: 'dunk_360_slam' },
          { phase: DunkPhase.LANDING, duration: 0.35, anim: 'dunk_landing' },
        ],
        ballRelease: 0.85,
        hangTime: 1.7,
        rotation: Math.PI * 2,
      },
      [DunkType.DUNK_720]: {
        name: '720° Dunk',
        difficulty: 95,
        minVertical: 90,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.25, anim: 'dunk_720_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.15, anim: 'dunk_720_takeoff' },
          { phase: DunkPhase.ASCENT, duration: 0.35, anim: 'dunk_720_ascent' },
          { phase: DunkPhase.TRICK, duration: 1.0, anim: 'dunk_720_double_spin' },
          { phase: DunkPhase.FINISH, duration: 0.3, anim: 'dunk_720_slam' },
          { phase: DunkPhase.LANDING, duration: 0.4, anim: 'dunk_landing' },
        ],
        ballRelease: 0.9,
        hangTime: 2.05,
        rotation: Math.PI * 4,
      },
      [DunkType.BETWEEN_LEGS]: {
        name: 'Between the Legs',
        difficulty: 85,
        minVertical: 82,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.3, anim: 'dunk_btl_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.15, anim: 'dunk_btl_takeoff' },
          { phase: DunkPhase.ASCENT, duration: 0.35, anim: 'dunk_btl_ascent' },
          { phase: DunkPhase.TRICK, duration: 0.55, anim: 'dunk_btl_transfer' },
          { phase: DunkPhase.FINISH, duration: 0.3, anim: 'dunk_btl_slam' },
          { phase: DunkPhase.LANDING, duration: 0.35, anim: 'dunk_landing' },
        ],
        ballRelease: 0.88,
        hangTime: 1.7,
      },
      [DunkType.DOUBLE_CLUTCH]: {
        name: 'Double Clutch Reverse',
        difficulty: 82,
        minVertical: 78,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.3, anim: 'dunk_dc_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.15, anim: 'dunk_dc_takeoff' },
          { phase: DunkPhase.ASCENT, duration: 0.35, anim: 'dunk_dc_ascent' },
          { phase: DunkPhase.TRICK, duration: 0.6, anim: 'dunk_dc_double_pump' },
          { phase: DunkPhase.FINISH, duration: 0.3, anim: 'dunk_dc_reverse_slam' },
          { phase: DunkPhase.LANDING, duration: 0.35, anim: 'dunk_landing' },
        ],
        ballRelease: 0.9,
        hangTime: 1.75,
      },
      [DunkType.CARTWHEEL]: {
        name: 'Cartwheel to Dunk',
        difficulty: 88,
        minVertical: 80,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.35, anim: 'dunk_cartwheel_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.2, anim: 'dunk_cartwheel_takeoff' },
          { phase: DunkPhase.TRICK, duration: 0.8, anim: 'dunk_cartwheel_full' },
          { phase: DunkPhase.FINISH, duration: 0.3, anim: 'dunk_cartwheel_slam' },
          { phase: DunkPhase.LANDING, duration: 0.4, anim: 'dunk_landing' },
        ],
        ballRelease: 0.85,
        hangTime: 1.85,
        rotation: Math.PI / 2,
      },
      [DunkType.BACKFLIP]: {
        name: 'Backflip Dunk',
        difficulty: 92,
        minVertical: 85,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.3, anim: 'dunk_backflip_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.2, anim: 'dunk_backflip_takeoff' },
          { phase: DunkPhase.TRICK, duration: 0.9, anim: 'dunk_backflip_full' },
          { phase: DunkPhase.FINISH, duration: 0.3, anim: 'dunk_backflip_slam' },
          { phase: DunkPhase.LANDING, duration: 0.45, anim: 'dunk_backflip_landing' },
        ],
        ballRelease: 0.88,
        hangTime: 1.95,
        rotation: -Math.PI,
      },
      [DunkType.FREE_THROW_LINE]: {
        name: 'Free Throw Line',
        difficulty: 90,
        minVertical: 88,
        minSpeed: 9.0,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.6, anim: 'dunk_ftl_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.2, anim: 'dunk_ftl_takeoff' },
          { phase: DunkPhase.ASCENT, duration: 0.5, anim: 'dunk_ftl_flight' },
          { phase: DunkPhase.TRICK, duration: 0.5, anim: 'dunk_ftl_extension' },
          { phase: DunkPhase.FINISH, duration: 0.35, anim: 'dunk_ftl_slam' },
          { phase: DunkPhase.LANDING, duration: 0.4, anim: 'dunk_landing' },
        ],
        ballRelease: 0.85,
        hangTime: 2.15,
        takeoffDistance: 4.6,
      },
      [DunkType.ALLEY_OOP]: {
        name: 'Alley-Oop',
        difficulty: 70,
        minVertical: 70,
        isAlleyOop: true,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.4, anim: 'dunk_oop_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.15, anim: 'dunk_oop_takeoff' },
          { phase: DunkPhase.ASCENT, duration: 0.4, anim: 'dunk_oop_ascent' },
          { phase: DunkPhase.TRICK, duration: 0.3, anim: 'dunk_oop_catch' },
          { phase: DunkPhase.FINISH, duration: 0.3, anim: 'dunk_oop_slam' },
          { phase: DunkPhase.LANDING, duration: 0.3, anim: 'dunk_landing' },
        ],
        ballRelease: 0.95,
        hangTime: 1.55,
      },
      [DunkType.SELF_ALLEY_OOP]: {
        name: 'Self Alley-Oop',
        difficulty: 93,
        minVertical: 85,
        phases: [
          { phase: DunkPhase.APPROACH, duration: 0.3, anim: 'dunk_self_oop_approach' },
          { phase: DunkPhase.TAKEOFF, duration: 0.2, anim: 'dunk_self_oop_takeoff' },
          { phase: DunkPhase.TRICK, duration: 0.4, anim: 'dunk_self_oop_throw' },
          { phase: DunkPhase.ASCENT, duration: 0.35, anim: 'dunk_self_oop_chase' },
          { phase: DunkPhase.TRICK, duration: 0.35, anim: 'dunk_self_oop_catch' },
          { phase: DunkPhase.FINISH, duration: 0.3, anim: 'dunk_self_oop_slam' },
          { phase: DunkPhase.LANDING, duration: 0.35, anim: 'dunk_landing' },
        ],
        ballRelease: 0.95,
        hangTime: 1.95,
      },
    };
  }

  canAttemptDunk(dunkType) {
    const def = this.dunkDefinitions[dunkType];
    if (!def) return false;
    
    const attrs = this.character.attributes;
    const vert = attrs.vertical;
    const speed = attrs.speed;
    
    if (vert < def.minVertical) return false;
    if (def.minSpeed && speed < def.minSpeed) return false;
    
    const distToRim = this.getDistanceToRim();
    if (def.takeoffDistance && distToRim > def.takeoffDistance + 0.5) return false;
    
    return true;
  }

  getAvailableDunks() {
    return Object.keys(this.dunkDefinitions).filter(d => this.canAttemptDunk(d));
  }

  getDistanceToRim() {
    const rimSide = this.getTargetRimSide();
    const rimPos = this.court.getRimPosition(rimSide);
    return this.character.position.distanceTo(rimPos);
  }

  getTargetRimSide() {
    const pos = this.character.position;
    return Math.abs(pos.x - 12.7) < Math.abs(pos.x + 12.7) ? 'east' : 'west';
  }

  attemptDunk(dunkType, options = {}) {
    if (this.activeDunk) return false;
    if (!this.canAttemptDunk(dunkType)) return false;
    if (!this.character.state.hasBall) return false;
    
    const def = this.dunkDefinitions[dunkType];
    this.activeDunk = { type: dunkType, def, options };
    this.dunkStartTime = this.engine.clock.getElapsedTime();
    this.dunkDuration = def.hangTime;
    this.currentPhase = DunkPhase.APPROACH;
    this.phaseProgress = 0;
    
    this.targetRimSide = this.getTargetRimSide();
    this.targetRim = this.court.getRimPosition(this.targetRimSide);
    
    this.character.state.dunking = true;
    this.character.state.jumping = true;
    this.character.state.grounded = false;
    
    this.ball.state = 'shot';
    this.ball.holder = null;
    this.character.state.hasBall = false;
    this.ballAttached = true;
    
    this.setupDunkPhysics(def);
    this.playDunkAnimation(DunkPhase.APPROACH);
    
    this.triggerCameraEffects(dunkType);
    
    return true;
  }

  setupDunkPhysics(def) {
    const rimPos = this.targetRim.clone();
    const charPos = this.character.position.clone();
    const horizontalDist = new THREE.Vector2(
      rimPos.x - charPos.x, rimPos.z - charPos.z
    ).length();
    
    const hangTime = def.hangTime;
    const peakHeight = rimPos.y + 0.5;
    const verticalVel = Math.sqrt(2 * Math.abs(this.ball.gravity) * (peakHeight - charPos.y));
    
    this.takeoffPosition.copy(charPos);
    this.takeoffVelocity.set(0, verticalVel, 0);
    
    const horizontalVel = horizontalDist / hangTime;
    const dir = new THREE.Vector2(rimPos.x - charPos.x, rimPos.z - charPos.z).normalize();
    this.takeoffVelocity.x = dir.x * horizontalVel;
    this.takeoffVelocity.z = dir.y * horizontalVel;
    
    this.character.velocity.copy(this.takeoffVelocity);
    this.character.jumpV = verticalVel;
    this.character.jumpY = 0;
    
    this.peakHeight = peakHeight;
  }

  playDunkAnimation(phase) {
    const def = this.activeDunk.def;
    const phaseDef = def.phases.find(p => p.phase === phase);
    if (phaseDef) {
      this.character.animationController?.play(phaseDef.anim, {
        layer: 0,
        fadeIn: 0.08,
        timeScale: 1.0,
        clampWhenFinished: phase === DunkPhase.LANDING,
      });
    }
  }

  triggerCameraEffects(dunkType) {
    const def = this.dunkDefinitions[dunkType];
    const intensity = THREE.MathUtils.mapLinear(def.difficulty, 60, 95, 0.3, 1.0);
    
    this.cameraShake = intensity;
    this.slowMotion = def.difficulty >= 85;
    this.slowMoFactor = this.slowMotion ? 0.25 : 1.0;
    
    if (this.engine.cameraController) {
      this.engine.cameraController.triggerDunkShake(intensity, def.hangTime);
      if (this.slowMotion) {
        this.engine.cameraController.enableSlowMo(def.hangTime * 0.6);
      }
    }
  }

  update(dt) {
    if (!this.activeDunk) return;
    
    const effectiveDt = dt * this.slowMoFactor;
    const elapsed = this.engine.clock.getElapsedTime() - this.dunkStartTime;
    const progress = Math.min(1, elapsed / this.dunkDuration);
    
    this.updatePhase(elapsed);
    this.updateBallAttachment(elapsed);
    this.updateCharacterPhysics(effectiveDt);
    this.updateCameraShake(effectiveDt);
    
    if (progress >= 1) {
      this.completeDunk();
    }
  }

  updatePhase(elapsed) {
    const def = this.activeDunk.def;
    let accumulated = 0;
    
    for (const phaseDef of def.phases) {
      if (elapsed < accumulated + phaseDef.duration) {
        if (this.currentPhase !== phaseDef.phase) {
          this.currentPhase = phaseDef.phase;
          this.phaseProgress = 0;
          this.playDunkAnimation(phaseDef.phase);
        }
        this.phaseProgress = (elapsed - accumulated) / phaseDef.duration;
        break;
      }
      accumulated += phaseDef.duration;
    }
  }

  updateBallAttachment(elapsed) {
    if (!this.ballAttached) return;
    
    const def = this.activeDunk.def;
    const releaseTime = def.hangTime * def.ballRelease;
    
    if (elapsed >= releaseTime) {
      this.releaseBall();
      return;
    }
    
    const handBone = this.character.bones[`${this.character.state.ballHand}Hand`] || 
                     this.character.bones.rightHand;
    if (handBone) {
      handBone.getWorldPosition(this.ballAttachPoint);
      this.ballAttachPoint.y += 0.05;
      this.ball.position.copy(this.ballAttachPoint);
      this.ball.velocity.set(0, 0, 0);
    }
  }

  releaseBall() {
    this.ballAttached = false;
    this.ball.state = 'shot';
    this.ball.shotInfo = {
      isDunk: true,
      dunkType: this.activeDunk.type,
      targetRim: this.targetRimSide,
      autoMake: true,
    };
    
    const rimPos = this.targetRim.clone();
    const toRim = new THREE.Vector3().subVectors(rimPos, this.ball.position).normalize();
    this.ball.velocity.copy(toRim.multiplyScalar(8)).add(new THREE.Vector3(0, 2, 0));
  }

  updateCharacterPhysics(dt) {
    if (this.character.jumpV !== 0 || this.character.jumpY > 0) {
      this.character.jumpY += this.character.jumpV * dt;
      this.character.jumpV += this.ball.gravity * dt;
      
      if (this.character.jumpY <= 0) {
        this.character.jumpY = 0;
        this.character.jumpV = 0;
        this.character.state.grounded = true;
        this.character.state.jumping = false;
      }
    }
    
    this.character.position.addScaledVector(this.character.velocity, dt);
    this.character.sync?.();
  }

  updateCameraShake(dt) {
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2);
    }
  }

  completeDunk() {
    if (!this.activeDunk) return;
    
    const def = this.activeDunk.def;
    const dunkType = this.activeDunk.type;
    
    this.character.stats.dunks++;
    this.character.state.dunking = false;
    this.character.state.jumping = false;
    this.character.state.grounded = true;
    this.character.jumpY = 0;
    this.character.jumpV = 0;
    
    this.playDunkAnimation(DunkPhase.LANDING);
    
    this.onDunkComplete(dunkType, def);
    
    this.activeDunk = null;
    this.currentPhase = null;
    this.slowMotion = false;
    this.slowMoFactor = 1.0;
    this.cameraShake = 0;
  }

  onDunkComplete(dunkType, def) {
    const hypeGain = THREE.MathUtils.mapLinear(def.difficulty, 60, 95, 10, 35);
    
    if (this.engine.hypeSystem) {
      this.engine.hypeSystem.addHype(this.character, hypeGain);
    }
    
    if (this.engine.comboSystem) {
      this.engine.comboSystem.addTrick(dunkType, def.difficulty);
    }
    
    if (this.engine.audio) {
      this.engine.audio.playDunkSlam(dunkType);
      this.engine.audio.playCrowdReaction(def.difficulty);
    }
    
    this.showDunkCallout(dunkType, def);
  }

  showDunkCallout(dunkType, def) {
    const messages = {
      [DunkType.TOMOHAWK]: 'TOMAHAWK! 🪓',
      [DunkType.WINDMILL]: 'WINDMILL! 🌪️',
      [DunkType.DUNK_360]: '360° DUNK! 🔄',
      [DunkType.DUNK_720]: '720°!!! 🌪️🌪️',
      [DunkType.BETWEEN_LEGS]: 'BETWEEN THE LEGS! 🦵',
      [DunkType.DOUBLE_CLUTCH]: 'DOUBLE CLUTCH! 🤯',
      [DunkType.CARTWHEEL]: 'CARTWHEEL DUNK! 🤸',
      [DunkType.BACKFLIP]: 'BACKFLIP DUNK! 🤸‍♂️',
      [DunkType.FREE_THROW_LINE]: 'FREE THROW LINE! ✈️',
      [DunkType.ALLEY_OOP]: 'ALLEY-OOP! ✈️',
      [DunkType.SELF_ALLEY_OOP]: 'SELF OOP! 🤯✈️',
    };
    
    const msg = messages[dunkType] || `${def.name.toUpperCase()}!`;
    this.engine.showMessage?.(msg, 1800);
  }

  attemptTrickCombo(trickSequence) {
    if (!this.character.state.hasBall) return false;
    if (this.activeDunk) return false;
    
    this.dunkQueue = [...trickSequence];
    this.processQueue();
  }

  processQueue() {
    if (this.dunkQueue.length === 0) return;
    
    const next = this.dunkQueue.shift();
    if (typeof next === 'string') {
      this.attemptDunk(next);
    } else if (next.type === 'crossover') {
      this.performCrossover(next.direction);
    } else if (next.type === 'spin') {
      this.performSpinMove();
    }
  }

  performCrossover(direction) {
    this.character.animationController?.play(
      direction === 'left' ? 'crossover_left' : 'crossover_right',
      { layer: 0, fadeIn: 0.05, clampWhenFinished: true }
    );
    this.character.stats.crossovers++;
  }

  performSpinMove() {
    this.character.animationController?.play('spin_move', { 
      layer: 0, fadeIn: 0.05, clampWhenFinished: true 
    });
  }

  getDunkProgress() {
    if (!this.activeDunk) return 0;
    const elapsed = this.engine.clock.getElapsedTime() - this.dunkStartTime;
    return Math.min(1, elapsed / this.dunkDuration);
  }

  isDunking() {
    return this.activeDunk !== null;
  }

  getCurrentDunk() {
    return this.activeDunk?.type || null;
  }

  cancelDunk() {
    this.activeDunk = null;
    this.character.state.dunking = false;
    this.slowMotion = false;
    this.slowMoFactor = 1.0;
  }

  dispose() {
    this.activeDunk = null;
    this.dunkQueue = [];
  }
}

export function createProceduralDunkAnimations() {
  return {};
}