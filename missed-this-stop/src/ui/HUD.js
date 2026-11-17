
export class HUD {
  constructor() {
    this.elements = {
      title: document.querySelector("#title-screen"),
      dialogue: document.querySelector("#dialogue-screen"),
      transition: document.querySelector("#transition-screen"),
      ending: document.querySelector("#ending-screen"),

      speaker: document.querySelector("#speaker"),
      dialogueText: document.querySelector("#dialogue-text"),

      chapter: document.querySelector("#chapter-label"),
      message: document.querySelector("#message"),

      transitionTitle: document.querySelector("#transition-title"),
      transitionDescription: document.querySelector("#transition-description"),

      pause: document.querySelector("#pause-button")
    };

    this.callbacks = {
      start: null,
      pause: null,
      dialogue: null,
      transition: null,
      ending: null
    };

    document.querySelector("#start-button")
      .addEventListener("click", () => this.callbacks.start?.());

    this.elements.pause.addEventListener("click", () => {
      this.callbacks.pause?.();
    });

    document.querySelector("#dialogue-next")
      .addEventListener("click", () => this.callbacks.dialogue?.());

    document.querySelector("#transition-button")
      .addEventListener("click", () => this.callbacks.transition?.());

    document.querySelector("#ending-button")
      .addEventListener("click", () => this.callbacks.ending?.());
  }

  onStart(callback) {
    this.callbacks.start = callback;
  }

  onPause(callback) {
    this.callbacks.pause = callback;
  }

  onDialogueNext(callback) {
    this.callbacks.dialogue = callback;
  }

  onTransitionNext(callback) {
    this.callbacks.transition = callback;
  }

  onEnding(callback) {
    this.callbacks.ending = callback;
  }

  
  hideAll() {
    this.elements.title.classList.add("hidden");
    this.elements.dialogue.classList.add("hidden");
    this.elements.transition.classList.add("hidden");
    this.elements.ending.classList.add("hidden");

    this.elements.chapter.classList.remove("hidden");
    this.elements.message.classList.add("hidden");
    this.elements.pause.classList.remove("hidden");

    document.querySelector(".hud-top").classList.remove("hidden");
    document.querySelector(".game-brand").classList.remove("hidden");
    document.querySelector(".crosshair").classList.remove("hidden");
    document.querySelector(".bottom-hint").classList.remove("hidden");
  }


  showTitle() {
    this.hideAll();
    this.elements.title.classList.remove("hidden");

    document.querySelector(".hud-top").classList.add("hidden");
    document.querySelector(".game-brand").classList.add("hidden");
    document.querySelector(".crosshair").classList.add("hidden");
    document.querySelector(".bottom-hint").classList.add("hidden");
  }

  showDialogue(speaker, text) {
    this.elements.dialogue.classList.remove("hidden");

    this.elements.speaker.textContent = speaker;
    this.elements.dialogueText.textContent = text;
  }

  hideDialogue() {
    this.elements.dialogue.classList.add("hidden");
  }

  showTransition(chapter) {
    this.elements.transition.classList.remove("hidden");

    this.elements.transitionTitle.textContent = chapter.name;
    this.elements.transitionDescription.textContent =
      chapter.description;
  }

  hideTransition() {
    this.elements.transition.classList.add("hidden");
  }

  showEnding() {
    this.hideAll();

    this.elements.ending.classList.remove("hidden");

    document.querySelector(".hud-top").classList.add("hidden");
    document.querySelector(".game-brand").classList.add("hidden");
    document.querySelector(".crosshair").classList.add("hidden");
    document.querySelector(".bottom-hint").classList.add("hidden");
  }

  updateChapter(chapter) {
    this.elements.chapter.textContent = chapter.label;
  }

  updateStatus(status) {
    const label = document.querySelector("#speed-label");

    if (status.state === "dialogue") {
      label.textContent = "SLOWING DOWN";
    } else {
      const motion = status.jumping ? "AIRBORNE" : "MOVING FORWARD";
      label.textContent =
        `${motion} · ${Math.round(status.speed)} M/S · ` +
        `LANE ${status.lane + 1} · ${status.mistakes} MISSTEPS`;
    }
  }

  showMessage(text) {
    this.elements.message.textContent = text;

    this.elements.message.classList.remove("hidden");

    clearTimeout(this.messageTimeout);

    if (text) {
      this.messageTimeout = setTimeout(() => {
        this.elements.message.classList.add("hidden");
      }, 2200);
    }
  }

  setPauseLabel(text) {
    this.elements.pause.textContent = text;
  }
}
