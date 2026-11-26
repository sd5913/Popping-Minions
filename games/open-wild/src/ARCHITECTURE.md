# Next Stop: The Open Wild — 多章节架构方案

## 目录结构

```
src/
├── main.js                     # 入口：加载章节 → 组装引擎 → 启动
├── audio.js                    # 全局音效（可被 engine 或各章节复用）
├── style.css                   # 全局样式 + 章节可覆盖的 CSS 变量
│
├── engine/                     # 通用跑酷引擎（不引用任何 chapter*.js）
│   ├── index.js                # Runner 类 + createRunner 工厂
│   ├── renderer.js             # THREE 初始化、后处理链、DreamGrade 着色器
│   ├── camera.js               # 第一人称 rig、bob/sway/抖动、过渡动画
│   ├── loop.js                 # 主循环 frame()、dt clamp、时间管理
│   ├── input.js                # 键盘 + 触控 + swipe
│   ├── effects.js              # 爆散粒子、闪光、dust
│   └── ui.js                   # HUD 刷新、字幕、对白、Toast、屏幕切换
│
└── chapters/                   # 所有章节模块
    ├── index.js                # 章节注册表（按 number 数字排序）
    ├── prologue/               # 序章（占位，负责进入第一章的过渡）
    │   └── index.js
    └── chapter1/
        ├── index.js            # 导出章节模块：data + builders + hooks
        ├── data.js             # 当前的 chapter1.js（CHAPTER, FEEDBACK, NARRATION, DIALOGUE, COPY, progressToDistance）
        └── builders.js         # buildPencilObstacle / buildStranger / gate 等第一章专属构建器
```

## 章节模块接口规范

每个章节模块必须导出一个对象：

```js
export default {
  number: "01",                 // 字符串，数字优先用于排序
  data: CHAPTER,                // 章节数据（lanes/physics/obstacles/pickups/gate/collisions 等）
  copy: COPY,                    // 文案（intro/hud/pause/recovery/finish）
  feedback: FEEDBACK,            // 碰撞反馈文案
  narration: NARRATION,          // 进度触发的旁白
  dialogue: DIALOGUE,            // NPC 对白
  
  // 以下为可选 hooks，章节自定义引擎扩展点
  scene: {
    model: "/models/chapter1.glb",      // GLB 路径（可选）
    transform: (x, y, z) => [x, z, -y], // Blender → Three 坐标变换（可选）
    beforeMount(runner, scene) {},      // GLB 加载完成后的额外场景处理
  },
  obstacles: [                           // 每个障碍类型的构建器（可选，默认用通用 box）
    { type: "pencil", build: (runner, spec) => THREE.Group },
    { type: "card",   build: (runner, spec) => THREE.Group },
  ],
  pickups: [                             // 每种拾取物的构建器（可选）
    { kind: "memory", build: (runner, spec) => THREE.Object3D },
  ],
  hooks: {
    onStart(runner) {},                 // 章节开始时
    onComplete(runner) {},              // 章节完成时
    onRecovery(runner) {},              // 三次碰撞进入恢复选择
    onSafeRoute(runner) {},             // 玩家选了安全路线
    onGate(runner) {},                  // 触发门
    onDialogueStart(runner) {},         // NPC 对白开始
    onDialogueEnd(runner) {},            // NPC 对白结束
  },
};
```

`engine/Runner` 通过 `chapter.obstacles.find(o => o.type === spec.type)` 查找构建器，找不到则回退到通用 box。

## 状态在章节间的流转

```
┌─────────────┐     runner.complete()      ┌──────────────┐     runner.begin()      ┌──────────────┐
│  Prologue   │ ──────────────────────────▶ │  Chapter 01  │ ──────────────────────▶ │  Chapter 02  │
│  (序章)     │                             │              │                          │              │
└─────────────┘                             └──────────────┘                          └──────────────┘
       │                                          │                                        │
       │                                          │  inventory: { memory, token, tape }   │
       │                                          │  collected: Set                        │
       │                                          │  seenDialogue: Set                      │
       └──────────────── persistent state ────────┴───────────────────────────────────────┘
```

持久状态（跨章节保留）：
- `inventory`（已拾取的物品数量）
- `collected`（已拾取 ID 的 Set，防重复）
- `seenDialogue`（对白看过的标记）
- `routes`（走过的路线）
- `memories`（收集到的总记忆数）

章节间重置：
- `distance`, `lane`, `playerX`, `jumpY`, `elapsed`
- `collisions`, `invulnerable`, `stumble` 等瞬态

## 序章 → 第一章衔接

序章不是跑酷玩法，而是进入第一章的过渡场景（例如：主角在考场门口醒来，远处有 answer sheet 建筑剪影）。序章模块的 `scene.model` 可以为空或序章专属 GLB，触发方式：

1. 用户点击"Start" → 加载序章 GLB → 播放开场旁白 → 倒计时或点击"Enter the avenue" → 触发 `runner.beginNextChapter()`
2. `beginNextChapter()` 调用 `engine.switchChapter(next, persistentState)`，引擎负责：
   - 淡出当前后处理
   - 清除场景障碍/NPC/拾取物
   - 加载下一章 GLB
   - 淡入新后处理着色器参数
   - 重置瞬态，合并持久状态

## 合并脚本

位于 `tools/merge-chapters.js`（Node.js，已在仓库可用），按 `src/chapters/*/index.js` 的 `number` 字段数字排序，显式写入 `[CHAPTER 01]`、`[CHAPTER 02]` 等稳定边界标记，输出到 `dist/merge/`。

## 设计原则

1. **引擎不引用章节**：`src/engine/**` 下的所有文件不得 `import` 任何 `src/chapters/**` 下的文件。引擎只依赖构造函数参数注入的 `chapter` 对象。
2. **章节不引用引擎内部**：章节模块不得直接操作 `THREE.WebGLRenderer` 或 `EffectComposer`，所有 3D 构建通过引擎暴露的 `addObstacle/addPickup/addNPC` API 完成。
3. **数据与行为分离**：`data.js` 只导出纯数据（可序列化），`builders.js` 放 Three.js 构建逻辑（必须）。
4. **向后兼容**：`npm run build` 和 36 项 Playwright 回归必须保持全绿，单章独立运行不受影响。
