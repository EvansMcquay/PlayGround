import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.gltfLoader = null;
    this.dracoLoader = null;
    this.isRunning = false;
    this.systems = new Map();
    this.frameCallbacks = [];
    
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLoaders();
    this.initLights();
    this.initPostProcessing();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.physicallyCorrectLights = true;
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030305);
    this.scene.fog = new THREE.Fog(0x030305, 40, 150);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      55, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      300
    );
    this.camera.position.set(0, 12, 20);
  }

  initLoaders() {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  initLights() {
    const hemi = new THREE.HemisphereLight(0x8fb4ff, 0x1a1008, 0.6);
    this.scene.add(hemi);

    this.sunLight = new THREE.DirectionalLight(0xfff8e7, 1.2);
    this.sunLight.position.set(-15, 40, -10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(4096, 4096);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -25;
    this.sunLight.shadow.camera.right = 25;
    this.sunLight.shadow.camera.top = 25;
    this.sunLight.shadow.camera.bottom = -25;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    this.floodLights = [];
    const floodPositions = [
      { pos: [-12, 14, 10], color: 0xffd4a0, intensity: 800 },
      { pos: [12, 14, -10], color: 0xffb880, intensity: 800 },
      { pos: [-12, 14, -10], color: 0xffd4a0, intensity: 600 },
      { pos: [12, 14, 10], color: 0xffb880, intensity: 600 },
    ];
    
    floodPositions.forEach(f => {
      const light = new THREE.PointLight(f.color, f.intensity, 60, 1.8);
      light.position.set(...f.pos);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      this.scene.add(light);
      this.floodLights.push(light);
    });

    this.neonPink = new THREE.PointLight(0xff2fb3, 0, 50, 1.8);
    this.neonPink.position.set(0, 5, -14);
    this.scene.add(this.neonPink);

    this.neonCyan = new THREE.PointLight(0x00e5ff, 0, 50, 1.8);
    this.neonCyan.position.set(0, 5, 14);
    this.scene.add(this.neonCyan);

    this.legendSpotlight = new THREE.SpotLight(0xffd23f, 0, 20, Math.PI / 6, 0.5, 1);
    this.legendSpotlight.position.set(0, 15, 0);
    this.legendSpotlight.target.position.set(0, 0, 0);
    this.scene.add(this.legendSpotlight);
    this.scene.add(this.legendSpotlight.target);
  }

  initPostProcessing() {
    this.composer = null;
    this.renderPass = null;
    this.bloomPass = null;
    this.fxaaPass = null;
  }

  registerSystem(name, system) {
    this.systems.set(name, system);
    system.engine = this;
    if (system.init) system.init();
  }

  getSystem(name) {
    return this.systems.get(name);
  }

  addFrameCallback(cb) {
    this.frameCallbacks.push(cb);
  }

  removeFrameCallback(cb) {
    const idx = this.frameCallbacks.indexOf(cb);
    if (idx >= 0) this.frameCallbacks.splice(idx, 1);
  }

  start() {
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);
    
    const dt = Math.min(0.033, this.clock.getDelta());
    const t = this.clock.getElapsedTime();
    
    this.systems.forEach(sys => {
      if (sys.update) sys.update(dt, t);
    });
    
    this.frameCallbacks.forEach(cb => cb(dt, t));
    
    this.renderer.render(this.scene, this.camera);
  };

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  loadGLTF(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, 
        (gltf) => {
          if (options.scale) gltf.scene.scale.setScalar(options.scale);
          if (options.position) gltf.scene.position.copy(options.position);
          if (options.rotation) gltf.scene.rotation.set(...options.rotation);
          resolve(gltf);
        },
        undefined,
        reject
      );
    });
  }

  dispose() {
    this.stop();
    this.systems.forEach(sys => sys.dispose?.());
    this.renderer.dispose();
    this.dracoLoader.dispose();
  }

  setPhase(phase) {
    if (this.game) this.game.setPhase(phase);
  }

  showMessage(text, duration = 1500) {
    this.uiManager?.showMessage(text, duration);
  }

  showTicker(text) {
    this.uiManager?.updateTicker(text);
  }
}

export const engine = null;