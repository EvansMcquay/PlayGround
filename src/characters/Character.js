import * as THREE from 'three';

const BONE_NAMES = {
  hips: 'mixamorig:Hips',
  spine: 'mixamorig:Spine',
  spine1: 'mixamorig:Spine1',
  spine2: 'mixamorig:Spine2',
  neck: 'mixamorig:Neck',
  head: 'mixamorig:Head',
  leftEye: 'mixamorig:LeftEye',
  rightEye: 'mixamorig:RightEye',
  leftShoulder: 'mixamorig:LeftShoulder',
  leftArm: 'mixamorig:LeftArm',
  leftForeArm: 'mixamorig:LeftForeArm',
  leftHand: 'mixamorig:LeftHand',
  leftHandThumb1: 'mixamorig:LeftHandThumb1',
  leftHandThumb2: 'mixamorig:LeftHandThumb2',
  leftHandThumb3: 'mixamorig:LeftHandThumb3',
  leftHandIndex1: 'mixamorig:LeftHandIndex1',
  leftHandIndex2: 'mixamorig:LeftHandIndex2',
  leftHandIndex3: 'mixamorig:LeftHandIndex3',
  leftHandMiddle1: 'mixamorig:LeftHandMiddle1',
  leftHandMiddle2: 'mixamorig:LeftHandMiddle2',
  leftHandMiddle3: 'mixamorig:LeftHandMiddle3',
  leftHandRing1: 'mixamorig:LeftHandRing1',
  leftHandRing2: 'mixamorig:LeftHandRing2',
  leftHandRing3: 'mixamorig:LeftHandRing3',
  leftHandPinky1: 'mixamorig:LeftHandPinky1',
  leftHandPinky2: 'mixamorig:LeftHandPinky2',
  leftHandPinky3: 'mixamorig:LeftHandPinky3',
  rightShoulder: 'mixamorig:RightShoulder',
  rightArm: 'mixamorig:RightArm',
  rightForeArm: 'mixamorig:RightForeArm',
  rightHand: 'mixamorig:RightHand',
  rightHandThumb1: 'mixamorig:RightHandThumb1',
  rightHandThumb2: 'mixamorig:RightHandThumb2',
  rightHandThumb3: 'mixamorig:RightHandThumb3',
  rightHandIndex1: 'mixamorig:RightHandIndex1',
  rightHandIndex2: 'mixamorig:RightHandIndex2',
  rightHandIndex3: 'mixamorig:RightHandIndex3',
  rightHandMiddle1: 'mixamorig:RightHandMiddle1',
  rightHandMiddle2: 'mixamorig:RightHandMiddle2',
  rightHandMiddle3: 'mixamorig:RightHandMiddle3',
  rightHandRing1: 'mixamorig:RightHandRing1',
  rightHandRing2: 'mixamorig:RightHandRing2',
  rightHandRing3: 'mixamorig:RightHandRing3',
  rightHandPinky1: 'mixamorig:RightHandPinky1',
  rightHandPinky2: 'mixamorig:RightHandPinky2',
  rightHandPinky3: 'mixamorig:RightHandPinky3',
  leftUpLeg: 'mixamorig:LeftUpLeg',
  leftLeg: 'mixamorig:LeftLeg',
  leftFoot: 'mixamorig:LeftFoot',
  leftToeBase: 'mixamorig:LeftToeBase',
  rightUpLeg: 'mixamorig:RightUpLeg',
  rightLeg: 'mixamorig:RightLeg',
  rightFoot: 'mixamorig:RightFoot',
  rightToeBase: 'mixamorig:RightToeBase',
};

export class Character {
  constructor(data = {}) {
    this.id = data.id || 'character';
    this.name = data.name || 'Player';
    this.height = data.height || 1.9;
    this.build = data.build || 'athletic';
    this.skinTone = data.skinTone || 0xcc9966;
    this.hairStyle = data.hairStyle || 'short';
    this.hairColor = data.hairColor || 0x2a1a0a;
    this.eyeColor = data.eyeColor || 0x3a2a1a;
    
    this.mesh = null;
    this.skeleton = null;
    this.mixer = null;
    this.animations = new Map();
    this.bones = {};
    this.boneMap = {};
    
    this.root = new THREE.Group();
    this.root.name = this.id;
    
    this.ikTargets = {
      leftHand: new THREE.Object3D(),
      rightHand: new THREE.Object3D(),
      leftFoot: new THREE.Object3D(),
      rightFoot: new THREE.Object3D(),
    };
    
    this.ikEnabled = { leftHand: false, rightHand: false, leftFoot: false, rightFoot: false };
    this.ikWeights = { leftHand: 1, rightHand: 1, leftFoot: 1, rightFoot: 1 };
    
    this.currentAction = null;
    this.actionQueue = [];
    this.blendTime = 0.15;
    
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();
    this.faceDirection = new THREE.Vector3(1, 0, 0);
    
    this.attributes = {
      speed: data.speed || 7.5,
      acceleration: data.acceleration || 8.0,
      dunk: data.dunk || 70,
      shoot: data.shoot || 70,
      handles: data.handles || 70,
      defense: data.defense || 70,
      stamina: data.stamina || 80,
      vertical: data.vertical || 70,
      strength: data.strength || 70,
    };
    
    this.signatureDunk = data.signatureDunk || 'tomahawk';
    this.introAnimation = data.introAnimation || 'intro_confident';
    
    this.state = {
      grounded: true,
      jumping: false,
      dunking: false,
      shooting: false,
      dribbling: false,
      crossingOver: false,
      stealing: false,
      blocking: false,
      stunned: false,
      stunTime: 0,
      hasBall: false,
      ballHand: 'right',
      legendMode: false,
    };
    
    this.stats = {
      points: 0, fgm: 0, fga: 0, tpm: 0, 
      dunks: 0, crossovers: 0, steals: 0, blocks: 0, assists: 0
    };
    
    this.animState = 'idle';
    this.animSpeed = 1.0;
    this.lastAnimTime = 0;
  }

  async loadModel(gltf, options = {}) {
    this.mesh = gltf.scene;
    this.mesh.name = `${this.id}_mesh`;
    
    this.mesh.traverse(child => {
      if (child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.skinning = true;
        if (child.material.map) child.material.map.colorSpace = THREE.SRGBColorSpace;
      }
      if (child.isMesh && !child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    this.skeleton = this.findSkeleton(this.mesh);
    if (!this.skeleton) {
      console.warn(`No skeleton found for ${this.name}`);
      return this.createFallbackModel();
    }
    
    this.mapBones();
    this.setupIK();
    this.mixer = new THREE.AnimationMixer(this.mesh);
    
    if (gltf.animations && gltf.animations.length > 0) {
      gltf.animations.forEach(clip => {
        const action = this.mixer.clipAction(clip);
        this.animations.set(clip.name, { clip, action });
      });
    }
    
    this.root.add(this.mesh);
    this.applyAppearance();
    
    if (options.position) this.root.position.copy(options.position);
    if (options.rotation) this.root.rotation.set(...options.rotation);
    if (options.scale) this.root.scale.setScalar(options.scale);
    
    return this;
  }

  findSkeleton(object) {
    let found = null;
    object.traverse(child => {
      if (child.isSkinnedMesh && child.skeleton) {
        found = child.skeleton;
      }
    });
    return found;
  }

  mapBones() {
    if (!this.skeleton) return;
    
    this.skeleton.bones.forEach(bone => {
      const cleanName = bone.name.replace('mixamorig:', '');
      this.bones[cleanName] = bone;
      this.boneMap[bone.name] = bone;
    });
    
    Object.entries(BONE_NAMES).forEach(([key, name]) => {
      if (this.boneMap[name]) this.bones[key] = this.boneMap[name];
    });
  }

  setupIK() {
    if (!this.bones.leftHand || !this.bones.rightHand) return;
    
    this.ikTargets.leftHand.name = 'IK_LeftHand';
    this.ikTargets.rightHand.name = 'IK_RightHand';
    this.ikTargets.leftFoot.name = 'IK_LeftFoot';
    this.ikTargets.rightFoot.name = 'IK_RightFoot';
    
    this.root.add(this.ikTargets.leftHand);
    this.root.add(this.ikTargets.rightHand);
    this.root.add(this.ikTargets.leftFoot);
    this.root.add(this.ikTargets.rightFoot);
  }

  createFallbackModel() {
    console.log(`Creating procedural fallback model for ${this.name}`);
    this.mesh = this.buildProceduralModel();
    this.root.add(this.mesh);
    return this;
  }

  buildProceduralModel() {
    const group = new THREE.Group();
    const h = this.height;
    const scale = h / 1.85;
    
    const skinMat = new THREE.MeshStandardMaterial({ 
      color: this.skinTone, 
      roughness: 0.6, 
      metalness: 0.1,
      transparent: false
    });
    const clothMat = (color) => new THREE.MeshStandardMaterial({ 
      color, roughness: 0.85, metalness: 0.05 
    });
    const shoeMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a, roughness: 0.4, metalness: 0.3 
    });
    
    const geom = {
      capsule: (r, h) => new THREE.CapsuleGeometry(r, h, 8, 16),
      box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
      sphere: (r) => new THREE.SphereGeometry(r, 16, 12),
    };
    
    const legs = new THREE.Group();
    const legL = new THREE.Mesh(geom.capsule(0.085 * scale, 0.45 * scale), skinMat);
    legL.position.set(-0.11 * scale, -0.42 * scale, 0);
    legL.name = 'LeftLeg';
    const legR = new THREE.Mesh(geom.capsule(0.085 * scale, 0.45 * scale), skinMat);
    legR.position.set(0.11 * scale, -0.42 * scale, 0);
    legR.name = 'RightLeg';
    legs.add(legL, legR);
    
    const shoeL = new THREE.Mesh(geom.box(0.12 * scale, 0.06 * scale, 0.28 * scale), shoeMat);
    shoeL.position.set(-0.11 * scale, -0.66 * scale, 0.04 * scale);
    const shoeR = new THREE.Mesh(geom.box(0.12 * scale, 0.06 * scale, 0.28 * scale), shoeMat);
    shoeR.position.set(0.11 * scale, -0.66 * scale, 0.04 * scale);
    legs.add(shoeL, shoeR);
    
    const shorts = new THREE.Mesh(geom.box(0.32 * scale, 0.18 * scale, 0.22 * scale), clothMat(0x1a1a2e));
    shorts.position.y = -0.12 * scale;
    
    const torso = new THREE.Mesh(geom.box(0.3 * scale, 0.35 * scale, 0.18 * scale), clothMat(0x00e5ff));
    torso.position.y = 0.12 * scale;
    
    const armL = new THREE.Mesh(geom.capsule(0.065 * scale, 0.32 * scale), skinMat);
    armL.position.set(-0.26 * scale, 0.2 * scale, 0);
    armL.name = 'LeftArm';
    const armR = new THREE.Mesh(geom.capsule(0.065 * scale, 0.32 * scale), skinMat);
    armR.position.set(0.26 * scale, 0.2 * scale, 0);
    armR.name = 'RightArm';
    
    const handL = new THREE.Mesh(geom.sphere(0.07 * scale), skinMat);
    handL.position.set(-0.26 * scale, -0.18 * scale, 0);
    handL.scale.set(1, 1.2, 1);
    const handR = new THREE.Mesh(geom.sphere(0.07 * scale), skinMat);
    handR.position.set(0.26 * scale, -0.18 * scale, 0);
    handR.scale.set(1, 1.2, 1);
    
    const head = new THREE.Mesh(geom.sphere(0.11 * scale), skinMat);
    head.position.y = 0.42 * scale;
    head.name = 'Head';
    
    const hair = new THREE.Mesh(geom.sphere(0.115 * scale), 
      new THREE.MeshStandardMaterial({ color: this.hairColor, roughness: 0.9 }));
    hair.position.y = 0.42 * scale;
    hair.scale.set(1.05, 0.9, 1.05);
    
    group.add(legs, shorts, torso, armL, armR, handL, handR, head, hair);
    
    group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    
    return group;
  }

  applyAppearance() {
    if (!this.mesh) return;
    
    this.mesh.traverse(child => {
      if (!child.isMesh) return;
      
      const name = child.name.toLowerCase();
      const mat = child.material;
      const mats = Array.isArray(mat) ? mat : [mat];
      
      mats.forEach(m => {
        if (name.includes('head') || name.includes('face') || name.includes('neck') ||
            name.includes('arm') || name.includes('hand') || name.includes('leg') || 
            name.includes('foot') || name.includes('toe')) {
          m.color.setHex(this.skinTone);
        } else if (name.includes('hair')) {
          m.color.setHex(this.hairColor);
        } else if (name.includes('shirt') || name.includes('jersey') || name.includes('torso') ||
                   name.includes('chest') || name.includes('upper')) {
          m.color.setHex(0x00e5ff);
        } else if (name.includes('short') || name.includes('pant') || name.includes('leg') && !name.includes('up')) {
          m.color.setHex(0x1a1a2e);
        } else if (name.includes('shoe') || name.includes('foot')) {
          m.color.setHex(0x1a1a1a);
        }
        m.needsUpdate = true;
      });
    });
  }

  playAnimation(name, options = {}) {
    const anim = this.animations.get(name);
    if (!anim) {
      console.warn(`Animation "${name}" not found for ${this.name}`);
      return null;
    }
    
    const { loop = THREE.LoopRepeat, clampWhenFinished = false, timeScale = 1 } = options;
    
    if (this.currentAction && this.currentAction !== anim.action) {
      this.currentAction.fadeOut(this.blendTime);
    }
    
    anim.action.reset();
    anim.action.setLoop(loop, clampWhenFinished ? 1 : Infinity);
    anim.action.timeScale = timeScale * this.animSpeed;
    anim.action.fadeIn(this.blendTime);
    anim.action.play();
    
    this.currentAction = anim.action;
    this.animState = name;
    
    return anim.action;
  }

  crossFadeAnimation(name, duration = 0.2, options = {}) {
    const anim = this.animations.get(name);
    if (!anim) return null;
    
    if (this.currentAction) {
      this.currentAction.crossFadeTo(anim.action, duration, true);
    } else {
      anim.action.reset();
      anim.action.play();
    }
    
    anim.action.timeScale = (options.timeScale || 1) * this.animSpeed;
    this.currentAction = anim.action;
    this.animState = name;
    
    return anim.action;
  }

  stopAnimation(fadeOut = 0.1) {
    if (this.currentAction) {
      this.currentAction.fadeOut(fadeOut);
      this.currentAction = null;
    }
  }

  setAnimationSpeed(speed) {
    this.animSpeed = speed;
    if (this.currentAction) {
      this.currentAction.timeScale = speed;
    }
  }

  updateIK(dt) {
    if (!this.skeleton) return;
    
    if (this.ikEnabled.leftHand) {
      this.solveTwoBoneIK(
        this.bones.leftShoulder, this.bones.leftArm, this.bones.leftForeArm,
        this.ikTargets.leftHand.getWorldPosition(new THREE.Vector3()),
        this.ikWeights.leftHand
      );
    }
    
    if (this.ikEnabled.rightHand) {
      this.solveTwoBoneIK(
        this.bones.rightShoulder, this.bones.rightArm, this.bones.rightForeArm,
        this.ikTargets.rightHand.getWorldPosition(new THREE.Vector3()),
        this.ikWeights.rightHand
      );
    }
    
    if (this.ikEnabled.leftFoot) {
      this.solveTwoBoneIK(
        this.bones.hips, this.bones.leftUpLeg, this.bones.leftLeg,
        this.ikTargets.leftFoot.getWorldPosition(new THREE.Vector3()),
        this.ikWeights.leftFoot
      );
    }
    
    if (this.ikEnabled.rightFoot) {
      this.solveTwoBoneIK(
        this.bones.hips, this.bones.rightUpLeg, this.bones.rightLeg,
        this.ikTargets.rightFoot.getWorldPosition(new THREE.Vector3()),
        this.ikWeights.rightFoot
      );
    }
  }

  solveTwoBoneIK(hip, knee, ankle, targetPos, weight = 1) {
    if (!hip || !knee || !ankle) return;
    
    const hipPos = new THREE.Vector3();
    const kneePos = new THREE.Vector3();
    const anklePos = new THREE.Vector3();
    
    hip.getWorldPosition(hipPos);
    knee.getWorldPosition(kneePos);
    ankle.getWorldPosition(anklePos);
    
    const upperLen = hipPos.distanceTo(kneePos);
    const lowerLen = kneePos.distanceTo(anklePos);
    const totalLen = upperLen + lowerLen;
    const targetDist = hipPos.distanceTo(targetPos);
    
    if (targetDist > totalLen * 0.98) {
      const dir = new THREE.Vector3().subVectors(targetPos, hipPos).normalize();
      const kneeTarget = hipPos.clone().add(dir.clone().multiplyScalar(upperLen));
      this.bendKneeTowards(knee, kneeTarget, weight);
      return;
    }
    
    const cosAngle = (upperLen * upperLen + targetDist * targetDist - lowerLen * lowerLen) / 
                     (2 * upperLen * targetDist);
    const angle = Math.acos(THREE.MathUtils.clamp(cosAngle, -1, 1));
    
    const dir = new THREE.Vector3().subVectors(targetPos, hipPos).normalize();
    const axis = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    if (axis.length() < 0.001) axis.set(1, 0, 0);
    axis.normalize();
    
    const quat = new THREE.Quaternion().setFromAxisAngle(axis, angle * weight);
    hip.premultiply(quat);
  }

  bendKneeTowards(knee, target, weight) {
    if (!knee) return;
    const kneePos = new THREE.Vector3();
    knee.getWorldPosition(kneePos);
    const dir = new THREE.Vector3().subVectors(target, kneePos).normalize();
    const axis = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    if (axis.length() < 0.001) axis.set(1, 0, 0);
    axis.normalize();
    const quat = new THREE.Quaternion().setFromAxisAngle(axis, Math.PI * 0.3 * weight);
    knee.premultiply(quat);
  }

  lookAt(target, weight = 1) {
    if (!this.bones.head || !this.bones.neck) return;
    
    const headPos = new THREE.Vector3();
    this.bones.head.getWorldPosition(headPos);
    const dir = new THREE.Vector3().subVectors(target, headPos).normalize();
    
    const headQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    const neckQuat = headQuat.clone().slerp(new THREE.Quaternion(), 0.5);
    
    this.bones.head.premultiply(headQuat.clone().slerp(new THREE.Quaternion(), 1 - weight));
    this.bones.neck.premultiply(neckQuat.clone().slerp(new THREE.Quaternion(), 1 - weight));
  }

  updateMixer(dt) {
    if (this.mixer) this.mixer.update(dt);
  }

  update(dt) {
    this.updateMixer(dt);
    this.updateIK(dt);
    
    this.root.position.lerp(this.position, Math.min(1, dt * 15));
    
    const targetY = Math.atan2(this.faceDirection.x, this.faceDirection.z);
    const currentY = this.root.rotation.y;
    let diff = targetY - currentY;
    diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
    this.root.rotation.y += diff * Math.min(1, dt * 10);
    
    if (this.state.stunned) {
      this.state.stunTime -= dt;
      if (this.state.stunTime <= 0) this.state.stunned = false;
    }
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
  }

  setFaceDirection(x, z) {
    this.faceDirection.set(x, 0, z).normalize();
  }

  addVelocity(v) {
    this.velocity.add(v);
  }

  shootBall(charge) {
    if (!this.state.hasBall) return;
    if (!this.engine?.matchManager?.ball) return;
    
    const ball = this.engine.matchManager.ball;
    const rimSide = this.engine.matchManager.getTargetRimSide?.(this) || 'east';
    const rimPos = this.engine.matchManager.court?.getRimPosition?.(rimSide) || new THREE.Vector3();
    const dist = this.position.distanceTo(rimPos);
    
    const isDunk = dist < 2.5 && this.state.jumping;
    this.state.hasBall = false;
    ball.state = isDunk ? 'shot' : 'shot';
    ball.holder = null;
    this.stats.fga++;
    
    const perfect = THREE.MathUtils.clamp(0.58 + dist * 0.016, 0.6, 0.86);
    const width = Math.max(0.07, 0.15 - dist * 0.006);
    const green = Math.abs(charge - perfect) < width / 2;
    
    let base = isDunk ? 0.9 : THREE.MathUtils.clamp(0.85 - dist * 0.04, 0.15, 0.8);
    base *= (this.attributes.shoot / 82);
    base *= (0.72 + this.stamina * 0.38);
    if (green) base = Math.min(0.985, base + 0.35);
    else base *= THREE.MathUtils.clamp(1 - (Math.abs(charge - perfect) - width / 2) * 2.2, 0.12, 1);
    
    const makes = Math.random() < base;
    const offAmt = makes ? 0.03 : 0.16 + Math.random() * 0.3;
    const ang = Math.random() * Math.PI * 2;
    const target = rimPos.clone().add(new THREE.Vector3(Math.cos(ang) * offAmt, 0, Math.sin(ang) * offAmt));
    const t = isDunk ? 0.5 : THREE.MathUtils.clamp(0.65 + dist * 0.045, 0.7, 1.15);
    const from = this.position.clone().add(new THREE.Vector3(0, isDunk ? 2.3 : 2.0, 0));
    const grav = -9.81 * 1.2;
    const v = target.clone().sub(from).divideScalar(t);
    v.y = (target.y - from.y - 0.5 * grav * t * t) / t;
    
    ball.pos.copy(from); ball.vel.copy(v);
    ball.shotInfo = { shooter: this, makes, side: rimSide, t, age: 0, grav, is3: dist > 6.75, green, dunk: isDunk, counted: false };
    
    this.state.jumping = true;
    this.jumpV = isDunk ? 7.2 : 4.4;
    this.holdT = 0.7;
    
    this.animationController?.play(isDunk ? 'dunk_tomahawk' : 'jump_shot', { layer: 0, clampWhenFinished: true });
    
    this.engine.hypeSystem?.onShotMade?.(this, green, dist > 6.75, isDunk);
  }

  passBall(target) {
    if (!this.state.hasBall || !target) return;
    if (!this.engine?.matchManager?.ball) return;
    
    const ball = this.engine.matchManager.ball;
    this.state.hasBall = false;
    ball.startPass(this, target, false);
    this.engine.hypeSystem?.onAlleyOopPass?.(this);
    this.animationController?.play('pass', { layer: 0, clampWhenFinished: true });
  }

  throwAlleyOop(target) {
    if (!this.state.hasBall || !target) return;
    if (!this.engine?.matchManager?.ball) return;
    
    const ball = this.engine.matchManager.ball;
    this.state.hasBall = false;
    ball.startPass(this, target, true);
    this.engine.hypeSystem?.onAlleyOopPass?.(this);
    this.animationController?.play('alley_oop_pass', { layer: 0, clampWhenFinished: true });
  }

  doCrossover() {
    if (this.crossoverCooldown > 0 || !this.state.hasBall || this.state.stunned) return;
    this.crossoverCooldown = 1.1;
    this.dribbleSide = (this.dribbleSide || 1) * -1;
    
    const side = new THREE.Vector3(-this.faceDirection.z, 0, this.faceDirection.x).multiplyScalar(this.dribbleSide);
    this.velocity.addScaledVector(side, 6.5);
    this.faceDirection.add(side.clone().multiplyScalar(0.5)).normalize();
    
    this.stats.crossovers++;
    this.engine.hypeSystem?.addTrick?.(this, 'crossover', 1.0);
    this.engine.audio?.playAnkleBreak?.();
    
    this.animationController?.play(this.dribbleSide > 0 ? 'crossover_right' : 'crossover_left', { layer: 0, clampWhenFinished: true });
  }

  trySteal() {
    if (this.stealCooldown > 0 || this.state.stunned) return;
    this.stealCooldown = 0.9;
    this.jumpV = 4.2;
    this.contestT = 1.0;
    
    const ball = this.engine?.matchManager?.ball;
    if (ball && ball.holder && ball.holder !== this && ball.holder.isHome !== this.isHome) {
      const dist = this.position.distanceTo(ball.holder.position);
      if (dist < 1.5) {
        const ch = 0.24 / (this.engine?.matchManager?.difficulty || 1) + (ball.holder.stamina < 0.3 ? 0.12 : 0);
        if (this.attributes.defense > 90) ch += 0.15;
        if (Math.random() < ch) {
          ball.holder.state.hasBall = false;
          ball.state = 'loose'; ball.holder = null;
          ball.pos.copy(ball.holder.position).add(new THREE.Vector3(0, 1, 0));
          ball.vel.set((Math.random() - 0.5) * 6, 3, (Math.random() - 0.5) * 6);
          this.stats.stl++;
          this.engine.hypeSystem?.onSteal?.(this);
          this.engine.audio?.playSteal?.();
        }
      }
    }
    this.animationController?.play('steal', { layer: 0, clampWhenFinished: true });
  }

  tryBlock() {
    if (this.blockCooldown > 0 || this.state.stunned) return;
    this.blockCooldown = 1.0;
    this.jumpV = 5;
    this.contestT = 1.0;
    
    const ball = this.engine?.matchManager?.ball;
    if (ball && (ball.state === 'shot' || ball.state === 'held')) {
      const shooter = ball.state === 'shot' ? ball.shotInfo?.shooter : ball.holder;
      if (shooter && shooter !== this && shooter.isHome !== this.isHome) {
        const dist = this.position.distanceTo(shooter.position);
        if (dist < 2.3) {
          let ch = 0.3 + (this.attributes.defense - 75) * 0.008;
          if (this.attributes.defense > 90) ch += 0.15;
          if (Math.random() < THREE.MathUtils.clamp(ch, 0.1, 0.6)) {
            if (ball.holder) ball.holder.state.hasBall = false;
            ball.shotInfo = null; ball.state = 'loose'; ball.holder = null; ball.lob = false;
            ball.pos.copy(shooter.pos).add(new THREE.Vector3(0, 2, 0));
            const away = this.position.clone().sub(shooter.position).setY(0).normalize();
            ball.vel.copy(away.multiplyScalar(7)).add(new THREE.Vector3(0, 3, 0));
            this.stats.blk++;
            this.engine.hypeSystem?.onBlock?.(this);
            this.engine.audio?.playBlock?.();
          }
        }
      }
    }
    this.animationController?.play('block', { layer: 0, clampWhenFinished: true });
  }

  dispose() {
    this.animations.forEach(({ action, clip }) => {
      action.stop();
      clip?.dispose?.();
    });
    this.animations.clear();
    this.mixer?.uncacheRoot?.(this.mesh);
    if (this.mesh) {
      this.mesh.traverse(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      });
    }
  }
}