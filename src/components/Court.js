import * as THREE from 'three';

export class StreetCourt {
  constructor(length = 28, width = 15) {
    this.length = length;
    this.width = width;
    this.mesh = null;
    this.rims = { east: null, west: null };
    this.backboards = { east: null, west: null };
    this.fences = [];
    this.crowd = null;
    this.neonSigns = [];
  }

  async build(engine) {
    this.engine = engine;
    await this.createCourtSurface();
    this.createHoops();
    this.createFences();
    this.createCrowd();
    this.createLighting();
    this.createNeonSigns();
    this.createAtmosphere();
    
    const courtGroup = new THREE.Group();
    courtGroup.name = 'street_court';
    courtGroup.add(this.mesh);
    courtGroup.add(this.rims.east.group);
    courtGroup.add(this.rims.west.group);
    this.fences.forEach(f => courtGroup.add(f));
    if (this.crowd) courtGroup.add(this.crowd);
    this.neonSigns.forEach(n => courtGroup.add(n));
    
    engine.scene.add(courtGroup);
    this.group = courtGroup;
    
    return this;
  }

  async createCourtSurface() {
    const tex = this.createAsphaltTexture();
    const geo = new THREE.PlaneGeometry(this.length + 4, this.width + 4, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: this.createAsphaltNormalMap(),
      roughness: 0.7,
      metalness: 0.1,
      displacementMap: this.createDisplacementMap(),
      displacementScale: 0.02,
    });
    
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;
    this.mesh.name = 'court_surface';
    
    const lot = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.95 })
    );
    lot.rotation.x = -Math.PI / 2;
    lot.position.y = -0.08;
    lot.receiveShadow = true;
    this.mesh.add(lot);
  }

  createAsphaltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1152;
    const ctx = canvas.getContext('2d');
    
    const mx = (x) => (x / (this.length + 4) + 0.5) * canvas.width;
    const mz = (z) => (z / (this.width + 4) + 0.5) * canvas.height;
    
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 15000; i++) {
      const alpha = Math.random() * 0.08;
      ctx.fillStyle = Math.random() > 0.5 
        ? `rgba(255,255,255,${alpha})` 
        : `rgba(0,0,0,${alpha * 1.5})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
    
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = 'rgba(30,35,45,0.4)';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      let x = Math.random() * canvas.width;
      let y = Math.random() * canvas.height;
      ctx.moveTo(x, y);
      for (let k = 0; k < 8; k++) {
        x += (Math.random() - 0.5) * 200;
        y += (Math.random() - 0.5) * 200;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    
    const keyColorA = 'rgba(100, 20, 160, 0.85)';
    const keyColorB = 'rgba(0, 120, 140, 0.85)';
    const pw = (5.8 / (this.length + 4)) * canvas.width;
    const ph = (4.9 / (this.width + 4)) * canvas.height;
    
    ctx.fillStyle = keyColorA;
    ctx.fillRect(mx(this.length / 2) - pw, canvas.height / 2 - ph / 2, pw, ph);
    ctx.fillStyle = keyColorB;
    ctx.fillRect(mx(-this.length / 2), canvas.height / 2 - ph / 2, pw, ph);
    
    ctx.strokeStyle = 'rgba(240, 240, 230, 0.9)';
    ctx.lineWidth = 5;
    
    ctx.strokeRect(mx(-this.length / 2), mz(-this.width / 2), mx(this.length / 2) - mx(-this.length / 2), mz(this.width / 2) - mz(-this.width / 2));
    
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height / 2, 120, 120, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    const rad = (d) => (d * Math.PI) / 180;
    for (const s of [1, -1]) {
      const cx = mx(s * 12.7), cy = mz(0);
      const rx = (6.75 / (this.length + 4)) * canvas.width;
      const ry = (6.75 / (this.width + 4)) * canvas.height;
      const a0 = s > 0 ? rad(112) : rad(-68);
      const a1 = s > 0 ? rad(248) : rad(68);
      
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, a0, a1, false);
      ctx.stroke();
      
      const ex0 = cx + rx * Math.cos(a0), ey0 = cy + ry * Math.sin(a0);
      const ex1 = cx + rx * Math.cos(a1), ey1 = cy + ry * Math.sin(a1);
      const bx = mx(s * (this.length / 2));
      ctx.beginPath(); ctx.moveTo(ex0, ey0); ctx.lineTo(bx, ey0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex1, ey1); ctx.lineTo(bx, ey1); ctx.stroke();
      
      ctx.beginPath();
      ctx.ellipse(mx(s * (this.length / 2 - 5.8)), mz(0), (1.8 / (this.length + 4)) * canvas.width, (1.8 / (this.width + 4)) * canvas.height, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-0.08);
    ctx.font = '900 140px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#05060a';
    ctx.strokeText('STREET', 0, -50);
    ctx.fillStyle = '#ff2fb3';
    ctx.fillText('STREET', 0, -50);
    ctx.strokeText('LEGENDS', 0, 100);
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('LEGENDS', 0, 100);
    ctx.restore();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createAsphaltNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(512, 512);
    const data = imageData.data;
    
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const noise = (Math.random() - 0.5) * 0.3;
        const nx = noise;
        const ny = noise;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const i = (y * 512 + x) * 4;
        data[i] = (nx * 0.5 + 0.5) * 255;
        data[i + 1] = (ny * 0.5 + 0.5) * 255;
        data[i + 2] = (nz * 0.5 + 0.5) * 255;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  createDisplacementMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(512, 512);
    const data = imageData.data;
    
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const val = Math.random() * 0.15;
        const i = (y * 512 + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = val * 255;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  createHoops() {
    const RIM_R = 0.2286;
    const RIM_H = 3.05;
    const HOOP_X = 12.7;
    
    for (const side of ['east', 'west']) {
      const s = side === 'east' ? 1 : -1;
      const group = new THREE.Group();
      group.name = `hoop_${side}`;
      
      const steelMat = new THREE.MeshStandardMaterial({ 
        color: 0x3a3f4a, roughness: 0.4, metalness: 0.75 
      });
      const glassMat = new THREE.MeshPhysicalMaterial({ 
        color: 0xd0e8ff, transparent: true, opacity: 0.3, 
        roughness: 0.1, metalness: 0.02, transmission: 0.85,
        clearcoat: 1, clearcoatRoughness: 0.1 
      });
      const rimMat = new THREE.MeshStandardMaterial({ 
        color: 0xff5a1a, roughness: 0.3, metalness: 0.6,
        emissive: 0xff5a1a, emissiveIntensity: 0.3 
      });
      const netMat = new THREE.MeshBasicMaterial({ 
        color: 0xf0f0f0, wireframe: true, transparent: true, opacity: 0.8 
      });
      const padMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a22, roughness: 0.9 
      });
      const neonMat = (color) => new THREE.MeshBasicMaterial({ 
        color, transparent: true, opacity: 0.9 
      });
      
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 4.2, 16),
        steelMat
      );
      pole.position.set(s * (HOOP_X + 1.6), 2.1, 0);
      pole.castShadow = true;
      group.add(pole);
      
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.18, 0.18),
        steelMat
      );
      arm.position.set(s * (HOOP_X + 0.95), 3.6, 0);
      arm.castShadow = true;
      group.add(arm);
      
      const backboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.05, 1.8),
        glassMat
      );
      backboard.position.set(s * (HOOP_X + 0.45), 3.45, 0);
      backboard.castShadow = true;
      group.add(backboard);
      
      const bbFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 1.12, 1.87),
        steelMat
      );
      bbFrame.position.set(s * (HOOP_X + 0.47), 3.45, 0);
      group.add(bbFrame);
      
      const neonStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.1, 1.85),
        neonMat(side === 'east' ? 0xff2fb3 : 0x00e5ff)
      );
      neonStrip.position.set(s * (HOOP_X + 0.44), 2.95, 0);
      group.add(neonStrip);
      
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(RIM_R, 0.024, 12, 32),
        rimMat
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(s * HOOP_X, RIM_H, 0);
      rim.castShadow = true;
      group.add(rim);
      
      const net = new THREE.Mesh(
        new THREE.CylinderGeometry(RIM_R, RIM_R * 0.55, 0.45, 16, 6, true),
        netMat
      );
      net.position.set(s * HOOP_X, RIM_H - 0.23, 0);
      group.add(net);
      
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1.8, 0.5),
        padMat
      );
      pad.position.set(s * (HOOP_X + 1.6), 1.2, 0);
      group.add(pad);
      
      const rimLight = new THREE.PointLight(side === 'east' ? 0xff5a1a : 0x00e5ff, 0, 8, 2);
      rimLight.position.set(s * HOOP_X, RIM_H + 0.3, 0);
      group.add(rimLight);
      
      this.rims[side] = { 
        group, 
        rim, 
        net, 
        backboard, 
        position: new THREE.Vector3(s * HOOP_X, RIM_H, 0),
        rimLight 
      };
      
      this.backboards[side] = backboard;
    }
  }

  createFences() {
    const FX = this.length / 2 + 2.2;
    const FZ = this.width / 2 + 2.2;
    
    const fenceTex = this.createFenceTexture();
    const fenceMat = new THREE.MeshBasicMaterial({
      map: fenceTex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      alphaTest: 0.1,
    });
    
    const postMat = new THREE.MeshStandardMaterial({ 
      color: 0x2a2e35, roughness: 0.5, metalness: 0.6 
    });
    
    const createFence = (w, x, z, ry) => {
      const fence = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.2), fenceMat);
      fence.position.set(x, 1.6, z);
      fence.rotation.y = ry;
      this.fences.push(fence);
      
      const posts = Math.ceil(w / 2.5);
      for (let i = 0; i <= posts; i++) {
        const px = x + (i - posts / 2) * 2.5 * Math.cos(ry);
        const pz = z + (i - posts / 2) * 2.5 * Math.sin(ry);
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.08, 3.8, 8),
          postMat
        );
        post.position.set(px, 1.9, pz);
        post.castShadow = true;
        this.fences.push(post);
      }
    };
    
    createFence(FX * 2 + 0.6, 0, -FZ, 0);
    createFence(FX * 2 + 0.6, 0, FZ, 0);
    createFence(FZ * 2 + 0.6, -FX, 0, Math.PI / 2);
    createFence(FZ * 2 + 0.6, FX, 0, Math.PI / 2);
  }

  createFenceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(140, 160, 180, 0.5)';
    ctx.lineWidth = 2;
    for (let i = -256; i < 512; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + 256, 0); ctx.lineTo(i, 256); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 1);
    return tex;
  }

  createCrowd() {
    const N = 200;
    const geo = new THREE.BoxGeometry(0.38, 1.0, 0.28);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.crowd = new THREE.InstancedMesh(geo, mat, N);
    this.crowd.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    const dummy = new THREE.Object3D();
    const colors = [
      0xff2fb3, 0x00e5ff, 0xffd23f, 0xe8e8e8, 0xff6a00, 
      0x7b2fff, 0x22c55e, 0xff3366, 0x00ffcc, 0xffcc00
    ];
    const colorAttr = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    
    for (let i = 0; i < N; i++) {
      const side = i % 4;
      const tier = Math.floor(Math.random() * 3);
      let x, z;
      const FZ = this.width / 2 + 4;
      const FX = this.length / 2 + 4;
      
      if (side === 0) { x = (Math.random() - 0.5) * 40; z = -FZ - 1.5 - tier * 1.8 - Math.random() * 2; }
      else if (side === 1) { x = (Math.random() - 0.5) * 40; z = FZ + 1.5 + tier * 1.8 + Math.random() * 2; }
      else if (side === 2) { x = -FX - 1.5 - tier * 1.8 - Math.random() * 2; z = (Math.random() - 0.5) * 28; }
      else { x = FX + 1.5 + tier * 1.8 + Math.random() * 2; z = (Math.random() - 0.5) * 28; }
      
      const y = 0.6 + tier * 1.5;
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      this.crowd.setMatrixAt(i, dummy.matrix);
      
      const col = new THREE.Color(colors[(Math.random() * colors.length) | 0]);
      colorAttr.setXYZ(i, col.r, col.g, col.b);
    }
    
    this.crowd.geometry.setAttribute('instanceColor', colorAttr);
    this.crowd.instanceMatrix.needsUpdate = true;
    this.crowd.castShadow = true;
    
    this.crowdBase = [];
    for (let i = 0; i < N; i++) {
      this.crowdBase.push({ 
        phase: Math.random() * Math.PI * 2, 
        amp: 0.05 + Math.random() * 0.1,
        freq: 1.5 + Math.random() * 2,
      });
    }
  }

  updateCrowd(t, hype) {
    if (!this.crowd) return;
    const amp = 0.1 + hype * 0.3;
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < this.crowd.count; i++) {
      const b = this.crowdBase[i];
      const mat = this.crowd.getMatrixAt(i, dummy.matrix);
      const pos = new THREE.Vector3().setFromMatrixPosition(dummy.matrix);
      pos.y += Math.sin(t * b.freq + b.phase) * amp;
      dummy.position.copy(pos);
      dummy.updateMatrix();
      this.crowd.setMatrixAt(i, dummy.matrix);
    }
    this.crowd.instanceMatrix.needsUpdate = true;
  }

  createLighting() {
    const poleMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1c22, roughness: 0.4, metalness: 0.7 
    });
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffe8c0 });
    
    const positions = [
      [-14, 12], [14, -12], [-14, -12], [14, 12],
      [-20, 0], [20, 0], [0, -20], [0, 20]
    ];
    
    this.floodlights = [];
    positions.forEach(([x, z]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 12, 8),
        poleMat
      );
      pole.position.set(x * 1.3, 6, z * 1.3);
      pole.castShadow = true;
      this.group?.add(pole);
      
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.6, 0.5),
        headMat
      );
      head.position.set(x * 1.3, 12, z * 1.3);
      head.lookAt(0, 0, 0);
      this.group?.add(head);
      
      const light = new THREE.SpotLight(0xfff0d0, 1200, 50, Math.PI / 4, 0.3, 1);
      light.position.set(x * 1.3, 12.5, z * 1.3);
      light.target.position.set(x * 1.3 * 0.5, 0, z * 1.3 * 0.5);
      light.castShadow = true;
      light.shadow.mapSize.set(2048, 2048);
      this.group?.add(light);
      this.group?.add(light.target);
      this.floodlights.push(light);
    });
  }

  createNeonSigns() {
    const signs = [
      { text: 'STREET', pos: [-20, 8, -16], color: 0xff2fb3, rot: 0.3 },
      { text: 'LEGENDS', pos: [18, 7, 16], color: 0x00e5ff, rot: -0.2 },
      { text: 'THE CAGE', pos: [0, 10, -18], color: 0xffd23f, rot: 0 },
      { text: 'NO BLOOD', pos: [-18, 6, 18], color: 0xff3366, rot: 0.15 },
      { text: 'NO FOUL', pos: [18, 6, -18], color: 0x00ffcc, rot: -0.15 },
    ];
    
    signs.forEach(s => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#00000000';
      ctx.fillRect(0, 0, 512, 128);
      ctx.font = '900 80px Arial Black, Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = `#${s.color.toString(16).padStart(6, '0')}`;
      ctx.shadowBlur = 30;
      ctx.fillStyle = `#${s.color.toString(16).padStart(6, '0')}`;
      ctx.fillText(s.text, 256, 88);
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 1.5),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
      );
      sign.position.set(...s.pos);
      sign.rotation.y = s.rot;
      sign.userData = { baseColor: s.color, text: s.text };
      this.neonSigns.push(sign);
      this.group?.add(sign);
    });
  }

  createAtmosphere() {
    const particleCount = 300;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      velocities[i] = 0.05 + Math.random() * 0.15;
      sizes[i] = 0.05 + Math.random() * 0.1;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    
    const mat = new THREE.PointsMaterial({
      color: 0xffd4a0,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      depthWrite: false,
    });
    
    this.dust = new THREE.Points(geo, mat);
    this.group?.add(this.dust);
  }

  updateAtmosphere(t) {
    if (this.dust) {
      const pos = this.dust.geometry.attributes.position;
      const vel = this.dust.geometry.attributes.aVelocity;
      
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + vel.getX(i) * 0.016;
        if (y > 15) y = 0;
        pos.setY(i, y);
        
        const drift = Math.sin(t + i) * 0.002;
        pos.setX(i, pos.getX(i) + drift);
      }
      pos.needsUpdate = true;
    }
    
    this.neonSigns.forEach(s => {
      const flicker = 0.7 + Math.sin(t * 5 + s.pos[0]) * 0.3;
      s.material.opacity = flicker;
    });
  }

  getNearestRim(ballPos) {
    const east = this.rims.east.position;
    const west = this.rims.west.position;
    const dEast = ballPos.distanceTo(east);
    const dWest = ballPos.distanceTo(west);
    return dEast < dWest ? east : west;
  }

  getBackboard(ballPos) {
    const east = this.rims.east;
    const west = this.rims.west;
    const dEast = Math.abs(ballPos.x - east.position.x);
    const dWest = Math.abs(ballPos.x - west.position.x);
    const bb = dEast < dWest ? east : west;
    
    if (bb === east) {
      return { minX: 12.7 + 0.45, maxX: 12.7 + 0.5, y: [2.4, 4.5], z: [-0.9, 0.9] };
    } else {
      return { minX: -12.7 - 0.5, maxX: -12.7 - 0.45, y: [2.4, 4.5], z: [-0.9, 0.9] };
    }
  }

  getRimPosition(side) {
    return this.rims[side]?.position.clone() || new THREE.Vector3();
  }

  update(t, hype) {
    this.updateCrowd(t, hype);
    this.updateAtmosphere(t);
    
    this.rims.east.rimLight.intensity = 0.5 + Math.sin(t * 3) * 0.5;
    this.rims.west.rimLight.intensity = 0.5 + Math.cos(t * 3) * 0.5;
  }

  dispose() {
    if (this.group) this.engine?.scene?.remove(this.group);
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) this.mesh.material.forEach(m => m.dispose());
        else this.mesh.material.dispose();
      }
    }
    this.fences.forEach(f => {
      f.geometry?.dispose();
      f.material?.dispose?.();
    });
    this.neonSigns.forEach(s => {
      s.geometry?.dispose();
      s.material?.map?.dispose?.();
      s.material?.dispose?.();
    });
    if (this.crowd) {
      this.crowd.geometry.dispose();
      this.crowd.material.dispose();
    }
    if (this.dust) {
      this.dust.geometry.dispose();
      this.dust.material.dispose();
    }
  }
}