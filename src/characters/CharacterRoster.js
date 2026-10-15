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
    celebration: 'hype_dance', taunt: '“You can’t guard all this!”', signatureMove: 'Glitch crossover combo', num: 10,
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
    celebration: 'confident_nod', taunt: '“Good shot selection.”', signatureMove: 'Logo pull-up', num: 1,
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
    celebration: 'chalk_toss', taunt: '“Poster waiting to happen.”', signatureMove: 'Free-throw-line windmill', num: 2,
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
    celebration: 'stealth_vanish', taunt: '“Didn’t even see me.”', signatureMove: 'Shamgod into a strip', num: 4,
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
    celebration: 'backflip', taunt: '“SIUUU!”', signatureMove: 'Backflip tomahawk', num: 17,
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
    celebration: 'shoulder_check', taunt: '“Move, I’m hungry.”', signatureMove: 'Double-clutch through contact', num: 20,
  },
];

export const MORE_STREAMERS = [
  {
    id: 'agent_00',
    name: 'AGENT 0.',
    aka: 'The Strategist • High IQ',
    category: 'streamer',
    height: 1.91,
    build: 'athletic',
    skinTone: 0x6b4423,
    hairStyle: 'waves_360',
    hairColor: 0x0d0804,
    eyeColor: 0x2a1a0a,
    attributes: { speed: 7.6, acceleration: 7.8, dunk: 74, shoot: 84, handles: 86, defense: 88, stamina: 86, vertical: 74, strength: 78 },
    signatureDunk: 'reverse_two_hand',
    introAnimation: 'intro_clipboard',
    playstyle: 'cerebral_two_way',
    bio: 'Reads the floor two plays ahead. Locks up, distributes, takes what the defense gives.',
    tags: ['iq', 'passing', 'defense', 'clutch'],
    celebration: 'clipboard_check',
    taunt: '“I read that like a script.”',
    signatureMove: 'No-look dime off the pick',
    num: 0,
  },
  {
    id: 'flight_reacts',
    name: 'FLIGHT R.',
    aka: 'The Wildcard • Comedy Hoops',
    category: 'streamer',
    height: 1.88,
    build: 'lean_athletic',
    skinTone: 0x8d5524,
    hairStyle: 'curly_top',
    hairColor: 0x140a04,
    eyeColor: 0x2a1a0a,
    attributes: { speed: 8.0, acceleration: 8.2, dunk: 76, shoot: 68, handles: 90, defense: 66, stamina: 84, vertical: 80, strength: 70 },
    signatureDunk: 'off_glass_self_oop',
    introAnimation: 'intro_look_away',
    playstyle: 'chaos_comedy',
    bio: 'Unpredictable trick moves, look-away passes, and celebrations that break the internet win or lose.',
    tags: ['unpredictable', 'tricks', 'comedy', 'streaky'],
    celebration: 'look_away_dance',
    taunt: '“LIGHT SKINNED AND I’M DELIRIOUS!”',
    signatureMove: 'Spin-cycle into a prayer three',
    num: 24,
  },
  {
    id: 'plaqueboy_max',
    name: 'PLAQUEBOY M.',
    aka: 'The Producer • Smooth Operator',
    category: 'streamer',
    height: 1.83,
    build: 'lean_athletic',
    skinTone: 0xc68642,
    hairStyle: 'dreads_low',
    hairColor: 0x100804,
    eyeColor: 0x3a2a1a,
    attributes: { speed: 8.2, acceleration: 8.4, dunk: 72, shoot: 86, handles: 88, defense: 74, stamina: 82, vertical: 76, strength: 68 },
    signatureDunk: 'finger_roll_acrobatic',
    introAnimation: 'intro_headphone_nod',
    playstyle: 'rhythm_shooter',
    bio: 'Plays on beat. Smooth pull-ups, slick handles, and a jumper with perfect tempo.',
    tags: ['pullup', 'rhythm', 'handles', 'smooth'],
    celebration: 'headphone_mix',
    taunt: '“That one’s going on the tape.”',
    signatureMove: 'Hezi-pull from the elbow',
    num: 5,
  },
];

export const RAPPER_LEGENDS = [
  {
    id: 'durk_v',
    name: 'DURK V.',
    aka: 'The Voice • Calm Competitor',
    category: 'rapper',
    height: 1.80,
    build: 'lean_athletic',
    skinTone: 0x5a3a22,
    hairStyle: 'dreads_low',
    hairColor: 0x0d0804,
    eyeColor: 0x1a0a05,
    attributes: { speed: 7.8, acceleration: 8.0, dunk: 74, shoot: 90, handles: 84, defense: 78, stamina: 86, vertical: 76, strength: 74 },
    signatureDunk: 'baseline_reverse',
    introAnimation: 'intro_calm_stare',
    playstyle: 'precise_shooter',
    bio: 'Calm, competitive, precise. Never rushed — stylish midrange and cold-blooded free throws.',
    tags: ['midrange', 'clutch', 'composed', 'stylish'],
    celebration: 'voice_point',
    taunt: '“Too calm for all that.”',
    signatureMove: 'Step-back middy',
    num: 722,
  },
  {
    id: 'keef_s',
    name: 'KEEF S.',
    aka: 'Glo Gang • Intimidator',
    category: 'rapper',
    height: 1.83,
    build: 'power_athletic',
    skinTone: 0x4a3018,
    hairStyle: 'dreads_high_top',
    hairColor: 0x0d0804,
    eyeColor: 0x1a0a05,
    attributes: { speed: 7.2, acceleration: 7.4, dunk: 92, shoot: 70, handles: 74, defense: 84, stamina: 84, vertical: 88, strength: 94 },
    signatureDunk: 'two_hand_power_slam',
    introAnimation: 'intro_glo_stare',
    playstyle: 'physical_finisher',
    bio: 'Powerful finishing and physical play. An intimidating presence who dunks through contact.',
    tags: ['power', 'contact', 'intimidation', 'posterizer'],
    celebration: 'glo_hands',
    taunt: '“Bang bang.”',
    signatureMove: 'Shoulder-clear tomahawk',
    num: 300,
  },
  {
    id: 'baby_d',
    name: 'BABY D.',
    aka: 'ATL Hitmaker • Smooth',
    category: 'rapper',
    height: 1.73,
    build: 'compact_athletic',
    skinTone: 0x6b4423,
    hairStyle: 'dreads_low',
    hairColor: 0x0d0804,
    eyeColor: 0x2a1a0a,
    attributes: { speed: 8.8, acceleration: 9.0, dunk: 78, shoot: 82, handles: 92, defense: 72, stamina: 88, vertical: 84, strength: 70 },
    signatureDunk: 'quick_first_step_slam',
    introAnimation: 'intro_whistle_ice',
    playstyle: 'crafty_driver',
    bio: 'Small, quick, and crafty. Elite first step and pull-up game out of the pick-and-roll.',
    tags: ['quickness', 'pullup', 'floaters', 'handles'],
    celebration: 'whistle_ice',
    taunt: '“Too little for all that reach.”',
    signatureMove: 'Snake dribble pull-up',
    num: 4,
  },
  {
    id: 'yb_n',
    name: 'YB N.',
    aka: 'Lil Top • Relentless Motor',
    category: 'rapper',
    height: 1.75,
    build: 'compact_power',
    skinTone: 0x5a3a22,
    hairStyle: 'dreads_low',
    hairColor: 0x0d0804,
    eyeColor: 0x1a0a05,
    attributes: { speed: 8.6, acceleration: 8.8, dunk: 84, shoot: 76, handles: 82, defense: 80, stamina: 96, vertical: 88, strength: 82 },
    signatureDunk: 'contact_and_one_slam',
    introAnimation: 'intro_slashed_throat',
    playstyle: 'relentless_driver',
    bio: 'Nonstop motor. Attacks the rim every possession and finishes through anything.',
    tags: ['motor', 'contact', 'transition', 'relentless'],
    celebration: 'slime_point',
    taunt: '“Run it back.”',
    signatureMove: 'Full-court downhill drive',
    num: 38,
  },
  {
    id: 'carti_v',
    name: 'CARTI V.',
    aka: 'Vamp • Rage Energy',
    category: 'rapper',
    height: 1.85,
    build: 'wiry_athletic',
    skinTone: 0x4a3018,
    hairStyle: 'braids_long',
    hairColor: 0x0d0804,
    eyeColor: 0x1a1a2a,
    attributes: { speed: 9.0, acceleration: 9.4, dunk: 88, shoot: 72, handles: 90, defense: 68, stamina: 90, vertical: 92, strength: 66 },
    signatureDunk: 'windmill_360',
    introAnimation: 'intro_vamp_hands',
    playstyle: 'chaos_athlete',
    bio: 'Chaotic bounce and rage energy. Acrobatic finishes from impossible angles.',
    tags: ['bounce', 'chaos', 'acrobat', 'energy'],
    celebration: 'vamp_crouch',
    taunt: '“Schyeah!”',
    signatureMove: 'Baseline 360',
    num: 666,
  },
  {
    id: 'trav_s',
    name: 'TRAV S.',
    aka: 'Astro • Showman',
    category: 'rapper',
    height: 1.88,
    build: 'athletic',
    skinTone: 0x6b4423,
    hairStyle: 'braids_long',
    hairColor: 0x0d0804,
    eyeColor: 0x2a1a0a,
    attributes: { speed: 8.0, acceleration: 8.2, dunk: 90, shoot: 84, handles: 84, defense: 74, stamina: 86, vertical: 90, strength: 76 },
    signatureDunk: 'free_throw_line_windmill',
    introAnimation: 'intro_astro_bounce',
    playstyle: 'showtime_dunker',
    bio: 'Arena-sized showmanship on blacktop. Deep threes then a free-throw-line statement.',
    tags: ['showtime', 'deep_range', 'bounce', 'spectacle'],
    celebration: 'astro_bounce',
    taunt: '“It’s lit!”',
    signatureMove: 'Logo three to windmill',
    num: 1,
  },
  {
    id: 'savage_2',
    name: 'SAVAGE 2.',
    aka: 'Slaughter King • Stopper',
    category: 'rapper',
    height: 1.93,
    build: 'power_athletic',
    skinTone: 0x4a3018,
    hairStyle: 'fade_design',
    hairColor: 0x080604,
    eyeColor: 0x1a0a05,
    attributes: { speed: 7.0, acceleration: 7.2, dunk: 82, shoot: 74, handles: 72, defense: 96, stamina: 88, vertical: 78, strength: 94 },
    signatureDunk: 'putback_slam',
    introAnimation: 'intro_knife_tap',
    playstyle: 'defensive_enforcer',
    bio: 'Locks the cage down. Physical POA defense, brutal box-outs, and putback slams.',
    tags: ['lockdown', 'rebounding', 'physical', 'putbacks'],
    celebration: 'zone_six',
    taunt: '“No easy buckets.”',
    signatureMove: 'Chase-down rejection',
    num: 21,
  },
  {
    id: 'future_h',
    name: 'FUTURE H.',
    aka: 'Pluto • Veteran Playmaker',
    category: 'rapper',
    height: 1.88,
    build: 'lean_athletic',
    skinTone: 0x5a3a22,
    hairStyle: 'dreads_low',
    hairColor: 0x0d0804,
    eyeColor: 0x1a0a05,
    attributes: { speed: 7.4, acceleration: 7.6, dunk: 76, shoot: 82, handles: 88, defense: 76, stamina: 84, vertical: 76, strength: 74 },
    signatureDunk: 'finger_roll_acrobatic',
    introAnimation: 'intro_pluto_hands',
    playstyle: 'crafty_veteran',
    bio: 'Veteran craft. Changes pace, manipulates help, and carves up switches.',
    tags: ['crafty', 'pace', 'floater', 'veteran'],
    celebration: 'pluto_hands',
    taunt: '“Ain’t no pressure.”',
    signatureMove: 'Pace-change snake to floater',
    num: 8,
  },
  {
    id: 'uzi_v',
    name: 'UZI V.',
    aka: 'Pink Tape • Human Pogo',
    category: 'rapper',
    height: 1.63,
    build: 'compact_explosive',
    skinTone: 0x6b4423,
    hairStyle: 'braids_long',
    hairColor: 0x3a1a5a,
    eyeColor: 0x2a1a2a,
    attributes: { speed: 9.4, acceleration: 9.6, dunk: 86, shoot: 78, handles: 94, defense: 70, stamina: 92, vertical: 96, strength: 64 },
    signatureDunk: 'between_legs_reverse',
    introAnimation: 'intro_pogo_bounce',
    playstyle: 'pogo_guard',
    bio: 'The smallest giant on concrete. Absurd bounce, fearless rim attacks, endless energy.',
    tags: ['bounce', 'fearless', 'handles', 'energy'],
    celebration: 'pogo_bounce',
    taunt: '“Too high for you!”',
    signatureMove: 'BTL into a skywalker finish',
    num: 16,
  },
  {
    id: 'kodak_b',
    name: 'KODAK B.',
    aka: 'Sniper • Project Baby',
    category: 'rapper',
    height: 1.80,
    build: 'stocky_athletic',
    skinTone: 0x4a3018,
    hairStyle: 'braids_long',
    hairColor: 0x0d0804,
    eyeColor: 0x1a0a05,
    attributes: { speed: 7.2, acceleration: 7.4, dunk: 74, shoot: 94, handles: 78, defense: 72, stamina: 80, vertical: 74, strength: 78 },
    signatureDunk: 'corner_catch_slam',
    introAnimation: 'intro_sniper_aim',
    playstyle: 'streaky_sniper',
    bio: 'Streaky and lethal. Once the first one drops, the cage becomes a shooting range.',
    tags: ['catch_shoot', 'streaky', 'range', 'tough_shots'],
    celebration: 'sniper_aim',
    taunt: '“Skrrt — that’s water.”',
    signatureMove: 'Relocate logo three',
    num: 180,
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
    celebration: 'crown_tap', taunt: '“Queen of this cage.”', signatureMove: 'Windmill 360', num: 23,
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
    celebration: 'vanish', taunt: '“Ghosted.”', signatureMove: 'Phantom pocket-steal', num: 3,
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
    celebration: 'camera_flash', taunt: '“Say cheese.”', signatureMove: 'Logo-range double-clutch', num: 11,
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
    celebration: 'ground_shake', taunt: '“Not in my paint.”', signatureMove: 'Two-hand power slam', num: 32,
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
    const all = [...STREAMER_LEGENDS, ...MORE_STREAMERS, ...RAPPER_LEGENDS, ...ORIGINAL_LEGENDS];

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
    return [...STREAMER_LEGENDS, ...MORE_STREAMERS].map(l => this.characters.get(l.id)?.character).filter(Boolean);
  }

  getStreamerData() {
    return [...STREAMER_LEGENDS, ...MORE_STREAMERS];
  }

  getRapperLegends() {
    return RAPPER_LEGENDS.map(l => this.characters.get(l.id)?.character).filter(Boolean);
  }

  getRapperData() {
    return RAPPER_LEGENDS;
  }

  getOriginalLegends() {
    return ORIGINAL_LEGENDS.map(l => this.characters.get(l.id)?.character).filter(Boolean);
  }

  getOriginalData() {
    return ORIGINAL_LEGENDS;
  }

  getAllPlayableData() {
    return [...STREAMER_LEGENDS, ...MORE_STREAMERS, ...RAPPER_LEGENDS, ...ORIGINAL_LEGENDS];
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