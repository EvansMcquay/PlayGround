import * as THREE from 'three';

export const BallState = {
  HELD: 'held',
  DRIBBLE: 'dribble',
  PASS: 'pass',
  SHOT: 'shot',
  LOOSE: 'loose',
  ALLEY_OOP: 'alley_oop',
};

export class Basketball {
  constructor(radius = 0.121) {
    this.radius = radius;
    this.mesh = null;
    this.body = null;
    
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();
    this.rotation = new THREE.Quaternion();
    
    this.state = BallState.LOOSE;
    this.holder = null;
    this.lastHolder = null;
    this.possessionTeam = null;
    
    this.gravity = -9.81 * 1.2;
    this.bounceRestitution = 0.65;
    this.airDrag = 0.02;
    this.spinDecay = 0.98;
    
    this.shotInfo = null;
    this.passInfo = null;
    this.dribbleInfo = null;
    
    this.trail = [];
    this.maxTrailLength = 8;
    
    this.collisionCallbacks = [];
  }

  createMesh(material) {
    const geometry = new THREE.SphereGeometry(this.radius, 32, 24);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.name = 'basketball';
    return this.mesh;
  }

  createProceduralMaterial() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const baseColor = '#c9682b';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 256);
    
    ctx.strokeStyle = '#2a1405';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(256, 0); ctx.lineTo(256, 256); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 128); ctx.lineTo(512, 128); ctx.stroke();
    ctx.beginPath();
    ctx.arc(128, 128, 100, -1.2, 1.2); ctx.stroke();
    ctx.beginPath();
    ctx.arc(384, 128, 100, Math.PI - 1.2, Math.PI + 1.2); ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.05,
      normalMap: this.createNormalMap(),
    });
  }

  createNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(512, 512);
    const data = imageData.data;
    
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const nx = (x / 512 - 0.5) * 2;
        const ny = (y / 512 - 0.5) * 2;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const i = (y * 512 + x) * 4;
        data[i] = (nx * 0.5 + 0.5) * 255;
        data[i + 1] = (ny * 0.5 + 0.5) * 255;
        data[i + 2] = (nz * 0.5 + 0.5) * 255;
        data[i + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  attachToHand(holder, hand = 'right') {
    this.state = BallState.HELD;
    this.holder = holder;
    this.holder.state.hasBall = true;
    this.holder.state.ballHand = hand;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.lastHolder = holder;
  }

  release() {
    this.holder = null;
    this.state = BallState.LOOSE;
  }

  startDribble(holder, hand = 'right') {
    this.state = BallState.DRIBBLE;
    this.holder = holder;
    this.holder.state.hasBall = true;
    this.holder.state.ballHand = hand;
    this.dribbleInfo = {
      hand,
      phase: 0,
      height: 0.6,
      speed: 1.0,
      lastBounce: 0,
    };
  }

  startPass(from, to, isLob = false) {
    this.state = isLob ? BallState.ALLEY_OOP : BallState.PASS;
    this.holder = null;
    if (from) from.state.hasBall = false;
    this.passInfo = {
      from: from?.position.clone() || this.position.clone(),
      to: to?.position.clone() || new THREE.Vector3(),
      target: to,
      isLob,
      startTime: 0,
      duration: isLob ? 0.9 : 0.45,
      peakHeight: isLob ? 3.5 : 1.5,
    };
    this.lastHolder = from;
  }

  startShot(shooter, target, shotType = 'jump') {
    this.state = BallState.SHOT;
    this.holder = null;
    if (shooter) shooter.state.hasBall = false;
    
    const dist = shooter.position.distanceTo(target);
    const isDunk = dist < 2.5 && shooter.state.jumping;
    
    this.shotInfo = {
      shooter,
      target: target.clone(),
      shotType,
      isDunk,
      isThree: dist > 6.75,
      releaseHeight: this.position.y,
      releaseVelocity: this.velocity.clone(),
      arcHeight: isDunk ? 0 : Math.max(2.5, dist * 0.35),
      startTime: 0,
      gravity: this.gravity,
      greenWindow: false,
      perfectRelease: false,
      contested: false,
    };
    
    this.lastHolder = shooter;
  }

  update(dt, court) {
    this.updateTrail();
    
    switch (this.state) {
      case BallState.HELD:
        this.updateHeld(dt);
        break;
      case BallState.DRIBBLE:
        this.updateDribble(dt);
        break;
      case BallState.PASS:
      case BallState.ALLEY_OOP:
        this.updatePass(dt);
        break;
      case BallState.SHOT:
        this.updateShot(dt);
        break;
      case BallState.LOOSE:
        this.updateLoose(dt, court);
        break;
    }
    
    this.updateMesh();
    this.checkCollisions(court);
  }

  updateHeld(dt) {
    if (!this.holder) {
      this.state = BallState.LOOSE;
      return;
    }
    
    const handBone = this.holder.bones[`${this.holder.state.ballHand}Hand`];
    if (handBone) {
      const handPos = new THREE.Vector3();
      handBone.getWorldPosition(handPos);
      this.position.copy(handPos);
      this.position.y += 0.08;
    } else {
      this.position.copy(this.holder.position);
      this.position.y += 1.0;
      const forward = new THREE.Vector3();
      this.holder.root.getWorldDirection(forward);
      this.position.add(forward.multiplyScalar(0.4));
    }
    
    this.rotation.identity();
  }

  updateDribble(dt) {
    if (!this.holder || !this.dribbleInfo) {
      this.state = BallState.LOOSE;
      return;
    }
    
    const hand = this.dribbleInfo.hand;
    const handBone = this.holder.bones[`${hand}Hand`];
    let handPos = new THREE.Vector3();
    
    if (handBone) {
      handBone.getWorldPosition(handPos);
    } else {
      handPos.copy(this.holder.position);
      handPos.y += 0.8;
      const side = hand === 'right' ? 1 : -1;
      const right = new THREE.Vector3();
      this.holder.root.getWorldDirection(new THREE.Vector3()).cross(new THREE.Vector3(0, 1, 0)).multiplyScalar(side * 0.3);
      handPos.add(right);
    }
    
    this.dribbleInfo.phase += dt * 8 * this.dribbleInfo.speed;
    const bounce = Math.abs(Math.sin(this.dribbleInfo.phase));
    const height = this.dribbleInfo.height * (1 - bounce) + 0.05;
    
    this.position.x = handPos.x;
    this.position.z = handPos.z;
    this.position.y = handPos.y - this.dribbleInfo.height + height;
    
    if (bounce < 0.05 && this.dribbleInfo.lastBounce < 0.5) {
      this.onBounce();
    }
    this.dribbleInfo.lastBounce = bounce;
  }

  updatePass(dt) {
    if (!this.passInfo) return;
    
    this.passInfo.startTime += dt;
    const t = Math.min(1, this.passInfo.startTime / this.passInfo.duration);
    const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    
    const start = this.passInfo.from;
    const end = this.passInfo.to.clone();
    end.y += 1.0;
    
    this.position.lerpVectors(start, end, easedT);
    this.position.y += Math.sin(t * Math.PI) * this.passInfo.peakHeight;
    
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    this.rotation.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    
    if (t >= 1) {
      this.completePass();
    }
  }

  completePass() {
    if (this.passInfo?.target) {
      const target = this.passInfo.target;
      this.attachToHand(target, 'right');
      target.state.hasBall = true;
      this.passInfo = null;
    } else {
      this.state = BallState.LOOSE;
      this.passInfo = null;
    }
  }

  updateShot(dt) {
    if (!this.shotInfo) {
      this.state = BallState.LOOSE;
      return;
    }
    
    this.shotInfo.startTime += dt;
    this.velocity.y += this.gravity * dt;
    this.position.addScaledVector(this.velocity, dt);
    
    this.angularVelocity.multiplyScalar(this.spinDecay);
    const rotQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(this.angularVelocity.x * dt, this.angularVelocity.y * dt, this.angularVelocity.z * dt)
    );
    this.rotation.premultiply(rotQuat);
    
    if (this.shotInfo.isDunk && this.position.y <= 3.05) {
      this.onDunk();
    }
  }

  updateLoose(dt, court) {
    this.velocity.y += this.gravity * dt;
    this.velocity.multiplyScalar(1 - this.airDrag * dt);
    this.position.addScaledVector(this.velocity, dt);
    
    this.angularVelocity.multiplyScalar(this.spinDecay);
    const rotQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(this.angularVelocity.x * dt, this.angularVelocity.y * dt, this.angularVelocity.z * dt)
    );
    this.rotation.premultiply(rotQuat);
    
    if (this.position.y <= this.radius) {
      this.position.y = this.radius;
      if (Math.abs(this.velocity.y) > 1) {
        this.onBounce();
      }
      this.velocity.y = Math.abs(this.velocity.y) * this.bounceRestitution;
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
    }
    
    this.checkCourtBounds(court);
  }

  onBounce() {
    if (this.engine?.audio) {
      this.engine.audio.playBounce(this.position);
    }
  }

  onDunk() {
    this.shotInfo = null;
    this.state = BallState.LOOSE;
    this.velocity.set(0, 0, 0);
  }

  checkCollisions(court) {
    if (!court) return;
    
    const rimPos = court.getNearestRim(this.position);
    if (rimPos) {
      const toRim = new THREE.Vector3().subVectors(this.position, rimPos);
      const dist = toRim.length();
      
      if (dist < this.radius + 0.23 && this.velocity.y < 0) {
        if (dist < 0.15 && this.position.y > 3.0 && this.position.y < 3.3) {
          this.onMake(rimPos);
        } else {
          this.onRimHit(toRim.normalize());
        }
      }
    }
    
    const backboard = court.getBackboard(this.position);
    if (backboard && this.position.x > backboard.minX && this.position.x < backboard.maxX) {
      if (this.velocity.x > 0 && this.position.x > backboard.minX) {
        this.velocity.x *= -0.6;
        this.position.x = backboard.minX + this.radius;
      }
    }
  }

  onRimHit(normal) {
    this.velocity.reflect(normal).multiplyScalar(0.5);
    this.velocity.y = Math.max(this.velocity.y, 2);
  }

  onMake(rimPos) {
    this.shotInfo = null;
    this.state = BallState.LOOSE;
    this.velocity.set(0, 0, 0);
    this.position.y = 3.05;
  }

  checkCourtBounds(court) {
    const halfL = court.length / 2 + 1;
    const halfW = court.width / 2 + 1;
    
    if (Math.abs(this.position.x) > halfL) {
      this.position.x = Math.sign(this.position.x) * halfL;
      this.velocity.x *= -0.5;
    }
    if (Math.abs(this.position.z) > halfW) {
      this.position.z = Math.sign(this.position.z) * halfW;
      this.velocity.z *= -0.5;
    }
  }

  updateMesh() {
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.rotation);
    }
  }

  updateTrail() {
    this.trail.unshift(this.position.clone());
    if (this.trail.length > this.maxTrailLength) this.trail.pop();
  }

  getTrailPositions() {
    return this.trail;
  }

  onCollision(callback) {
    this.collisionCallbacks.push(callback);
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) this.mesh.material.forEach(m => m.dispose());
        else this.mesh.material.dispose();
      }
    }
  }
}