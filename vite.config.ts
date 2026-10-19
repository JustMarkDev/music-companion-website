import { defineConfig } from "vite-plus";

/** Fonts and the demo wallpaper are only discovered after the JS builds the page; preload them. */
const preloadCriticalAssets = {
  name: "preload-critical-assets",
  transformIndexHtml(_html: string, ctx: { bundle?: Record<string, unknown> }) {
    return Object.keys(ctx.bundle ?? {}).flatMap((file) => {
      const font = /(nunito|source-sans-3)-latin-wght-normal.*\.woff2$/.test(file);
      if (!font && !/wallpaper.*\.webp$/.test(file)) return [];
      const attrs = font
        ? { as: "font", type: "font/woff2", crossorigin: "" }
        : { as: "image", type: "image/webp" };
      return [
        {
          tag: "link",
          attrs: { rel: "preload", href: `/${file}`, ...attrs },
          injectTo: "head" as const,
        },
      ];
    });
  },
};

export default defineConfig({
  plugins: [preloadCriticalAssets],
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
});
