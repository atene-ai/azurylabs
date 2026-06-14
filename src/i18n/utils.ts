import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

// UI config
export const ui = {
  en: {},
  es: {},
};

export const defaultLang = "en";
export const showDefaultLang = true;

// Helper to get lang from url
export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

// Cache for translations
let translationsCache: Record<string, any> = {};

export function useTranslations(lang: string) {
  // In development, we want to reload translations on every request
  // In production, we can use the cache
  const isDev = import.meta.env.DEV;
  if (!translationsCache[lang] || isDev) {
    try {
      const filePath = path.join(process.cwd(), "src", "i18n", `${lang}.yaml`);
      const fileContents = fs.readFileSync(filePath, "utf8");
      translationsCache[lang] = yaml.load(fileContents);
    } catch (e) {
      console.error(`Error loading translations for ${lang}:`, e);
      return (key: string) => key;
    }
  }

  const translations = translationsCache[lang];

  return function t(key: string): any {
    const keys = key.split(".");
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
}
