import type { Preview } from "storybook-solidjs-vite";
import "../src/styles.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Design theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "glass", title: "Glass (iOS minimal)" },
          { value: "felt", title: "Felt (card room)" },
          { value: "playful", title: "Playful (bold)" },
          { value: "xp", title: "Windows XP (Luna)" },
        ],
        dynamicTitle: true,
      },
    },
    mode: {
      description: "Light or dark",
      toolbar: {
        title: "Mode",
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    textSize: {
      description: "System text size (Dynamic Type / Android font scale)",
      toolbar: {
        title: "Text size",
        icon: "zoom",
        items: [
          { value: "100", title: "Default (100%)" },
          { value: "135", title: "Largest standard (135%)" },
          { value: "200", title: "Accessibility (200%)" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "felt", mode: "light", textSize: "100" },
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    options: {
      storySort: { order: ["Start here", "Accessibility", "Foundations", "Components", "Game", "Screens"] },
    },
  },
  decorators: [
    (Story, ctx) => {
      const root = document.documentElement;
      // forceTheme: story is theme-specific (e.g. the XP desktop).
      // isolateThemes: story renders several themes side by side, so keep the page root neutral
      // (theme rules match ancestors, and XP.css must not leak into the other columns).
      root.dataset.theme = ctx.parameters.forceTheme ?? (ctx.parameters.isolateThemes ? "glass" : (ctx.globals.theme ?? "felt"));
      root.dataset.mode = ctx.globals.mode ?? "light";
      // Simulates the phone's text-size setting: text is rem-based, spacing is px.
      const ts = ctx.parameters.textSize ?? ctx.globals.textSize ?? "100";
      root.style.fontSize = ts === "100" ? "" : `${ts}%`;
      return <Story />;
    },
  ],
};

export default preview;
