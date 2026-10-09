/** Ported from music-companion src/hotkeys.ts and src/settings.ts. */

export type Platform = "windows" | "macos";
export type HotkeyAction = "pinned" | "playPause" | "next" | "previous";

// macOS reserves Ctrl+Arrow for Mission Control, so the transport shortcuts add
// Command. Super is the accelerator name the global-shortcut plugin expects.
export const DEFAULT_HOTKEYS: Record<Platform, Record<HotkeyAction, string>> = {
  windows: {
    pinned: "Ctrl+Shift+KeyL",
    playPause: "Ctrl+Shift+Space",
    next: "Ctrl+ArrowRight",
    previous: "Ctrl+ArrowLeft",
  },
  macos: {
    pinned: "Shift+Super+KeyL",
    playPause: "Shift+Super+Space",
    next: "Ctrl+Super+ArrowRight",
    previous: "Ctrl+Super+ArrowLeft",
  },
};

type KeyboardShortcut = Pick<KeyboardEvent, "ctrlKey" | "shiftKey" | "altKey" | "metaKey" | "code">;

/** Modifier order matches the accelerator grammar the global-shortcut plugin parses. */
export function keyboardEventToAccelerator(event: KeyboardShortcut) {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.shiftKey) parts.push("Shift");
  if (event.altKey) parts.push("Alt");
  if (event.metaKey) parts.push("Super");
  parts.push(event.code);
  return parts.join("+");
}

const MACOS_SYMBOLS: Record<string, string> = { Ctrl: "⌃", Alt: "⌥", Shift: "⇧", Super: "⌘" };
const MACOS_MODIFIER_ORDER = ["Super", "Ctrl", "Alt", "Shift"];
const ARROWS: Record<string, string> = {
  ArrowRight: "→",
  ArrowLeft: "←",
  ArrowUp: "↑",
  ArrowDown: "↓",
};

/** One label per key, with Command first on macOS as in the app's keycaps. */
export function acceleratorKeys(accelerator: string, platform: Platform) {
  const parts = accelerator
    .split("+")
    .map((part) => ARROWS[part] ?? part.replace(/^(Key|Digit)/, ""));
  if (platform !== "macos") return parts.map((part) => (part === "Super" ? "Win" : part));
  const modifiers = MACOS_MODIFIER_ORDER.filter((modifier) => parts.includes(modifier));
  const keys = parts.filter((part) => !(part in MACOS_SYMBOLS));
  return [...modifiers.map((modifier) => MACOS_SYMBOLS[modifier]), ...keys];
}
