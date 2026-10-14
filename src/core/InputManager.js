export class InputManager {
  constructor() {
    this.keys = new Map();
    this.keyMap = {
      'KeyW': 'moveForward',
      'KeyS': 'moveBackward',
      'KeyA': 'moveLeft',
      'KeyD': 'moveRight',
      'ArrowUp': 'moveForward',
      'ArrowDown': 'moveBackward',
      'ArrowLeft': 'moveLeft',
      'ArrowRight': 'moveRight',
      'Space': 'jump',
      'ShiftLeft': 'sprint',
      'ShiftRight': 'sprint',
      'KeyJ': 'crossover',
      'KeyQ': 'pass',
      'KeyT': 'alleyOop',
      'KeyE': 'steal',
      'KeyR': 'resetCamera',
      'KeyM': 'mute',
      'KeyP': 'pause',
      'Escape': 'pause',
      'Tab': 'switchPlayer',
      'Digit1': 'taunt1',
      'Digit2': 'taunt2',
      'Digit3': 'taunt3',
      'Digit4': 'celebrate',
    };
    
    this.actions = new Map();
    this.previousKeys = new Map();
    this.gamepadIndex = 0;
    this.gamepad = null;
    
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => this.clearAllKeys());
    
    window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
    window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));
  }

  onKeyDown(e) {
    const action = this.keyMap[e.code];
    if (action) {
      this.keys.set(action, true);
      this.keys.set(e.code, true);
      e.preventDefault();
    }
    this.keys.set(e.code, true);
  }

  onKeyUp(e) {
    const action = this.keyMap[e.code];
    if (action) {
      this.keys.set(action, false);
      this.keys.set(e.code, false);
    }
    this.keys.set(e.code, false);
  }

  onGamepadConnected(e) {
    this.gamepad = e.gamepad;
    this.gamepadIndex = e.gamepad.index;
    console.log('Gamepad connected:', e.gamepad.id);
  }

  onGamepadDisconnected(e) {
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepad = null;
    }
  }

  update() {
    this.previousKeys = new Map(this.keys);
    
    if (this.gamepad) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) this.updateGamepad(gp);
    }
  }

  updateGamepad(gp) {
    const deadzone = 0.15;
    
    const leftX = gp.axes[0];
    const leftY = gp.axes[1];
    
    if (Math.abs(leftX) > deadzone || Math.abs(leftY) > deadzone) {
      this.keys.set('moveLeft', leftX < -deadzone);
      this.keys.set('moveRight', leftX > deadzone);
      this.keys.set('moveForward', leftY < -deadzone);
      this.keys.set('moveBackward', leftY > deadzone);
    } else {
      this.keys.set('moveLeft', false);
      this.keys.set('moveRight', false);
      this.keys.set('moveForward', false);
      this.keys.set('moveBackward', false);
    }
    
    const buttons = gp.buttons;
    this.keys.set('jump', buttons[0]?.pressed || false);
    this.keys.set('sprint', buttons[5]?.pressed || false);
    this.keys.set('crossover', buttons[1]?.pressed || false);
    this.keys.set('pass', buttons[2]?.pressed || false);
    this.keys.set('steal', buttons[4]?.pressed || false);
    this.keys.set('alleyOop', buttons[3]?.pressed || false);
    
    if (buttons[9]?.pressed) this.keys.set('pause', true);
  }

  isPressed(action) {
    return this.keys.get(action) === true;
  }

  wasPressed(action) {
    return this.keys.get(action) === true && this.previousKeys.get(action) !== true;
  }

  wasReleased(action) {
    return this.keys.get(action) !== true && this.previousKeys.get(action) === true;
  }

  getAxis2D(horizontal, vertical) {
    let x = 0, y = 0;
    if (this.isPressed(horizontal + 'Right') || this.isPressed(horizontal + 'Left')) {
      x = this.isPressed(horizontal + 'Right') ? 1 : -1;
    }
    if (this.isPressed(vertical + 'Forward') || this.isPressed(vertical + 'Backward')) {
      y = this.isPressed(vertical + 'Backward') ? 1 : -1;
    }
    return { x, y };
  }

  clearAllKeys() {
    this.keys.forEach((_, key) => this.keys.set(key, false));
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clearAllKeys);
  }
}