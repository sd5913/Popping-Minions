
export class InputManager {
  constructor() {
    this.listeners = new Set();
    this.enabled = true;

    this.keyMap = {
      ArrowLeft: "LEFT",
      KeyA: "LEFT",
      ArrowRight: "RIGHT",
      KeyD: "RIGHT",
      ArrowUp: "FORWARD",
      KeyW: "FORWARD",
      Space: "JUMP",
      Enter: "INTERACT"
    };

    this.handleKeyDown = (event) => {
      if (!this.enabled) return;

      const action = this.keyMap[event.code];
      if (!action) return;

      event.preventDefault();

      if (event.repeat) return;

      this.emit(action);
      console.log("[INPUT]", action);
    };

    window.addEventListener("keydown", this.handleKeyDown);
  }

  emit(action, payload = {}) {
    if (!this.enabled) return;

    this.listeners.forEach(callback => {
      callback(action, payload);
    });
  }

  onAction(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.listeners.clear();
  }
}
