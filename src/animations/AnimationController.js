import * as THREE from 'three';

export const AnimState = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  SPRINT: 'sprint',
  DRIBBLE_IDLE: 'dribble_idle',
  DRIBBLE_WALK: 'dribble_walk',
  DRIBBLE_RUN: 'dribble_run',
  CROSSOVER_LEFT: 'crossover_left',
  CROSSOVER_RIGHT: 'crossover_right',
  BEHIND_BACK: 'behind_back',
  SPIN_MOVE: 'spin_move',
  HESITATION: 'hesitation',
  IN_AND_OUT: 'in_and_out',
  SHAMGOD: 'shamgod',
  JUMP_SHOT: 'jump_shot',
  LAYUP: 'layup',
  DUNK_TOMOHAWK: 'dunk_tomahawk',
  DUNK_WINDMILL: 'dunk_windmill',
  DUNK_360: 'dunk_360',
  DUNK_720: 'dunk_720',
  DUNK_BETWEEN_LEGS: 'dunk_between_legs',
  DUNK_DOUBLE_CLUTCH: 'dunk_double_clutch',
  DUNK_CARTWHEEL: 'dunk_cartwheel',
  DUNK_BACKFLIP: 'dunk_backflip',
  DUNK_FREE_THROW_LINE: 'dunk_free_throw_line',
  ALLEY_OOP_CATCH: 'alley_oop_catch',
  ALLEY_OOP_FINISH: 'alley_oop_finish',
  STEAL: 'steal',
  BLOCK: 'block',
  REBOUND: 'rebound',
  FALL: 'fall',
  LAND: 'land',
  STUN: 'stun',
  CELEBRATE: 'celebrate',
  INTRO: 'intro',
};

export const AnimLayer = {
  BASE: 0,
  ADDITIVE: 1,
  UPPER_BODY: 2,
  FULL_BODY: 3,
};

export class AnimationController {
  constructor(character) {
    this.character = character;
    this.mixer = character.mixer;
    this.actions = new Map();
    this.activeActions = new Map();
    this.layerWeights = new Map();
    this.transitions = [];
    
    this.state = AnimState.IDLE;
    this.previousState = null;
    this.stateTime = 0;
    this.speed = 1.0;
    this.mirrored = false;
    
    this.defaultFadeTime = 0.15;
    this.crossfadeTime = 0.2;
    
    this.queuedState = null;
    this.queueTime = 0;
  }

  registerAnimation(name, clip, options = {}) {
    const action = this.mixer.clipAction(clip);
    action.name = name;
    action.loop = options.loop || THREE.LoopRepeat;
    action.clampWhenFinished = options.clampWhenFinished || false;
    action.timeScale = options.timeScale || 1;
    this.actions.set(name, { action, clip, options });
    return action;
  }

  play(state, options = {}) {
    const { 
      layer = AnimLayer.BASE, 
      fadeIn = this.defaultFadeTime, 
      fadeOut = this.defaultFadeTime,
      timeScale = 1,
      loop = true,
      clampWhenFinished = false,
      weight = 1,
      sync = false,
    } = options;
    
    const anim = this.actions.get(state);
    if (!anim) {
      console.warn(`Animation "${state}" not registered`);
      return false;
    }
    
    const action = anim.action;
    
    if (this.activeActions.has(layer)) {
      const current = this.activeActions.get(layer);
      if (current.action === action) {
        action.timeScale = timeScale * this.speed;
        return true;
      }
      current.action.crossFadeTo(action, fadeOut, true);
    } else {
      action.reset();
      action.fadeIn(fadeIn);
      action.play();
    }
    
    action.timeScale = timeScale * this.speed;
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, clampWhenFinished ? 1 : Infinity);
    action.setEffectiveWeight(weight);
    
    this.activeActions.set(layer, { action, state, startTime: this.stateTime });
    
    if (layer === AnimLayer.BASE) {
      this.previousState = this.state;
      this.state = state;
      this.stateTime = 0;
    }
    
    return true;
  }

  crossFade(state, duration = 0.2, options = {}) {
    const anim = this.actions.get(state);
    if (!anim) return false;
    
    if (this.activeActions.has(AnimLayer.BASE)) {
      const current = this.activeActions.get(AnimLayer.BASE);
      current.action.crossFadeTo(anim.action, duration, true);
    } else {
      anim.action.reset();
      anim.action.fadeIn(duration);
      anim.action.play();
    }
    
    anim.action.timeScale = (options.timeScale || 1) * this.speed;
    anim.action.setLoop(options.loop !== false ? THREE.LoopRepeat : THREE.LoopOnce, 
                        options.clampWhenFinished ? 1 : Infinity);
    
    this.activeActions.set(AnimLayer.BASE, { action: anim.action, state, startTime: this.stateTime });
    this.previousState = this.state;
    this.state = state;
    this.stateTime = 0;
    
    return true;
  }

  stop(layer = AnimLayer.BASE, fadeOut = 0.1) {
    const active = this.activeActions.get(layer);
    if (active) {
      active.action.fadeOut(fadeOut);
      this.activeActions.delete(layer);
    }
  }

  stopAll(fadeOut = 0.1) {
    this.activeActions.forEach(({ action }) => action.fadeOut(fadeOut));
    this.activeActions.clear();
  }

  setSpeed(speed) {
    this.speed = speed;
    this.activeActions.forEach(({ action }) => {
      const baseScale = action.timeScale / (this.speed || 1);
      action.timeScale = baseScale * speed;
    });
  }

  setWeight(layer, weight, fadeTime = 0.2) {
    const active = this.activeActions.get(layer);
    if (active) {
      active.action.setEffectiveWeight(weight);
    }
  }

  getState() {
    return this.state;
  }

  getStateTime() {
    return this.stateTime;
  }

  isPlaying(state, layer = AnimLayer.BASE) {
    const active = this.activeActions.get(layer);
    return active?.state === state && active.action.isRunning();
  }

  getAction(state) {
    const anim = this.actions.get(state);
    return anim?.action;
  }

  update(dt) {
    this.stateTime += dt;
    
    if (this.queuedState && this.stateTime >= this.queueTime) {
      this.play(this.queuedState);
      this.queuedState = null;
    }
    
    this.activeActions.forEach(({ action, state, startTime }, layer) => {
      if (!action.isRunning() && action.getEffectiveWeight() < 0.01) {
        this.activeActions.delete(layer);
      }
    });
    
    this.transitions = this.transitions.filter(t => {
      t.elapsed += dt;
      if (t.elapsed >= t.duration) {
        t.onComplete?.();
        return false;
      }
      return true;
    });
  }

  queueState(state, delay = 0) {
    this.queuedState = state;
    this.queueTime = this.stateTime + delay;
  }

  mirrorAnimation(state, mirrored = true) {
    const anim = this.actions.get(state);
    if (!anim) return;
    this.mirrored = mirrored;
  }

  getClipProgress(state) {
    const anim = this.actions.get(state);
    if (!anim || !anim.action.isRunning()) return 0;
    return (anim.action.time / anim.clip.duration) % 1;
  }

  setClipTime(state, time) {
    const anim = this.actions.get(state);
    if (anim) anim.action.time = time;
  }

  addEventCallback(state, time, callback) {
    const anim = this.actions.get(state);
    if (!anim) return;
    
    const checkEvent = () => {
      const progress = this.getClipProgress(state);
      if (progress >= time && progress < time + 0.016) {
        callback();
      }
    };
    
    this.character.engine?.addFrameCallback?.(checkEvent);
  }
}

export function createAnimationClipsFromMorphs() {
  const clips = [];
  
  const createClip = (name, duration, tracks) => {
    return new THREE.AnimationClip(name, duration, tracks);
  };
  
  return clips;
}