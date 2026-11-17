export const LANE_SPACING = 3.2;

const ROAD_WIDTH = 11;
const ROAD_SEGMENT = 5;
const DRAW_DISTANCE = 110;

const OBSTACLE_SHAPES = {
  luggage: { width: 1.7, height: 1.55, depth: 1.4 },
  barrier: { width: 2.45, height: 1.15, depth: 1.15 },
  pencil: { width: 0.8, height: 3.4, depth: 0.8 },
  gate: { width: 2.65, height: 2.7, depth: 1.05 },
  block: { width: 2.25, height: 2.15, depth: 1.8 },
  crate: { width: 2.1, height: 1.85, depth: 1.65 },
  cart: { width: 2.55, height: 1.65, depth: 2.1 },
  rock: { width: 2.25, height: 1.25, depth: 1.8 },
  door: { width: 2.4, height: 3.1, depth: 0.8 },
  "falling-block": { width: 2.3, height: 2.55, depth: 1.75 },
  driftwood: { width: 2.75, height: 0.75, depth: 1.35 },
  island: { width: 3.2, height: 0.6, depth: 2.4 },
  "broken-road": { width: 3.15, height: 0.05, depth: 4.2 }
};

function mix(hex, amount) {
  const value = hex.replace("#", "");
  const full = value.length === 3
    ? value.split("").map((part) => part + part).join("")
    : value;
  const number = Number.parseInt(full, 16);
  const target = amount < 0 ? 0 : 255;
  const strength = Math.abs(amount);
  const red = number >> 16;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  const channel = (source) => Math.round(source + (target - source) * strength);

  return `rgb(${channel(red)}, ${channel(green)}, ${channel(blue)})`;
}

function hash(index) {
  const value = Math.sin(index * 91.137 + 17.31) * 43758.5453;
  return value - Math.floor(value);
}

export class FirstPersonRenderer {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.horizon = 0;
    this.focal = 0;
    this.cameraX = 0;
    this.cameraHeight = 1.62;
    this.viewShift = 0;
  }

  configure(width, height, movement, time) {
    this.width = width;
    this.height = height;
    this.horizon = height * 0.34;
    this.focal = Math.min(width * 0.88, height * 1.12);
    this.cameraX = (movement.visualLane - 1) * LANE_SPACING;

    const runningBob = movement.isJumping
      ? 0
      : Math.sin(movement.distance * 1.45) * 0.045;
    const landingDip = movement.landingImpact * 0.18;

    this.cameraHeight =
      1.62 + movement.jumpHeight + runningBob - landingDip;
    this.viewShift = movement.laneLean * width * 0.022;

    if (movement.isStumbling) {
      this.viewShift += Math.sin(time * 52) * 7 * movement.stumbleRatio;
      this.horizon += Math.sin(time * 39) * 4 * movement.stumbleRatio;
    }
  }

  point(x, y, z) {
    const depth = Math.max(0.38, z);
    const scale = this.focal / depth;

    return [
      this.width / 2 + this.viewShift + (x - this.cameraX) * scale,
      this.horizon + (this.cameraHeight - y) * scale
    ];
  }

  polygon(ctx, points, fill, stroke = null, lineWidth = 1) {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  drawBackground(ctx, chapter, movement) {
    const { colors } = chapter;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, colors.skyTop);
    gradient.addColorStop(0.62, colors.skyBottom);
    gradient.addColorStop(1, mix(colors.road, -0.32));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const glowX = this.width * 0.64 - this.cameraX * 8;
    const glowY = this.horizon * 0.55;
    const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, this.width * 0.24);
    glow.addColorStop(0, `${colors.accent}aa`);
    glow.addColorStop(1, `${colors.accent}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.width, this.horizon * 1.4);

    const skylineShift = this.cameraX * 10;
    ctx.fillStyle = mix(colors.building, -0.18);
    ctx.globalAlpha = 0.48;

    for (let index = -2; index < 18; index += 1) {
      const buildingWidth = this.width / 13;
      const x = index * buildingWidth - skylineShift % buildingWidth;
      const buildingHeight = this.height * (0.06 + hash(index + 40) * 0.15);
      ctx.fillRect(x, this.horizon - buildingHeight, buildingWidth + 1, buildingHeight);
    }

    ctx.globalAlpha = 1;

    const haze = ctx.createLinearGradient(0, this.horizon - 35, 0, this.horizon + 95);
    haze.addColorStop(0, "rgba(255,255,255,0)");
    haze.addColorStop(0.5, "rgba(255,244,224,0.12)");
    haze.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, this.horizon - 35, this.width, 130);
  }

  drawRoad(ctx, chapter, movement) {
    const colors = chapter.colors;
    const roadOffset = movement.distance % ROAD_SEGMENT;
    const firstSegment = Math.floor(movement.distance / ROAD_SEGMENT);
    const half = ROAD_WIDTH / 2;
    const segments = [];

    for (let local = -roadOffset; local < DRAW_DISTANCE; local += ROAD_SEGMENT) {
      const near = Math.max(0.42, local);
      const far = local + ROAD_SEGMENT;
      if (far <= 0.42) continue;
      segments.push({ near, far, index: firstSegment + Math.round((local + roadOffset) / ROAD_SEGMENT) });
    }

    for (let cursor = segments.length - 1; cursor >= 0; cursor -= 1) {
      const { near, far, index } = segments[cursor];
      const roadFill = index % 2 === 0
        ? colors.road
        : mix(colors.road, -0.075);

      this.polygon(ctx, [
        this.point(-half, 0, near),
        this.point(half, 0, near),
        this.point(half, 0, far),
        this.point(-half, 0, far)
      ], roadFill);

      for (const side of [-1, 1]) {
        const inside = side * half;
        const outside = side * (half + 0.22);
        this.polygon(ctx, [
          this.point(inside, 0.015, near),
          this.point(outside, 0.015, near),
          this.point(outside, 0.015, far),
          this.point(inside, 0.015, far)
        ], colors.roadLine);
      }

      if (index % 2 === 0) {
        for (const divider of [-ROAD_WIDTH / 6, ROAD_WIDTH / 6]) {
          this.polygon(ctx, [
            this.point(divider - 0.035, 0.025, near),
            this.point(divider + 0.035, 0.025, near),
            this.point(divider + 0.035, 0.025, far),
            this.point(divider - 0.035, 0.025, far)
          ], colors.roadLine);
        }
      }
    }
  }

  drawScenery(ctx, chapter, movement) {
    const period = 156;
    const offset = movement.distance % period;
    const items = [];

    for (let index = 0; index < 16; index += 1) {
      const z = ((index * 11.2 - offset + period) % period) + 5;
      if (z > DRAW_DISTANCE) continue;
      items.push({ index, z });
    }

    items.sort((a, b) => b.z - a.z);

    for (const item of items) {
      const side = item.index % 2 === 0 ? -1 : 1;
      const width = 0.7 + hash(item.index) * 0.9;
      const height = 2.4 + hash(item.index + 9) * 4.8;
      const x = side * (ROAD_WIDTH / 2 + 1.3 + hash(item.index + 2) * 2.2);

      this.drawBlock(ctx, {
        x,
        z: item.z,
        width,
        height,
        depth: 1.15 + hash(item.index + 1),
        front: mix(chapter.colors.building, -0.04),
        top: mix(chapter.colors.building, 0.16),
        side: mix(chapter.colors.building, -0.22),
        stroke: mix(chapter.colors.building, -0.38)
      });

      if (item.index % 3 === 0) {
        const lamp = this.point(x - side * 0.2, height + 0.35, item.z - 0.3);
        const radius = Math.max(1.5, this.focal * 0.09 / item.z);
        ctx.fillStyle = chapter.colors.accent;
        ctx.beginPath();
        ctx.arc(lamp[0], lamp[1], radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawBlock(ctx, block) {
    const near = Math.max(0.48, block.z - block.depth / 2);
    const far = block.z + block.depth / 2;
    if (far <= 0.42) return;

    const left = block.x - block.width / 2;
    const right = block.x + block.width / 2;
    const base = 0;
    const top = block.height;

    const frontBottomLeft = this.point(left, base, near);
    const frontBottomRight = this.point(right, base, near);
    const frontTopRight = this.point(right, top, near);
    const frontTopLeft = this.point(left, top, near);
    const farTopLeft = this.point(left, top, far);
    const farTopRight = this.point(right, top, far);
    const farBottomLeft = this.point(left, base, far);
    const farBottomRight = this.point(right, base, far);

    this.polygon(ctx, [
      frontTopLeft,
      frontTopRight,
      farTopRight,
      farTopLeft
    ], block.top, block.stroke);

    const showLeft = this.cameraX < block.x;
    this.polygon(ctx, showLeft
      ? [frontBottomLeft, frontTopLeft, farTopLeft, farBottomLeft]
      : [frontBottomRight, frontTopRight, farTopRight, farBottomRight],
    block.side, block.stroke);

    this.polygon(ctx, [
      frontBottomLeft,
      frontBottomRight,
      frontTopRight,
      frontTopLeft
    ], block.front, block.stroke, Math.max(1, this.focal * 0.004 / near));
  }

  drawObstacle(ctx, chapter, obstacle) {
    const shape = OBSTACLE_SHAPES[obstacle.type] || OBSTACLE_SHAPES.luggage;
    const laneX = (obstacle.lane - 1) * LANE_SPACING;

    if (obstacle.type === "broken-road") {
      const near = Math.max(0.48, obstacle.z - shape.depth / 2);
      const far = obstacle.z + shape.depth / 2;
      this.polygon(ctx, [
        this.point(laneX - shape.width / 2, 0.04, near),
        this.point(laneX + shape.width / 2, 0.04, near),
        this.point(laneX + shape.width * 0.42, 0.04, far),
        this.point(laneX - shape.width * 0.48, 0.04, far)
      ], "#0c1016", mix(chapter.colors.accent, -0.45), 2);
      return;
    }

    const shadowNear = Math.max(0.48, obstacle.z - shape.depth * 0.7);
    const shadowFar = obstacle.z + shape.depth * 0.75;
    this.polygon(ctx, [
      this.point(laneX - shape.width * 0.7, 0.02, shadowNear),
      this.point(laneX + shape.width * 0.72, 0.02, shadowNear),
      this.point(laneX + shape.width * 0.62, 0.02, shadowFar),
      this.point(laneX - shape.width * 0.58, 0.02, shadowFar)
    ], "rgba(0,0,0,0.28)");

    this.drawBlock(ctx, {
      x: laneX,
      z: obstacle.z,
      ...shape,
      front: chapter.colors.accent,
      top: mix(chapter.colors.accent, 0.24),
      side: mix(chapter.colors.accent, -0.25),
      stroke: mix(chapter.colors.accent, -0.52)
    });

    const near = Math.max(0.48, obstacle.z - shape.depth / 2);
    const left = laneX - shape.width / 2;
    const right = laneX + shape.width / 2;

    if (["luggage", "barrier", "crate", "cart", "block"].includes(obstacle.type)) {
      ctx.strokeStyle = mix(chapter.colors.accent, -0.48);
      ctx.lineWidth = Math.max(1, this.focal * 0.003 / near);
      for (let row = 1; row < 4; row += 1) {
        const y = shape.height * row / 4;
        const a = this.point(left, y, near);
        const b = this.point(right, y, near);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
    }
  }

  drawObstacles(ctx, chapter, obstacles) {
    const visible = obstacles
      .filter((obstacle) => !obstacle.hit && obstacle.z > 0.35 && obstacle.z < DRAW_DISTANCE)
      .sort((a, b) => b.z - a.z);

    visible.forEach((obstacle) => this.drawObstacle(ctx, chapter, obstacle));
  }

  drawMotionFeedback(ctx, chapter, movement) {
    const vignette = ctx.createRadialGradient(
      this.width / 2,
      this.height * 0.48,
      this.height * 0.16,
      this.width / 2,
      this.height * 0.48,
      Math.max(this.width, this.height) * 0.72
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(4,7,12,0.34)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);

    if (movement.jumpHeight > 0.05) {
      const strength = Math.min(0.18, movement.jumpHeight * 0.1);
      ctx.fillStyle = `rgba(255,255,255,${strength})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    if (movement.landingImpact > 0.02) {
      ctx.strokeStyle = `${chapter.colors.roadLine}99`;
      ctx.lineWidth = 2 + movement.landingImpact * 4;
      ctx.beginPath();
      ctx.ellipse(
        this.width / 2,
        this.height * 0.88,
        this.width * (0.08 + movement.landingImpact * 0.12),
        this.height * (0.018 + movement.landingImpact * 0.025),
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  render(ctx, width, height, frame) {
    const { chapter, movement, obstacles, time, state } = frame;
    this.configure(width, height, movement, time);

    ctx.save();
    this.drawBackground(ctx, chapter, movement);
    this.drawRoad(ctx, chapter, movement);
    this.drawScenery(ctx, chapter, movement);
    this.drawObstacles(ctx, chapter, obstacles);
    this.drawMotionFeedback(ctx, chapter, movement);

    if (state === "ending" || state === "finished") {
      ctx.fillStyle = "rgba(12,20,29,0.32)";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }
}
