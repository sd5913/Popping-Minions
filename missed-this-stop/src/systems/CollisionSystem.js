
export class CollisionSystem {
  constructor() {
    this.totalMistakes = 0;
    this.recoveryTime = 0;
    this.lastCollisionTime = -10;
    this.invulnerabilityDuration = 1.5;
  }

  check(player, obstacles, currentTime) {
    if (this.recoveryTime > 0) return null;

    if (
      currentTime - this.lastCollisionTime <
      this.invulnerabilityDuration
    ) {
      return null;
    }

    for (const obstacle of obstacles) {
      if (obstacle.hit) continue;

      if (obstacle.z < 0.07 || obstacle.z > 0.15) {
        continue;
      }

      if (obstacle.lane !== player.lane) {
        continue;
      }

      if (player.isJumping && obstacle.jumpable) {
        continue;
      }

      obstacle.hit = true;

      this.totalMistakes++;
      this.recoveryTime = 1.1;
      this.lastCollisionTime = currentTime;

      return obstacle;
    }

    return null;
  }

  update(deltaTime) {
    if (this.recoveryTime > 0) {
      this.recoveryTime -= deltaTime;
      this.recoveryTime = Math.max(0, this.recoveryTime);
    }
  }

  reset() {
    this.totalMistakes = 0;
    this.recoveryTime = 0;
    this.lastCollisionTime = -10;
  }
}
