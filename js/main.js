import * as THREE from 'three';

/* ============================================================
   STREET LEGENDS — 3D arcade street basketball (NYC night)
   1v1 / 3v3, hype meter, legend mode, ankle breakers, oops
   ============================================================ */
const $ = (id) => document.getElementById(id);
const errbox = $('errbox');
window.addEventListener('error', (e) => {
  errbox.classList.remove('hidden');
  errbox.textContent = 'Error: ' + (e.message || e.error);
});
function showMsg(txt, ms = 1400) {
  const el = $('game-msg');
  el.textContent = txt; el.classList.remove('hidden');
  clearTimeout(showMsg._t);
  showMsg._t = setTimeout(() => el.classList.add('hidden'), ms);
}
function ticker(txt) { $('ticker-text').textContent = txt; }

// ---------- Legends roster ----------
const LEGENDS = [
  { name: 'KING DRE', aka: 'Rapper • Uptown', ht: 2.01, spd: 7.4, dunk: 95, shoot: 72, handles: 78, def: 74, hair: 'cap', skin: 0x6b4423, top: '#7a1fff', topType: 'hoodie', shorts: '#111111', shoes: '#ffd23f', acc: 'chain', special: 'CROWN DUNK — dunks almost automatic', num: 0 },
  { name: 'PIXEL', aka: 'Streamer • 10M subs', ht: 1.88, spd: 8.4, dunk: 70, shoot: 80, handles: 97, def: 72, hair: 'beanie', skin: 0xffdbac, top: '#00e5ff', topType: 'tee', shorts: '#1a1a2e', shoes: '#ffffff', acc: 'sleeve', special: 'GLITCH CROSS — breaks ankles easy', num: 7 },
  { name: 'AIR CANVAS', aka: 'YouTuber • Mixtape king', ht: 1.96, spd: 7.9, dunk: 84, shoot: 96, handles: 82, def: 70, hair: 'dreads', skin: 0x8d5524, top: '#ff2fb3', topType: 'tank', shorts: '#0e0e18', shoes: '#00e5ff', acc: null, special: 'FROM THE LOGO — deep range', num: 11 },
  { name: 'CONCRETE ROSE', aka: 'Street legend • The Cage', ht: 1.93, spd: 8.0, dunk: 82, shoot: 84, handles: 86, def: 85, hair: 'afro', skin: 0xa06a35, top: '#22c55e', topType: 'tee', shorts: '#101820', shoes: '#ff2f2f', acc: 'headband', special: 'IRON LUNGS — never gets tired', num: 23 },
  { name: 'MIDNIGHT MAG', aka: 'Ghost of Rucker', ht: 1.90, spd: 8.6, dunk: 76, shoot: 78, handles: 92, def: 94, hair: 'fade', skin: 0xc68642, top: '#111111', topType: 'hoodie', shorts: '#5b0f2b', shoes: '#e8e8e8', acc: null, special: 'PICKPOCKET — steals on lock', num: 3 },
  { name: 'BIG BRICKZ', aka: 'Enforcer • 7-footer', ht: 2.13, spd: 6.5, dunk: 90, shoot: 60, handles: 55, def: 93, hair: 'fade', skin: 0x6b4423, top: '#ff6a00', topType: 'tank', shorts: '#221100', shoes: '#ffffff', acc: null, special: 'BRICK WALL — erase shots', num: 32 },
];
const SQUAD = { name: 'Uptown', abbr: 'UPT', c1: 0x00e5ff };
const RIVALS = { name: 'Downtown', abbr: 'DNT', c1: 0xff2f5b };

// ---------- Audio: beat + sfx (all synthesized) ----------
const AudioSL = {
  ctx: null, master: null, crowdGain: null, muted: false, beatTimer: null, step: 0,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.ctx;
      this.master = ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(ctx.destination);
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.5;
      this.crowdGain = ctx.createGain(); this.crowdGain.gain.value = 0.06;
      src.connect(f).connect(this.crowdGain).connect(this.master);
      src.start();
    } catch { /* no audio */ }
  },
  toggleMute() {
    if (!this.ctx) return;
    this.muted = !this.muted;
    this.master.gain.value = this.muted ? 0 : 0.9;
    ticker(this.muted ? '🔇 Sound off' : '🔊 Sound on');
  },
  blip(freq, dur, type = 'sine', vol = 0.2, slide = 0) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur);
  },
  noise(dur, vol = 0.15, freq = 2000) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const len = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(this.master); s.start(t);
  },
  bounce() { this.blip(110, 0.12, 'sine', 0.25, -40); },
  swish() { this.noise(0.25, 0.2, 3000); this.blip(1700, 0.25, 'triangle', 0.1); },
  rim() { this.blip(300, 0.16, 'square', 0.07); },
  whistle() { this.blip(2300, 0.45, 'square', 0.09); },
  airhorn() { this.blip(220, 0.9, 'sawtooth', 0.3, 60); this.blip(277, 0.9, 'sawtooth', 0.2, 40); },
  breakSfx() { this.noise(0.3, 0.25, 800); this.blip(900, 0.2, 'square', 0.12, -500); },
  cheer(big = false) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this.crowdGain.gain.cancelScheduledValues(t);
    this.crowdGain.gain.setValueAtTime(big ? 0.4 : 0.2, t);
    this.crowdGain.gain.exponentialRampToValueAtTime(0.06, t + (big ? 2.5 : 1.1));
  },
  startBeat() {
    if (!this.ctx || this.beatTimer) return;
    const stepDur = 60 / 94 / 2; // 94bpm 8th notes
    const bass = [55, 0, 55, 65.4, 0, 55, 49, 58.3];
    this.beatTimer = setInterval(() => {
      if (this.muted || !G || G.phase === 'menu') return;
      const s = this.step % 8;
      if (s % 2 === 0) this.blip(60, 0.18, 'sine', 0.5, -25);      // kick
      if (s % 2 === 1) this.noise(0.05, 0.06, 7000);              // hat
      if (bass[s]) this.blip(bass[s], 0.3, 'triangle', 0.16);     // bass
      this.step++;
    }, stepDur * 1000);
  },
};

// ---------- Renderer / Scene ----------
const canvas = $('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);
scene.fog = new THREE.Fog(0x05070f, 45, 130);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 13, 19);

scene.add(new THREE.HemisphereLight(0x33415e, 0x0a0805, 0.7));
const moon = new THREE.DirectionalLight(0x8fb4ff, 0.55);
moon.position.set(-14, 30, -10); moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -24; moon.shadow.camera.right = 24;
moon.shadow.camera.top = 24; moon.shadow.camera.bottom = -24;
scene.add(moon);
const floodA = new THREE.PointLight(0xffc37a, 320, 60, 1.8); floodA.position.set(-10, 11, 8); scene.add(floodA);
const floodB = new THREE.PointLight(0xff9a5b, 320, 60, 1.8); floodB.position.set(10, 11, -8); scene.add(floodB);
const neonPink = new THREE.PointLight(0xff2fb3, 60, 40, 1.8); neonPink.position.set(0, 4, -12); scene.add(neonPink);
const neonCyan = new THREE.PointLight(0x00e5ff, 60, 40, 1.8); neonCyan.position.set(0, 4, 12); scene.add(neonCyan);
const legendLight = new THREE.PointLight(0xffd23f, 0, 14, 1.8); scene.add(legendLight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Court ----------
const L = 28, W = 15;
const RIM_H = 3.05, RIM_R = 0.2286, BALL_R = 0.121;
const HOOP_X = 12.7;
const FX = L / 2 + 2.2, FZ = W / 2 + 2.2; // fence bounds (no OOB!)
const hoops = { east: { x: HOOP_X, z: 0 }, west: { x: -HOOP_X, z: 0 } };

function makeAsphaltTexture() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1120;
  const g = c.getContext('2d');
  const mx = (x) => (x / (L + 4) + 0.5) * c.width;
  const mz = (z) => (z / (W + 4) + 0.5) * c.height;
  g.fillStyle = '#272c39'; g.fillRect(0, 0, c.width, c.height);
  // speckle
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.06})`;
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
  }
  // keys painted
  const key = (s, col) => {
    const bx = mx(s * L / 2);
    const pw = (5.8 / (L + 4)) * c.width, ph = (4.9 / (W + 4)) * c.height;
    g.fillStyle = col;
    g.fillRect(s > 0 ? bx - pw : bx, c.height / 2 - ph / 2, pw, ph);
  };
  key(1, 'rgba(122,31,179,.9)'); key(-1, 'rgba(14,127,140,.9)');
  // puddles (sheen spots)
  for (let i = 0; i < 7; i++) {
    g.fillStyle = 'rgba(8,12,22,.45)';
    g.beginPath();
    g.ellipse(Math.random() * c.width, Math.random() * c.height, 60 + Math.random() * 90, 25 + Math.random() * 30, Math.random(), 0, Math.PI * 2);
    g.fill();
  }
  // cracks
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    g.beginPath();
    let x = Math.random() * c.width, y = Math.random() * c.height;
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 160; y += (Math.random() - 0.5) * 160; g.lineTo(x, y); }
    g.stroke();
  }
  // worn lines
  g.strokeStyle = 'rgba(240,240,235,.8)'; g.lineWidth = 5;
  const rect = (x0, z0, x1, z1) => g.strokeRect(mx(x0), mz(z0), mx(x1) - mx(x0), mz(z1) - mz(z0));
  rect(-L / 2, -W / 2, L / 2, W / 2);
  g.beginPath(); g.ellipse(c.width / 2, c.height / 2, 115, 115, 0, 0, Math.PI * 2); g.stroke();
  const rad = (d) => (d * Math.PI) / 180;
  for (const s of [1, -1]) {
    const cx = mx(s * HOOP_X), cy = mz(0);
    const rx = (6.75 / (L + 4)) * c.width, ry = (6.75 / (W + 4)) * c.height;
    const a0 = s > 0 ? rad(112) : rad(-68), a1 = s > 0 ? rad(248) : rad(68);
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, a0, a1, false); g.stroke();
    const ex0 = cx + rx * Math.cos(a0), ey0 = cy + ry * Math.sin(a0);
    const ex1 = cx + rx * Math.cos(a1), ey1 = cy + ry * Math.sin(a1);
    const bx = mx(s * (L / 2));
    g.beginPath(); g.moveTo(ex0, ey0); g.lineTo(bx, ey0); g.stroke();
    g.beginPath(); g.moveTo(ex1, ey1); g.lineTo(bx, ey1); g.stroke();
    g.beginPath(); g.ellipse(mx(s * (L / 2 - 5.8)), mz(0), (1.8 / (L + 4)) * c.width, (1.8 / (W + 4)) * c.height, 0, 0, Math.PI * 2); g.stroke();
  }
  // center graffiti
  g.save();
  g.translate(c.width / 2, c.height / 2); g.rotate(-0.06);
  g.font = '900 130px Arial Black, Arial'; g.textAlign = 'center';
  g.lineWidth = 10; g.strokeStyle = '#0a0a12';
  g.strokeText('STREET', 0, -40); g.fillStyle = '#ff2fb3'; g.fillText('STREET', 0, -40);
  g.strokeText('LEGENDS', 0, 90); g.fillStyle = '#00e5ff'; g.fillText('LEGENDS', 0, 90);
  g.restore();
  // crown tag
  g.save(); g.translate(c.width / 2 - 480, c.height / 2 - 180); g.rotate(-0.3);
  g.font = '900 110px Arial'; g.fillStyle = '#ffd23f'; g.textAlign = 'center';
  g.fillText('♛', 0, 0); g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function makeGraffitiWallTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#141019'; g.fillRect(0, 0, 1024, 256);
  // bricks
  g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
  for (let y = 0; y < 256; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  const tags = [
    ['UPTOWN ♛', '#ffd23f', 60, 120, -0.08], ['THE CAGE', '#ff2fb3', 330, 90, 0.05],
    ['NO BLOOD NO FOUL', '#00e5ff', 560, 150, -0.04], ['LEGENDS ONLY', '#ff6a00', 830, 100, 0.07],
    ['★', '#ff2fb3', 200, 190, 0], ['★', '#00e5ff', 720, 60, 0],
  ];
  for (const [txt, col, x, y, r] of tags) {
    g.save(); g.translate(x, y); g.rotate(r);
    g.font = '900 52px Arial Black, Arial'; g.textAlign = 'center';
    g.lineWidth = 8; g.strokeStyle = '#000'; g.strokeText(txt, 0, 0);
    g.fillStyle = col; g.fillText(txt, 0, 0); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
function makeFenceTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(150,170,200,.5)'; g.lineWidth = 2;
  for (let i = -128; i < 256; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
    g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 2);
  return t;
}
function makeWindowsTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0a0c14'; g.fillRect(0, 0, 256, 256);
  for (let y = 8; y < 250; y += 22) for (let x = 8; x < 250; x += 18) {
    const lit = Math.random();
    g.fillStyle = lit < 0.3 ? '#ffd98a' : lit < 0.4 ? '#9ae8ff' : '#151a26';
    g.fillRect(x, y, 11, 14);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let courtMesh, crowd, crowdBase = [], dust, dustVel;
function buildArena() {
  if (!courtMesh) {
    const tex = makeAsphaltTexture();
    courtMesh = new THREE.Mesh(new THREE.PlaneGeometry(L + 4, W + 4),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.38, metalness: 0.32 }));
    courtMesh.rotation.x = -Math.PI / 2; courtMesh.receiveShadow = true;
    scene.add(courtMesh);
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(300, 300),
      new THREE.MeshStandardMaterial({ color: 0x11141c, roughness: 0.95 }));
    lot.rotation.x = -Math.PI / 2; lot.position.y = -0.06; lot.receiveShadow = true;
    scene.add(lot);
    // graffiti walls + chain-link fence
    const wallTex = makeGraffitiWallTexture();
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
    const fenceTex = makeFenceTexture();
    const fenceMat = new THREE.MeshBasicMaterial({ map: fenceTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const mkSide = (w, x, z, ry) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, 0.3), wallMat);
      wall.position.set(x, 0.55, z); wall.rotation.y = ry; scene.add(wall);
      const fence = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.6), fenceMat);
      fence.position.set(x, 2.4, z); fence.rotation.y = ry; scene.add(fence);
    };
    mkSide(FX * 2 + 0.6, 0, -FZ, 0); mkSide(FX * 2 + 0.6, 0, FZ, 0);
    mkSide(FZ * 2 + 0.6, -FX, 0, Math.PI / 2); mkSide(FZ * 2 + 0.6, FX, 0, Math.PI / 2);
    // floodlight towers
    const poleM = new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.6, metalness: 0.6 });
    const headM = new THREE.MeshBasicMaterial({ color: 0xffe2b0 });
    for (const [x, z] of [[-10, 8], [10, -8], [-10, -8], [10, 8]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 11), poleM);
      pole.position.set(x * 1.7, 5.5, z * 1.7); scene.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.4), headM);
      head.position.set(x * 1.7, 11, z * 1.7); head.lookAt(0, 0, 0); scene.add(head);
    }
    // skyline
    const winTex = makeWindowsTexture();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
      const r = 42 + Math.random() * 28;
      const h = 14 + Math.random() * 30, w = 6 + Math.random() * 8;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w),
        new THREE.MeshStandardMaterial({ color: 0x0d1018, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.55, roughness: 1 }));
      b.position.set(Math.cos(a) * r, h / 2 - 1, Math.sin(a) * r);
      scene.add(b);
    }
    // moon sprite
    const mc = document.createElement('canvas'); mc.width = mc.height = 128;
    const mg = mc.getContext('2d');
    const grad = mg.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, '#f4f1de'); grad.addColorStop(0.45, '#e8e4cc'); grad.addColorStop(0.55, 'rgba(232,228,204,.25)'); grad.addColorStop(1, 'rgba(232,228,204,0)');
    mg.fillStyle = grad; mg.fillRect(0, 0, 128, 128);
    const mt = new THREE.CanvasTexture(mc);
    const moonS = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, fog: false, depthWrite: false }));
    moonS.scale.set(22, 22, 1); moonS.position.set(-70, 60, -90); scene.add(moonS);
    // stars
    const sg = new THREE.BufferGeometry();
    const sp = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.2, r = 180;
      sp[i * 3] = Math.cos(a) * Math.cos(e) * r; sp[i * 3 + 1] = Math.sin(e) * r; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xaFC4ff, size: 0.7, fog: false })));
    // crowd around the cage
    const N = 130;
    crowd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 1.15, 0.32), new THREE.MeshLambertMaterial({ color: 0xffffff }), N);
    const dummy = new THREE.Object3D(); const col = new THREE.Color();
    const pal = [0xff2fb3, 0x00e5ff, 0xffd23f, 0xe8e8e8, 0xff6a00, 0x7b2fff, 0x22c55e];
    for (let i = 0; i < N; i++) {
      const side = i % 4;
      let x, z;
      if (side === 0) { x = (Math.random() - 0.5) * 34; z = -FZ - 1.2 - Math.random() * 2; }
      else if (side === 1) { x = (Math.random() - 0.5) * 34; z = FZ + 1.2 + Math.random() * 2; }
      else if (side === 2) { x = -FX - 1.2 - Math.random() * 2; z = (Math.random() - 0.5) * 22; }
      else { x = FX + 1.2 + Math.random() * 2; z = (Math.random() - 0.5) * 22; }
      crowdBase.push({ x, z, ph: Math.random() * 10 });
      dummy.position.set(x, 0.6, z); dummy.updateMatrix();
      crowd.setMatrixAt(i, dummy.matrix);
      crowd.setColorAt(i, col.setHex(pal[(Math.random() * pal.length) | 0]));
    }
    crowd.instanceMatrix.needsUpdate = true; scene.add(crowd);
    // dust / atmosphere particles
    const dn = 160;
    const dp = new Float32Array(dn * 3); dustVel = new Float32Array(dn);
    for (let i = 0; i < dn; i++) {
      dp[i * 3] = (Math.random() - 0.5) * 40; dp[i * 3 + 1] = Math.random() * 9; dp[i * 3 + 2] = (Math.random() - 0.5) * 30;
      dustVel[i] = 0.15 + Math.random() * 0.4;
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffc37a, size: 0.09, transparent: true, opacity: 0.7 }));
    scene.add(dust);
  }
}
function rimPos(side) { return side === 'east' ? new THREE.Vector3(HOOP_X, RIM_H, 0) : new THREE.Vector3(-HOOP_X, RIM_H, 0); }
const hoopMeshes = {};
function buildHoops() {
  for (const side of ['east', 'west']) {
    if (hoopMeshes[side]) continue;
    const grp = new THREE.Group();
    const s = side === 'east' ? 1 : -1;
    const steel = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.5, metalness: 0.7 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.9), steel);
    pole.position.set(s * (HOOP_X + 1.6), 1.95, 0); pole.castShadow = true; grp.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.18), steel);
    arm.position.set(s * (HOOP_X + 0.9), 3.6, 0); grp.add(arm);
    const bb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.05, 1.8),
      new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.4, roughness: 0.15 }));
    bb.position.set(s * (HOOP_X + 0.45), 3.45, 0); grp.add(bb);
    // neon rim glow strip on backboard
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.85),
      new THREE.MeshBasicMaterial({ color: side === 'east' ? 0xff2fb3 : 0x00e5ff }));
    strip.position.set(s * (HOOP_X + 0.44), 2.95, 0); grp.add(strip);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM_R, 0.024, 10, 28),
      new THREE.MeshStandardMaterial({ color: 0xff5b1a, roughness: 0.35, metalness: 0.6, emissive: 0xff5b1a, emissiveIntensity: 0.35 }));
    rim.rotation.x = Math.PI / 2; rim.position.set(s * HOOP_X, RIM_H, 0); grp.add(rim);
    const net = new THREE.Mesh(new THREE.CylinderGeometry(RIM_R, RIM_R * 0.55, 0.42, 12, 4, true),
      new THREE.MeshBasicMaterial({ color: 0xf5f5f5, wireframe: true, transparent: true, opacity: 0.85 }));
    net.position.set(s * HOOP_X, RIM_H - 0.22, 0); grp.add(net);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.9 }));
    pad.position.set(s * (HOOP_X + 1.6), 1.1, 0); grp.add(pad);
    scene.add(grp); hoopMeshes[side] = grp;
  }
}

// ---------- Players ----------
function numberSprite(num) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.font = '900 84px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(String(num), 64, 68);
  g.fillStyle = '#fff'; g.fillText(String(num), 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(0.55, 0.55, 1);
  return s;
}
class Player {
  constructor(team, cfg, idx) {
    this.team = team; this.cfg = cfg; this.idx = idx;
    this.isHome = team.isHome;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.face = new THREE.Vector3(1, 0, 0);
    this.speed = cfg.spd; this.stamina = 1;
    this.hasBall = false; this.jumpV = 0; this.jumpY = 0;
    this.contestT = 0; this.stealCD = 0; this.holdT = 0; this.crossCD = 0;
    this.stun = 0; this.dribbleSide = 1;
    this.stats = { pts: 0, fgm: 0, fga: 0, tpm: 0, dunk: 0, brk: 0, ast: 0, stl: 0, blk: 0 };
    this.build();
  }
  build() {
    const g = new THREE.Group();
    const c = this.cfg;
    const hScale = c.ht / 1.98;
    const skinM = new THREE.MeshStandardMaterial({ color: c.skin, roughness: 0.55 });
    const topM = new THREE.MeshStandardMaterial({ color: new THREE.Color(c.top), roughness: 0.8 });
    const shortsM = new THREE.MeshStandardMaterial({ color: new THREE.Color(c.shorts), roughness: 0.85 });
    const shoeM = new THREE.MeshStandardMaterial({ color: new THREE.Color(c.shoes), roughness: 0.4 });
    const hairC = new THREE.Color(c.hairCol || '#14100c');
    const hairM = new THREE.MeshStandardMaterial({ color: hairC, roughness: 0.95 });
    const baggy = c.topType === 'hoodie' ? 1.18 : 1;
    // legs + shoes
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.78 * hScale, 0.17), skinM);
    this.legR = this.legL.clone();
    this.legL.position.set(-0.13, 0.39 * hScale, 0); this.legR.position.set(0.13, 0.39 * hScale, 0);
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.32), shoeM);
    const shoeR = shoeL.clone();
    shoeL.position.set(-0.13, 0.06, 0.05); shoeR.position.set(0.13, 0.06, 0.05);
    g.add(shoeL, shoeR);
    // shorts
    const shorts = new THREE.Mesh(new THREE.BoxGeometry(0.5, (c.topType === 'tank' ? 0.34 : 0.44) * hScale, 0.32), shortsM);
    shorts.position.y = 0.78 * hScale + 0.2 * hScale;
    // torso
    const torsoH = (c.topType === 'tank' ? 0.62 : 0.72) * hScale;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52 * baggy, torsoH, 0.3 * baggy), topM);
    torso.position.y = shorts.position.y + 0.2 * hScale + torsoH / 2;
    this.torsoY = torso.position.y;
    // arms (sleeveless for tank)
    const armM = c.topType === 'tank' ? skinM : topM;
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.6 * hScale, 0.13), armM);
    this.armR = this.armL.clone();
    this.armL.position.set(-0.36 * baggy, this.torsoY + 0.08, 0);
    this.armR.position.set(0.36 * baggy, this.torsoY + 0.08, 0);
    if (c.acc === 'sleeve') this.armR.material = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), skinM);
    head.position.y = this.torsoY + torsoH / 2 + 0.19;
    this.headY = head.position.y;
    g.add(this.legL, this.legR, shorts, torso, this.armL, this.armR, head);
    // hair styles
    const hy = head.position.y;
    if (c.hair === 'afro') {
      const afro = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), hairM);
      afro.position.y = hy + 0.09; afro.scale.set(1.1, 0.95, 1.1); g.add(afro);
    } else if (c.hair === 'dreads') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.155, 10, 8), hairM);
      cap.position.y = hy + 0.06; g.add(cap);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const d = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.34), hairM);
        d.position.set(Math.cos(a) * 0.13, hy - 0.12, Math.sin(a) * 0.13);
        g.add(d);
      }
    } else if (c.hair === 'fade') {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.152, 10, 8), hairM);
      f.position.y = hy + 0.045; f.scale.set(1, 0.6, 1); g.add(f);
    } else if (c.hair === 'cap') {
      const capM = new THREE.MeshStandardMaterial({ color: new THREE.Color(c.top), roughness: 0.8 });
      const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.16, 0.1, 12), capM);
      dome.position.y = hy + 0.1; g.add(dome);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.22), capM);
      brim.position.set(0, hy + 0.08, -0.22); g.add(brim); // backwards
    } else if (c.hair === 'beanie') {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.9 }));
      b.position.y = hy + 0.07; b.scale.set(1, 0.75, 1); g.add(b);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 8, 14), new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.8 }));
      rim.rotation.x = Math.PI / 2; rim.position.y = hy + 0.02; g.add(rim);
    }
    // accessories
    if (c.acc === 'chain') {
      const ch = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 8, 16), new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.9, roughness: 0.25 }));
      ch.position.y = this.torsoY + torsoH / 2 - 0.02; ch.rotation.x = Math.PI / 2 - 0.25; g.add(ch);
    } else if (c.acc === 'headband') {
      const hb = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.025, 8, 16), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 }));
      hb.rotation.x = Math.PI / 2; hb.position.y = hy + 0.03; g.add(hb);
    }
    // number on back
    const num = numberSprite(c.num);
    num.position.set(0, this.torsoY, -0.19 * baggy);
    g.add(num);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.mesh = g; this.hScale = hScale;
    scene.add(g);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 24),
      new THREE.MeshBasicMaterial({ color: this.isHome ? 0x00e5ff : 0xffd23f, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.03; this.ring.visible = false;
    scene.add(this.ring);
    // legend glow shell
    this.glow = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glow.position.y = 1.1; g.add(this.glow);
    this.animT = Math.random() * 10;
  }
  setPos(x, z) { this.pos.set(x, 0, z); this.sync(); }
  sync() {
    this.mesh.position.set(this.pos.x, this.jumpY, this.pos.z);
    this.mesh.rotation.y = Math.atan2(this.face.x, this.face.z);
    this.mesh.rotation.x = this.stun > 0 ? -0.85 * Math.min(1, this.stun) : 0;
    this.ring.position.set(this.pos.x, 0.03, this.pos.z);
    const sp = this.vel.length();
    this.animT += 0.016 * (2 + sp * 1.6);
    const sw = Math.sin(this.animT * 8) * Math.min(0.5, sp * 0.09);
    this.legL.position.z = sw; this.legR.position.z = -sw;
    const armsUp = this.holdT > 0 || this.jumpY > 0.25;
    this.armL.position.y = this.torsoY + 0.08 + (armsUp ? 0.45 : Math.abs(sw) * 0.4);
    this.armR.position.y = this.torsoY + 0.08 + (armsUp ? 0.45 : Math.abs(sw) * 0.4);
    this.glow.material.opacity = this.legendOn ? 0.22 + Math.sin(performance.now() * 0.02) * 0.1 : 0;
  }
}

// ---------- Game state ----------
const G = {
  phase: 'menu', mode: '3v3', target: 21,
  home: null, away: null, players: [],
  user: null, ball: null,
  homeScore: 0, awayScore: 0, difficulty: 1.0,
  homeAttacksEast: true, possession: 'home', lastTouch: null,
  deadT: 0, tipT: 0,
  charge: 0, charging: false, green: { c: 0.7, w: 0.12 },
  hype: { home: 0, away: 0 }, legend: { home: 0, away: 0 },
  camYaw: 0, camPitch: 0.68, camDist: 22, autoCam: true,
  assistMan: null, shake: 0, wasShot: false, lastHolder: null,
  selLegend: 2, selMode: '3v3',
};
function teamAttackSide(isHome) {
  const east = G.homeAttacksEast;
  return (isHome ? east : !east) ? 'east' : 'west';
}
function addHype(isHome, n) {
  const k = isHome ? 'home' : 'away';
  if (G.legend[k] > 0) return;
  G.hype[k] = Math.min(100, G.hype[k] + n);
  if (G.hype[k] >= 100) {
    G.legend[k] = 12; G.hype[k] = 25;
    if (isHome) {
      $('legend-banner').classList.remove('hidden');
      showMsg('LEGEND MODE! 👑', 1800);
      ticker('👑 LEGEND MODE — greens automatic, ankles in danger!');
    } else {
      showMsg('RIVAL LEGEND MODE! 😈', 1800);
      ticker('😈 Rival is FEELING IT — lock up!');
    }
    AudioSL.airhorn(); AudioSL.cheer(true);
  }
  updateHypeUI();
}
function updateHypeUI() {
  $('hype-fill').style.height = G.hype.home + '%';
}

// ---------- Ball ----------
function makeBall() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#c25a1e'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#2a1405'; g.lineWidth = 8;
  g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke();
  g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  g.beginPath(); g.arc(64, 128, 90, -1.2, 1.2); g.stroke();
  g.beginPath(); g.arc(192, 128, 90, Math.PI - 1.2, Math.PI + 1.2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 20, 16),
    new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }));
  m.castShadow = true; scene.add(m);
  return { mesh: m, pos: new THREE.Vector3(0, 1, 0), vel: new THREE.Vector3(), state: 'held', holder: null, passT: 0, passFrom: new THREE.Vector3(), passTo: new THREE.Vector3(), passTarget: null, lob: false, shotInfo: null };
}

// ---------- Setup ----------
function setupMatch(legendIdx, mode, target, diff) {
  for (const p of G.players) { scene.remove(p.mesh); scene.remove(p.ring); }
  G.players = [];
  G.mode = mode; G.target = target; G.difficulty = diff;
  G.homeScore = 0; G.awayScore = 0;
  G.hype = { home: 0, away: 0 }; G.legend = { home: 0, away: 0 };
  G.homeAttacksEast = true;
  G.home = { def: SQUAD, isHome: true };
  G.away = { def: RIVALS, isHome: false };
  buildArena(); buildHoops();
  const n = mode === '1v1' ? 1 : 3;
  const mine = [LEGENDS[legendIdx]];
  const pool = LEGENDS.map((_, i) => i).filter((i) => i !== legendIdx);
  for (let i = 1; i < n; i++) mine.push(LEGENDS[pool.splice((Math.random() * pool.length) | 0, 1)[0]]);
  const theirs = [];
  const pool2 = LEGENDS.map((_, i) => i).filter((i) => i !== legendIdx);
  for (let i = 0; i < n; i++) theirs.push(LEGENDS[pool2.splice((Math.random() * pool2.length) | 0, 1)[0]]);
  mine.forEach((cfg, i) => G.players.push(new Player(G.home, { ...cfg, num: cfg.num }, i)));
  theirs.forEach((cfg, i) => G.players.push(new Player(G.away, { ...cfg, num: cfg.num }, i)));
  if (!G.ball) G.ball = makeBall();
  resetTipoff();
  updateScoreboard(); updateHypeUI();
  $('sb-home-abbr').textContent = 'UPT';
  $('sb-away-abbr').textContent = 'DNT';
  $('sb-target').textContent = 'FIRST TO ' + target;
  $('sb-quarter').textContent = mode;
}
function formationSpots(attackSide, ballX) {
  const s = attackSide === 'east' ? 1 : -1;
  const hx = s * HOOP_X;
  const shift = THREE.MathUtils.clamp(ballX * 0.15, -2, 2);
  return [
    new THREE.Vector3(hx - s * 7.5, 0, shift * 0.4),
    new THREE.Vector3(hx - s * 6.2, 0, 4.6 + shift),
    new THREE.Vector3(hx - s * 6.2, 0, -4.6 + shift),
  ];
}
function checkBall(isHome) {
  // street "check" at the top after a score
  G.phase = 'dead'; G.deadT = 1.2;
  G.possession = isHome ? 'home' : 'away';
  const atk = teamAttackSide(isHome);
  const s = atk === 'east' ? 1 : -1;
  const top = new THREE.Vector3(s * 6.5, 0, 0);
  const mates = G.players.filter((p) => p.isHome === isHome);
  const foes = G.players.filter((p) => p.isHome !== isHome);
  mates.forEach((p, i) => {
    if (i === 0) { p.setPos(top.x, top.z); }
    else { const sp = formationSpots(atk, top.x)[i] || top; p.setPos(sp.x, sp.z); }
    p.vel.set(0, 0, 0); p.hasBall = false; p.stun = 0;
  });
  foes.forEach((p, i) => {
    p.setPos(top.x * 0.4 + (i - 1) * 2, (i % 2 ? 3.2 : -3.2));
    p.vel.set(0, 0, 0); p.hasBall = false; p.stun = 0;
  });
  G.ball.state = 'held'; G.ball.holder = mates[0]; G.ball.lob = false; mates[0].hasBall = true;
  G.ball.pos.copy(mates[0].pos).add(new THREE.Vector3(0, 1, 0));
  G.lastTouch = mates[0];
  if (isHome && G.mode !== '1v1') { /* keep current user if home */ }
  G.user = pickUser();
}
function resetTipoff() {
  G.phase = 'tipoff'; G.tipT = 2.0; G.wasShot = false; G.lastHolder = null;
  G.players.forEach((p, i) => {
    const s = p.isHome ? 1 : -1;
    if (G.mode === '1v1') p.setPos(s * 3, 0);
    else if (i % 3 === 2 || (p.role === undefined && p.idx === 2)) p.setPos(s * 0.8, s > 0 ? 0.7 : -0.7);
    else p.setPos(s * (2.5 + p.idx * 1.8), (p.idx % 2 === 0 ? 1 : -1) * (1.5 + p.idx));
    p.vel.set(0, 0, 0); p.hasBall = false; p.jumpY = 0; p.stun = 0;
  });
  // centers (idx 2 in 3v3, idx 0 in 1v1) jump
  G.ball.state = 'loose'; G.ball.holder = null; G.ball.lob = false;
  G.ball.pos.set(0, 4.2, 0); G.ball.vel.set(0, 0.5, 0);
  G.user = G.players.find((p) => p.isHome && p.idx === 0);
  G.possession = 'home';
  showMsg('RUN IT! 🔥', 1300);
  ticker(`Street ball at The Cage — ${G.mode}, first to ${G.target}. NO BLOOD NO FOUL.`);
}
function pickUser() {
  const home = G.players.filter((p) => p.isHome);
  if (G.ball.holder && G.ball.holder.isHome) return G.ball.holder;
  let best = home[0], bd = 1e9;
  for (const p of home) { const d = p.pos.distanceTo(G.ball.pos); if (d < bd) { bd = d; best = p; } }
  return best;
}

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', (e) => {
  if (['TAB', 'SPACE', 'ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWDOWN'].includes(e.code) || e.key === ' ') e.preventDefault();
  if (e.repeat) { keys[e.code] = true; return; }
  keys[e.code] = true;
  if (e.code === 'Tab') cycleDefender();
  if (e.code === 'KeyQ') tryPass(false);
  if (e.code === 'KeyT') tryAlleyOop();
  if (e.code === 'KeyJ') doCrossover(G.user);
  if (e.code === 'KeyE') tryStealBlock();
  if (e.code === 'KeyM') AudioSL.toggleMute();
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  if (e.code === 'KeyF') document.documentElement.requestFullscreen?.();
  if (e.code === 'KeyR') { G.camYaw = 0; G.camPitch = 0.68; G.camDist = 22; }
  AudioSL.init();
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'Space') releaseShot();
});
window.addEventListener('pointerdown', () => AudioSL.init());
let dragging = false, px = 0, py = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  G.camYaw -= (e.clientX - px) * 0.005;
  G.camPitch = THREE.MathUtils.clamp(G.camPitch + (e.clientY - py) * 0.004, 0.25, 1.25);
  px = e.clientX; py = e.clientY;
});
window.addEventListener('pointerup', () => {
  dragging = false;
  if (G.charging) releaseShot();
});
canvas.addEventListener('wheel', (e) => {
  G.camDist = THREE.MathUtils.clamp(G.camDist + e.deltaY * 0.02, 10, 38);
  e.preventDefault();
}, { passive: false });

function cycleDefender() {
  if (G.phase !== 'play') return;
  const home = G.players.filter((p) => p.isHome);
  home.sort((a, b) => a.pos.distanceTo(G.ball.pos) - b.pos.distanceTo(G.ball.pos));
  G.user = home[(home.indexOf(G.user) + 1) % home.length];
  AudioSL.blip(700, 0.07, 'square', 0.08);
}

// ---------- Moves ----------
function nearestOpp(pos, isHome) {
  let best = null, bd = 1e9;
  for (const p of G.players) {
    if (p.isHome === isHome) continue;
    const d = p.pos.distanceTo(pos);
    if (d < bd) { bd = d; best = p; }
  }
  return { p: best, d: bd };
}
function legendBoost(p) { return G.legend[p.isHome ? 'home' : 'away'] > 0; }

function doCrossover(p) {
  if (!p || G.phase !== 'play' || p.crossCD > 0 || p.hasBall === false || p.stun > 0) return;
  if (G.ball.holder !== p) return;
  p.crossCD = 1.1;
  p.dribbleSide *= -1;
  // burst perpendicular to facing
  const side = new THREE.Vector3(-p.face.z, 0, p.face.x).multiplyScalar(p.dribbleSide);
  p.vel.addScaledVector(side, 6.5);
  p.face.add(side.clone().multiplyScalar(0.5)).normalize();
  AudioSL.noise(0.08, 0.1, 2500);
  if (p.isHome) addHype(true, 5);
  // ankle-breaker roll
  const { p: dman, d } = nearestOpp(p.pos, p.isHome);
  if (dman && d < 1.9 && dman.stun <= 0) {
    let ch = 0.16 + (p.cfg.handles - dman.cfg.def) * 0.009;
    if (p.cfg.name === 'PIXEL') ch += 0.15;
    if (legendBoost(p)) ch += 0.2;
    if (p.isHome && dman !== G.user) ch *= 1.0;
    if (!p.isHome && dman === G.user) ch *= 0.55 * G.difficulty; // don't bully the player constantly
    if (dman.jumpY > 0.1) ch += 0.1;
    if (Math.random() < THREE.MathUtils.clamp(ch, 0.04, 0.65)) {
      dman.stun = 1.35; dman.stealCD = 1.4;
      dman.vel.set(0, 0, 0);
      p.stats.brk++;
      addHype(p.isHome, 20);
      G.shake = Math.max(G.shake, 0.35);
      showMsg('ANKLE BREAKER!! 🥨', 1200);
      ticker(`${p.cfg.name} sends ${dman.cfg.name} to the FLOOR!`);
      AudioSL.breakSfx(); AudioSL.cheer(true);
    } else if (p === G.user) {
      ticker(`${p.cfg.name} with the nasty cross!`);
    }
  }
}
function tryPass(lob) {
  const u = G.user;
  if (G.phase !== 'play' || !G.ball.holder || G.ball.holder !== u) return;
  const mates = G.players.filter((p) => p.isHome && p !== u);
  if (!mates.length) return;
  let best = mates[0], bs = -1e9;
  for (const m of mates) {
    const to = m.pos.clone().sub(u.pos).normalize();
    const s = to.dot(u.face) * 2 + nearestOpp(m.pos, true).d * 0.3 - u.pos.distanceTo(m.pos) * 0.05;
    if (s > bs) { bs = s; best = m; }
  }
  G.assistMan = u;
  launchPass(u, best, lob);
}
function tryAlleyOop() {
  const u = G.user;
  if (G.phase !== 'play' || G.mode === '1v1' || !G.ball.holder || G.ball.holder !== u) return;
  const atk = teamAttackSide(true);
  const mates = G.players.filter((p) => p.isHome && p !== u);
  mates.sort((a, b) => a.pos.distanceTo(rimPos(atk)) - b.pos.distanceTo(rimPos(atk)));
  const target = mates[0];
  if (!target || target.pos.distanceTo(rimPos(atk)) > 9) {
    ticker('Nobody to oop — get a runner going!');
    return;
  }
  G.assistMan = u;
  launchPass(u, target, true);
  ticker(`${u.cfg.name} throws it UP for ${target.cfg.name}!`);
}
function launchPass(from, to, lob = false) {
  from.hasBall = false;
  G.ball.state = 'pass'; G.ball.holder = null; G.ball.lob = lob;
  G.ball.passT = 0;
  G.ball.passFrom.copy(from.pos).add(new THREE.Vector3(0, 1.3, 0));
  G.ball.passTo.copy(to.pos).add(new THREE.Vector3(0, lob ? 2.2 : 1.1, 0));
  G.ball.passTarget = to;
  AudioSL.blip(lob ? 800 : 500, 0.1, 'triangle', 0.1);
}
function tryStealBlock() {
  const u = G.user;
  if (!u || G.phase !== 'play' || u.stealCD > 0 || u.stun > 0) return;
  u.stealCD = 0.9;
  u.jumpV = 4.2; u.contestT = 1.0;
  AudioSL.blip(300, 0.1, 'square', 0.08);
  // block a shot in flight / at release
  const B = G.ball;
  if ((B.state === 'shot' || B.state === 'held') ) {
    const shooter = B.state === 'shot' ? B.shotInfo.shooter : B.holder;
    if (shooter && shooter.isHome !== u.isHome && u.pos.distanceTo(shooter.pos) < 2.3) {
      let ch = 0.3 + (u.cfg.def - 75) * 0.008;
      if (u.cfg.name === 'BIG BRICKZ') ch += 0.15;
      if (legendBoost(u)) ch += 0.15;
      if (Math.random() < THREE.MathUtils.clamp(ch, 0.1, 0.6)) {
        if (B.holder) B.holder.hasBall = false;
        B.shotInfo = null; B.state = 'loose'; B.holder = null; B.lob = false;
        B.pos.copy(shooter.pos).add(new THREE.Vector3(0, 2, 0));
        const away = u.pos.clone().sub(shooter.pos).setY(0).normalize();
        B.vel.copy(away.multiplyScalar(7)).add(new THREE.Vector3(0, 3, 0));
        u.stats.blk++;
        addHype(u.isHome, 12);
        G.shake = Math.max(G.shake, 0.4);
        showMsg('REJECTED! 🚫', 1000);
        ticker(`${u.cfg.name} erases ${shooter.cfg.name}!`);
        AudioSL.cheer(true);
        return;
      }
    }
  }
  // steal off dribble
  const h = B.holder;
  if (h && h.isHome !== u.isHome && h.pos.distanceTo(u.pos) < 1.5) {
    let ch = 0.24 / G.difficulty + (h.stamina < 0.3 ? 0.12 : 0);
    if (u.cfg.name === 'MIDNIGHT MAG') ch += 0.15;
    if (Math.random() < ch) {
      h.hasBall = false; G.assistMan = null;
      B.state = 'loose'; B.holder = null;
      B.pos.copy(h.pos).add(new THREE.Vector3(0, 1, 0));
      B.vel.set((Math.random() - 0.5) * 6, 3, (Math.random() - 0.5) * 6);
      u.stats.stl++;
      addHype(u.isHome, 8);
      ticker(`${u.cfg.name} with the RIP!`);
      showMsg('STEAL! 🔓', 900);
      AudioSL.cheer(false);
    }
  }
}
function releaseShot() {
  if (!G.charging) return;
  G.charging = false;
  if (G.phase !== 'play' || G.ball.holder !== G.user) { G.charge = 0; return; }
  shootBall(G.user, G.charge);
  G.charge = 0;
}
function distToRim(p) {
  return p.pos.distanceTo(rimPos(teamAttackSide(p.isHome)));
}
function shootBall(p, charge) {
  const side = teamAttackSide(p.isHome);
  const rim = rimPos(side);
  const dist = p.pos.distanceTo(rim);
  const driving = p.vel.length() > 5 || p.sprintFlag;
  const isDunk = dist < 2.7 && driving && p.jumpY < 0.3;
  p.hasBall = false;
  G.ball.state = 'shot'; G.ball.holder = null; G.ball.lob = false;
  p.stats.fga++;
  const nd = nearestOpp(p.pos, p.isHome);
  const contest = Math.min(1.5, nd.d < 1.7 ? 1.25 - nd.d * 0.5 : 0);
  let perfect, width;
  if (isDunk) { perfect = 0.45; width = 0.7; }
  else { perfect = THREE.MathUtils.clamp(0.58 + dist * 0.016, 0.6, 0.86); width = Math.max(0.07, 0.15 - dist * 0.006 - contest * 0.03); }
  if (legendBoost(p)) width *= 1.8;
  G.green = { c: perfect, w: width };
  const err = Math.abs(charge - perfect);
  // base make probability (street: forgiving inside, skill outside)
  let base;
  if (isDunk) {
    base = 0.9 + (p.cfg.dunk - 80) * 0.006;
  } else {
    base = THREE.MathUtils.clamp(0.85 - dist * 0.04, 0.15, 0.8);
    base *= (p.cfg.shoot / 82);
    if (dist > 8 && p.cfg.name === 'AIR CANVAS') base += 0.12; // logo range
  }
  base *= (1 - contest * (isDunk ? 0.3 : 0.38)) * (0.72 + p.stamina * 0.38);
  if (legendBoost(p)) base += 0.14;
  if (!p.isHome) base = base * 0.9 * G.difficulty + 0.01;
  if (p.cfg.name === 'KING DRE' && isDunk) base = Math.min(0.97, base + 0.08);
  const green = err < width / 2;
  if (green) base = Math.min(0.985, base + 0.35);
  else base *= THREE.MathUtils.clamp(1 - (err - width / 2) * 2.2, 0.12, 1);
  const makes = Math.random() < base;
  const offAmt = makes ? 0.03 : 0.16 + Math.random() * 0.3 + contest * 0.12 + err * 0.5;
  const ang = Math.random() * Math.PI * 2;
  const target = rim.clone().add(new THREE.Vector3(Math.cos(ang) * offAmt * (makes ? 0.4 : 1), 0, Math.sin(ang) * offAmt * (makes ? 0.4 : 1)));
  const t = isDunk ? 0.5 : THREE.MathUtils.clamp(0.65 + dist * 0.045, 0.7, 1.15);
  const from = p.pos.clone().add(new THREE.Vector3(0, isDunk ? 2.3 : 2.0 + p.jumpY, 0));
  const grav = -9.8 * 1.6;
  const v = target.clone().sub(from).divideScalar(t);
  v.y = (target.y - from.y - 0.5 * grav * t * t) / t;
  G.ball.pos.copy(from); G.ball.vel.copy(v);
  const is3 = dist > 6.75;
  G.ball.shotInfo = { shooter: p, makes, side, t, age: 0, grav, is3, green, dunk: isDunk, counted: false, poster: isDunk && contest > 0.6 };
  p.jumpV = isDunk ? 7.2 : 4.4; p.holdT = 0.7;
  if (isDunk) {
    G.shake = Math.max(G.shake, contest > 0.6 ? 0.7 : 0.5);
    addHype(p.isHome, 15);
  }
  if (green && !isDunk) addHype(p.isHome, is3 ? 10 : 6);
  updateMeter();
}
function updateMeter() {
  const g = G.green;
  const el = $('shotmeter-green');
  el.style.bottom = ((g.c - g.w / 2) * 100) + '%';
  el.style.height = (g.w * 100) + '%';
}

// ---------- Scoring (street: 1s & 2s) ----------
const LINES = ['THAT BOY NICE!', 'TALK TO EM!', 'CAGE CLASSIC!', 'COOKING!', 'DIFFERENT BREED!', 'TOO SAUCY!'];
function onMake(info) {
  const p = info.shooter;
  const pts = info.is3 ? 2 : 1;
  p.stats.pts += pts; p.stats.fgm++;
  if (info.is3) p.stats.tpm++;
  if (info.dunk) p.stats.dunk++;
  if (G.assistMan && G.assistMan !== p && G.assistMan.isHome === p.isHome) G.assistMan.stats.ast++;
  G.assistMan = null; G.wasShot = false;
  if (p.isHome) G.homeScore += pts; else G.awayScore += pts;
  AudioSL.swish(); AudioSL.cheer(info.is3 || info.green || info.dunk);
  if (info.dunk) showMsg(info.oop ? 'ALLEY-OOP!! ✈️' : (info.poster ? 'POSTER DUNK!! 💥' : 'SLAM! 🔨'), 1300);
  else showMsg(info.is3 ? 'TWO BALL! 🎯' : (info.green ? 'GREEN! 💦' : 'BUCKET!'), 1100);
  ticker(`${p.cfg.name} (${p.isHome ? 'UPT' : 'DNT'}) ${info.oop ? 'finishes the OOP' : info.dunk ? 'THROWS IT DOWN' : info.is3 ? 'splashes the DEUCE' : 'scores'} — ${LINES[(Math.random() * LINES.length) | 0]}`);
  updateScoreboard();
  G.lastTouch = p;
  if ((p.isHome ? G.homeScore : G.awayScore) >= G.target) {
    G.phase = 'dead'; G.deadT = 1.4;
    setTimeout(() => endGame(), 1300);
    return;
  }
  G.phase = 'dead'; G.deadT = 1.1;
  G.possession = !p.isHome ? 'home' : 'away';
  const otherHome = !p.isHome;
  setTimeout(() => { if (G.phase === 'dead') checkBall(otherHome); }, 1000);
}

// ---------- HUD ----------
function updateScoreboard() {
  $('sb-home-score').textContent = G.homeScore;
  $('sb-away-score').textContent = G.awayScore;
  $('sb-target').textContent = `FIRST TO ${G.target}`;
}

// ---------- AI ----------
function aiControl(p, dt) {
  const holder = G.ball.holder;
  const myBall = holder && holder.isHome === p.isHome;
  const iHaveIt = holder === p;
  const atk = teamAttackSide(p.isHome);
  const atkRim = rimPos(atk);
  const defSide = atk === 'east' ? 'west' : 'east';
  const defRim = rimPos(defSide);
  const diffR = p.isHome ? 1 : G.difficulty;
  let want = p.pos.clone(), sprint = false;

  if (G.phase !== 'play') { /* hold */ }
  else if (p.stun > 0) { /* floored */ }
  else if (G.ball.state === 'shot' || G.ball.state === 'loose') {
    const land = predictLanding();
    if (reboundRank(p) < 2) { want.copy(land); sprint = true; }
    else want.copy(defRim).lerp(p.pos, 0.35);
  }
  else if (iHaveIt) {
    want.copy(atkRim); sprint = distToRim(p) > 4.5;
    const nd = nearestOpp(p.pos, p.isHome);
    if (nd.p && p.pos.distanceTo(atkRim) > 3) {
      const away = p.pos.clone().sub(nd.p.pos).setY(0).normalize().multiplyScalar(1.4);
      want.add(away);
    }
    p.aiT = (p.aiT || 0) + dt;
    // AI crossovers!
    p.crossT = (p.crossT || 1 + Math.random() * 2) - dt;
    if (p.crossT < 0 && nd.d < 2.2) { p.crossT = 2 + Math.random() * 2.5; doCrossover(p); return; }
    const react = 1.5 / diffR;
    if (p.aiT > react) {
      const open = nd.d > 1.9, close = distToRim(p) < 6.5 + diffR;
      const closing = (p.isHome ? G.homeScore : G.awayScore) >= G.target - 3;
      if ((open && close) || closing) {
        shootBall(p, perfectFor(p) + (Math.random() - 0.5) * 0.1);
        p.aiT = 0; return;
      }
      if (nd.d < 1.1 && Math.random() < 0.05 * diffR && G.mode !== '1v1') {
        const mates = G.players.filter((q) => q.isHome === p.isHome && q !== p);
        mates.sort((a, b) => nearestOpp(a.pos, a.isHome).d - nearestOpp(b.pos, b.isHome).d);
        if (mates[0] && nearestOpp(mates[0].pos, mates[0].isHome).d > nd.d + 0.5) {
          G.assistMan = p; launchPass(p, mates[0]); p.aiT = 0; return;
        }
      }
      // alley-oop attempt by AI
      if (G.mode !== '1v1' && Math.random() < 0.008 * diffR) {
        const mates = G.players.filter((q) => q.isHome === p.isHome && q !== p);
        mates.sort((a, b) => a.pos.distanceTo(rimPos(atk)) - b.pos.distanceTo(rimPos(atk)));
        if (mates[0] && mates[0].pos.distanceTo(rimPos(atk)) < 6) {
          G.assistMan = p; launchPass(p, mates[0], true); p.aiT = 0; return;
        }
      }
      if (p.aiT > 4.5) { shootBall(p, perfectFor(p)); p.aiT = 0; return; }
    }
  }
  else if (myBall) {
    const mates = G.players.filter((q) => q.isHome === p.isHome && G.ball.holder !== q);
    const idx = Math.max(0, mates.indexOf(p));
    const spots = formationSpots(atk, G.ball.pos.x);
    want.copy(spots[Math.min(idx + (G.mode === '1v1' ? 0 : 1), spots.length - 1)] || spots[0]);
    p.cutT = (p.cutT ?? Math.random() * 4) - dt;
    if (p.cutT < 0) { p.cutT = 3 + Math.random() * 4; p.cutDest = Math.random() < 0.35 ? atkRim.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3)) : null; }
    if (p.cutDest) { want.copy(p.cutDest); if (p.pos.distanceTo(p.cutDest) < 1) p.cutDest = null; }
  }
  else {
    const myMan = G.players.find((q) => q.isHome !== p.isHome && q.idx === p.idx) || nearestOpp(p.pos, !p.isHome).p;
    if (!myMan) want.copy(defRim);
    else if (G.ball.holder === myMan) {
      want.copy(myMan.pos).lerp(atkRim, -0.12);
      sprint = true;
      p.reachT = (p.reachT || 0) - dt;
      if (p.reachT < 0 && p.pos.distanceTo(myMan.pos) < 1.3) {
        p.reachT = 1.6 / diffR + Math.random();
        let ch = 0.15 * diffR;
        if (p.cfg.name === 'MIDNIGHT MAG') ch += 0.12;
        if (myMan === G.user) ch *= 0.7;
        if (Math.random() < ch && myMan !== G.user) {
          myMan.hasBall = false; G.ball.state = 'loose'; G.ball.holder = null;
          G.ball.pos.copy(myMan.pos).add(new THREE.Vector3(0, 1, 0));
          G.ball.vel.set((Math.random() - 0.5) * 5, 2.5, (Math.random() - 0.5) * 5);
          p.stats.stl++;
          ticker(`${p.cfg.name} strips it!`);
        }
      }
      if (Math.random() < dt * 0.7) { p.jumpV = 4; p.contestT = 1; }
    } else {
      want.copy(myMan.pos.clone().lerp(defRim, 0.35).lerp(G.ball.pos, 0.18));
    }
  }
  movePlayer(p, want, dt, sprint, 1);
}
function perfectFor(p) {
  const d = distToRim(p);
  return THREE.MathUtils.clamp(0.58 + d * 0.016, 0.6, 0.86);
}
function reboundRank(p) {
  const land = predictLanding();
  return [...G.players].sort((a, b) => a.pos.distanceTo(land) - b.pos.distanceTo(land)).indexOf(p);
}
function predictLanding() {
  if (G.ball.state === 'shot' && G.ball.shotInfo && !G.ball.shotInfo.makes) {
    return rimPos(G.ball.shotInfo.side).add(new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2));
  }
  return G.ball.pos.clone().setY(0);
}
function movePlayer(p, want, dt, sprint, mul = 1) {
  const to = want.clone().sub(p.pos); to.y = 0;
  const d = to.length();
  if (d > 0.08 && p.stun <= 0) {
    to.normalize();
    p.face.lerp(to, Math.min(1, dt * 10)).normalize();
    let max = p.speed * mul * (sprint ? 1.24 : 0.85) * (0.7 + p.stamina * 0.4);
    if (legendBoost(p)) max *= 1.12;
    if (p !== G.user) max *= 0.92;
    p.vel.x += to.x * 30 * dt; p.vel.z += to.z * 30 * dt;
    const sp = p.vel.length();
    if (sp > max) p.vel.multiplyScalar(max / sp);
    if (sprint && d > 1) p.stamina = Math.max(0.12, p.stamina - dt * (p.cfg.name === 'CONCRETE ROSE' ? 0.045 : 0.09));
  } else {
    p.vel.multiplyScalar(Math.max(0, 1 - dt * 8));
  }
  p.sprintFlag = sprint && d > 1;
  p.pos.x += p.vel.x * dt; p.pos.z += p.vel.z * dt;
  // the cage keeps everything in — fence bounce
  if (Math.abs(p.pos.x) > FX) { p.pos.x = Math.sign(p.pos.x) * FX; p.vel.x *= -0.3; }
  if (Math.abs(p.pos.z) > FZ) { p.pos.z = Math.sign(p.pos.z) * FZ; p.vel.z *= -0.3; }
  if (p.jumpV !== 0 || p.jumpY > 0) {
    p.jumpY += p.jumpV * dt; p.jumpV -= 13 * dt;
    if (p.jumpY <= 0) { p.jumpY = 0; p.jumpV = 0; }
  }
  p.contestT = Math.max(0, p.contestT - dt);
  p.stealCD = Math.max(0, p.stealCD - dt);
  p.crossCD = Math.max(0, p.crossCD - dt);
  p.holdT = Math.max(0, p.holdT - dt);
  if (!sprint) p.stamina = Math.min(1, p.stamina + dt * 0.05);
  p.sync();
}

// ---------- User ----------
function userControl(dt) {
  const u = G.user;
  if (!u || G.phase !== 'play') return;
  if (keys['Space'] && G.ball.holder === u && !G.charging) { G.charging = true; G.charge = 0; }
  let ix = 0, iz = 0;
  if (keys['KeyW'] || keys['ArrowUp']) iz -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) iz += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) ix -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) ix += 1;
  const cos = Math.cos(-G.camYaw), sin = Math.sin(-G.camYaw);
  const rx = ix * cos - iz * sin, rz = ix * sin + iz * cos;
  const has = G.ball.holder === u;
  if ((rx !== 0 || rz !== 0) && u.stun <= 0) {
    const want = u.pos.clone().add(new THREE.Vector3(rx * 4, 0, rz * 4));
    movePlayer(u, want, dt, keys['ShiftLeft'] || keys['ShiftRight'], has ? 0.94 : 1.0);
    if (has) u.face.set(rx, 0, rz).normalize();
  } else {
    u.vel.multiplyScalar(Math.max(0, 1 - dt * 10));
    u.pos.x += u.vel.x * dt; u.pos.z += u.vel.z * dt;
    u.sprintFlag = false;
    if (u.jumpV !== 0 || u.jumpY > 0) {
      u.jumpY += u.jumpV * dt; u.jumpV -= 13 * dt;
      if (u.jumpY <= 0) { u.jumpY = 0; u.jumpV = 0; }
    }
    u.contestT = Math.max(0, u.contestT - dt);
    u.stealCD = Math.max(0, u.stealCD - dt);
    u.crossCD = Math.max(0, u.crossCD - dt);
    u.holdT = Math.max(0, u.holdT - dt);
    u.sync();
    u.stamina = Math.min(1, u.stamina + dt * 0.06);
  }
  if (G.charging && G.ball.holder === u) {
    G.charge = Math.min(1, G.charge + dt * 1.05);
    u.holdT = 0.2;
    const rim = rimPos(teamAttackSide(true));
    u.face.copy(rim.clone().sub(u.pos).setY(0).normalize());
  }
  if (keys['Space'] && G.ball.holder !== u && u.jumpY === 0 && u.jumpV === 0 && u.stun <= 0) {
    u.jumpV = 4.4; u.contestT = 1.0;
  }
  $('stamina-fill').style.width = (u.stamina * 100) + '%';
  const sm = $('shotmeter');
  if (G.charging && G.ball.holder === u) {
    sm.classList.remove('hidden');
    $('shotmeter-fill').style.height = (G.charge * 100) + '%';
    const d = distToRim(u);
    const c = THREE.MathUtils.clamp(0.58 + d * 0.016, 0.6, 0.86);
    const w = Math.max(0.07, 0.15 - d * 0.006) * (legendBoost(u) ? 1.8 : 1);
    $('shotmeter-green').style.bottom = ((c - w / 2) * 100) + '%';
    $('shotmeter-green').style.height = (w * 100) + '%';
  } else sm.classList.add('hidden');
}

// ---------- Ball update ----------
let bounceCD = 0;
function updateBall(dt) {
  const B = G.ball;
  bounceCD -= dt;
  if (B.state === 'held' && B.holder) {
    const h = B.holder;
    h.dribbleSide = h.dribbleSide || 1;
    if (h.vel.length() > 1 && Math.random() < dt * 2) h.dribbleSide *= -1;
    const sideV = new THREE.Vector3(-h.face.z, 0, h.face.x).multiplyScalar(0.4 * h.dribbleSide);
    const off = h.face.clone().multiplyScalar(0.45).add(sideV);
    B.pos.set(h.pos.x + off.x, 0.6 + Math.abs(Math.sin(performance.now() * 0.012)) * 0.28, h.pos.z + off.z);
    B.mesh.position.copy(B.pos);
  } else if (B.state === 'pass') {
    B.passT += dt / (B.lob ? 0.62 : 0.38);
    const t = Math.min(1, B.passT);
    B.pos.lerpVectors(B.passFrom, B.passTo, t);
    B.pos.y += Math.sin(t * Math.PI) * (B.lob ? 2.4 : 0.8);
    B.mesh.position.copy(B.pos);
    if (t >= 1) {
      const tgt = B.passTarget;
      let intercept = null;
      for (const p of G.players) {
        if (p.isHome === tgt.isHome) continue;
        if (p.pos.distanceTo(B.pos) < 0.9 && Math.random() < 0.45) { intercept = p; break; }
      }
      const rec = intercept || tgt;
      if (G.ball.holder) G.ball.holder.hasBall = false;
      rec.hasBall = true; B.state = 'held'; B.holder = rec;
      G.lastTouch = rec;
      const wasLob = B.lob; B.lob = false;
      // ALLEY-OOP finish?
      if (!intercept && wasLob && rec.pos.distanceTo(rimPos(teamAttackSide(rec.isHome))) < 5.5) {
        doAlleyOopFinish(rec);
      } else {
        if (intercept) { ticker(`${rec.cfg.name} picks the pass!`); showMsg('INTERCEPTED!', 900); }
        if (rec.isHome && G.phase === 'play') G.user = rec;
      }
    }
  } else if (B.state === 'shot' || B.state === 'loose') {
    const info = B.shotInfo;
    const grav = info ? info.grav : -9.8 * 1.6;
    B.vel.y += grav * dt;
    B.pos.addScaledVector(B.vel, dt);
    for (const side of ['east', 'west']) {
      const s = side === 'east' ? 1 : -1;
      const bx = s * (HOOP_X + 0.45);
      const prevX = B.pos.x - B.vel.x * dt;
      if (Math.sign(prevX - bx) !== Math.sign(B.pos.x - bx) && Math.abs(B.pos.z) < 0.95 && B.pos.y > 2.8 && B.pos.y < 4.1) {
        B.pos.x = bx + Math.sign(B.pos.x - bx) * (BALL_R + 0.01);
        B.vel.x *= -0.55; B.vel.y *= 0.9; B.vel.z *= 0.9;
        AudioSL.rim();
      }
      const rim = rimPos(side);
      const dx = B.pos.x - rim.x, dz = B.pos.z - rim.z, dy = B.pos.y - rim.y;
      const hd = Math.hypot(dx, dz);
      if (Math.abs(dy) < 0.16 && Math.abs(hd - RIM_R) < BALL_R + 0.03) {
        const n = new THREE.Vector3(dx, 0, dz).normalize();
        const out = hd > RIM_R;
        B.pos.x = rim.x + n.x * (RIM_R + (out ? BALL_R + 0.005 : -(BALL_R + 0.005)));
        B.pos.z = rim.z + n.z * (RIM_R + (out ? BALL_R + 0.005 : -(BALL_R + 0.005)));
        const dot = B.vel.x * n.x + B.vel.z * n.z;
        B.vel.x -= 1.7 * dot * n.x; B.vel.z -= 1.7 * dot * n.z;
        B.vel.multiplyScalar(0.72);
        AudioSL.rim();
      }
      if (B.vel.y < 0 && info && !info.counted) {
        const crossed = (B.pos.y - B.vel.y * dt) > rim.y && B.pos.y <= rim.y;
        if (hd < RIM_R - 0.02 && crossed && side === info.side) {
          info.counted = true; info.makes = true;
        }
      }
    }
    if (B.pos.y < BALL_R) {
      B.pos.y = BALL_R;
      if (Math.abs(B.vel.y) > 1 && bounceCD <= 0) { AudioSL.bounce(); bounceCD = 0.09; }
      B.vel.y *= -0.62; B.vel.x *= 0.82; B.vel.z *= 0.82;
      if (Math.abs(B.vel.y) < 0.7) B.vel.y = 0;
    }
    // fence keeps it in — bounce loose balls off the cage
    if (Math.abs(B.pos.x) > FX) { B.pos.x = Math.sign(B.pos.x) * FX; B.vel.x *= -0.55; AudioSL.rim(); }
    if (Math.abs(B.pos.z) > FZ) { B.pos.z = Math.sign(B.pos.z) * FZ; B.vel.z *= -0.55; AudioSL.rim(); }
    B.mesh.position.copy(B.pos);
    B.mesh.rotation.x += dt * 8;
    if (info) {
      info.age += dt;
      if (info.counted || (info.makes && B.pos.y < RIM_H - 0.6 && B.vel.y < 0)) {
        B.shotInfo = null; B.state = 'held'; B.holder = null;
        onMake(info);
        return;
      }
      if (info.age > 2.6 || (B.pos.y <= BALL_R + 0.01 && Math.abs(B.vel.y) < 0.8 && info.age > 1.2)) {
        B.shotInfo = null; B.state = 'loose'; G.wasShot = true;
        B.vel.multiplyScalar(0.5);
        ticker(`${info.shooter.cfg.name} can't get it to fall.`);
      }
    } else if (B.state === 'loose') {
      for (const p of G.players) {
        if (p.stun > 0) continue;
        if (p.pos.distanceTo(B.pos) < 0.8 && B.pos.y < 1.5) {
          if (B.holder) B.holder.hasBall = false;
          p.hasBall = true; B.holder = p; B.state = 'held';
          G.lastTouch = p; G.possession = p.isHome ? 'home' : 'away';
          if (G.wasShot) { /* rebound */ G.wasShot = false; addHype(p.isHome, 4); }
          if (p.isHome) G.user = p;
          if (G.lastHolder && G.lastHolder.isHome !== p.isHome) G.lastHolder = p;
          break;
        }
      }
    }
  }
  for (const side of ['east', 'west']) {
    const rim = rimPos(side);
    if (B.pos.distanceTo(rim) < 0.35 && B.pos.y < RIM_H && B.pos.y > RIM_H - 0.6) {
      B.vel.multiplyScalar(1 - dt * 6);
    }
  }
}
function doAlleyOopFinish(rec) {
  const side = teamAttackSide(rec.isHome);
  const rim = rimPos(side);
  rec.hasBall = false;
  G.ball.state = 'shot'; G.ball.holder = null;
  rec.stats.fga++;
  rec.jumpV = 7.5; rec.holdT = 0.8;
  const from = rec.pos.clone().add(new THREE.Vector3(0, 2.4, 0));
  const t = 0.45, grav = -9.8 * 1.6;
  const v = rim.clone().sub(from).divideScalar(t);
  v.y = (rim.y - from.y - 0.5 * grav * t * t) / t;
  G.ball.pos.copy(from); G.ball.vel.copy(v);
  G.ball.shotInfo = { shooter: rec, makes: true, side, t, age: 0, grav, is3: false, green: false, dunk: true, oop: true, counted: false };
  addHype(rec.isHome, 25);
  G.shake = Math.max(G.shake, 0.7);
  showMsg('ALLEY-OOP!! ✈️', 1400);
  ticker(`${G.assistMan ? G.assistMan.cfg.name : '???'} lobs it — ${rec.cfg.name} FINISHES!`);
  AudioSL.cheer(true);
}

// ---------- Camera ----------
function updateCamera(dt) {
  const focus = G.ball ? G.ball.pos : new THREE.Vector3();
  let tx, ty, tz;
  if (G.phase === 'menu') {
    const t = performance.now() * 0.0001;
    tx = Math.cos(t) * 19; tz = Math.sin(t) * 19; ty = 11;
  } else if (G.autoCam) {
    const fx = THREE.MathUtils.clamp(focus.x * 0.55, -7, 7);
    const yaw = G.camYaw, dist = G.camDist, pitch = G.camPitch;
    tx = fx * 0.7 + Math.sin(yaw) * 4;
    tz = Math.cos(yaw) * dist * 0.95;
    ty = 4 + dist * Math.sin(pitch) * 0.85;
  } else { tx = focus.x + 6; ty = 12; tz = 16; }
  const k = 1 - Math.pow(0.001, dt);
  camera.position.lerp(new THREE.Vector3(tx, ty, tz), k);
  if (G.shake > 0) {
    camera.position.x += (Math.random() - 0.5) * G.shake;
    camera.position.y += (Math.random() - 0.5) * G.shake * 0.6;
    G.shake = Math.max(0, G.shake - dt * 1.8);
  }
  camera.lookAt(THREE.MathUtils.clamp(focus.x * 0.6, -8, 8), 1.2, focus.z * 0.4);
}

// ---------- Crowd + dust ----------
const _dummy = new THREE.Object3D();
function updateAmbience(t) {
  if (crowd) {
    const amp = 0.12 + (G.hype.home + G.hype.away) / 200 * 0.5 + (G.phase === 'play' ? 0.1 : 0);
    for (let i = 0; i < crowdBase.length; i++) {
      const b = crowdBase[i];
      _dummy.position.set(b.x, 0.6 + Math.abs(Math.sin(t * 2.4 + b.ph)) * amp, b.z);
      _dummy.updateMatrix();
      crowd.setMatrixAt(i, _dummy.matrix);
    }
    crowd.instanceMatrix.needsUpdate = true;
  }
  if (dust) {
    const pos = dust.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dustVel[i] * 0.016;
      if (y > 9) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }
  // legend glow follows user
  if (G.user && G.legend.home > 0) {
    legendLight.position.copy(G.user.pos).add(new THREE.Vector3(0, 1.5, 0));
    legendLight.intensity = 60 + Math.sin(t * 10) * 25;
  } else legendLight.intensity = 0;
}

// ---------- Game over ----------
function endGame() {
  if (G.phase === 'over' || G.phase === 'menu') return;
  G.phase = 'over';
  $('legend-banner').classList.add('hidden');
  AudioSL.airhorn(); AudioSL.cheer(true);
  const win = G.homeScore > G.awayScore;
  $('final').classList.remove('hidden');
  $('final-title').textContent = win ? 'UPTOWN TAKES THE CAGE! 🏆' : 'DOWNTOWN TAKES THE CAGE! 🏆';
  $('final-score').textContent = `UPT ${G.homeScore} — ${G.awayScore} DNT`;
  const rows = [...G.players].sort((a, b) => b.stats.pts - a.stats.pts)
    .map((p) => `${p.isHome ? 'UPT' : 'DNT'} ${p.cfg.name}: ${p.stats.pts} PTS${p.stats.dunk ? `, ${p.stats.dunk} DUNK` : ''}${p.stats.brk ? `, ${p.stats.brk} BRK` : ''}${p.stats.ast ? `, ${p.stats.ast} AST` : ''}${p.stats.stl ? `, ${p.stats.stl} STL` : ''}${p.stats.blk ? `, ${p.stats.blk} BLK` : ''}`)
    .join('<br>');
  const pog = [...G.players].sort((a, b) => (b.stats.pts + b.stats.ast * 2) - (a.stats.pts + a.stats.ast * 2))[0];
  $('final-stats').innerHTML = `<b>👑 MVP OF THE CAGE: ${pog.cfg.name} (${pog.stats.pts} PTS)</b><br><br>${rows}`;
  ticker(`FINAL: Uptown ${G.homeScore}, Downtown ${G.awayScore}.`);
}

// ---------- Main loop ----------
const clockT = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.033, clockT.getDelta());
  const t = performance.now() * 0.001;
  if (G.paused) { renderer.render(scene, camera); return; }
  // legend timers + hype decay
  for (const k of ['home', 'away']) {
    if (G.legend[k] > 0) {
      G.legend[k] -= dt;
      if (G.legend[k] <= 0) {
        G.legend[k] = 0;
        for (const p of G.players) p.legendOn = false;
        if (k === 'home') $('legend-banner').classList.add('hidden');
        ticker('Legend mode fades…');
      }
    }
  }
  if (G.phase === 'play') {
    G.hype.home = Math.max(0, G.hype.home - dt * 0.8);
    G.hype.away = Math.max(0, G.hype.away - dt * 0.8);
    if (((t * 2) | 0) !== (((t - dt) * 2) | 0)) updateHypeUI();
  }
  for (const p of G.players) {
    p.stun = Math.max(0, p.stun - dt);
    p.legendOn = G.legend[p.isHome ? 'home' : 'away'] > 0;
  }
  if (G.phase === 'tipoff') {
    G.tipT -= dt;
    const jumpers = G.mode === '1v1' ? G.players : G.players.filter((p) => p.idx === 2);
    for (const c of jumpers) { if (G.tipT < 1.0 && c.jumpY === 0 && c.jumpV === 0) c.jumpV = 5; }
    for (const p of G.players) {
      if (p.jumpV !== 0 || p.jumpY > 0) { p.jumpY += p.jumpV * dt; p.jumpV -= 13 * dt; if (p.jumpY <= 0) { p.jumpY = 0; p.jumpV = 0; } p.sync(); }
    }
    updateBall(dt);
    if (G.tipT <= 0 && G.ball.state === 'loose' && !G.ball.holder) {
      const awayFirst = G.players.find((p) => !p.isHome && p.idx === (G.mode === '1v1' ? 0 : 1));
      awayFirst.hasBall = true; G.ball.state = 'held'; G.ball.holder = awayFirst;
      G.possession = 'away'; G.lastTouch = awayFirst; G.wasShot = false;
      G.phase = 'play';
      ticker(`Downtown wins the tip — first to ${G.target}!`);
    }
    if (G.ball.holder && G.phase === 'tipoff') G.phase = 'play';
  } else if (G.phase === 'play') {
    userControl(dt);
    for (const p of G.players) { if (p !== G.user) aiControl(p, dt); }
    updateBall(dt);
    if (G.ball.holder && G.lastHolder !== G.ball.holder) G.lastHolder = G.ball.holder;
    updateScoreboard();
  } else if (G.phase === 'dead') {
    G.deadT -= dt;
    for (const p of G.players) { p.vel.multiplyScalar(Math.max(0, 1 - dt * 6)); p.sync(); }
    updateBall(dt);
    if (G.deadT <= 0 && G.phase === 'dead') G.phase = 'play';
  }
  for (const p of G.players) p.ring.visible = (p === G.user && G.phase === 'play');
  if (G.user && G.phase === 'play') {
    G.user.ring.visible = true;
    G.user.ring.material.color.setHex(G.ball.holder === G.user ? 0x39ff6a : 0x00e5ff);
  }
  updateAmbience(t);
  updateCamera(dt);
  renderer.render(scene, camera);
}

// ---------- UI ----------
function buildRosterCards() {
  const r = $('roster');
  r.innerHTML = '';
  LEGENDS.forEach((l, i) => {
    const d = document.createElement('div');
    d.className = 'legend-card' + (i === G.selLegend ? ' selected' : '');
    const bar = (v) => `<div class="bar"><i style="width:${v}%"></i></div>`;
    d.innerHTML = `<h3>#${l.num} ${l.name}</h3><div class="aka">${l.aka}</div>
      <div class="bars">DUNK${bar(l.dunk)}SHOT${bar(l.shoot)}HANDLES${bar(l.handles)}DEF${bar(l.def)}</div>
      <div class="special">⭐ ${l.special}</div>`;
    d.addEventListener('click', () => {
      G.selLegend = i;
      [...r.children].forEach((c, j) => c.classList.toggle('selected', j === i));
      AudioSL.init(); AudioSL.blip(600 + i * 80, 0.1, 'square', 0.1);
    });
    r.appendChild(d);
  });
}
function startGame() {
  AudioSL.init();
  const target = parseInt($('opt-target').value, 10);
  const diff = parseFloat($('opt-diff').value);
  setupMatch(G.selLegend, G.selMode, target, diff);
  $('menu').classList.add('hidden');
  $('final').classList.add('hidden');
  $('scoreboard').classList.remove('hidden');
  $('ticker').classList.remove('hidden');
  $('stamina').classList.remove('hidden');
  $('controls-hint').classList.remove('hidden');
  $('hype').classList.remove('hidden');
  $('loading').style.display = 'none';
  AudioSL.startBeat();
}
function togglePause(force) {
  if (G.phase === 'menu' || G.phase === 'over') return;
  const p = $('pause');
  const show = force !== undefined ? force : p.classList.contains('hidden');
  p.classList.toggle('hidden', !show);
  G.paused = show;
}
$('mode-1v1').addEventListener('click', () => {
  G.selMode = '1v1';
  $('mode-1v1').classList.add('selected'); $('mode-3v3').classList.remove('selected');
  $('opt-target').value = '11';
});
$('mode-3v3').addEventListener('click', () => {
  G.selMode = '3v3';
  $('mode-3v3').classList.add('selected'); $('mode-1v1').classList.remove('selected');
  $('opt-target').value = '21';
});
$('btn-play').addEventListener('click', startGame);
$('btn-howto').addEventListener('click', () => $('howto').classList.toggle('hidden'));
$('btn-resume').addEventListener('click', () => togglePause(false));
$('btn-quit').addEventListener('click', () => { togglePause(false); G.phase = 'menu'; $('pause').classList.add('hidden'); $('menu').classList.remove('hidden'); });
$('btn-rematch').addEventListener('click', () => { $('final').classList.add('hidden'); startGame(); });
$('btn-tomenu').addEventListener('click', () => { $('final').classList.add('hidden'); G.phase = 'menu'; $('menu').classList.remove('hidden'); });
$('opt-autocam').addEventListener('change', (e) => (G.autoCam = e.target.checked));

// attract scene behind menu
buildRosterCards();
setupMatch(2, '3v3', 21, 1.0);
G.phase = 'menu';
$('loading').style.display = 'none';
if (new URLSearchParams(location.search).has('play')) { setTimeout(startGame, 600); }
window.__SL_READY = true;
window.__SL = G;
loop();
