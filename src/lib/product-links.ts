/**
 * Destinos de Iruz Connect e Iruz Tracking System.
 * Si cambian los sitios, editar solo estas dos funciones.
 */
export function connectHref(_lang: string): string {
  return "https://connect.iruzlabs.com";
}

export function trackingHref(_lang: string): string {
  return "https://go.iruzlabs.com/+";
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}
