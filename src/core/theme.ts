export type Theme = "dark" | "light";

export function getStoredTheme(): Theme {
  const t = localStorage.getItem("vehof-theme");
  return t === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
    localStorage.setItem("vehof-theme", "dark");
  } else {
    root.classList.remove("dark");
    localStorage.setItem("vehof-theme", "light");
  }
}
