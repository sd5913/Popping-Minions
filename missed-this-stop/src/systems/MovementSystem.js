
export class MovementSystem {
  constructor() {
    this.lane = 1;
    this.visualLane = 1;

    this.jumpHeight = 0;
    this.isJumping = false;
    this.jumpTime = 0;
    this.jumpDuration = 0.8;

    this.forwardSpeed = 0.5;
    this.stumbleTime = 0;
    this.stumbleDuration = 1.1;

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
    this.jumpTime = 0;
  }

  stumble() {
    this.stumbleTime = this.stumbleDuration;

    // 失误后进入相邻支路，不重置游戏
    if (this.lane === 1) {
      this.lane = Math.random() > 0.5 ? 0 : 2;
    } else {
      this.lane = 1;
    }
  }

  update(deltaTime, speed) {
    this.forwardSpeed = speed;

    const smoothing = Math.min(1, deltaTime * 9);

    this.visualLane +=
      (this.lane - this.visualLane) * smoothing;

    this.distance += speed * deltaTime;

    if (this.isJumping) {
      this.jumpTime += deltaTime;

      const progress = Math.min(
        this.jumpTime / this.jumpDuration,
        1
      );

      this.jumpHeight =
        Math.sin(progress * Math.PI) * 1;

      if (progress >= 1) {
        this.isJumping = false;
        this.jumpHeight = 0;
      }
    }

    if (this.stumbleTime > 0) {
      this.stumbleTime -= deltaTime;

      if (this.stumbleTime < 0) {
        this.stumbleTime = 0;
      }
    }
  }

  get isStumbling() {
    return this.stumbleTime > 0;
  }
}
