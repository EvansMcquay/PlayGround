import * as THREE from 'three';

export class CameraController {
  constructor(camera, engine) {
    this.camera = camera;
    this.engine = engine;
    
    this.mode = 'gameplay';
    this.target = new THREE.Vector3();
    this.targetEntity = null;
    
    this.offset = new THREE.Vector3(0, 8, 15);
    this.idealOffset = new THREE.Vector3(0, 8, 15);
    this.currentOffset = new THREE.Vector3(0, 8, 15);
    
    this.yaw = 0;
    this.pitch = -0.5;
    this.distance = 18;
    this.height = 8;
    
    this.lookAhead = new THREE.Vector3();
    this.lookAheadDistance = 3;
    
    this.shake = {
      intensity: 0,
      duration: 0,
      timer: 0,
      offset: new THREE.Vector3(),
      rotation: new THREE.Euler(),
    };
    
    this.slowMo = {
      active: false,
      timer: 0,
      duration: 0,
      factor: 0.25,
      originalSpeed: 1,
    };
    
    this.legendMode = {
      active: false,
      character: null,
      timer: 0,
      orbitSpeed: 0.3,
      orbitRadius: 6,
      orbitHeight: 4,
      orbitAngle: 0,
    };
    
    this.dunkCamera = {
      active: false,
      timer: 0,
      duration: 0,
      type: null,
      zoomFactor: 1,
      targetFOV: 55,
      originalFOV: 55,
    };
    
    this.milestoneFlash = {
      active: false,
      timer: 0,
      duration: 0.5,
      color: new THREE.Color(0xffd23f),
      intensity: 0,
    };
    
    this.bounds = {
      minX: -16, maxX: 16,
      minZ: -10, maxZ: 10,
      minHeight: 4, maxHeight: 20,
    };
    
    this.lerpSpeed = 8;
    this.rotationLerpSpeed = 5;
  }

  setTarget(entity) {
    this.targetEntity = entity;
  }

  setMode(mode) {
    this.mode = mode;
  }

  update(dt) {
    this.updateShake(dt);
    this.updateSlowMo(dt);
    this.updateLegendMode(dt);
    this.updateDunkCamera(dt);
    this.updateMilestoneFlash(dt);
    
    if (this.mode === 'gameplay') {
      this.updateGameplayCamera(dt);
    } else if (this.mode === 'intro') {
      this.updateIntroCamera(dt);
    } else if (this.mode === 'replay') {
      this.updateReplayCamera(dt);
    } else if (this.mode === 'menu') {
      this.updateMenuCamera(dt);
    }
    
    this.applyTransforms();
  }

  updateGameplayCamera(dt) {
    if (!this.targetEntity) return;
    
    const entity = this.targetEntity;
    const pos = entity.position.clone();
    const vel = entity.velocity.clone();
    vel.y = 0;
    
    this.lookAhead.lerp(vel.normalize().multiplyScalar(this.lookAheadDistance), dt * 3);
    
    const targetPos = pos.add(this.lookAhead);
    targetPos.y = Math.max(this.bounds.minHeight, Math.min(this.bounds.maxHeight, pos.y + this.height));
    
    targetPos.x = THREE.MathUtils.clamp(targetPos.x, this.bounds.minX, this.bounds.maxX);
    targetPos.z = THREE.MathUtils.clamp(targetPos.z, this.bounds.minZ, this.bounds.maxZ);
    
    this.target.lerp(targetPos, dt * this.lerpSpeed);
    
    if (entity.state.dunking) {
      const rimSide = this.engine.court?.getTargetRimSide?.(entity) || 'east';
      const rimPos = this.engine.court?.getRimPosition?.(rimSide) || new THREE.Vector3();
      this.target.lerp(rimPos.clone().setY(4), dt * 5);
    }
    
    const behindOffset = new THREE.Vector3(
      -Math.sin(this.yaw) * this.distance,
      this.height,
      -Math.cos(this.yaw) * this.distance
    );
    
    this.idealOffset.lerp(behindOffset, dt * 3);
  }

  updateIntroCamera(dt) {
    const t = this.engine.clock.getElapsedTime();
    this.yaw = t * 0.15;
    this.pitch = -0.4 + Math.sin(t * 0.5) * 0.1;
    this.distance = 22 + Math.sin(t * 0.3) * 3;
    this.height = 10 + Math.sin(t * 0.7) * 2;
    
    this.target.set(0, 2, 0);
  }

  updateReplayCamera(dt) {
    if (!this.replayData) return;
    
    this.replayTimer += dt;
    const progress = this.replayTimer / this.replayDuration;
    
    if (progress >= 1) {
      this.endReplay();
      return;
    }
    
    const start = this.replayData.start;
    const end = this.replayData.end;
    
    this.target.lerpVectors(start.target, end.target, progress);
    this.yaw = THREE.MathUtils.lerp(start.yaw, end.yaw, progress);
    this.pitch = THREE.MathUtils.lerp(start.pitch, end.pitch, progress);
    this.distance = THREE.MathUtils.lerp(start.distance, end.distance, progress);
    this.height = THREE.MathUtils.lerp(start.height, end.height, progress);
    this.camera.fov = THREE.MathUtils.lerp(start.fov, end.fov, progress);
    this.camera.updateProjectionMatrix();
  }

  updateMenuCamera(dt) {
    const t = this.engine.clock.getElapsedTime();
    this.yaw = t * 0.08;
    this.pitch = -0.35;
    this.distance = 18;
    this.height = 8;
    this.target.set(0, 1.5, 0);
  }

  updateShake(dt) {
    if (this.shake.timer > 0) {
      this.shake.timer -= dt;
      const progress = 1 - this.shake.timer / this.shake.duration;
      const decay = 1 - progress;
      
      this.shake.offset.set(
        (Math.random() - 0.5) * this.shake.intensity * decay * 2,
        (Math.random() - 0.5) * this.shake.intensity * decay * 1.5,
        (Math.random() - 0.5) * this.shake.intensity * decay
      );
      
      this.shake.rotation.set(
        (Math.random() - 0.5) * this.shake.intensity * decay * 0.1,
        (Math.random() - 0.5) * this.shake.intensity * decay * 0.1,
        (Math.random() - 0.5) * this.shake.intensity * decay * 0.05
      );
    } else {
      this.shake.offset.set(0, 0, 0);
      this.shake.rotation.set(0, 0, 0);
    }
  }

  updateSlowMo(dt) {
    if (this.slowMo.active) {
      this.slowMo.timer -= dt;
      if (this.slowMo.timer <= 0) {
        this.disableSlowMo();
      }
    }
  }

  updateLegendMode(dt) {
    if (this.legendMode.active && this.legendMode.character) {
      this.legendMode.timer -= dt;
      this.legendMode.orbitAngle += dt * this.legendMode.orbitSpeed;
      
      const char = this.legendMode.character;
      const charPos = char.position.clone();
      
      this.target.lerp(charPos.clone().setY(2.5), dt * 4);
      
      this.yaw = this.legendMode.orbitAngle;
      this.distance = this.legendMode.orbitRadius;
      this.height = this.legendMode.orbitHeight;
      this.pitch = -0.3;
    }
  }

  updateDunkCamera(dt) {
    if (this.dunkCamera.active) {
      this.dunkCamera.timer -= dt;
      const progress = 1 - this.dunkCamera.timer / this.dunkCamera.duration;
      
      if (this.dunkCamera.type === 'zoom') {
        const zoom = THREE.MathUtils.lerp(1, this.dunkCamera.zoomFactor, progress);
        this.camera.fov = this.dunkCamera.originalFOV / zoom;
        this.camera.updateProjectionMatrix();
      } else if (this.dunkCamera.type === 'dramatic') {
        const fov = THREE.MathUtils.lerp(this.dunkCamera.originalFOV, this.dunkCamera.targetFOV, progress);
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
      }
      
      if (this.dunkCamera.timer <= 0) {
        this.endDunkCamera();
      }
    }
  }

  updateMilestoneFlash(dt) {
    if (this.milestoneFlash.active) {
      this.milestoneFlash.timer -= dt;
      const progress = this.milestoneFlash.timer / this.milestoneFlash.duration;
      this.milestoneFlash.intensity = progress;
    }
  }

  applyTransforms() {
    const offset = new THREE.Vector3();
    offset.x = Math.sin(this.yaw) * this.distance * Math.cos(this.pitch);
    offset.z = Math.cos(this.yaw) * this.distance * Math.cos(this.pitch);
    offset.y = this.distance * Math.sin(this.pitch) + this.height;
    
    const desiredPos = this.target.clone().add(offset);
    this.currentOffset.lerp(offset, 0.1);
    
    this.camera.position.lerp(desiredPos, 0.1);
    this.camera.lookAt(this.target.clone().add(this.shake.offset));
    this.camera.rotation.z += this.shake.rotation.z;
  }

  triggerDunkShake(intensity, duration) {
    this.shake.intensity = intensity;
    this.shake.duration = duration;
    this.shake.timer = duration;
  }

  enableSlowMo(duration, factor = 0.25) {
    this.slowMo.active = true;
    this.slowMo.timer = duration;
    this.slowMo.duration = duration;
    this.slowMo.factor = factor;
    this.slowMo.originalSpeed = this.engine.timeScale || 1;
    this.engine.timeScale = factor;
  }

  disableSlowMo() {
    this.slowMo.active = false;
    this.engine.timeScale = this.slowMo.originalSpeed;
  }

  enableLegendMode(character) {
    this.legendMode.active = true;
    this.legendMode.character = character;
    this.legendMode.timer = this.hype?.legendDuration || 15;
    this.legendMode.orbitAngle = 0;
  }

  disableLegendMode() {
    this.legendMode.active = false;
    this.legendMode.character = null;
  }

  triggerDunkCamera(type, duration) {
    this.dunkCamera.active = true;
    this.dunkCamera.timer = duration;
    this.dunkCamera.duration = duration;
    this.dunkCamera.type = type;
    this.dunkCamera.originalFOV = this.camera.fov;
    
    if (type === 'zoom') {
      this.dunkCamera.zoomFactor = 1.5;
    } else if (type === 'dramatic') {
      this.dunkCamera.targetFOV = 35;
    }
  }

  endDunkCamera() {
    this.dunkCamera.active = false;
    this.camera.fov = this.dunkCamera.originalFOV;
    this.camera.updateProjectionMatrix();
  }

  triggerMilestoneFlash(reward) {
    const colors = {
      confidence: 0x00e5ff,
      momentum: 0xff2fb3,
      dominance: 0xffd23f,
      legend: 0xffd23f,
    };
    
    this.milestoneFlash.active = true;
    this.milestoneFlash.timer = this.milestoneFlash.duration;
    this.milestoneFlash.color.setHex(colors[reward] || 0xffd23f);
    this.milestoneFlash.intensity = 1;
  }

  startReplay(data, duration = 3) {
    this.mode = 'replay';
    this.replayData = data;
    this.replayDuration = duration;
    this.replayTimer = 0;
  }

  endReplay() {
    this.mode = 'gameplay';
    this.replayData = null;
  }

  setBounds(bounds) {
    this.bounds = { ...this.bounds, ...bounds };
  }

  setYaw(yaw) {
    this.yaw = yaw;
  }

  setPitch(pitch) {
    this.pitch = THREE.MathUtils.clamp(pitch, -1.2, 0.2);
  }

  setDistance(dist) {
    this.distance = THREE.MathUtils.clamp(dist, 8, 40);
  }

  getState() {
    return {
      mode: this.mode,
      position: this.camera.position.clone(),
      target: this.target.clone(),
      yaw: this.yaw,
      pitch: this.pitch,
      distance: this.distance,
      fov: this.camera.fov,
      shakeActive: this.shake.timer > 0,
      slowMoActive: this.slowMo.active,
      legendActive: this.legendMode.active,
    };
  }

  dispose() {
    this.targetEntity = null;
  }
}