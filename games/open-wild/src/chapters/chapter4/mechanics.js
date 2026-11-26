// Chapter 04 signature mechanics, driven through generic Runner lifecycle hooks.
// The shared engine still owns lanes, collisions, pickups and UI screens.

import builders from "./builders.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createMechanics(CHAPTER, progressToDistance) {
  let environment = null;
  const state = {
    holding: false,
    boarded: false,
    boardActive: false,
    boardProgress: 0,
    drift: false,
    idle: 0,
    steerPulse: false,
    lastLane: 1,
    forkResolved: false,
    route: null,
    prompt: null,
    promptText: null,
    promptFill: null,
    hidePromptAt: 0,
    lastPercent: -1,
    time: 0,
  };

  const boardDistance = progressToDistance(CHAPTER.signature.boarding.start);
  const baseSpeed = CHAPTER.baseSpeed;

  function setPrompt(visible, text = "") {
    if (!state.prompt) return;
    state.prompt.hidden = !visible;
    if (state.promptText && text) state.promptText.textContent = text;
  }

  function resetBoat() {
    const env = environment;
    if (!env) return;
    env.boarded = false;
    env.boat.visible = true;
    env.boat.position.set(0, CHAPTER.groundY, CHAPTER.startZ - boardDistance);
    env.boat.rotation.set(0, Math.PI, 0);
    env.wake.visible = false;
  }

  function finishBoarding(runner, announce = true) {
    if (state.boarded) return;
    state.boarded = true;
    state.boardActive = false;
    state.boardProgress = 1;
    state.holding = false;
    state.idle = 0;
    state.lastLane = runner.game.lane;
    if (environment) environment.boarded = true;
    setPrompt(true, "THE CURRENT TAKES IT FROM HERE");
    state.prompt?.classList.add("is-complete");
    if (state.promptFill) state.promptFill.style.transform = "scaleX(1)";
    state.hidePromptAt = performance.now() + 1200;
    if (announce) {
      runner._showToast("The paper boat takes your weight", "You sit low on the water. The current is already moving.", "#d3b279");
      runner._showSubtitle("Hold a course — or let the river pick one.", 2800);
      runner._flash();
    }
  }

  function enterDrift(runner) {
    if (state.drift) return;
    state.drift = true;
    runner.game.motionLabel = "Drifting on the current";
    runner._showToast("Drift Mode", "No stroke for a moment. The river keeps the course.", "#8fa39c");
    runner._showSubtitle("You stop paddling. The water does not.", 2600);
  }

  function leaveDrift(runner) {
    if (!state.drift) return;
    state.drift = false;
    state.idle = 0;
    runner.game.motionLabel = "Rowing the river";
  }

  return {
    attach(runner, sceneEnvironment) {
      environment = sceneEnvironment;
      resetBoat();
      if (state.prompt) return;
      const prompt = document.createElement("button");
      prompt.id = "chapter-interaction";
      prompt.className = "chapter-interaction";
      prompt.type = "button";
      prompt.hidden = true;
      prompt.innerHTML = '<span class="interaction-label">HOLD E — STEP INTO THE PAPER BOAT</span><i class="interaction-track"><b></b></i>';
      prompt.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (state.boardActive) state.holding = true;
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
      state.boarded = false;
      state.boardActive = false;
      state.boardProgress = 0;
      state.drift = false;
      state.idle = 0;
      state.steerPulse = false;
      state.lastLane = 1;
      state.forkResolved = false;
      state.route = null;
      state.hidePromptAt = 0;
      state.lastPercent = -1;
      runner.game.motionLabel = "Rowing the river";
      state.prompt?.classList.remove("is-complete");
      if (state.promptFill) state.promptFill.style.transform = "scaleX(0)";
      setPrompt(false);
      resetBoat();
    },

    onKeyDown(runner, event) {
      const steer = ["KeyA", "KeyD", "ArrowLeft", "ArrowRight"].includes(event.code);
      if (steer) {
        state.idle = 0;
        state.steerPulse = true;
        if (state.boarded) leaveDrift(runner);
      }
      if (event.code !== "KeyE" || !state.boardActive) return false;
      event.preventDefault();
      state.holding = true;
      return true;
    },

    onKeyUp(runner, event) {
      if (event.code === "KeyE") state.holding = false;
      return false;
    },

    onTeleport(runner, target) {
      // QA/debug jumps cross the boarding trigger without simulating a hold.
      // Normal play never calls this hook; boarding still needs a real hold.
      if (target > CHAPTER.signature.boarding.start + 1 && !state.boarded) finishBoarding(runner, false);
    },

    onUpdate(runner, dt) {
      state.time += dt;
      const env = environment;
      if (!env) return;

      // Ambient water and lanterns keep moving on every screen.
      env.streaks.forEach((streak) => {
        streak.position.z += streak.userData.speed * dt;
        if (streak.position.z > CHAPTER.startZ + 6) streak.position.z = CHAPTER.startZ - CHAPTER.length - 6;
      });
      env.bankLights.forEach((lamp, index) => {
        lamp.material.opacity = 0.48 + Math.sin(state.time * 1.7 + index * 0.6) * 0.12;
      });
      env.boat.position.y = CHAPTER.groundY + Math.sin(state.time * 1.6) * 0.035;
      env.boat.rotation.z = Math.sin(state.time * 1.1) * 0.02;

      if (state.hidePromptAt && performance.now() >= state.hidePromptAt) {
        state.hidePromptAt = 0;
        setPrompt(false);
        state.prompt?.classList.remove("is-complete");
      }

      if (runner.game.state !== "running" || runner.game.dialogueActive) return;

      const p = (runner.game.distance / CHAPTER.length) * 100;

      if (!state.boarded) {
        runner.game.cameraOffsetY = 0;
        if (p < CHAPTER.signature.boarding.start) {
          env.boat.position.set(0, env.boat.position.y, CHAPTER.startZ - boardDistance);
          env.boat.rotation.y = Math.PI;
          runner.game.motionLabel = "Walking the bank";
          return;
        }
        if (!state.boardActive) {
          state.boardActive = true;
          state.holding = false;
          state.lastPercent = -1;
          setPrompt(true, "HOLD E — STEP INTO THE PAPER BOAT");
          runner._showSubtitle("The bank ends here. Step into the paper boat.", 2600);
        }
        runner.game.distance = boardDistance;
        runner.game.prevDistance = boardDistance;
        runner.game.lastSpeed = 0;
        runner.game.jumpY = 0;
        runner.game.jumpV = 0;
        env.boat.position.set(0, env.boat.position.y, runner.camera.position.z - 4.2);
        env.boat.rotation.y = Math.PI;
        if (state.holding) state.boardProgress = Math.min(1, state.boardProgress + dt / CHAPTER.signature.boarding.hold);
        const percent = Math.round(state.boardProgress * 100);
        if (percent !== state.lastPercent) {
          state.lastPercent = percent;
          if (state.promptText) state.promptText.textContent = `HOLD E — STEP INTO THE PAPER BOAT · ${percent}%`;
          if (state.promptFill) state.promptFill.style.transform = `scaleX(${state.boardProgress})`;
        }
        if (state.boardProgress >= 1) finishBoarding(runner);
        return;
      }

      // Boarded: sit low over the paper boat and ride the current.
      runner.game.cameraOffsetY = 0.45;
      const camera = runner.camera;
      const boatX = runner.game.playerX;
      const boatZ = camera.position.z - 4;
      env.boat.visible = true;
      env.boat.position.set(boatX, CHAPTER.groundY + Math.sin(state.time * 2.1) * 0.045, boatZ);
      env.boat.rotation.y = Math.PI;
      const lateral = (boatX - (env.boat.userData.lastX ?? boatX)) / Math.max(dt, 0.001);
      env.boat.rotation.z = clamp(-lateral * 0.05, -0.2, 0.2) + Math.sin(state.time * 1.3) * 0.015;
      env.boat.userData.lastX = boatX;
      env.wake.visible = true;
      env.wake.position.z = 2.2 + Math.sin(state.time * 3) * 0.1;

      if (runner.game.lane !== state.lastLane) {
        state.lastLane = runner.game.lane;
        state.idle = 0;
        leaveDrift(runner);
      }
      if (state.steerPulse) {
        state.steerPulse = false;
        state.idle = 0;
      }

      if (p < CHAPTER.signature.fork.p - 0.5) {
        state.idle += dt;
        if (state.idle >= CHAPTER.signature.drift.idle && !state.drift) enterDrift(runner);
      }

      if (state.drift) {
        runner.game.distance = Math.min(CHAPTER.length, runner.game.distance + baseSpeed * 0.06 * dt);
        runner.game.knock = Math.sin(state.time * 0.9) * 0.12;
        camera.rotation.z += Math.sin(state.time * 0.8) * 0.012;
        runner.game.motionLabel = "Drifting on the current";
      } else {
        runner.game.motionLabel = "Rowing the river";
      }

      if (!state.forkResolved && p >= CHAPTER.signature.fork.p) {
        state.forkResolved = true;
        if (state.drift) {
          state.route = "drift";
          runner._showToast("The current finds the quiet channel", "You let the river choose. It chooses the far bank.", "#8fa39c");
          runner._showSubtitle("You were not drifting away. You were arriving.", 2800);
        } else {
          state.route = "rowed";
          runner._showToast("You keep rowing", "Every stroke is yours. The bank comes anyway.", "#d3b279");
          runner._showSubtitle("The far bank does not care how you got there.", 2800);
        }
      }
    },

    onComplete() {
      state.holding = false;
      state.boardActive = false;
      state.hidePromptAt = 0;
      setPrompt(false);
    },

    snapshot() {
      return {
        boarded: state.boarded,
        boardProgress: Number(clamp(state.boardProgress, 0, 1).toFixed(2)),
        drifting: state.drift,
        idle: Number(state.idle.toFixed(2)),
        forkResolved: state.forkResolved,
        route: state.route,
      };
    },
  };
}
