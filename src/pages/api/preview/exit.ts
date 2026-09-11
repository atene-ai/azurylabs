import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  cookies.delete("__preview", { path: "/" });

  const target = new URL(request.url).searchParams.get("url") ?? "/";
  const safe = target.startsWith("/") && !target.startsWith("//") ? target : "/";

  return redirect(safe, 307);
};
