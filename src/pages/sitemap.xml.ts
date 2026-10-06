import type { APIRoute } from "astro";
import { getArticles, getTeamMembers } from "../lib/strapi";

export const prerender = false;

const STATIC_PATHS = ["", "acerca", "privacidad", "terminos"];
const LANGS = ["es", "en"] as const;

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(
  loc: URL,
  alternates: { hreflang: string; href: URL }[],
  lastmod?: string,
): string {
  const altLinks = alternates
    .map(
      (alt) =>
        `\n    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${xmlEscape(alt.href.toString())}" />`,
    )
    .join("");
  return `  <url>
    <loc>${xmlEscape(loc.toString())}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}${altLinks}
  </url>`;
}

export const GET: APIRoute = async ({ site, locals }) => {
  const base = site ?? new URL("https://iruzlabs.com");
  const entries: string[] = [];

  for (const path of STATIC_PATHS) {
    const esHref = new URL(path ? `/es/${path}` : "/es/", base);
    const enHref = new URL(path ? `/en/${path}` : "/en/", base);
    const alternates = [
      { hreflang: "es", href: esHref },
      { hreflang: "en", href: enHref },
    ];
    entries.push(urlEntry(esHref, alternates));
    entries.push(urlEntry(enHref, alternates));
  }

  const blogIndexEs = new URL("/es/blog", base);
  const blogIndexEn = new URL("/en/blog", base);
  const blogAlternates = [
    { hreflang: "es", href: blogIndexEs },
    { hreflang: "en", href: blogIndexEn },
  ];
  entries.push(urlEntry(blogIndexEs, blogAlternates));
  entries.push(urlEntry(blogIndexEn, blogAlternates));

  try {
    const [esArticles, enArticles] = await Promise.all(
      LANGS.map((lang) => getArticles({ locals, lang })),
    );
    const enSlugs = new Set(enArticles.map((a) => a.slug));
    const esSlugs = new Set(esArticles.map((a) => a.slug));

    for (const article of esArticles) {
      if (!article.publishedAt || article.seo?.noIndex) continue;
      const esHref = new URL(`/es/blog/${article.slug}`, base);
      const enHref = new URL(`/en/blog/${article.slug}`, base);
      const alternates = [
        { hreflang: "es", href: esHref },
        ...(enSlugs.has(article.slug) ? [{ hreflang: "en", href: enHref }] : []),
      ];
      entries.push(urlEntry(esHref, alternates, article.updatedAt?.slice(0, 10)));
    }

    for (const article of enArticles) {
      if (!article.publishedAt || article.seo?.noIndex) continue;
      const enHref = new URL(`/en/blog/${article.slug}`, base);
      const esHref = new URL(`/es/blog/${article.slug}`, base);
      const alternates = [
        ...(esSlugs.has(article.slug) ? [{ hreflang: "es", href: esHref }] : []),
        { hreflang: "en", href: enHref },
      ];
      entries.push(urlEntry(enHref, alternates, article.updatedAt?.slice(0, 10)));
    }
  } catch {
    // Si Strapi no responde, el sitemap igual sale con las rutas estaticas.
  }

  try {
    const [esMembers, enMembers] = await Promise.all(
      LANGS.map((lang) => getTeamMembers({ locals, lang })),
    );
    const enSlugs = new Set(enMembers.map((m) => m.slug));
    const esSlugs = new Set(esMembers.map((m) => m.slug));

    for (const member of esMembers) {
      const esHref = new URL(`/es/equipo/${member.slug}`, base);
      const enHref = new URL(`/en/equipo/${member.slug}`, base);
      const alternates = [
        { hreflang: "es", href: esHref },
        ...(enSlugs.has(member.slug) ? [{ hreflang: "en", href: enHref }] : []),
      ];
      entries.push(urlEntry(esHref, alternates, member.updatedAt?.slice(0, 10)));
    }

    for (const member of enMembers) {
      const enHref = new URL(`/en/equipo/${member.slug}`, base);
      const esHref = new URL(`/es/equipo/${member.slug}`, base);
      const alternates = [
        ...(esSlugs.has(member.slug) ? [{ hreflang: "es", href: esHref }] : []),
        { hreflang: "en", href: enHref },
      ];
      entries.push(urlEntry(enHref, alternates, member.updatedAt?.slice(0, 10)));
    }
  } catch {
    // Si Strapi no responde, el sitemap igual sale con las rutas estaticas.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
};
