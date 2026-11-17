export class MovementSystem {
  constructor() {
    this.lane = 1;
    this.visualLane = 1;
    this.previousVisualLane = 1;
    this.laneLean = 0;
    this.jumpHeight = 0;
    this.jumpVelocity = 0;
    this.isJumping = false;
    this.gravity = 15.5;
    this.jumpImpulse = 6.15;
    this.landingImpact = 0;
    this.forwardSpeed = 0;
    this.stumbleTime = 0;
    this.stumbleDuration = 0.9;
    this.distance = 0;
  }

  moveLeft() {
    this.lane = Math.max(0, this.lane - 1);
  }

  moveRight() {
    this.lane = Math.min(2, this.lane + 1);
  }

  jump() {
    if (this.isJumping || this.stumbleTime > 0) return;
    this.isJumping = true;
    this.jumpVelocity = this.jumpImpulse;
    this.landingImpact = 0;
  }

  stumble() {
    this.stumbleTime = this.stumbleDuration;

    // A mistake changes the route, but never ends or resets the run.
    if (this.lane === 1) {
      this.lane = Math.random() > 0.5 ? 0 : 2;
    } else {
      this.lane = 1;
    }
  }

  update(deltaTime, speed) {
    this.forwardSpeed = speed;
    this.previousVisualLane = this.visualLane;

    const laneSmoothing = 1 - Math.exp(-deltaTime * 10.5);
    this.visualLane += (this.lane - this.visualLane) * laneSmoothing;

    const laneVelocity = deltaTime > 0
      ? (this.visualLane - this.previousVisualLane) / deltaTime
      : 0;
    const targetLean = Math.max(-1, Math.min(1, laneVelocity * 0.12));
    const leanSmoothing = 1 - Math.exp(-deltaTime * 12);
    this.laneLean += (targetLean - this.laneLean) * leanSmoothing;

    this.distance += speed * deltaTime;

    if (this.isJumping) {
      this.jumpVelocity -= this.gravity * deltaTime;
      this.jumpHeight += this.jumpVelocity * deltaTime;

      if (this.jumpHeight <= 0) {
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.isJumping = false;
        this.landingImpact = 1;
      }
    }

    this.landingImpact = Math.max(0, this.landingImpact - deltaTime * 4.8);

    if (this.stumbleTime > 0) {
      this.stumbleTime = Math.max(0, this.stumbleTime - deltaTime);
    }
  }

  get isStumbling() {
    return this.stumbleTime > 0;
  }

  get stumbleRatio() {
    if (!this.isStumbling) return 0;
    return this.stumbleTime / this.stumbleDuration;
  }
}
