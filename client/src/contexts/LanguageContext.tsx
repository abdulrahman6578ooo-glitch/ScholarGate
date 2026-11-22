import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Language = "ar" | "en";
interface LanguageValue {
  lang: Language;
  isArabic: boolean;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    try {
      return localStorage.getItem("scholargate:language") === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.dataset.language = lang;
    try {
      localStorage.setItem("scholargate:language", lang);
    } catch {
      // Language still works when storage is unavailable.
    }
  }, [lang]);

  const value = useMemo<LanguageValue>(() => ({
    lang,
    isArabic: lang === "ar",
    toggleLanguage: () => setLang(current => current === "ar" ? "en" : "ar"),
  }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
