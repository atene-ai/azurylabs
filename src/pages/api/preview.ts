import type { APIRoute } from "astro";
import { getEnv } from "../../lib/strapi";

export const prerender = false;

/** Comparacion en tiempo constante: evita filtrar el secreto byte a byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const GET: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const params = new URL(request.url).searchParams;
  const secret = params.get("secret") ?? "";
  const target = params.get("url") ?? "/";
  const status = params.get("status") === "draft" ? "draft" : "published";

  const expected = getEnv(locals, "PREVIEW_SECRET");
  if (!expected || !safeEqual(secret, expected)) {
    return new Response("Invalid preview token", { status: 401 });
  }

  // Solo rutas internas. `//evil.com` es una URL protocol-relative valida
  // para el navegador y convertiria esto en un open redirect.
  if (!target.startsWith("/") || target.startsWith("//")) {
    return new Response("Invalid preview target", { status: 400 });
  }

  // En produccion el admin de Strapi abre esta pagina en un iframe cross-site:
  // ahi hace falta SameSite=None, que el navegador solo acepta junto con
  // Secure. En `astro dev` sobre http esa combinacion se descarta y el
  // preview no funcionaria en local, asi que degradamos a Lax.
  const isHttps = new URL(request.url).protocol === "https:";

  cookies.set("__preview", status, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return redirect(target, 307);
};
