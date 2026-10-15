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
    
    const a = data.attributes || data;
    this.attributes = {
      speed: a.speed || 7.5,
      acceleration: a.acceleration || 8.0,
      dunk: a.dunk || 70,
      shoot: a.shoot || 70,
      handles: a.handles || 70,
      defense: a.defense || 70,
      stamina: a.stamina || 80,
      vertical: a.vertical || 70,
      strength: a.strength || 70,
    };

    this.signatureDunk = data.signatureDunk || 'tomahawk';
    this.introAnimation = data.introAnimation || 'intro_confident';
    this.category = data.category || 'original';
    this.aka = data.aka || '';
    this.bio = data.bio || '';
    this.playstyle = data.playstyle || '';
    this.celebration = data.celebration || 'crown_tap';
    this.taunt = data.taunt || '';
    this.signatureMove = data.signatureMove || '';
    this.num = data.num ?? 0;
    this.tattoos = data.tattoos || (this.category === 'rapper' ? 'sleeve' : null);
    
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

    // live gameplay values (must be numbers — physics/odds depend on them)
    this.stamina = 1;
    this.jumpY = 0;
    this.jumpV = 0;
    this.shotCharge = 0;
    this.shotCharging = false;
    this.dribbleSide = 1;
    this.crossoverCooldown = 0;
    this.stealCooldown = 0;
    this.blockCooldown = 0;
    this.stealCD = 0;
    this.contestT = 0;
    this.holdT = 0;
    
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

  // Stylized-but-humanoid procedural athlete. NOT a photorealistic likeness —
  // it carries each legend's silhouette, hair, ink, and fit until licensed
  // GLB assets are provided. Proportions vary by build type.
  buildProceduralModel() {
    const group = new THREE.Group();
    const h = this.height;
    const scale = h / 1.85;
    const builds = {
      lean_athletic:      { shoulder: 0.94, torso: 1.0,  leg: 1.04, arm: 1.0 },
      athletic:           { shoulder: 1.0,  torso: 1.0,  leg: 1.0,  arm: 1.0 },
      athletic_female:    { shoulder: 0.88, torso: 0.96, leg: 1.05, arm: 0.96 },
      wiry_athletic:      { shoulder: 0.9,  torso: 0.98, leg: 1.06, arm: 1.02 },
      wiry:               { shoulder: 0.9,  torso: 0.98, leg: 1.05, arm: 1.0 },
      explosive:          { shoulder: 1.02, torso: 1.0,  leg: 1.02, arm: 1.0 },
      power_athletic:     { shoulder: 1.12, torso: 1.04, leg: 0.98, arm: 1.04 },
      powerhouse:         { shoulder: 1.18, torso: 1.08, leg: 0.96, arm: 1.08 },
      massive:            { shoulder: 1.28, torso: 1.14, leg: 0.94, arm: 1.12 },
      compact_athletic:   { shoulder: 0.94, torso: 0.96, leg: 0.98, arm: 0.96 },
      compact_power:      { shoulder: 1.04, torso: 1.0,  leg: 0.96, arm: 1.0 },
      compact_explosive:  { shoulder: 0.92, torso: 0.94, leg: 1.0,  arm: 0.96 },
      stocky_athletic:    { shoulder: 1.06, torso: 1.02, leg: 0.96, arm: 1.0 },
      tall_athletic:      { shoulder: 1.0,  torso: 1.04, leg: 1.06, arm: 1.04 },
    };
    const b = builds[this.build] || builds.athletic;
    const sw = b.shoulder * scale; // shoulder-width multiplier

    const skinMat = new THREE.MeshStandardMaterial({
      color: this.skinTone, roughness: 0.55, metalness: 0.05,
    });
    const teamColor = this.isHome === false ? 0xff2f5b : 0x00e5ff;
    const clothMat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.35, metalness: 0.3 });
    const accentMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.5, emissive: teamColor, emissiveIntensity: 0.25 });

    const G = {
      capsule: (r, len) => new THREE.CapsuleGeometry(r, len, 8, 16),
      box: (w, hh, d) => new THREE.BoxGeometry(w, hh, d),
      sphere: (r) => new THREE.SphereGeometry(r, 16, 12),
    };

    // ---- legs + sneakers ----
    const legLen = 0.45 * b.leg * scale;
    const legL = new THREE.Mesh(G.capsule(0.085 * sw, legLen), skinMat);
    legL.position.set(-0.11 * sw, -0.42 * scale, 0); legL.name = 'LeftLeg';
    const legR = legL.clone(); legR.position.x = 0.11 * sw; legR.name = 'RightLeg';
    const sockL = new THREE.Mesh(G.capsule(0.088 * sw, 0.1 * scale), clothMat(0xf2f2f2));
    sockL.position.set(-0.11 * sw, -0.6 * scale, 0);
    const sockR = sockL.clone(); sockR.position.x = 0.11 * sw;
    const shoeGeoL = G.box(0.12 * sw, 0.07 * scale, 0.3 * scale);
    const shoeL = new THREE.Mesh(shoeGeoL, shoeMat);
    shoeL.position.set(-0.11 * sw, -0.68 * scale, 0.05 * scale);
    const shoeR = new THREE.Mesh(shoeGeoL.clone(), shoeMat);
    shoeR.position.set(0.11 * sw, -0.68 * scale, 0.05 * scale);
    const soleL = new THREE.Mesh(G.box(0.125 * sw, 0.025 * scale, 0.31 * scale), accentMat);
    soleL.position.set(-0.11 * sw, -0.715 * scale, 0.05 * scale);
    const soleR = soleL.clone(); soleR.position.x = 0.11 * sw;
    group.add(legL, legR, sockL, sockR, shoeL, shoeR, soleL, soleR);

    // ---- shorts + torso ----
    const shorts = new THREE.Mesh(G.box(0.32 * sw, 0.2 * scale, 0.23 * sw), clothMat(0x14141f));
    shorts.position.y = -0.1 * scale;
    const waistband = new THREE.Mesh(G.box(0.325 * sw, 0.035 * scale, 0.235 * sw), accentMat);
    waistband.position.y = 0.005 * scale;
    const torsoH = 0.36 * b.torso * scale;
    const torso = new THREE.Mesh(G.box(0.31 * sw, torsoH, 0.19 * sw), clothMat(teamColor));
    torso.position.y = 0.02 * scale + torsoH / 2;
    // chest stripe
    const stripe = new THREE.Mesh(G.box(0.315 * sw, 0.05 * scale, 0.195 * sw), clothMat(0x0b0b12));
    stripe.position.y = torso.position.y + torsoH * 0.18;
    group.add(shorts, waistband, torso, stripe);

    // ---- arms + hands (tattoos optional) ----
    const armLen = 0.32 * b.arm * scale;
    const armL = new THREE.Mesh(G.capsule(0.062 * sw, armLen), skinMat);
    armL.position.set(-0.26 * sw, torso.position.y + 0.05 * scale, 0); armL.name = 'LeftArm';
    const armR = armL.clone(); armR.position.x = 0.26 * sw; armR.name = 'RightArm';
    group.add(armL, armR);
    if (this.tattoos) {
      const inkMat = new THREE.MeshStandardMaterial({ color: 0x101014, roughness: 0.7 });
      const inkL = new THREE.Mesh(G.capsule(0.066 * sw, armLen * 0.55),
        this.tattoos === 'sleeve' ? inkMat : skinMat);
      inkL.position.copy(armL.position); inkL.position.y -= armLen * 0.12;
      const inkR = inkL.clone(); inkR.position.x = 0.26 * sw;
      if (this.tattoos === 'sleeve') group.add(inkL, inkR);
      else { // band tattoos
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.068 * sw, 0.012 * scale, 8, 16), inkMat);
        band.rotation.x = Math.PI / 2; band.position.copy(armL.position); band.position.y -= 0.08;
        const band2 = band.clone(); band2.position.x = 0.26 * sw;
        group.add(band, band2);
      }
    }
    const handGeo = G.sphere(0.068 * scale);
    const handL = new THREE.Mesh(handGeo, skinMat);
    handL.position.set(-0.26 * sw, armL.position.y - armLen / 2 - 0.1 * scale, 0);
    handL.scale.set(1, 1.25, 1); handL.name = 'LeftHand';
    const handR = new THREE.Mesh(handGeo.clone(), skinMat);
    handR.position.set(0.26 * sw, handL.position.y, 0);
    handR.scale.set(1, 1.25, 1); handR.name = 'RightHand';
    group.add(handL, handR);

    // ---- head + face ----
    const headY = torso.position.y + torsoH / 2 + 0.19 * scale;
    const head = new THREE.Mesh(G.sphere(0.108 * scale), skinMat);
    head.position.y = headY; head.name = 'Head';
    group.add(head);
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xf5f2ea, roughness: 0.3 });
    const pupilM = new THREE.MeshStandardMaterial({ color: this.eyeColor, roughness: 0.2 });
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(G.sphere(0.02 * scale), eyeWhite);
      eye.position.set(s * 0.04 * scale, headY + 0.015 * scale, -0.095 * scale);
      const pupil = new THREE.Mesh(G.sphere(0.009 * scale), pupilM);
      pupil.position.set(s * 0.04 * scale, headY + 0.015 * scale, -0.112 * scale);
      const brow = new THREE.Mesh(G.box(0.045 * scale, 0.012 * scale, 0.01), new THREE.MeshStandardMaterial({ color: this.hairColor, roughness: 0.9 }));
      brow.position.set(s * 0.042 * scale, headY + 0.055 * scale, -0.1 * scale);
      brow.rotation.z = s * -0.12;
      group.add(eye, pupil, brow);
    }
    const mouth = new THREE.Mesh(G.box(0.05 * scale, 0.012 * scale, 0.01), new THREE.MeshStandardMaterial({ color: 0x5a2a22, roughness: 0.8 }));
    mouth.position.set(0, headY - 0.055 * scale, -0.1 * scale);
    group.add(mouth);
    if (this.hairStyle.includes('beard') || this.id === 'fanum') {
      const beard = new THREE.Mesh(G.sphere(0.085 * scale), new THREE.MeshStandardMaterial({ color: this.hairColor, roughness: 0.95 }));
      beard.position.set(0, headY - 0.045 * scale, -0.03 * scale);
      beard.scale.set(1, 0.75, 0.9);
      group.add(beard);
    }
    this.buildHairstyle(group, G, headY, scale);

    // ---- jersey number on back ----
    const numTex = this.makeNumberTexture(String(this.num));
    const numPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.2 * sw, 0.2 * sw),
      new THREE.MeshBasicMaterial({ map: numTex, transparent: true }));
    numPlane.position.set(0, torso.position.y + 0.02, 0.098 * sw + 0.001);
    numPlane.rotation.y = Math.PI;
    group.add(numPlane);

    group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    return group;
  }

  buildHairstyle(group, G, headY, scale) {
    const hairM = new THREE.MeshStandardMaterial({ color: this.hairColor, roughness: 0.92 });
    const s = this.hairStyle;
    const add = (m) => group.add(m);
    if (s === 'bald') return;
    if (s === 'afro') {
      const afro = new THREE.Mesh(G.sphere(0.15 * scale), hairM);
      afro.position.y = headY + 0.06 * scale; afro.scale.set(1.15, 1.0, 1.15); add(afro);
    } else if (s === 'fade' || s === 'fade_design' || s === 'short_waves' || s === 'waves_360' || s === 'short') {
      const cap = new THREE.Mesh(G.sphere(0.11 * scale), hairM);
      cap.position.y = headY + 0.035 * scale; cap.scale.set(1.02, 0.62, 1.02); add(cap);
      if (s === 'fade_design') {
        const lineM = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.6 });
        const line = new THREE.Mesh(G.box(0.012 * scale, 0.05 * scale, 0.012), lineM);
        line.position.set(0.1 * scale, headY + 0.02 * scale, -0.03 * scale);
        line.rotation.z = 0.5; add(line);
      }
    } else if (s === 'twists' || s === 'curly_top') {
      const cap = new THREE.Mesh(G.sphere(0.115 * scale), hairM);
      cap.position.y = headY + 0.05 * scale; cap.scale.set(1.02, 0.8, 1.02); add(cap);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * scale, 0.014 * scale, 0.09 * scale), hairM);
        t.position.set(Math.cos(a) * 0.09 * scale, headY + 0.12 * scale, Math.sin(a) * 0.09 * scale);
        t.rotation.z = Math.cos(a) * 0.5; t.rotation.x = Math.sin(a) * -0.5; add(t);
      }
    } else if (s === 'dreads_high_top' || s === 'dreads_low' || s === 'long_dreads' || s === 'braids_long') {
      const cap = new THREE.Mesh(G.sphere(0.112 * scale), hairM);
      cap.position.y = headY + 0.05 * scale; add(cap);
      const len = s === 'long_dreads' || s === 'braids_long' ? 0.34 : 0.2;
      const n = s === 'braids_long' ? 10 : 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const d = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * scale, 0.016 * scale, len * scale), hairM);
        d.position.set(Math.cos(a) * 0.1 * scale, headY + 0.02 * scale - len * scale * 0.4, Math.sin(a) * 0.1 * scale);
        d.rotation.z = Math.cos(a) * 0.25; d.rotation.x = Math.sin(a) * -0.25; add(d);
      }
    } else if (s === 'cap') {
      const capM = new THREE.MeshStandardMaterial({ color: 0x7a1fff, roughness: 0.8 });
      const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.115 * scale, 0.08 * scale, 12), capM);
      dome.position.y = headY + 0.07 * scale; add(dome);
      const brim = new THREE.Mesh(G.box(0.16 * scale, 0.02 * scale, 0.16 * scale), capM);
      brim.position.set(0, headY + 0.05 * scale, 0.16 * scale); add(brim);
    } else if (s === 'beanie') {
      const b = new THREE.Mesh(G.sphere(0.115 * scale), new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.9 }));
      b.position.y = headY + 0.045 * scale; b.scale.set(1.02, 0.8, 1.02); add(b);
    } else {
      const cap = new THREE.Mesh(G.sphere(0.11 * scale), hairM);
      cap.position.y = headY + 0.04 * scale; cap.scale.set(1.02, 0.65, 1.02); add(cap);
    }
  }

  makeNumberTexture(num) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.font = '900 76px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.8)';
    g.strokeText(num, 64, 68); g.fillStyle = '#fff'; g.fillText(num, 64, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
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

    // gameplay cooldown decay (tricks, steals, blocks, contests)
    this.crossoverCooldown = Math.max(0, (this.crossoverCooldown || 0) - dt);
    this.stealCooldown = Math.max(0, (this.stealCooldown || 0) - dt);
    this.blockCooldown = Math.max(0, (this.blockCooldown || 0) - dt);
    this.stealCD = Math.max(0, (this.stealCD || 0) - dt);
    this.contestT = Math.max(0, (this.contestT || 0) - dt);
    this.holdT = Math.max(0, (this.holdT || 0) - dt);
    // jump physics for procedural athletes
    if (this.jumpV !== 0 || this.jumpY > 0) {
      this.jumpY += this.jumpV * dt;
      this.jumpV -= 16 * dt;
      if (this.jumpY <= 0) { this.jumpY = 0; this.jumpV = 0; }
    }
    if (typeof this.stamina === 'number' && !this.state?.hasBall) {
      this.stamina = Math.min(1, this.stamina + dt * 0.04);
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
    
    ball.position.copy(from); ball.velocity.copy(v);
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
    return this.doTrickMove('crossover');
  }

  // Trick-move set: crossover (J) / behind-back (K) / spin (L) / hesitation (H).
  // Each has its own burst profile; all feed the combo system and can break ankles.
  doTrickMove(type = 'crossover') {
    if (this.crossoverCooldown > 0 || !this.state.hasBall || this.state.stunned) return null;
    const profiles = {
      crossover:   { cd: 1.1, burst: 6.5, trick: 'crossover',            hype: 1.0, anim: null },
      behind_back: { cd: 1.4, burst: 5.5, trick: 'behind_back',          hype: 1.2, anim: 'behind_back' },
      spin:        { cd: 1.6, burst: 7.5, trick: 'spin_move',            hype: 1.4, anim: 'spin_move' },
      hesitation:  { cd: 0.9, burst: 3.0, trick: 'hesitation',          hype: 0.8, anim: 'hesitation' },
    };
    const p = profiles[type] || profiles.crossover;
    this.crossoverCooldown = p.cd;
    this.dribbleSide = (this.dribbleSide || 1) * -1;

    const side = new THREE.Vector3(-this.faceDirection.z, 0, this.faceDirection.x).multiplyScalar(this.dribbleSide);
    if (type === 'spin') {
      // burst through the defender's shoulder + 360 visual yaw snap
      this.velocity.addScaledVector(this.faceDirection, p.burst);
      this.root.rotation.y += Math.PI * 2 * 0.25;
    } else if (type === 'hesitation') {
      this.velocity.multiplyScalar(0.25); // freeze, then explode
      this.velocity.addScaledVector(this.faceDirection, 4.5);
    } else {
      this.velocity.addScaledVector(side, p.burst);
    }
    this.faceDirection.add(side.clone().multiplyScalar(0.5)).normalize();

    this.stats.crossovers++;
    // ankle-breaker roll: handles vs defender, harder moves = bigger chance + hype
    const opp = this.engine?.matchManager?.getNearestDefender?.(this);
    if (opp && this.position.distanceTo(opp.position) < (type === 'spin' ? 2.2 : 1.9)) {
      let ch = 0.14 + (this.attributes.handles - (opp.attributes?.defense || 70)) * 0.008 + (p.hype - 1) * 0.1;
      if (this.engine?.matchManager?.userCharacter && opp === this.engine.matchManager.userCharacter) ch *= 0.55;
      if (Math.random() < THREE.MathUtils.clamp(ch, 0.03, 0.6)) {
        opp.state.stunned = true; opp.state.stunTime = 1.2;
        this.engine.hypeSystem?.addTrick?.(this, 'ankle_breaker', p.hype);
        this.engine.audio?.playAnkleBreak?.();
        this.engine.showMessage?.(`${this.name}: ${this.taunt || 'ANKLES! 🥨'}`, 1400);
      } else {
        this.engine.hypeSystem?.addTrick?.(this, p.trick, p.hype);
      }
    } else {
      this.engine.hypeSystem?.addTrick?.(this, p.trick, p.hype);
    }

    this.animationController?.play(p.anim || (this.dribbleSide > 0 ? 'crossover_right' : 'crossover_left'), { layer: 0, clampWhenFinished: true });
    return type;
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
          ball.position.copy(ball.holder.position).add(new THREE.Vector3(0, 1, 0));
          ball.velocity.set((Math.random() - 0.5) * 6, 3, (Math.random() - 0.5) * 6);
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
            ball.position.copy(shooter.position).add(new THREE.Vector3(0, 2, 0));
            const away = this.position.clone().sub(shooter.position).setY(0).normalize();
            ball.velocity.copy(away.multiplyScalar(7)).add(new THREE.Vector3(0, 3, 0));
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