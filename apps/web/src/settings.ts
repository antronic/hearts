import { createEffect, createRoot, createSignal } from "solid-js";
import { defaultSettings, type Settings } from "@hearts/ui";

const KEY = "hearts:settings";

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

export const { settings, setSettings } = createRoot(() => {
  const [settings, set] = createSignal<Settings>(load());
  const setSettings = (patch: Partial<Settings>) => set({ ...settings(), ...patch });
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  const [systemDark, setSystemDark] = createSignal(dark.matches);
  dark.addEventListener("change", (e) => setSystemDark(e.matches));
  createEffect(() => {
    const s = settings();
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
    const root = document.documentElement;
    root.dataset.theme = s.theme;
    const mode = s.mode === "system" ? (systemDark() ? "dark" : "light") : s.mode;
    root.dataset.mode = mode;
    root.style.colorScheme = mode;
    root.classList.toggle("reduce-motion", s.reduceMotion);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", getComputedStyle(root).getPropertyValue("--bg").trim() || "#0f3d27");
  });
  return { settings, setSettings };
});

/** Random id kept on this device so a refresh or reconnect keeps your seat. */
export function clientId(): string {
  try {
    let id = localStorage.getItem("hearts:client");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("hearts:client", id);
    }
    return id;
  } catch {
    return (window as any).__hid ??= crypto.randomUUID();
  }
}
