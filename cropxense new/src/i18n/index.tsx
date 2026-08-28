import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { en, type TranslationKey } from "./en";
import { mr } from "./mr";
import { hi } from "./hi";
import { ta } from "./ta";

export type Lang = "en" | "mr" | "hi" | "ta";

export const LANGS: { code: Lang; label: string; htmlLang: string }[] = [
  { code: "en", label: "English", htmlLang: "en" },
  { code: "mr", label: "मराठी", htmlLang: "mr" },
  { code: "hi", label: "हिन्दी", htmlLang: "hi" },
  { code: "ta", label: "தமிழ்", htmlLang: "ta" },
];

const DICTS: Record<Lang, Record<string, string>> = { en, mr, hi, ta };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  cycle: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("cropxense.lang") as Lang | null;
    if (stored && stored in DICTS) setLang(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("cropxense.lang", lang);
    document.documentElement.lang = LANGS.find((l) => l.code === lang)?.htmlLang ?? "en";
  }, [lang]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let out = DICTS[lang]?.[key] ?? en[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
      }
      return out;
    },
    [lang],
  );

  const cycle = useCallback(() => {
    setLang((cur) => {
      const next = LANGS[(LANGS.findIndex((l) => l.code === cur) + 1) % LANGS.length];
      return next ? next.code : "en";
    });
  }, []);

  const value = useMemo(() => ({ lang, setLang, cycle, t }), [lang, cycle, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return ctx;
}
