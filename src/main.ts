import "@fontsource-variable/nunito";
import "@fontsource-variable/source-sans-3";
import "./app.css";
import "./style.css";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import {
  siApplemusic,
  siSoundcloud,
  siSpotify,
  siTidal,
  siVlcmediaplayer,
  siYoutubemusic,
} from "simple-icons";
import wallpaper from "./assets/wallpaper.webp";
import { mountDemo, setAppVersion } from "./demo";
import { lang, t } from "./i18n";
import { brandIcon, icons } from "./icons";

const REPO_URL = "https://github.com/JustMarkDev/music-companion";
const RELEASES_URL = `${REPO_URL}/releases/latest`;
const RELEASE_API = "https://api.github.com/repos/JustMarkDev/music-companion/releases/latest";

type OS = "windows" | "macos" | "linux";

// Flip `ready` once a platform ships; the button then links straight to its file.
const DOWNLOADS: Record<OS, { name: string; asset: RegExp; ready: boolean }> = {
  windows: { name: "Windows", asset: /_x64-setup\.exe$/, ready: true },
  macos: { name: "macOS", asset: /\.dmg$/, ready: false },
  linux: { name: "Linux", asset: /\.AppImage$/, ready: false },
};

const PLAYERS = [siSpotify, siApplemusic, siYoutubemusic, siSoundcloud, siTidal, siVlcmediaplayer];

/** Phones and tablets cannot run it, so they get the Windows link to pass along. */
function detectOS(userAgent = navigator.userAgent): OS {
  if (/android|iphone|ipad|ipod/i.test(userAgent)) return "windows";
  if (/mac os x|macintosh/i.test(userAgent)) return "macos";
  if (/linux|x11|cros/i.test(userAgent)) return "linux";
  return "windows";
}

const os = detectOS();
const download = DOWNLOADS[os];

function downloadButton() {
  return download.ready
    ? `<a class="key download" href="${RELEASES_URL}" data-download>${icons.arrowDownTray}${t.download(download.name)}</a>`
    : `<span class="key download" aria-disabled="true">${t.comingSoon(download.name)}</span>`;
}

const githubButton = `<a class="key secondary" href="${REPO_URL}">${icons.github}${t.github}</a>`;

document.documentElement.lang = lang;
document.title = t.title;
document.querySelector('meta[name="description"]')?.setAttribute("content", t.description);

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <header class="nav">
    <a class="brand" href="/" aria-label="${t.home}">
      <img src="/icon.png" alt="" width="32" height="32" />
      <span>Music Companion</span>
    </a>
    <a class="key icon-key" href="${REPO_URL}" aria-label="${t.github}" title="${t.github}">${icons.github}</a>
  </header>

  <main>
    <section class="hero">
      <p class="eyebrow">${t.eyebrow}</p>
      <h1>${t.headline}</h1>
      <p class="lede">${t.lede}</p>
      <div class="actions">
        ${downloadButton()}
        ${githubButton}
      </div>
    </section>

    <section class="demo-section" aria-label="${t.demoLabel}">
      <div class="demo-stage" id="demo" style="background-image: url(${wallpaper})"></div>
      <p class="demo-caption">${t.demoCaption}</p>
    </section>

    <section class="players reveal">
      <div>
        <h2>${t.playersTitle}</h2>
        <p>${t.playersBody}</p>
      </div>
      <ul class="player-logos" aria-label="${t.playersLabel}">
        ${PLAYERS.map((icon) => `<li title="${icon.title}">${brandIcon(icon)}<span class="visually-hidden">${icon.title}</span></li>`).join("")}
      </ul>
    </section>

    <section class="open-source card reveal">
      <div>
        <h2>${t.openTitle}</h2>
        <p>${t.openBody}</p>
        <div class="actions">
          ${downloadButton()}
          ${githubButton}
        </div>
      </div>
      <a class="repo" href="${REPO_URL}">
        ${icons.github}
        <span><strong>JustMarkDev/music-companion</strong><small>${t.license}</small></span>
      </a>
    </section>
  </main>

  <footer class="footer">
    <span>${t.credit} <a href="https://lrc.red/">lrc.red</a>. ${t.notAffiliated}</span>
    <nav aria-label="${t.footerLabel}">
      <a href="${REPO_URL}/releases">${t.releases}</a>
      <a href="${REPO_URL}/blob/main/LICENSE">${t.licenseLink}</a>
      <a href="${REPO_URL}/issues">${t.issues}</a>
    </nav>
  </footer>
`;

mountDemo(document.querySelector<HTMLElement>("#demo")!);

// Until the API answers (or if it is rate limited) the button opens the release page.
void fetch(RELEASE_API)
  .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
  .then(
    (release: { tag_name: string; assets: { name: string; browser_download_url: string }[] }) => {
      setAppVersion(release.tag_name.replace(/^v/, ""));
      const asset = release.assets.find((file) => download.asset.test(file.name));
      if (!download.ready || !asset) return;
      document.querySelectorAll<HTMLAnchorElement>("[data-download]").forEach((link) => {
        link.href = asset.browser_download_url;
        link.title = `${asset.name}`;
      });
    },
  )
  .catch(() => {});

const revealer = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("revealed");
      revealer.unobserve(entry.target);
    }),
  { threshold: 0.2 },
);
document.querySelectorAll(".reveal").forEach((section) => revealer.observe(section));

inject();
injectSpeedInsights();
