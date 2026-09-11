/**
 * Cliente de la API de Strapi (cms.azurylabs.com).
 *
 * Un solo token, a proposito. Verificado contra la instancia: un token
 * Read-only devuelve borradores en cuanto se le pasa `status=draft`, asi
 * que en Strapi 5 no existe un token que solo vea contenido publicado.
 *
 * La proteccion real es esta: el token vive unicamente en el servidor y
 * `status: 'draft'` solo se pide cuando la cookie `__preview` ya paso por
 * /api/preview, que valida el secreto compartido con Strapi.
 */

/** Astro rutea con `es`/`en`; Strapi guarda `es-MX`/`en`. */
export const STRAPI_LOCALE: Record<string, string> = {
  es: "es-MX",
  en: "en",
};

export type StrapiImage = {
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
};

export type BlockNode = {
  type: string;
  children?: BlockNode[];
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  level?: number;
  format?: "ordered" | "unordered";
  url?: string;
  image?: StrapiImage;
};

export type Article = {
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: BlockNode[];
  readingTime?: number;
  publishedAt: string | null;
  updatedAt: string;
  cover?: StrapiImage | null;
  author?: {
    name: string;
    slug: string;
    role?: string;
    avatar?: StrapiImage | null;
  } | null;
  categories?: { name: string; slug: string }[];
  seo?: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    ogImage?: StrapiImage | null;
  } | null;
};

export type SocialLink = {
  platform: "x" | "linkedin" | "github" | "instagram" | "youtube" | "website";
  url: string;
};

export type Project = {
  name: string;
  description?: string;
  url?: string;
};

export type ExperienceEntry = {
  company: string;
  companyUrl?: string;
  companyLogo?: StrapiImage | null;
  role: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  /** Un bullet por linea. */
  highlights?: string;
  /** Lista separada por comas. */
  techStack?: string;
  projects?: Project[];
};

export type Stat = {
  value: string;
  label: string;
};

export type SkillGroup = {
  title: string;
  /** Lista separada por comas. */
  items: string;
};

export type Degree = {
  institution: string;
  degree: string;
  startYear?: string;
  endYear?: string;
};

export type Certification = {
  name: string;
  issuer?: string;
  year?: string;
  url?: string;
  featured?: boolean;
};

export type TeamMember = {
  documentId: string;
  name: string;
  slug: string;
  role: string;
  bio: string;
  avatar?: StrapiImage | null;
  email?: string | null;
  socials?: SocialLink[];
  order: number;
  updatedAt: string;
  previousCompanies?: string | null;
  tagline?: string | null;
  stats?: Stat[];
  experience?: ExperienceEntry[];
  techStack?: string | null;
  skillGroups?: SkillGroup[];
  education?: Degree[];
  certifications?: Certification[];
  githubUsername?: string | null;
  phone?: string | null;
  location?: string | null;
  resume?: { url: string; name?: string } | null;
  contactIntro?: string | null;
};

/**
 * En Cloudflare los secretos llegan por el runtime, no por import.meta.env.
 * En `astro dev` pasa lo contrario, asi que probamos ambos.
 */
export function getEnv(locals: unknown, key: string): string {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })
    ?.runtime?.env;
  return runtimeEnv?.[key] ?? (import.meta.env as Record<string, any>)[key] ?? "";
}

/** Las imagenes vienen con ruta relativa salvo que uses un proveedor externo. */
export function mediaUrl(base: string, url: string | undefined): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `${base}${url}`;
}

const ARTICLE_POPULATE = [
  "populate[cover]=true",
  "populate[categories]=true",
  "populate[author][populate][avatar]=true",
  "populate[seo][populate][ogImage]=true",
].join("&");

type FetchOptions = {
  locals: unknown;
  lang: string;
  /** Solo debe llegar `draft` desde una peticion con cookie de preview valida. */
  status?: "published" | "draft";
};

function resolve(opts: FetchOptions) {
  const base = getEnv(opts.locals, "STRAPI_URL").replace(/\/$/, "");
  const token = getEnv(opts.locals, "STRAPI_TOKEN");
  const locale = STRAPI_LOCALE[opts.lang] ?? STRAPI_LOCALE.es;
  return { base, token, locale, isDraft: opts.status === "draft" };
}

async function call<T>(url: string, token: string): Promise<T | null> {
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    console.error(`[strapi] ${res.status} ${res.statusText} -> ${url}`);
    return null;
  }

  const json = (await res.json()) as { data: T };
  return json.data;
}

const TEAM_MEMBER_POPULATE = [
  "populate[avatar]=true",
  "populate[socials]=true",
  "populate[stats]=true",
  "populate[experience][populate][companyLogo]=true",
  "populate[experience][populate][projects]=true",
  "populate[skillGroups]=true",
  "populate[education]=true",
  "populate[certifications]=true",
  "populate[resume]=true",
].join("&");

export async function getTeamMembers(opts: FetchOptions): Promise<TeamMember[]> {
  const { base, token, locale, isDraft } = resolve(opts);

  const url =
    `${base}/api/team-members?locale=${locale}` +
    `&filters[featured][$eq]=true` +
    `&sort[0]=order:asc` +
    `&${TEAM_MEMBER_POPULATE}` +
    (isDraft ? "&status=draft" : "");

  return (await call<TeamMember[]>(url, token)) ?? [];
}

export async function getTeamMemberBySlug(
  slug: string,
  opts: FetchOptions,
): Promise<TeamMember | null> {
  const { base, token, locale, isDraft } = resolve(opts);

  const url =
    `${base}/api/team-members?locale=${locale}` +
    `&filters[slug][$eq]=${encodeURIComponent(slug)}` +
    `&${TEAM_MEMBER_POPULATE}` +
    (isDraft ? "&status=draft" : "");

  const data = await call<TeamMember[]>(url, token);
  return data?.[0] ?? null;
}

export async function getArticles(opts: FetchOptions): Promise<Article[]> {
  const { base, token, locale, isDraft } = resolve(opts);

  const url =
    `${base}/api/articles?locale=${locale}` +
    `&sort[0]=publishedAt:desc` +
    `&${ARTICLE_POPULATE}` +
    (isDraft ? "&status=draft" : "");

  return (await call<Article[]>(url, token)) ?? [];
}

/**
 * Existe una version publicada de este slug?
 *
 * Con `status=draft` Strapi devuelve la entrada borrador, cuyo `publishedAt`
 * es null siempre, incluso si el documento ya esta publicado. Para separar
 * "nunca publicado" de "borrador de algo ya en vivo" hay que preguntar por la
 * version publicada por separado. Se piden solo publishedAt y una fila.
 */
export async function hasPublishedVersion(
  slug: string,
  opts: FetchOptions,
): Promise<boolean> {
  const { base, token, locale } = resolve(opts);

  const url =
    `${base}/api/articles?locale=${locale}` +
    `&filters[slug][$eq]=${encodeURIComponent(slug)}` +
    `&fields[0]=publishedAt` +
    `&pagination[pageSize]=1`;

  const data = await call<{ publishedAt: string | null }[]>(url, token);
  return Boolean(data?.[0]?.publishedAt);
}

export async function getArticleBySlug(
  slug: string,
  opts: FetchOptions,
): Promise<Article | null> {
  const { base, token, locale, isDraft } = resolve(opts);

  const url =
    `${base}/api/articles?locale=${locale}` +
    `&filters[slug][$eq]=${encodeURIComponent(slug)}` +
    `&${ARTICLE_POPULATE}` +
    (isDraft ? "&status=draft" : "");

  const data = await call<Article[]>(url, token);
  return data?.[0] ?? null;
}
