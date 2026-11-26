// Entry point — the root URL is the journey directory. Direct chapter links
// (?chapter=1..4 and chapter ids) still boot the universal Runner for QA.

import { chapters, chapterById, chapterByNumber } from "./chapters/index.js";
import { createRunner } from "./engine/index.js";
import "./style.css";

const playableChapters = chapters.filter((chapter) => Number(chapter.number) >= 1 && Number(chapter.number) <= 4);
const STORAGE_KEY = "open-wild:journey:v1";
const TRANSITION_KEY = "open-wild:transition";

function readJourney() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const validIds = new Set(playableChapters.map((chapter) => chapter.id));
    return {
      completed: Array.isArray(value.completed) ? value.completed.filter((id) => validIds.has(id)) : [],
      results: value.results && typeof value.results === "object" ? value.results : {},
    };
  } catch {
    return { completed: [], results: {} };
  }
}

function chapterHref(number) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("chapter", String(Number(number)));
  return `${url.pathname}${url.search}`;
}

function hubHref() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.pathname;
}

function navigate(href, label) {
  if (document.body.classList.contains("is-leaving")) return;
  document.body.classList.add("is-leaving");
  const overlay = document.getElementById("journey-transition");
  const transitionLabel = document.getElementById("transition-label");
  if (transitionLabel) transitionLabel.textContent = label;
  if (overlay) {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-active"));
  }
  try { sessionStorage.setItem(TRANSITION_KEY, "1"); } catch { /* storage is optional */ }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => window.location.assign(href), reduced ? 20 : 360);
}

function revealAfterNavigation() {
  let arriving = false;
  try {
    arriving = sessionStorage.getItem(TRANSITION_KEY) === "1";
    sessionStorage.removeItem(TRANSITION_KEY);
  } catch { /* storage is optional */ }
  if (!arriving) return;
  const overlay = document.getElementById("journey-transition");
  if (!overlay) return;
  overlay.hidden = false;
  overlay.classList.add("is-active");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.remove("is-active");
    window.setTimeout(() => { overlay.hidden = true; }, 480);
  }));
}

function renderHub() {
  document.body.dataset.chapter = "hub";
  document.body.dataset.state = "hub";
  document.title = "Next Stop: The Open Wild · Journey Directory";
  document.getElementById("game-canvas").hidden = true;
  document.getElementById("intro-screen").hidden = true;
  const hub = document.getElementById("hub-screen");
  hub.hidden = false;

  const journey = readJourney();
  const completed = new Set(journey.completed);
  document.getElementById("journey-progress-label").textContent = `${completed.size} / ${playableChapters.length} chapters complete`;
  document.getElementById("journey-progress-fill").style.width = `${(completed.size / playableChapters.length) * 100}%`;

  const list = document.getElementById("chapter-list");
  list.replaceChildren(...playableChapters.map((chapter) => {
    const link = document.createElement("a");
    const done = completed.has(chapter.id);
    link.className = `chapter-card${done ? " is-complete" : ""}`;
    link.dataset.chapter = chapter.number;
    link.href = chapterHref(chapter.number);
    link.setAttribute("aria-label", `${done ? "Replay" : "Play"} Chapter ${chapter.number}: ${chapter.title}`);

    const number = document.createElement("span");
    number.className = "chapter-card-number";
    number.textContent = chapter.number;
    const copy = document.createElement("span");
    copy.className = "chapter-card-copy";
    const title = document.createElement("strong");
    title.textContent = chapter.title;
    const tagline = document.createElement("span");
    tagline.textContent = chapter.data.tagline || chapter.copy.intro.description;
    const facts = document.createElement("small");
    facts.textContent = (chapter.copy.intro.facts || []).slice(0, 2).join(" · ");
    copy.append(title, tagline, facts);
    const status = document.createElement("span");
    status.className = "chapter-card-status";
    status.textContent = done ? "Completed · Replay" : "Begin chapter";
    const arrow = document.createElement("b");
    arrow.textContent = "→";
    status.appendChild(arrow);
    link.append(number, copy, status);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.href, `Chapter ${chapter.number} · ${chapter.title}`);
    });
    return link;
  }));
  revealAfterNavigation();
}

function hydrateIntro(chapter) {
  const copy = chapter.copy?.intro;
  if (!copy) return;
  const eyebrow = document.querySelector(".intro-copy > .eyebrow");
  const title = document.querySelector(".intro-copy h1");
  const titleAccent = document.querySelector(".intro-copy h1 em");
  const series = document.querySelector(".english-title");
  const description = document.querySelector(".intro-description");
  const loading = document.querySelector("#loading-label");
  const start = document.querySelector("#start-button span");
  const controls = document.querySelector(".keyboard-note");
  const routesTitle = document.querySelector(".route-key > .eyebrow");
  const routesList = document.querySelector(".route-key");
  const chapterNumber = document.querySelector(".chapter-number");
  const facts = document.querySelector(".run-facts");

  if (eyebrow) eyebrow.textContent = copy.eyebrow;
  if (title?.firstChild) title.firstChild.textContent = copy.title;
  if (titleAccent) titleAccent.textContent = copy.titleAccent;
  if (series) series.textContent = copy.series;
  if (description) description.textContent = copy.description;
  if (start) start.textContent = copy.start;
  if (loading) loading.textContent = copy.loading;
  if (controls) controls.textContent = copy.controls;
  if (routesTitle) routesTitle.textContent = copy.routesTitle;
  if (chapterNumber) chapterNumber.textContent = chapter.number;
  if (facts && copy.facts) {
    facts.replaceChildren(...copy.facts.map((fact) => {
      const span = document.createElement("span");
      span.textContent = fact;
      return span;
    }));
  }
  if (routesList && copy.routes) {
    routesList.querySelectorAll("span").forEach((element) => element.remove());
    copy.routes.forEach((route) => {
      const row = document.createElement("span");
      const dot = document.createElement("i");
      const label = document.createElement("b");
      const detail = document.createElement("em");
      label.textContent = route.label;
      detail.textContent = route.detail;
      if (route.color) dot.style.setProperty("--key-color", route.color);
      row.append(dot, label, detail);
      routesList.appendChild(row);
    });
  }
}

function hydrateScreens(chapter) {
  const text = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value != null) element.textContent = value;
  };
  const modalCopy = (selector, copy) => {
    if (!copy) return;
    const root = document.querySelector(selector);
    const heading = root?.querySelector("h2");
    text(`${selector} .eyebrow`, copy.eyebrow);
    if (heading && copy.accent) {
      if (heading.firstChild) heading.firstChild.textContent = copy.title;
      text(`${selector} h2 em`, copy.accent);
    } else if (heading) {
      heading.textContent = copy.title;
    }
    text(`${selector} .modal-card > p:not(.eyebrow):not(.result-route):not(.result-note):not(.recovery-note)`, copy.copy);
  };

  modalCopy("#pause-screen", chapter.copy.pause);
  modalCopy("#recovery-screen", chapter.copy.recovery);
  modalCopy("#finish-screen", chapter.copy.finish);
  text("#resume-button span", chapter.copy.pause?.resume);
  text("#restart-from-pause", chapter.copy.pause?.restart);
  text("#restart-chapter-button b", chapter.copy.recovery?.restart);
  text("#safe-route-button b", chapter.copy.recovery?.safe);
  text("#recovery-screen .recovery-note", chapter.copy.recovery?.footnote);
  text("#restart-button span", chapter.copy.finish?.again);
}

async function bootChapter(chapter) {
  document.body.dataset.chapter = chapter.number;
  document.title = `${chapter.title} · Chapter ${chapter.number}`;
  document.getElementById("hub-screen").hidden = true;
  hydrateIntro(chapter);
  hydrateScreens(chapter);
  revealAfterNavigation();

  const index = playableChapters.findIndex((item) => item.id === chapter.id);
  const next = index >= 0 ? playableChapters[index + 1] : null;
  const nextButton = document.getElementById("next-chapter-button");
  if (nextButton) {
    nextButton.querySelector("span").textContent = next ? `Continue to Chapter ${next.number}` : "Return to the journey";
    nextButton.addEventListener("click", () => {
      if (next) navigate(chapterHref(next.number), `Chapter ${next.number} · ${next.title}`);
      else navigate(hubHref(), "The Open Wild · Journey Directory");
    });
  }
  document.querySelectorAll("[data-journey-hub]").forEach((button) => {
    button.addEventListener("click", () => navigate(hubHref(), "The Open Wild · Journey Directory"));
  });

  window.addEventListener("openwild:chaptercomplete", (event) => {
    const journey = readJourney();
    if (!journey.completed.includes(chapter.id)) journey.completed.push(chapter.id);
    journey.results[chapter.id] = {
      time: event.detail?.elapsed ?? 0,
      collisions: event.detail?.collisions ?? 0,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(journey)); } catch { /* storage is optional */ }
    if (next?.scene?.model) {
      const prefetch = document.createElement("link");
      prefetch.rel = "prefetch";
      prefetch.href = next.scene.model;
      prefetch.as = "fetch";
      document.head.appendChild(prefetch);
    }
  });

  try {
    await createRunner({ chapter });
  } catch (error) {
    console.error("Boot failed", error);
    const label = document.querySelector("#loading-label");
    if (label) label.textContent = "Scene failed to load · Return to the directory and try again";
  }
}

const requested = new URLSearchParams(window.location.search).get("chapter");
const chapter = requested && requested !== "hub"
  ? chapterById(requested) || chapterByNumber(requested.padStart(2, "0"))
  : null;
if (chapter) bootChapter(chapter);
else renderHub();
