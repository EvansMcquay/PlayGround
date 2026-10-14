import * as THREE from 'three';
import { Character } from './Character.js';

export const STREAMER_LEGENDS = [
  {
    id: 'kai_cenat',
    name: 'KAI C.',
    aka: 'The Hype King • 15M+',
    height: 1.78,
    build: 'lean_athletic',
    skinTone: 0x8d5524,
    hairStyle: 'twists',
    hairColor: 0x1a1005,
    eyeColor: 0x2a1a0a,
    attributes: {
      speed: 9.2,
      acceleration: 9.5,
      dunk: 78,
      shoot: 72,
      handles: 96,
      defense: 75,
      stamina: 90,
      vertical: 82,
      strength: 68,
    },
    signatureDunk: 'cartwheel_360',
    introAnimation: 'intro_hype_dance',
    playstyle: 'speed_handles_hype',
    bio: 'Fastest hands on the concrete. Breaks ankles, builds hype, finishes with flair.',
    tags: ['crossover', 'speed', 'hype', 'cartwheel'],
  },
  {
    id: 'adin_ross',
    name: 'ADIN R.',
    aka: 'The Playmaker • 12M+',
    height: 1.85,
    build: 'athletic',
    skinTone: 0xe8c8a0,
    hairStyle: 'curly_top',
    hairColor: 0x2a1a0a,
    eyeColor: 0x3a2a1a,
    attributes: {
      speed: 7.8,
      acceleration: 7.5,
      dunk: 72,
      shoot: 88,
      handles: 82,
      defense: 70,
      stamina: 80,
      vertical: 70,
      strength: 72,
    },
    signatureDunk: 'alley_oop_self',
    introAnimation: 'intro_confident_nod',
    playstyle: 'shooting_playmaking',
    bio: 'Sniper from anywhere. Threads needles, hits logos, makes everyone better.',
    tags: ['shooting', 'passing', 'clutch', 'logo_range'],
  },
  {
    id: 'duke_dennis',
    name: 'DUKE D.',
    aka: 'The Dunker • 10M+',
    height: 1.93,
    build: 'power_athletic',
    skinTone: 0x6b4423,
    hairStyle: 'dreads_high_top',
    hairColor: 0x140a04,
    eyeColor: 0x2a1a0a,
    attributes: {
      speed: 7.5,
      acceleration: 8.0,
      dunk: 98,
      shoot: 75,
      handles: 78,
      defense: 82,
      stamina: 85,
      vertical: 95,
      strength: 92,
    },
    signatureDunk: 'free_throw_line_windmill',
    introAnimation: 'intro_chalk_toss',
    playstyle: 'power_finishing',
    bio: 'Absolute force at the rim. Posterizes defenders, catches bodies, flies from the line.',
    tags: ['dunking', 'power', 'vertical', 'posterizer'],
  },
  {
    id: 'jynxzi',
    name: 'JYNXZI',
    aka: 'The Lockdown • 8M+',
    height: 1.88,
    build: 'wiry_athletic',
    skinTone: 0xc68642,
    hairStyle: 'fade_design',
    hairColor: 0x0d0804,
    eyeColor: 0x1a0a05,
    attributes: {
      speed: 8.8,
      acceleration: 9.0,
      dunk: 80,
      shoot: 70,
      handles: 88,
      defense: 97,
      stamina: 92,
      vertical: 85,
      strength: 75,
    },
    signatureDunk: 'between_legs_reverse',
    introAnimation: 'intro_stealth_approach',
    playstyle: 'defense_chaos',
    bio: 'Chaos on defense. Steals, blocks, unexpected moves. Turns defense into offense instantly.',
    tags: ['steals', 'blocks', 'unpredictable', 'transition'],
  },
  {
    id: 'ishowspeed',
    name: 'ISHOWSPEED',
    aka: 'The Rocket • 25M+',
    height: 1.80,
    build: 'explosive',
    skinTone: 0xa06a35,
    hairStyle: 'short_waves',
    hairColor: 0x141008,
    eyeColor: 0x2a1508,
    attributes: {
      speed: 9.8,
      acceleration: 10.0,
      dunk: 92,
      shoot: 65,
      handles: 85,
      defense: 72,
      stamina: 95,
      vertical: 94,
      strength: 80,
    },
    signatureDunk: 'backflip_tomahawk',
    introAnimation: 'intro_explosive_burst',
    playstyle: 'speed_explosion',
    bio: 'Pure explosion. 0 to 100 instantly. Backflips, 720s, plays at impossible speed.',
    tags: ['speed', 'backflip', '720', 'chaos'],
  },
  {
    id: 'fanum',
    name: 'FANUM',
    aka: 'The Enforcer • 8M+',
    height: 1.96,
    build: 'powerhouse',
    skinTone: 0x5a3a22,
    hairStyle: 'beard_fade',
    hairColor: 0x100804,
    eyeColor: 0x1a0a05,
    attributes: {
      speed: 6.8,
      acceleration: 6.5,
      dunk: 88,
      shoot: 68,
      handles: 70,
      defense: 90,
      stamina: 88,
      vertical: 78,
      strength: 98,
    },
    signatureDunk: 'double_clutch_power',
    introAnimation: 'intro_shoulder_check',
    playstyle: 'physical_dominance',
    bio: 'Bulldozer in the paint. Bodies up, finishes through contact, owns the glass.',
    tags: ['strength', 'post_play', 'rebounding', 'contact'],
  },
];

export const ORIGINAL_LEGENDS = [
  {
    id: 'concrete_rose',
    name: 'CONCRETE ROSE',
    aka: 'Queen of the Cage • NYC Legend',
    height: 1.83,
    build: 'athletic_female',
    skinTone: 0xa06a35,
    hairStyle: 'afro',
    hairColor: 0x1a1005,
    eyeColor: 0x3a2a1a,
    attributes: {
      speed: 8.5,
      acceleration: 8.8,
      dunk: 85,
      shoot: 84,
      handles: 90,
      defense: 88,
      stamina: 95,
      vertical: 88,
      strength: 78,
    },
    signatureDunk: 'windmill_360',
    introAnimation: 'intro_crown_tap',
    playstyle: 'complete_two_way',
    bio: 'The most complete player on concrete. No weaknesses. Pure winner.',
    tags: ['complete', 'clutch', 'leader', 'iron_lungs'],
  },
  {
    id: 'midnight_mag',
    name: 'MIDNIGHT MAG',
    aka: 'Ghost of Rucker • The Pickpocket',
    height: 1.90,
    build: 'wiry',
    skinTone: 0x8d5524,
    hairStyle: 'waves_360',
    hairColor: 0x080604,
    eyeColor: 0x1a1a2a,
    attributes: {
      speed: 8.6,
      acceleration: 8.9,
      dunk: 78,
      shoot: 78,
      handles: 94,
      defense: 96,
      stamina: 90,
      vertical: 82,
      strength: 70,
    },
    signatureDunk: 'shamgod_finish',
    introAnimation: 'intro_vanish',
    playstyle: 'defense_stealth',
    bio: 'Invisible until the ball is gone. Highest steal rate in history.',
    tags: ['steals', 'ankle_breaker', 'phantom', 'shadow'],
  },
  {
    id: 'air_canvas',
    name: 'AIR CANVAS',
    aka: 'Mixtape King • Logo Range',
    height: 1.96,
    build: 'tall_athletic',
    skinTone: 0x6b4423,
    hairStyle: 'long_dreads',
    hairColor: 0x100804,
    eyeColor: 0x2a1a0a,
    attributes: {
      speed: 7.2,
      acceleration: 7.0,
      dunk: 88,
      shoot: 98,
      handles: 84,
      defense: 72,
      stamina: 75,
      vertical: 86,
      strength: 74,
    },
    signatureDunk: 'free_throw_line_double_clutch',
    introAnimation: 'intro_camera_flash',
    playstyle: 'shooting_artistry',
    bio: 'Turns the court into a canvas. Deep threes, acrobatic finishes, pure art.',
    tags: ['deep_range', 'creative', 'mixtape', 'artist'],
  },
  {
    id: 'big_brickz',
    name: 'BIG BRICKZ',
    aka: 'The Wall • 7-Foot Enforcer',
    height: 2.16,
    build: 'massive',
    skinTone: 0x4a3018,
    hairStyle: 'bald',
    hairColor: 0x080604,
    eyeColor: 0x1a1a2a,
    attributes: {
      speed: 5.5,
      acceleration: 5.0,
      dunk: 90,
      shoot: 60,
      handles: 50,
      defense: 98,
      stamina: 80,
      vertical: 65,
      strength: 100,
    },
    signatureDunk: 'two_hand_power_slam',
    introAnimation: 'intro_ground_shake',
    playstyle: 'rim_protection',
    bio: 'Immovable object. Erases shots, grabs everything, dunks on souls.',
    tags: ['blocks', 'rebounds', 'intimidation', 'paint_beast'],
  },
];

export class CharacterRoster {
  constructor(engine) {
    this.engine = engine;
    this.characters = new Map();
    this.loadedCharacters = new Map();
    this.selectionIndex = 0;
    this.teamAssignments = new Map();
  }

  async initialize() {
    const all = [...STREAMER_LEGENDS, ...ORIGINAL_LEGENDS];
    
    for (const data of all) {
      const character = new Character(data);
      this.characters.set(data.id, { data, character, loaded: false });
    }
    
    await this.preloadModels();
  }

  async preloadModels() {
    const loadPromises = [];
    
    for (const [id, entry] of this.characters) {
      loadPromises.push(this.loadCharacter(id).catch(err => {
        console.warn(`Failed to load ${id}:`, err);
        entry.character.createFallbackModel();
        entry.loaded = true;
      }));
    }
    
    await Promise.allSettled(loadPromises);
  }

  async loadCharacter(id) {
    const entry = this.characters.get(id);
    if (!entry || entry.loaded) return entry?.character;
    
    try {
      const modelPath = `/assets/models/characters/${id}.glb`;
      const gltf = await this.engine.assetManager.loadGLTF(modelPath, { scale: 0.01 });
      await entry.character.loadModel(gltf);
    } catch (err) {
      console.log(`Using procedural model for ${id} (GLB not found: ${err.message})`);
      entry.character.createFallbackModel();
    }
    
    entry.loaded = true;
    this.loadedCharacters.set(id, entry.character);
    return entry.character;
  }

  getCharacter(id) {
    return this.characters.get(id)?.character;
  }

  getAllCharacters() {
    return Array.from(this.characters.values()).map(e => e.character);
  }

  getStreamerLegends() {
    return STREAMER_LEGENDS.map(l => this.characters.get(l.id)?.character).filter(Boolean);
  }

  getOriginalLegends() {
    return ORIGINAL_LEGENDS.map(l => this.characters.get(l.id)?.character).filter(Boolean);
  }

  getCharacterData(id) {
    return this.characters.get(id)?.data;
  }

  getRandomCharacter(excludeIds = []) {
    const available = Array.from(this.characters.keys()).filter(id => !excludeIds.includes(id));
    const randomId = available[Math.floor(Math.random() * available.length)];
    return this.getCharacter(randomId);
  }

  getRandomTeam(count, excludeIds = []) {
    const available = Array.from(this.characters.keys()).filter(id => !excludeIds.includes(id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(id => this.getCharacter(id));
  }

  assignToTeam(characterId, teamId) {
    this.teamAssignments.set(characterId, teamId);
  }

  getTeam(teamId) {
    const chars = [];
    this.teamAssignments.forEach((t, charId) => {
      if (t === teamId) chars.push(this.getCharacter(charId));
    });
    return chars;
  }

  clearTeams() {
    this.teamAssignments.clear();
  }

  async createPlayerInstance(id, team, overrides = {}) {
    const baseChar = this.getCharacter(id);
    if (!baseChar) return null;
    
    const clone = new Character({
      ...baseChar,
      ...overrides,
      id: `${id}_${team}_${Date.now()}`,
    });
    
    clone.mesh = baseChar.mesh?.clone(true);
    clone.skeleton = baseChar.skeleton;
    clone.mixer = new THREE.AnimationMixer(clone.mesh);
    clone.animations = new Map(baseChar.animations);
    clone.bones = { ...baseChar.bones };
    clone.boneMap = { ...baseChar.boneMap };
    clone.root = new THREE.Group();
    clone.root.add(clone.mesh);
    
    if (team) {
      this.assignToTeam(clone.id, team);
    }
    
    return clone;
  }

  dispose() {
    this.characters.forEach(({ character }) => character.dispose());
    this.characters.clear();
    this.loadedCharacters.clear();
  }
}

export function createCharacterFromData(data, engine) {
  const character = new Character(data);
  return character;
}