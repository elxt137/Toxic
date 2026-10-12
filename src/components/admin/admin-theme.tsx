"use client";

import { createContext, useContext, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function AdminThemeProvider({ initialTheme, children }: { initialTheme: Theme; children: React.ReactNode }) {
  const [theme, setTheme] = useState(initialTheme);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      document.cookie = `rc2_admin_theme=${next}; Path=/admin; Max-Age=31536000; SameSite=Lax`;
    } catch {
      // A blocked preference cookie must not prevent changing the current theme.
    }
  }
  return <ThemeContext.Provider value={{ theme, toggle }}><div className="admin-layout" data-admin-theme={theme}>{children}</div></ThemeContext.Provider>;
}

export function AdminThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("AdminThemeToggle requires AdminThemeProvider");
  const dark = context.theme === "dark";
  return <button className="admin-theme-toggle" type="button" role="switch" aria-label="Modo oscuro" aria-checked={dark} onClick={context.toggle}>
    <span className="admin-theme-track" aria-hidden="true"><span className="admin-theme-thumb">{dark ? <Moon size={14} /> : <Sun size={14} />}</span></span>
    <span>Modo oscuro</span>
  </button>;
}
