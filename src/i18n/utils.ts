import yaml from "js-yaml";

/**
 * Las traducciones se inlinean en el bundle durante el build.
 *
 * Antes esto usaba fs.readFileSync(process.cwd() + ...), que solo funciona
 * en build (Node) o en `astro dev`. Cualquier ruta con prerender=false
 * arrastra este modulo al bundle del Worker, y en Cloudflare no existe
 * node:fs ni process.cwd(): el chunk no carga y la ruta responde 500.
 *
 * import.meta.glob resuelve los YAML en tiempo de compilacion, asi que el
 * runtime no toca el sistema de archivos.
 */
const rawTranslations = import.meta.glob("./*.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const translations: Record<string, any> = {};

for (const [filePath, contents] of Object.entries(rawTranslations)) {
  const lang = filePath.replace(/^\.\//, "").replace(/\.yaml$/, "");
  try {
    translations[lang] = yaml.load(contents);
  } catch (e) {
    console.error(`Error parsing translations for ${lang}:`, e);
    translations[lang] = {};
  }
}

// UI config
export const ui = {
  es: {},
  en: {},
};

export const defaultLang = "es";
export const showDefaultLang = true;

// Helper to get lang from url
export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: string) {
  const dict = translations[lang] ?? translations[defaultLang];

  return function t(key: string): any {
    const keys = key.split(".");
    let value: any = dict;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
}
