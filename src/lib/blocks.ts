/**
 * Convierte el JSON del editor Blocks de Strapi a HTML.
 *
 * Todo el texto pasa por `esc()` antes de concatenarse: el contenido lo
 * escriben editores y termina en un `set:html`, asi que asumirlo confiable
 * seria un XSS almacenado.
 */
import type { BlockNode } from "./strapi";
import { mediaUrl } from "./strapi";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainText(node: BlockNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.children ?? []).map(plainText).join("");
}

/** #Automatización, #IRUZLabs: acepta acentos y numeros, no solo ASCII. */
const HASHTAG = /#([\p{L}\p{N}_]+)/gu;

/**
 * Convierte hashtags en enlaces a la busqueda de X.
 *
 * Opera sobre texto ya escapado: `esc()` solo toca & < > " ', que no forman
 * parte de un hashtag, asi que el match sigue siendo correcto.
 */
function linkifyHashtags(escaped: string): string {
  return escaped.replace(HASHTAG, (_full, tag: string) => {
    const href = `https://x.com/hashtag/${encodeURIComponent(tag)}`;
    return `<a class="hashtag" href="${href}" target="_blank" rel="noopener noreferrer">#${tag}</a>`;
  });
}

function countHashtags(text: string): number {
  return (text.match(HASHTAG) ?? []).length;
}

function renderLeaf(node: BlockNode): string {
  const raw = node.text ?? "";
  if (!raw) return "";

  // Dentro de `code` un # es sintaxis, no una etiqueta: no se linkifica.
  let html = node.code ? esc(raw) : linkifyHashtags(esc(raw));

  // El orden importa: `code` va mas adentro para que el resto lo envuelva.
  if (node.code) html = `<code>${html}</code>`;
  if (node.bold) html = `<strong>${html}</strong>`;
  if (node.italic) html = `<em>${html}</em>`;
  if (node.underline) html = `<u>${html}</u>`;
  if (node.strikethrough) html = `<s>${html}</s>`;
  return html;
}

function renderChildren(nodes: BlockNode[] | undefined, base: string): string {
  return (nodes ?? []).map((node) => renderNode(node, base)).join("");
}

function renderNode(node: BlockNode, base: string): string {
  switch (node.type) {
    case "text":
      return renderLeaf(node);

    case "link": {
      const raw = node.url ?? "";
      // Solo http(s) y rutas internas: `javascript:` seria ejecutable.
      const safe = /^(https?:\/\/|\/)/i.test(raw) ? raw : "#";
      const external = /^https?:\/\//i.test(safe);
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${esc(safe)}"${attrs}>${renderChildren(node.children, base)}</a>`;
    }

    case "paragraph": {
      const inner = renderChildren(node.children, base);
      // Los parrafos vacios son ruido del editor, no contenido.
      if (!inner.trim()) return "";

      // Una linea con varios hashtags es una fila de etiquetas, no prosa.
      // El umbral es 3 y no "solo hashtags" a proposito: los textos pegados
      // de redes suelen traer restos ("Ver menos") junto a las etiquetas.
      const isTagRow = countHashtags(plainText(node)) >= 3;
      return isTagRow ? `<p class="hashtags">${inner}</p>` : `<p>${inner}</p>`;
    }

    case "heading": {
      const level = Math.min(Math.max(node.level ?? 2, 1), 6);
      return `<h${level}>${renderChildren(node.children, base)}</h${level}>`;
    }

    case "list": {
      const tag = node.format === "ordered" ? "ol" : "ul";
      return `<${tag}>${renderChildren(node.children, base)}</${tag}>`;
    }

    case "list-item":
      return `<li>${renderChildren(node.children, base)}</li>`;

    case "quote":
      return `<blockquote>${renderChildren(node.children, base)}</blockquote>`;

    case "code":
      return `<pre><code>${esc(plainText(node))}</code></pre>`;

    case "image": {
      const img = node.image;
      if (!img?.url) return "";
      const src = esc(mediaUrl(base, img.url));
      const alt = esc(img.alternativeText ?? "");
      const dims =
        img.width && img.height
          ? ` width="${img.width}" height="${img.height}"`
          : "";
      return `<figure><img src="${src}" alt="${alt}"${dims} loading="lazy" decoding="async" /></figure>`;
    }

    default:
      return renderChildren(node.children, base);
  }
}

export function renderBlocks(
  nodes: BlockNode[] | undefined,
  strapiBase: string,
): string {
  if (!Array.isArray(nodes)) return "";
  return nodes.map((node) => renderNode(node, strapiBase)).join("");
}
