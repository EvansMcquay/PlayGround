import * as THREE from 'three';

export class AssetManager {
  constructor(engine) {
    this.engine = engine;
    this.cache = new Map();
    this.loadingPromises = new Map();
  }

  async loadGLTF(path, options = {}) {
    const key = path + JSON.stringify(options);
    if (this.cache.has(key)) return this.cache.get(key).clone();
    
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }
    
    const promise = this.engine.loadGLTF(path, options).then(gltf => {
      this.cache.set(key, gltf);
      this.loadingPromises.delete(key);
      return gltf;
    }).catch(err => {
      this.loadingPromises.delete(key);
      throw err;
    });
    
    this.loadingPromises.set(key, promise);
    return promise;
  }

  async loadTexture(path, options = {}) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(path, tex => {
        if (options.colorSpace) tex.colorSpace = options.colorSpace;
        if (options.anisotropy) tex.anisotropy = options.anisotropy;
        if (options.wrapS) tex.wrapS = options.wrapS;
        if (options.wrapT) tex.wrapT = options.wrapT;
        if (options.repeat) tex.repeat.set(...options.repeat);
        resolve(tex);
      }, undefined, reject);
    });
  }

  async loadAudio(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.AudioLoader();
      loader.load(url, buffer => resolve(buffer), undefined, reject);
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.forEach(v => v.scene?.traverse?.(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    }));
    this.cache.clear();
  }
}