// Chapter 03 signature mechanics, driven through generic Runner lifecycle hooks.
// The shared engine still owns movement, collisions, pickups and UI screens.

import builders from "./builders.js";

export function createMechanics(CHAPTER, progressToDistance) {
  let environment = null;
  const state = {
    holding: false,
    falling: false,
    fallTimer: 0,
    fallDistance: 0,
    falls: 0,
    gapResolved: false,
    repairActive: false,
    repairProgress: 0,
    repaired: false,
    prompt: null,
    promptText: null,
    promptFill: null,
    hidePromptAt: 0,
    lastPercent: -1,
  };

  const repairDistance = progressToDistance(CHAPTER.signature.repair.start);

  function setPrompt(visible, text = "") {
    if (!state.prompt) return;
    state.prompt.hidden = !visible;
    if (state.promptText && text) state.promptText.textContent = text;
  }

  function resetBridge() {
    const bridge = environment?.bridge;
    if (!bridge) return;
    bridge.active = false;
    bridge.progress = 0;
    bridge.light.intensity = 0;
    bridge.planks.forEach((plank) => {
      plank.visible = false;
      plank.position.y = -4.5;
      plank.rotation.z = 0;
    });
  }

  function repairBridge(runner, announce = true) {
    state.repaired = true;
    state.repairActive = false;
    state.repairProgress = 1;
    state.holding = false;
    state.hidePromptAt = performance.now() + 1100;
    if (environment?.bridge) {
      environment.bridge.active = true;
      environment.bridge.light.intensity = 12;
    }
    setPrompt(true, "THE BRIDGE HOLDS");
    state.prompt?.classList.add("is-complete");
    if (state.promptFill) state.promptFill.style.transform = "scaleX(1)";
    if (announce) {
      runner._showToast("The bridge holds", "You repaired what was in front of you. Keep moving.", "#d5a45e");
      runner._showSubtitle("The last span carries you into the light.", 2600);
      runner._flash();
    }
  }

  return {
    attach(runner, sceneEnvironment) {
      environment = sceneEnvironment;
      resetBridge();
      if (state.prompt) return;
      const prompt = document.createElement("button");
      prompt.id = "chapter-interaction";
      prompt.className = "chapter-interaction";
      prompt.type = "button";
      prompt.hidden = true;
      prompt.innerHTML = '<span class="interaction-label">HOLD E — REPAIR THE LAST SPAN</span><i class="interaction-track"><b></b></i>';
      prompt.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (state.repairActive) state.holding = true;
        prompt.setPointerCapture?.(event.pointerId);
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => prompt.addEventListener(name, () => { state.holding = false; }));
      document.body.appendChild(prompt);
      state.prompt = prompt;
      state.promptText = prompt.querySelector(".interaction-label");
      state.promptFill = prompt.querySelector(".interaction-track b");
    },

    onStart(runner) {
      state.holding = false;
      state.falling = false;
      state.fallTimer = 0;
      state.falls = 0;
      state.gapResolved = false;
      state.repairActive = false;
      state.repairProgress = 0;
      state.repaired = false;
      state.hidePromptAt = 0;
      state.lastPercent = -1;
      state.prompt?.classList.remove("is-complete");
      if (state.promptFill) state.promptFill.style.transform = "scaleX(0)";
      setPrompt(false);
      resetBridge();
    },

    onKeyDown(runner, event) {
      if (event.code !== "KeyE" || !state.repairActive) return false;
      event.preventDefault();
      state.holding = true;
      return true;
    },

    onKeyUp(runner, event) {
      if (event.code === "KeyE") state.holding = false;
      return false;
    },

    onTeleport(runner, target) {
      if (target > CHAPTER.signature.firstGap.end) state.gapResolved = true;
      // QA/debug jumps cross the interaction trigger without simulating a hold.
      // Normal play never calls this hook; the bridge still requires a real hold.
      if (target > CHAPTER.signature.repair.start + 1 && !state.repaired) repairBridge(runner, false);
    },

    onUpdate(runner, dt) {
      builders.updateBridge(environment?.bridge, dt);

      if (state.hidePromptAt && performance.now() >= state.hidePromptAt) {
        state.hidePromptAt = 0;
        setPrompt(false);
        state.prompt?.classList.remove("is-complete");
      }
      if (runner.game.state !== "running" || runner.game.dialogueActive) return;

      const p = (runner.game.distance / CHAPTER.length) * 100;
      const { firstGap, repair } = CHAPTER.signature;

      if (state.falling) {
        state.fallTimer += dt;
        runner.game.distance = state.fallDistance;
        runner.game.prevDistance = state.fallDistance;
        runner.game.lastSpeed = 0;
        runner.camera.position.y -= Math.min(3.8, state.fallTimer * 5.5);
        if (state.fallTimer >= 0.85) {
          state.falling = false;
          state.gapResolved = true;
          state.falls += 1;
          runner.setLane(1);
          runner.game.distance = progressToDistance(firstGap.end + 0.8);
          runner.game.prevDistance = runner.game.distance;
          runner.game.invulnerable = Math.max(runner.game.invulnerable, 1);
          runner._showToast("The lower road carries you forward", "You fell. Another way appeared below.", "#c88755");
          runner._showSubtitle("You do not need to climb back to where you were.", 2800);
          runner._flash();
        }
        return;
      }

      if (!state.gapResolved && p >= firstGap.start && p < firstGap.end && runner.game.jumpY < 0.25) {
        state.falling = true;
        state.fallTimer = 0;
        state.fallDistance = runner.game.distance;
        runner.game.jumpY = 0;
        runner.game.jumpV = 0;
        runner._showSubtitle("The road breaks. Another way appears below.", 1800);
        return;
      }
      if (p >= firstGap.end) state.gapResolved = true;

      if (!state.repaired && p >= repair.start) {
        if (!state.repairActive) {
          state.repairActive = true;
          state.holding = false;
          state.lastPercent = -1;
          setPrompt(true, "HOLD E — REPAIR THE LAST SPAN");
          runner._showSubtitle("The final span is broken. Hold E to repair it.", 2600);
        }
        runner.game.distance = repairDistance;
        runner.game.prevDistance = repairDistance;
        runner.game.lastSpeed = 0;
        runner.game.jumpY = 0;
        runner.game.jumpV = 0;
        if (runner.game.inventory.tape <= 0) {
          runner.game.inventory.tape = 1;
          runner._showToast("The builder shares repair tape", "No one is left behind at the final span.", "#d5a45e");
          runner._refreshHud();
        }
        if (state.holding) state.repairProgress = Math.min(1, state.repairProgress + dt / repair.hold);
        const percent = Math.round(state.repairProgress * 100);
        if (percent !== state.lastPercent) {
          state.lastPercent = percent;
          if (state.promptText) state.promptText.textContent = `HOLD E — REPAIR THE LAST SPAN · ${percent}%`;
          if (state.promptFill) state.promptFill.style.transform = `scaleX(${state.repairProgress})`;
        }
        if (state.repairProgress >= 1) repairBridge(runner);
      }
    },

    onComplete() {
      state.holding = false;
      state.repairActive = false;
      state.hidePromptAt = 0;
      setPrompt(false);
    },

    snapshot() {
      return {
        falls: state.falls,
        falling: state.falling,
        repairActive: state.repairActive,
        repairProgress: Number(state.repairProgress.toFixed(2)),
        bridgeRepaired: state.repaired,
      };
    },
  };
}
