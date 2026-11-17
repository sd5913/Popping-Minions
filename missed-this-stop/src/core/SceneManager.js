
import { CHAPTERS } from "../chapters/chapters.js";

export class SceneManager {
  constructor() {
    this.chapters = CHAPTERS;
    this.currentIndex = 0;
    this.elapsed = 0;
    this.dialoguePlayed = new Set();
  }

  get current() {
    return this.chapters[this.currentIndex];
  }

  get progress() {
    if (!this.current) return 1;

    return Math.min(
      this.elapsed / this.current.duration,
      1
    );
  }

  update(deltaTime) {
    if (!this.current) return false;

    this.elapsed += deltaTime;

    return this.elapsed >= this.current.duration;
  }

  next() {
    if (this.currentIndex >= this.chapters.length - 1) {
      return false;
    }

    this.currentIndex++;
    this.elapsed = 0;

    return true;
  }

  reset() {
    this.currentIndex = 0;
    this.elapsed = 0;
    this.dialoguePlayed.clear();
  }

  get isLastChapter() {
    return this.currentIndex === this.chapters.length - 1;
  }

  getDialogueKey() {
    return `${this.current.id}-dialogue`;
  }

  markDialoguePlayed() {
    this.dialoguePlayed.add(this.getDialogueKey());
  }

  hasPlayedDialogue() {
    return this.dialoguePlayed.has(this.getDialogueKey());
  }
}
