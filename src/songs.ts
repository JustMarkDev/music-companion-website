import type { Lang } from "./i18n";

/**
 * The demo's playlist. Each song shows off one feature: the page's own language timed word
 * by word, romanization, AI word sync, and translation. The lyrics are original, written for
 * this page.
 */

export type Line = {
  /** Seconds from the start of the track. */
  at: number;
  text: string;
  roman?: string;
  translation?: string;
  /** Background vocals, shown smaller under the line. */
  background?: string;
  /** Sung by the second voice of a duet, so it sits on the right. */
  second?: boolean;
};

export type Track = {
  title: string;
  artist: string;
  duration: number;
  /** lrc.red times every word of some songs; the rest are line-timed until AI sync runs. */
  wordTimed: boolean;
  lines: Line[];
};

const OWN_LANGUAGE: Record<Lang, Track> = {
  en: {
    title: "Midnight Driver",
    artist: "Neon Harbor",
    duration: 29,
    wordTimed: true,
    lines: [
      { at: 1, text: "Headlights on the empty road" },
      { at: 4.4, text: "Radio low, the city glows", background: "city glows" },
      { at: 7.8, text: "I can hear you through the static", second: true },
      { at: 11.2, text: "Every word is coming home", second: true },
      { at: 14.6, text: "Hold the wheel and hum along", background: "hum along" },
      { at: 18, text: "Midnight driver, sing it slow" },
      { at: 21.4, text: "Every light turns green for us", second: true },
      { at: 24.8, text: "Sing it till the morning shows" },
    ],
  },
  it: {
    title: "Strade di notte",
    artist: "Lia Ferraro",
    duration: 29,
    wordTimed: true,
    lines: [
      { at: 1, text: "Le luci della strada" },
      { at: 4.4, text: "scorrono sul vetro" },
      { at: 7.8, text: "la radio canta piano", second: true },
      { at: 11.2, text: "e ti sento ancora", second: true },
      { at: 14.6, text: "Guido fino all'alba", background: "fino all'alba" },
      { at: 18, text: "con te nella mente" },
      { at: 21.4, text: "ogni semaforo è verde", second: true },
      { at: 24.8, text: "se cantiamo insieme", background: "insieme" },
    ],
  },
};

const ROMANIZED: Track = {
  title: "夜明けの列車",
  artist: "Hoshino Rei",
  duration: 26,
  wordTimed: true,
  lines: [
    { at: 1, text: "窓の外に 星が流れる", roman: "mado no soto ni hoshi ga nagareru" },
    { at: 4.4, text: "君の声が まだ聞こえる", roman: "kimi no koe ga mada kikoeru" },
    { at: 7.8, text: "夜明けの列車に 乗って", roman: "yoake no ressha ni notte" },
    { at: 11.2, text: "遠くへ 行こう", roman: "tooku e ikou" },
    { at: 14.6, text: "眠らない 街を越えて", roman: "nemuranai machi wo koete" },
    { at: 18, text: "明日の歌を 歌おう", roman: "ashita no uta wo utaou" },
    { at: 21.4, text: "光の中で 待ってる", roman: "hikari no naka de matteru" },
  ],
};

/** Line-timed until "Sync words with AI" is on, in the page's language. */
const LINE_TIMED: Record<Lang, Track> = {
  en: {
    title: "Paper Planes",
    artist: "The Quiet Hours",
    duration: 25,
    wordTimed: false,
    lines: [
      { at: 1, text: "Folded all my letters into planes" },
      { at: 4.8, text: "Threw them from the window in the rain" },
      { at: 8.6, text: "Some will land on rooftops far away" },
      { at: 12.4, text: "Some will find you anyway" },
      { at: 16.2, text: "Paper planes, paper planes", background: "paper planes" },
      { at: 20, text: "Carry every word I couldn't say" },
    ],
  },
  it: {
    title: "Aeroplani di carta",
    artist: "Le Ore Quiete",
    duration: 25,
    wordTimed: false,
    lines: [
      { at: 1, text: "Ho piegato le mie lettere" },
      { at: 4.8, text: "in aeroplani di carta" },
      { at: 8.6, text: "li ho lanciati dalla finestra" },
      { at: 12.4, text: "sotto la pioggia di marzo" },
      { at: 16.2, text: "qualcuno arriverà lontano", background: "lontano" },
      { at: 20, text: "qualcuno arriverà da te" },
    ],
  },
};

/** A Spanish song with its translation into the page's language. */
const TRANSLATED = {
  title: "Sal de mar",
  artist: "Inés Calvo",
  duration: 25,
  lines: [
    {
      at: 1,
      text: "Camino descalza por la orilla",
      en: "I walk barefoot along the shore",
      it: "Cammino scalza lungo la riva",
    },
    {
      at: 4.8,
      text: "el viento me trae tu canción",
      en: "the wind brings me your song",
      it: "il vento mi porta la tua canzone",
    },
    {
      at: 8.6,
      text: "las olas borran mis pasos",
      en: "the waves wash away my footsteps",
      it: "le onde cancellano i miei passi",
    },
    { at: 12.4, text: "pero no tu voz", en: "but not your voice", it: "ma non la tua voce" },
    {
      at: 16.2,
      text: "sal de mar en la piel",
      en: "sea salt on my skin",
      it: "sale di mare sulla pelle",
    },
    {
      at: 20,
      text: "luz de luna en el corazón",
      en: "moonlight in my heart",
      it: "luce di luna nel cuore",
    },
  ],
};

export function playlist(lang: Lang): Track[] {
  return [
    OWN_LANGUAGE[lang],
    ROMANIZED,
    LINE_TIMED[lang],
    {
      ...TRANSLATED,
      wordTimed: true,
      lines: TRANSLATED.lines.map(({ at, text, ...translations }) => ({
        at,
        text,
        translation: translations[lang],
      })),
    },
  ];
}
