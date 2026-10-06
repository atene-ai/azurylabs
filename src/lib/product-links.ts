/**
 * Destinos de Iruz Connect e Iruz Tracking System.
 * Cuando existan sus sitios, cambiar solo estas dos funciones.
 * Mientras tanto llevan a la pagina de contacto de la propia landing.
 */
export function connectHref(lang: string): string {
  return `/${lang}/contacto`;
}

export function trackingHref(lang: string): string {
  return `/${lang}/contacto`;
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}
