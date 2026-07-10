"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translate, type Lang } from "@/lib/i18n";

export type Theme = "light" | "dark";

interface UiState {
  theme: Theme;
  lang: Lang;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<UiState | null>(null);

const THEME_KEY = "compressly-theme";
const LANG_KEY = "compressly-lang";

export function UiProvider({
  children,
  initialTheme = "dark",
  initialLang = "en",
}: {
  children: ReactNode;
  initialTheme?: Theme;
  initialLang?: Lang;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    const savedTheme = (localStorage.getItem(THEME_KEY) as Theme) || initialTheme;
    const savedLang = (localStorage.getItem(LANG_KEY) as Lang) || initialLang;
    setThemeState(savedTheme);
    setLangState(savedLang);
  }, [initialTheme, initialLang]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((p) => (p === "dark" ? "light" : "dark")),
    [],
  );
  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const value = useMemo<UiState>(
    () => ({ theme, lang, setTheme, toggleTheme, setLang, t }),
    [theme, lang, setTheme, toggleTheme, setLang, t],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi(): UiState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
}
