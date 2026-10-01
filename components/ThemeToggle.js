"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

const THEMES = ["light", "dark", "auto"];
const STORAGE_KEY = "dictionary-theme";

function resolveTheme(theme) {
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("auto");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const next = THEMES.includes(stored) ? stored : "auto";
    setTheme(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);

    if (theme !== "auto") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("auto");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return (
    <div
      className={styles.toggle}
      role="group"
      aria-label="Colour theme"
    >
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          className={
            theme === option ? `${styles.button} ${styles.active}` : styles.button
          }
          aria-pressed={theme === option}
          onClick={() => setTheme(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
