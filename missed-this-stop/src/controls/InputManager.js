export class InputManager {
  constructor() {
    this.listeners = new Set();
    this.enabled = true;
    this.surface = null;
    this.pointerStart = null;

    this.keyMap = {
      ArrowLeft: "LEFT",
      KeyA: "LEFT",
      ArrowRight: "RIGHT",
      KeyD: "RIGHT",
      ArrowUp: "JUMP",
      Space: "JUMP",
      KeyW: "FORWARD",
      Enter: "INTERACT"
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);

    window.addEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown(event) {
    if (!this.enabled) return;
    const action = this.keyMap[event.code];
    if (!action) return;
    event.preventDefault();
    if (event.repeat) return;
    this.emit(action, { source: "keyboard" });
  }

  bindSurface(surface) {
    if (this.surface === surface) return;
    this.unbindSurface();
    this.surface = surface;
    this.surface.addEventListener("pointerdown", this.handlePointerDown);
    this.surface.addEventListener("pointerup", this.handlePointerUp);
    this.surface.addEventListener("pointercancel", this.handlePointerCancel);
  }

  unbindSurface() {
    if (!this.surface) return;
    this.surface.removeEventListener("pointerdown", this.handlePointerDown);
    this.surface.removeEventListener("pointerup", this.handlePointerUp);
    this.surface.removeEventListener("pointercancel", this.handlePointerCancel);
    this.surface = null;
    this.pointerStart = null;
  }

  handlePointerDown(event) {
    if (!this.enabled) return;
    this.pointerStart = { x: event.clientX, y: event.clientY };
    this.surface?.setPointerCapture?.(event.pointerId);
  }

  handlePointerUp(event) {
    if (!this.enabled || !this.pointerStart) return;
    const deltaX = event.clientX - this.pointerStart.x;
    const deltaY = event.clientY - this.pointerStart.y;
    this.pointerStart = null;

    if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > Math.abs(deltaY)) {
      this.emit(deltaX < 0 ? "LEFT" : "RIGHT", { source: "pointer" });
    } else if (deltaY < -24) {
      this.emit("JUMP", { source: "pointer" });
    }
  }

  handlePointerCancel() {
    this.pointerStart = null;
  }

  emit(action, payload = {}) {
    if (!this.enabled) return;
    this.listeners.forEach((callback) => callback(action, payload));
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
    this.unbindSurface();
    this.listeners.clear();
  }
}
