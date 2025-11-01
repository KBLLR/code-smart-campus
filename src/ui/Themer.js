// src/ui/Themer.js

export class Themer {
  static setTheme(dark = false) {
    document.body.classList.toggle("dark", dark);
    const root = document.documentElement;

    if (dark) {
      root.style.setProperty("--bg", "rgba(15,15,15,0.75)");
      root.style.setProperty("--fg", "#eee");
      root.style.setProperty("--glass", "rgba(255, 255, 255, 0.06)");
      root.style.setProperty("--shadow", "rgba(0,0,0,0.4)");
    } else {
      root.style.setProperty("--bg", "rgba(255,255,255,0.95)");
      root.style.setProperty("--fg", "#111");
      root.style.setProperty("--glass", "rgba(255,255,255,0.6)");
      root.style.setProperty("--shadow", "rgba(0,0,0,0.15)");
    }
  }
}
