export class CollisionSystem {
  constructor() {
    this.totalMistakes = 0;
    this.recoveryTime = 0;
    this.lastCollisionTime = -10;
    this.invulnerabilityDuration = 1.15;
  }

  check(player, obstacles, currentTime) {
    if (this.recoveryTime > 0) return null;
    if (currentTime - this.lastCollisionTime < this.invulnerabilityDuration) {
      return null;
    }

    for (const obstacle of obstacles) {
      if (obstacle.hit) continue;
      if (obstacle.z < 0.65 || obstacle.z > 2.65) continue;
      if (obstacle.lane !== player.lane) continue;
      if (player.jumpHeight > 0.58 && obstacle.jumpable) continue;

      obstacle.hit = true;
      this.totalMistakes += 1;
      this.recoveryTime = 1.05;
      this.lastCollisionTime = currentTime;
      return obstacle;
    }

    return null;
  }

  update(deltaTime) {
    if (this.recoveryTime > 0) {
      this.recoveryTime = Math.max(0, this.recoveryTime - deltaTime);
    }
  }

  reset() {
    this.totalMistakes = 0;
    this.recoveryTime = 0;
    this.lastCollisionTime = -10;
  }
}
