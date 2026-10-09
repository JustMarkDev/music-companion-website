/**
 * Visitors in Italy get Italian, everyone else English. The time zone is the location
 * signal: it needs no request and no permission, and it is known before the first paint.
 */
const ITALIAN_TIME_ZONES = ["Europe/Rome", "Europe/San_Marino", "Europe/Vatican"];

export type Lang = "en" | "it";

export const lang: Lang = ITALIAN_TIME_ZONES.includes(
  Intl.DateTimeFormat().resolvedOptions().timeZone,
)
  ? "it"
  : "en";

const en = {
  title: "Music Companion: synced lyrics over everything",
  description:
    "A free, open-source lyrics overlay for Windows. It follows whatever you're playing and shows synced lyrics in a window that stays on top.",
  home: "Music Companion home",
  github: "View on GitHub",
  download: (os: string) => `Download for ${os}`,
  comingSoon: (os: string) => `${os} support coming soon`,
  eyebrow: "Free and open source",
  headline: "Synced lyrics, floating over everything.",
  lede: "Music Companion follows whatever you're playing and shows its lyrics in a small window that stays on top.",
  demoLabel: "Interactive demo",
  demoCaption: "This is the real settings window. Change anything and the lyrics follow.",
  playersTitle: "Works with the player you already use.",
  playersBody:
    "If it shows up in your system's media controls, Music Companion follows it, whether it's a desktop app or a browser tab.",
  playersLabel: "Supported players include",
  openTitle: "Free, with nothing to unlock.",
  openBody:
    "No account, no ads, no telemetry. The source is on GitHub under GPL-3.0, so you can read it, change it, or build it yourself.",
  license: "GPL-3.0 license",
  credit: "Lyrics from",
  notAffiliated: "Not affiliated with any of the players above.",
  footerLabel: "Footer",
  releases: "All releases",
  licenseLink: "License",
  issues: "Report an issue",

  overlayLabel: "Lyrics overlay",
  settingsLabel: "Settings window",
  sections: "Settings sections",
  tabs: { look: "Look", lyrics: "Lyrics", shortcuts: "Shortcuts", general: "General" },
  background: "Background",
  blur: "Blur",
  textSize: "Text size",
  lineSpacing: "Line spacing",
  accent: "Accent colour",
  wheel: "Drag to pick a colour",
  presets: "Accent colour presets",
  usePreset: (color: string) => `Use ${color}`,
  hex: "Accent colour hex value",
  dynamic: "Change with every song",
  dynamicHint: "Picks a fresh colour for each track",
  glass: "Overlay glass",
  materials: {
    windows: {
      acrylic: ["Acrylic", "Live frosted-glass blur of windows behind the overlay."],
      mica: ["Mica", "Efficient opaque backdrop tinted from your desktop wallpaper."],
    },
    macos: {
      acrylic: [
        "Clear",
        "Lightly frosted glass that reveals more of the windows behind the overlay.",
      ],
      mica: ["Regular", "Standard glass with a heavier frosted finish."],
    },
  },
  script: "How lyrics are written",
  original: "Original",
  originalHint: "As the artist wrote them",
  romanized: "Romanized",
  romanizedHint: "In Latin letters, when the song has them",
  translation: "Show translation",
  translationHint: "A second line under each lyric, when there is one",
  wordSync: "Sync words with AI",
  wordSyncHint: "Lights up each word as it's sung. The first time takes about 10 seconds per song.",
  hotkeys: {
    pinned: ["Pin overlay", "Clicks go through it"],
    playPause: ["Play / pause", ""],
    next: ["Next song", ""],
    previous: ["Previous song", ""],
  },
  recordHotkey: (label: string) => `${label} shortcut`,
  resetHotkey: "Reset to default",
  pressKeys: "Press keys…",
  hotkeyTip: "Press one to try it on the overlay. Click one and press your new combo to change it.",
  syncing: "Syncing words",
  login: "Open at login",
  loginHint: (os: string) => `Start with ${os}, so lyrics are there when music is`,
  saved: "Saved lyrics",
  savedHint: "Kept on this device, so songs load instantly",
  clear: "Clear",
  toasts: {
    cleared: "Saved lyrics cleared",
    pinned: "Pinned. Clicks go through it",
    unpinned: "Unpinned",
    playing: "Playing",
    paused: "Paused",
  },
};

const it: typeof en = {
  title: "Music Companion: testi sincronizzati sopra a tutto",
  description:
    "Un overlay di testi gratuito e open source per Windows. Segue quello che stai ascoltando e mostra il testo sincronizzato in una finestra sempre in primo piano.",
  home: "Home di Music Companion",
  github: "Vedi su GitHub",
  download: (os) => `Scarica per ${os}`,
  comingSoon: (os) => `Supporto per ${os} in arrivo`,
  eyebrow: "Gratis e open source",
  headline: "Testi sincronizzati, sempre in primo piano.",
  lede: "Music Companion segue quello che stai ascoltando e ne mostra il testo in una piccola finestra che resta sopra le altre.",
  demoLabel: "Demo interattiva",
  demoCaption:
    "Questa è la vera finestra delle impostazioni. Cambia qualcosa e il testo si aggiorna.",
  playersTitle: "Funziona con il player che usi già.",
  playersBody:
    "Se compare nei controlli multimediali del sistema, Music Companion lo segue, che sia un'app o una scheda del browser.",
  playersLabel: "Tra i player supportati",
  openTitle: "Gratis, senza niente da sbloccare.",
  openBody:
    "Niente account, niente pubblicità, nessuna telemetria. Il codice è su GitHub con licenza GPL-3.0: puoi leggerlo, modificarlo o compilarlo da te.",
  license: "Licenza GPL-3.0",
  credit: "Testi da",
  notAffiliated: "Non affiliato con nessuno dei player qui sopra.",
  footerLabel: "Piè di pagina",
  releases: "Tutte le versioni",
  licenseLink: "Licenza",
  issues: "Segnala un problema",

  overlayLabel: "Overlay dei testi",
  settingsLabel: "Finestra delle impostazioni",
  sections: "Sezioni delle impostazioni",
  tabs: { look: "Aspetto", lyrics: "Testi", shortcuts: "Scorciatoie", general: "Generali" },
  background: "Sfondo",
  blur: "Sfocatura",
  textSize: "Dimensione testo",
  lineSpacing: "Interlinea",
  accent: "Colore d'accento",
  wheel: "Trascina per scegliere un colore",
  presets: "Colori d'accento predefiniti",
  usePreset: (color) => `Usa ${color}`,
  hex: "Valore esadecimale del colore d'accento",
  dynamic: "Cambia a ogni canzone",
  dynamicHint: "Sceglie un colore nuovo per ogni brano",
  glass: "Effetto vetro",
  materials: {
    windows: {
      acrylic: ["Acrylic", "Sfocatura dal vivo delle finestre dietro l'overlay."],
      mica: ["Mica", "Fondo opaco ed efficiente, colorato dallo sfondo del desktop."],
    },
    macos: {
      acrylic: [
        "Trasparente",
        "Vetro leggermente smerigliato che lascia vedere le finestre dietro.",
      ],
      mica: ["Standard", "Vetro classico con una smerigliatura più marcata."],
    },
  },
  script: "Come sono scritti i testi",
  original: "Originale",
  originalHint: "Come li ha scritti l'artista",
  romanized: "Traslitterato",
  romanizedHint: "In caratteri latini, quando la canzone li ha",
  translation: "Mostra traduzione",
  translationHint: "Una seconda riga sotto ogni verso, quando c'è",
  wordSync: "Sincronizza le parole con l'IA",
  wordSyncHint:
    "Illumina ogni parola mentre viene cantata. La prima volta servono circa 10 secondi per canzone.",
  hotkeys: {
    pinned: ["Fissa l'overlay", "I clic lo attraversano"],
    playPause: ["Riproduci / pausa", ""],
    next: ["Canzone successiva", ""],
    previous: ["Canzone precedente", ""],
  },
  recordHotkey: (label) => `Scorciatoia ${label}`,
  resetHotkey: "Ripristina predefinita",
  pressKeys: "Premi i tasti…",
  hotkeyTip:
    "Premine una per provarla sull'overlay. Cliccane una e premi la nuova combinazione per cambiarla.",
  syncing: "Sincronizzo le parole",
  login: "Apri all'avvio",
  loginHint: (os) => `Si avvia con ${os}, così i testi ci sono quando c'è la musica`,
  saved: "Testi salvati",
  savedHint: "Conservati su questo dispositivo, così le canzoni si caricano subito",
  clear: "Svuota",
  toasts: {
    cleared: "Testi salvati eliminati",
    pinned: "Fissato. I clic lo attraversano",
    unpinned: "Sbloccato",
    playing: "In riproduzione",
    paused: "In pausa",
  },
};

export const t = lang === "it" ? it : en;
