import {
  acceleratorKeys,
  DEFAULT_HOTKEYS,
  keyboardEventToAccelerator,
  type HotkeyAction,
  type Platform,
} from "./hotkeys";
import { lang, t } from "./i18n";
import { icons } from "./icons";
import { playlist, type Line } from "./songs";

/**
 * A working copy of the app's overlay and settings window. The markup and styles are
 * ported from music-companion's src/main.ts and src/styles.css; only the native parts
 * (window glass, media session, global shortcuts) are imitated in the browser. The
 * overlay is pinned at the app's minimum window size, 220 × 110.
 */

type Material = "acrylic" | "mica";

const AI_SYNC_DELAY_MS = 1800;

const ACCENT_PRESETS = [
  "#FF8A65",
  "#FFD166",
  "#7EE0B5",
  "#6FB7FF",
  "#B79CFF",
  "#FF8FC7",
  "#F6F0E8",
  "#5C5566",
];
// The wheel's rim is a quarter white, so dragging tops out at 75% saturation.
const WHEEL_MAX_SATURATION = 0.75;

/** Small pictures at each end of a slider that show what moving it does. */
const SLIDER_ENDS = {
  opacity: [
    `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/></svg>`,
    `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="currentColor"/></svg>`,
  ],
  blur: [
    `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" fill="currentColor"/></svg>`,
    `<i class="blur-dot"></i>`,
  ],
  size: [`<b class="size-small">A</b>`, `<b class="size-large">A</b>`],
  spacing: [
    `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5.5h10M3 8h10M3 10.5h10"/></svg>`,
    `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 2.5h10M3 8h10M3 13.5h10"/></svg>`,
  ],
} as const;

const platform: Platform = /mac os x|macintosh/i.test(navigator.userAgent) ? "macos" : "windows";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const tracks = playlist(lang);
const hotkeys = { ...DEFAULT_HOTKEYS[platform] };

const settings = {
  opacity: 0,
  blurIntensity: 100,
  fontSize: 1,
  lineSpacing: 0.5,
  romanized: true,
  translation: false,
  accentMode: "manual" as "manual" | "dynamic",
  accentColor: "#FF8A65",
  material: "mica" as Material,
};

let trackIndex = 0;
let time = 0;
let aiSynced = false;
let syncTimer = 0;
let playing = true;
let onScreen = false;
let activeIndex = -2;
let toastTimer = 0;
let lineEls: HTMLElement[] = [];
let wordTimings: { el: HTMLElement; start: number; end: number }[][] = [];

const $ = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;

export function mountDemo(host: HTMLElement) {
  host.dataset.platform = platform;
  host.innerHTML = markup();

  bindSettings();
  applySettings();
  renderLyrics();

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
  }).observe(host);

  let last = performance.now();
  const frame = (now: number) => {
    // A hidden tab pauses requestAnimationFrame, so cap the jump when it resumes.
    const delta = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (playing && onScreen) {
      time += delta;
      if (time >= tracks[trackIndex].duration) skip(1, false);
    }
    tick();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export function setAppVersion(version: string) {
  $("#app-version").textContent = `Music Companion ${version}`;
}

/* ---------- Markup ---------- */

function markup() {
  const materials = t.materials[platform];
  const osName = platform === "macos" ? "macOS" : "Windows";
  return `
    <section class="overlay click-through accent-text" id="overlay" aria-label="${t.overlayLabel}">
      <div class="lyrics-viewport">
        <div class="lyrics-list" id="lyrics-list"></div>
      </div>
      <p class="word-sync-status" id="word-sync-status" role="status" hidden>
        <span class="searching-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        ${t.syncing}
      </p>
      <p class="toast" id="demo-toast" role="status">${icons.checkCircle}<span id="demo-toast-text"></span></p>
    </section>

    <aside class="settings-panel" aria-label="${t.settingsLabel}">
      <div class="settings-titlebar" aria-hidden="true">
        <span class="settings-app-icon">${icons.musicalNote}</span>
        <span>Music Companion</span>
        <span class="caption-buttons"><span>${icons.minus}</span><span>${icons.xMark}</span></span>
      </div>
      <header class="settings-header">
        <span class="traffic-lights" aria-hidden="true"><i></i><i class="traffic-minimize"></i><i class="traffic-zoom"></i></span>
        <nav class="settings-tabs" role="tablist" aria-label="${t.sections}">
          ${tab("look", icons.swatch, true)}
          ${tab("lyrics", icons.musicalNote)}
          ${tab("shortcuts", icons.keyboard)}
          ${tab("general", icons.cog)}
        </nav>
      </header>

      <section class="settings-page" id="page-look" role="tabpanel" aria-labelledby="tab-look" data-settings-page="look">
        <div class="settings-grid">
          <div class="card slider-card">
            ${sliderRow("opacity", t.background, 0, 100, 1, "opacity")}
            ${sliderRow("blur-intensity", t.blur, 1, 100, 1, "blur")}
            ${sliderRow("font-size", t.textSize, 0.5, 3, 0.05, "size")}
            ${sliderRow("line-spacing", t.lineSpacing, 20, 240, 10, "spacing")}
          </div>
          <div class="card accent-card" id="accent-card">
            <h3>${t.accent}</h3>
            <div class="accent-body">
              <div class="wheel-well">
                <div class="wheel" id="accent-wheel" title="${t.wheel}"><span class="wheel-handle" id="accent-wheel-handle"></span></div>
              </div>
              <div class="accent-side">
                <div class="candies" role="group" aria-label="${t.presets}">
                  ${ACCENT_PRESETS.map((color) => `<button type="button" class="candy" style="--candy: ${color}" data-accent-preset="${color}" title="${color}" aria-label="${t.usePreset(color)}"></button>`).join("")}
                </div>
                <input id="accent-color-hex" class="hex-input" type="text" maxlength="7" spellcheck="false" aria-label="${t.hex}" />
              </div>
            </div>
            <label class="setting-row" for="accent-dynamic">
              <span><strong>${t.dynamic}</strong><small>${t.dynamicHint}</small></span>
              <input id="accent-dynamic" class="switch" type="checkbox" role="switch" />
            </label>
          </div>
          <div class="card span">
            <h3>${t.glass}</h3>
            <div class="choices" role="radiogroup" aria-label="${t.glass}">
              ${(["acrylic", "mica"] as const).map((material) => `<button type="button" class="key choice" role="radio" data-material="${material}"><span class="choice-pic glass-pic glass-${material}" aria-hidden="true"></span><span class="choice-title">${materials[material][0]}</span><span class="choice-description">${materials[material][1]}</span></button>`).join("")}
            </div>
          </div>
        </div>
      </section>

      <section class="settings-page" id="page-lyrics" role="tabpanel" aria-labelledby="tab-lyrics" data-settings-page="lyrics" hidden>
        <div class="settings-grid">
          <div class="card span">
            <h3>${t.script}</h3>
            <div class="choices" role="radiogroup" aria-label="${t.script}">
              <button type="button" class="key choice" role="radio" data-script="original"><span class="choice-pic script-pic" aria-hidden="true">夜に駆ける</span><span class="choice-title">${t.original}</span><span class="choice-description">${t.originalHint}</span></button>
              <button type="button" class="key choice" role="radio" data-script="romanized"><span class="choice-pic script-pic" aria-hidden="true">Yoru ni kakeru</span><span class="choice-title">${t.romanized}</span><span class="choice-description">${t.romanizedHint}</span></button>
            </div>
          </div>
          <div class="card span">
            <label class="setting-row" for="show-translation">
              <span><strong>${t.translation}</strong><small>${t.translationHint}</small></span>
              <input id="show-translation" class="switch" type="checkbox" role="switch" />
            </label>
            <label class="setting-row" for="word-sync">
              <span><strong>${t.wordSync} <span class="sparkle">${icons.sparkles}</span></strong><small>${t.wordSyncHint}</small></span>
              <input id="word-sync" class="switch" type="checkbox" role="switch" />
            </label>
          </div>
        </div>
      </section>

      <section class="settings-page" id="page-shortcuts" role="tabpanel" aria-labelledby="tab-shortcuts" data-settings-page="shortcuts" hidden>
        <div class="hotkey-grid">
          ${hotkeyCard("pinned")}
          ${hotkeyCard("playPause")}
          ${hotkeyCard("next")}
          ${hotkeyCard("previous")}
        </div>
        <p class="settings-tip">${t.hotkeyTip}</p>
      </section>

      <section class="settings-page" id="page-general" role="tabpanel" aria-labelledby="tab-general" data-settings-page="general" hidden>
        <div class="settings-grid">
          <div class="card span">
            <label class="setting-row" for="start-login">
              <span><strong>${t.login}</strong><small>${t.loginHint(osName)}</small></span>
              <input id="start-login" class="switch" type="checkbox" role="switch" />
            </label>
            <div class="setting-row">
              <span><strong>${t.saved}</strong><small>${t.savedHint}</small></span>
              <button type="button" class="key button" id="clear-cache">${t.clear}</button>
            </div>
          </div>
        </div>
        <p class="app-version" id="app-version">Music Companion</p>
      </section>
    </aside>`;
}

function tab(name: keyof typeof t.tabs, icon: string, active = false) {
  return `<button type="button" class="key${active ? " active" : ""}" role="tab" id="tab-${name}" data-settings-tab="${name}" aria-controls="page-${name}" aria-selected="${active}">${icon}${t.tabs[name]}</button>`;
}

function sliderRow(
  id: string,
  label: string,
  min: number,
  max: number,
  step: number,
  ends: keyof typeof SLIDER_ENDS,
) {
  const [low, high] = SLIDER_ENDS[ends];
  return `
    <div class="slider-row">
      <label class="slider-label" for="${id}"><span>${label}</span><output id="${id}-value"></output></label>
      <div class="slider-track">
        <span aria-hidden="true">${low}</span>
        <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" />
        <span aria-hidden="true">${high}</span>
      </div>
    </div>`;
}

function hotkeyCard(action: HotkeyAction) {
  const [label, hint] = t.hotkeys[action];
  return `
    <div class="hotkey-card">
      <span class="hotkey-label"><strong>${label}</strong>${hint ? `<small>${hint}</small>` : ""}</span>
      <span class="hotkey-value">
        <button type="button" class="hotkey-reset" data-hotkey-reset="${action}" title="${t.resetHotkey}" aria-label="${t.resetHotkey}" hidden>${icons.arrowPath}</button>
        <button type="button" class="hotkey-input" data-hotkey="${action}" aria-label="${t.recordHotkey(label)}">${keycaps(hotkeys[action])}</button>
      </span>
    </div>`;
}

function keycaps(accelerator: string) {
  return acceleratorKeys(accelerator, platform)
    .map((key) => `<kbd>${escapeHtml(key)}</kbd>`)
    .join("");
}

/* ---------- Settings ---------- */

function bindSettings() {
  $(".settings-tabs").addEventListener("click", (event) => {
    const tab = (event.target as Element).closest<HTMLElement>("[data-settings-tab]");
    if (tab) showTab(tab.dataset.settingsTab!);
  });

  bindRange("opacity", (value) => (settings.opacity = value / 100));
  bindRange("blur-intensity", (value) => (settings.blurIntensity = value));
  bindRange("font-size", (value) => (settings.fontSize = value));
  bindRange("line-spacing", (value) => (settings.lineSpacing = value / 200));

  $(".candies").addEventListener("click", (event) => {
    const color = (event.target as Element).closest<HTMLElement>("[data-accent-preset]")?.dataset
      .accentPreset;
    if (color) setManualAccent(color);
  });

  const wheel = $("#accent-wheel");
  const pickFromWheel = (event: PointerEvent) => {
    const bounds = wheel.getBoundingClientRect();
    const radius = bounds.width / 2;
    const dx = event.clientX - bounds.left - radius;
    const dy = event.clientY - bounds.top - radius;
    const hue = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    const saturation = Math.min(1, Math.hypot(dx, dy) / radius) * WHEEL_MAX_SATURATION;
    setManualAccent(hsvToHex(hue, saturation, 1));
  };
  wheel.addEventListener("pointerdown", (event) => {
    wheel.setPointerCapture(event.pointerId);
    pickFromWheel(event);
  });
  wheel.addEventListener("pointermove", (event) => {
    if (wheel.hasPointerCapture(event.pointerId)) pickFromWheel(event);
  });

  $<HTMLInputElement>("#accent-color-hex").addEventListener("change", (event) => {
    const value = (event.currentTarget as HTMLInputElement).value;
    if (/^#?[\da-f]{6}$/i.test(value)) setManualAccent(`#${value.replace("#", "")}`);
    else renderAccent();
  });

  $<HTMLInputElement>("#accent-dynamic").addEventListener("change", (event) => {
    settings.accentMode = (event.currentTarget as HTMLInputElement).checked ? "dynamic" : "manual";
    renderAccent();
  });

  document.querySelectorAll<HTMLElement>("[data-material]").forEach((button) => {
    button.addEventListener("click", () => {
      settings.material = button.dataset.material as Material;
      applySettings();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-script]").forEach((button) => {
    button.addEventListener("click", () => {
      settings.romanized = button.dataset.script === "romanized";
      if (settings.romanized) showTrackWith((line) => !!line.roman);
      renderLyrics();
    });
  });

  $<HTMLInputElement>("#show-translation").addEventListener("change", (event) => {
    settings.translation = (event.currentTarget as HTMLInputElement).checked;
    if (settings.translation) showTrackWith((line) => !!line.translation);
    renderLyrics();
  });

  $<HTMLInputElement>("#word-sync").addEventListener("change", (event) => {
    const on = (event.currentTarget as HTMLInputElement).checked;
    clearTimeout(syncTimer);
    $("#word-sync-status").hidden = true;
    aiSynced = false;
    if (on) {
      // AI sync only changes line-timed songs, so show one.
      const lineTimed = tracks.findIndex((track) => !track.wordTimed);
      if (trackIndex !== lineTimed) play(lineTimed, tracks[lineTimed].lines[0].at);
      // The first sync of a song takes a while in the app; the demo keeps the wait short.
      $("#word-sync-status").hidden = false;
      syncTimer = window.setTimeout(() => {
        $("#word-sync-status").hidden = true;
        aiSynced = true;
        renderLyrics();
      }, AI_SYNC_DELAY_MS);
    }
    renderLyrics();
  });

  $("#clear-cache").addEventListener("click", () => showToast(t.toasts.cleared));

  bindHotkeys();
}

/** As in the app: click a shortcut, press the new combo, and it is saved on release. */
function bindHotkeys() {
  document.querySelectorAll<HTMLButtonElement>("[data-hotkey]").forEach((input) => {
    const action = input.dataset.hotkey as HotkeyAction;
    let pending: string | null = null;
    const save = () => {
      if (pending) hotkeys[action] = pending;
      pending = null;
      input.classList.remove("recording");
      input.innerHTML = keycaps(hotkeys[action]);
      $(`[data-hotkey-reset="${action}"]`).hidden =
        hotkeys[action] === DEFAULT_HOTKEYS[platform][action];
    };
    input.addEventListener("focus", () => {
      pending = null;
      input.classList.add("recording");
      input.textContent = t.pressKeys;
    });
    input.addEventListener("keydown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") return input.blur();
      if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return;
      pending = keyboardEventToAccelerator(event);
      input.innerHTML = keycaps(pending);
    });
    input.addEventListener("keyup", (event) => {
      if (pending) {
        event.preventDefault();
        input.blur();
      }
    });
    input.addEventListener("blur", save);
  });

  document.querySelectorAll<HTMLElement>("[data-hotkey-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.hotkeyReset as HotkeyAction;
      hotkeys[action] = DEFAULT_HOTKEYS[platform][action];
      $(`[data-hotkey="${action}"]`).innerHTML = keycaps(hotkeys[action]);
      button.hidden = true;
    });
  });

  // Pressing a shortcut anywhere on the page runs it, as it would anywhere on the desktop.
  document.addEventListener("keydown", (event) => {
    if ((event.target as Element).matches(".hex-input")) return;
    const accelerator = keyboardEventToAccelerator(event);
    const action = (Object.keys(hotkeys) as HotkeyAction[]).find(
      (name) => hotkeys[name] === accelerator,
    );
    if (!action) return;
    event.preventDefault();
    runHotkey(action);
  });
}

function bindRange(id: string, update: (value: number) => void) {
  $<HTMLInputElement>(`#${id}`).addEventListener("input", (event) => {
    update(Number((event.currentTarget as HTMLInputElement).value));
    applySettings();
    scrollToActive(false);
  });
}

function showTab(name: string) {
  document.querySelectorAll<HTMLElement>("[data-settings-tab]").forEach((tab) => {
    const selected = tab.dataset.settingsTab === name;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  document.querySelectorAll<HTMLElement>("[data-settings-page]").forEach((page) => {
    page.hidden = page.dataset.settingsPage !== name;
  });
}

function applySettings() {
  const overlay = $("#overlay");
  overlay.style.setProperty("--overlay-opacity", String(settings.opacity));
  overlay.style.setProperty("--backdrop-blur", `${settings.blurIntensity * 0.2}px`);
  overlay.style.setProperty("--lyric-size-scale", String(settings.fontSize));
  overlay.style.setProperty("--line-spacing", `${settings.lineSpacing}em`);
  overlay.classList.toggle("accent-text", settings.material === "acrylic");
  overlay.classList.toggle("mica", settings.material === "mica");

  const values: Record<string, number> = {
    opacity: Math.round(settings.opacity * 100),
    "blur-intensity": settings.blurIntensity,
    "font-size": settings.fontSize,
    "line-spacing": Math.round(settings.lineSpacing * 200),
  };
  for (const [id, value] of Object.entries(values)) {
    const input = $<HTMLInputElement>(`#${id}`);
    input.value = String(value);
    const percent = id === "font-size" ? Math.round(value * 100) : value;
    $<HTMLOutputElement>(`#${id}-value`).value = `${percent}%`;
    const progress = ((value - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
    input.style.setProperty("--range-progress", `${progress}%`);
  }
  document.querySelectorAll<HTMLElement>("[data-material]").forEach((button) => {
    const selected = button.dataset.material === settings.material;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  renderAccent();
}

function setManualAccent(color: string) {
  settings.accentMode = "manual";
  settings.accentColor = color.toUpperCase();
  renderAccent();
}

/** The accent also drives the rest of the page, so the whole site follows the picker. */
function renderAccent() {
  const dynamic = settings.accentMode === "dynamic";
  const track = tracks[trackIndex];
  const accent = dynamic
    ? hslToHex(hashHue(`${track.artist}:${track.title}`), 0.75, 0.66)
    : settings.accentColor;
  const root = document.documentElement.style;
  root.setProperty("--accent", accent);
  root.setProperty("--on-accent", readableTextOn(accent));

  $("#accent-card").classList.toggle("dynamic", dynamic);
  $<HTMLInputElement>("#accent-dynamic").checked = dynamic;
  $<HTMLInputElement>("#accent-color-hex").value = accent;
  document.querySelectorAll<HTMLElement>("[data-accent-preset]").forEach((candy) => {
    candy.classList.toggle("active", !dynamic && candy.dataset.accentPreset === accent);
  });
  // Colours more saturated than the wheel offers still sit on its rim.
  const { hue, saturation } = hexToHsv(accent);
  const reach = Math.min(1, saturation / WHEEL_MAX_SATURATION) * 50;
  const angle = (hue * Math.PI) / 180;
  const handle = $("#accent-wheel-handle");
  handle.style.left = `${50 + Math.sin(angle) * reach}%`;
  handle.style.top = `${50 - Math.cos(angle) * reach}%`;
  handle.style.background = accent;
}

/* ---------- Overlay ---------- */

function runHotkey(action: HotkeyAction) {
  const key = $(`[data-hotkey="${action}"]`);
  key.classList.remove("pressed");
  void key.offsetWidth;
  key.classList.add("pressed");

  if (action === "pinned") {
    // Unpinned, the app would show its title bar; the demo stays in its pinned look.
    const pinned = !$("#overlay").classList.toggle("unpinned");
    showToast(pinned ? t.toasts.pinned : t.toasts.unpinned);
  } else if (action === "playPause") {
    playing = !playing;
    showToast(playing ? t.toasts.playing : t.toasts.paused);
  } else {
    skip(action === "next" ? 1 : -1);
  }
}

function skip(direction: 1 | -1, announce = true) {
  play((trackIndex + direction + tracks.length) % tracks.length);
  // Pinned, the overlay has no title bar, so the song's name comes up as a toast.
  if (announce) showToast(`${tracks[trackIndex].title} · ${tracks[trackIndex].artist}`, "note");
}

/** Lyrics settings need a song that has what they show, so the demo switches to one. */
function showTrackWith(has: (line: Line) => boolean) {
  if (tracks[trackIndex].lines.some(has)) return;
  const index = tracks.findIndex((track) => track.lines.some(has));
  play(index, tracks[index].lines[0].at);
  showToast(`${tracks[index].title} · ${tracks[index].artist}`, "note");
}

function play(index: number, at = 0) {
  trackIndex = index;
  time = at;
  renderAccent();
  renderLyrics();
}

function showToast(text: string, icon: "check" | "note" = "check") {
  const toast = $("#demo-toast");
  toast.querySelector("svg")!.outerHTML = icon === "note" ? icons.musicalNote : icons.checkCircle;
  $("#demo-toast-text").textContent = text;
  toast.classList.add("toast-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("toast-visible"), 1800);
}

function renderLyrics() {
  const track = tracks[trackIndex];
  const wordSynced = track.wordTimed || aiSynced;
  const duet = track.lines.some((line) => line.second);
  const list = $("#lyrics-list");

  wordTimings = [];
  list.innerHTML = track.lines
    .map((line, index) => {
      const end = (track.lines[index + 1]?.at ?? track.duration) - 0.4;
      const text = settings.romanized && line.roman ? line.roman : line.text;
      const fill = (value: string) =>
        wordSynced ? words(value, line, end, index) : escapeHtml(value);
      const className = [
        "lyric-line",
        wordSynced ? "word-synced" : "",
        duet ? (line.second ? "voice-second" : "voice-lead") : "",
      ].join(" ");
      const background = line.background
        ? `<span class="lyric-background">${fill(line.background)}</span>`
        : "";
      const translation =
        settings.translation && line.translation
          ? `<span class="lyric-translation">${escapeHtml(line.translation)}</span>`
          : "";
      return `<p class="${className}"><span class="lyric-main">${fill(text)}</span>${background}${translation}</p>`;
    })
    .join("");

  lineEls = [...list.children] as HTMLElement[];
  list.querySelectorAll<HTMLElement>("[data-word]").forEach((el) => {
    const [index, start, end] = el.dataset.word!.split(":").map(Number);
    (wordTimings[index] ??= []).push({ el, start, end });
  });
  document.querySelectorAll<HTMLElement>("[data-script]").forEach((button) => {
    const selected = (button.dataset.script === "romanized") === settings.romanized;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  activeIndex = -2;
  tick();
}

/** Spreads a line's words over its duration, weighted by length. */
function words(text: string, line: Line, end: number, index: number) {
  const parts = text.split(" ");
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  let cursor = line.at;
  return parts
    .map((part) => {
      const length = ((end - line.at) * part.length) / total;
      const span = `<span class="lyric-word" data-word="${index}:${cursor}:${cursor + length}">${escapeHtml(part)}</span>`;
      cursor += length;
      return span;
    })
    .join(" ");
}

function tick() {
  const index = tracks[trackIndex].lines.findLastIndex((line) => line.at <= time);
  if (index !== activeIndex) {
    activeIndex = index;
    lineEls.forEach((el, i) => {
      el.classList.toggle("active", i === index);
      el.classList.toggle("far", Math.abs(i - Math.max(index, 0)) > 4);
    });
    scrollToActive(!reduceMotion.matches);
  }
  for (const word of wordTimings[index] ?? []) {
    const progress = Math.min(1, Math.max(0, (time - word.start) / (word.end - word.start)));
    word.el.style.setProperty("--word-progress", progress.toFixed(3));
  }
}

function scrollToActive(smooth: boolean) {
  const line = lineEls[Math.max(activeIndex, 0)];
  if (!line) return;
  const list = $("#lyrics-list");
  list.scrollTo({
    top: line.offsetTop - list.clientHeight / 2 + line.offsetHeight / 2,
    behavior: smooth ? "smooth" : "instant",
  });
}

/* ---------- Colour helpers, as in the app ---------- */

function hashHue(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % 360;
}

function hsvToHex(hue: number, saturation: number, value: number) {
  const channel = (n: number) => {
    const k = (n + hue / 60) % 6;
    return value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return toHex([channel(5), channel(3), channel(1)]);
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return toHex([channel(0), channel(8), channel(4)]);
}

function hexToHsv(hex: string) {
  const [r, g, b] = hexChannels(hex).map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return { hue: (hue * 60 + 360) % 360, saturation: max ? delta / max : 0 };
}

/** Dark text on light accents, light text on dark ones, so filled keys stay readable. */
function readableTextOn(hex: string) {
  const [r, g, b] = hexChannels(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#24120c" : "#fff8f0";
}

function hexChannels(hex: string) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex(channels: number[]) {
  return `#${channels
    .map((channel) =>
      Math.round(channel * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
}
