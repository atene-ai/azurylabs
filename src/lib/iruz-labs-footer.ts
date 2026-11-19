/**
 * Footer unificado del grupo Iruz Labs: fuente única de contenido.
 *
 * Este archivo se copia IDÉNTICO en todos los sitios del grupo:
 * iruzlabs (canónico), iruzlabs-systems, iruzlabs-atenea-engine, iruzlabs-crm,
 * iruzlabs-lindex, iruzlabs-ciee, iruzlabs-contractors y azurylabs.
 * Si cambias un enlace, un texto o una insignia, copia el archivo a todos los
 * repos en el mismo cambio.
 *
 * Lo propio de cada sitio (marca, producto destacado, rutas legales) no se
 * escribe aquí: lo declara el componente del footer con un `FooterSite`.
 */

export type FooterLang = "es" | "en";

export type FooterProductId =
  "atenea" | "lindex" | "sales-os" | "mi-negocio" | "ciee" | "systems" | "connect" | "tracking";

export type FooterBrandId = "iruzlabs" | "azurylabs";

export interface FooterLink {
  label: string;
  href: string;
  /** Producto propio del sitio: se muestra primero y destacado. */
  current?: boolean;
  external?: boolean;
}

export interface FooterColumn {
  id: "products" | "company" | "legal";
  heading: string;
  items: FooterLink[];
}

export interface FooterSite {
  /** Marca que firma el footer. Por omisión, Iruz Labs. */
  brand?: FooterBrandId;
  /** Producto propio del sitio: va primero y destacado en «Productos». */
  product?: FooterProductId;
  /**
   * Origen de las páginas de empresa (acerca, contacto, blog). Cadena vacía
   * para rutas relativas del propio sitio. Por omisión, el sitio corporativo.
   */
  companyOrigin?: string;
  /**
   * Avisos legales propios del sitio, solo si existen. `{lang}` se sustituye
   * por el idioma. Por omisión, los del sitio corporativo.
   */
  legal?: { privacy: string; terms: string };
}

const CORPORATE_ORIGIN = "https://iruzlabs.com";

export const footerCopy = {
  es: {
    tagline: "Inteligencia artificial aplicada, productos propios y soluciones a medida.",
    status: "Creando operaciones más inteligentes",
    copyright: "© {year} {entity}. Todos los derechos reservados.",
    navLabel: "Navegación del pie de página",
    products: "Productos",
    company: "Empresa",
    legal: "Legal",
    about: "Acerca de",
    team: "Equipo",
    contact: "Contacto",
    help: "Escríbenos",
    blog: "Blog",
    privacy: "Privacidad",
    terms: "Términos",
    alliances: "Alianzas y comunidades",
    inception: "Miembro de NVIDIA Inception",
    microsoftProgram: "Microsoft AI Cloud Partner Program",
    microsoftProgramStatus: "Miembro",
    madeInMexico: "Hecho en México",
    asemLabel: "Soy parte de la Marea Emprendedora: ASEM, Emprendedores de México",
    asemAlt: "Sello: Soy parte de la Marea Emprendedora, ASEM Emprendedores de México",
  },
  en: {
    tagline: "Applied artificial intelligence, own products and custom solutions.",
    status: "Building smarter operations",
    copyright: "© {year} {entity}. All rights reserved.",
    navLabel: "Footer navigation",
    products: "Products",
    company: "Company",
    legal: "Legal",
    about: "About",
    team: "Team",
    contact: "Contact",
    help: "Get in touch",
    blog: "Blog",
    privacy: "Privacy",
    terms: "Terms",
    alliances: "Partners and communities",
    inception: "NVIDIA Inception member",
    microsoftProgram: "Microsoft AI Cloud Partner Program",
    microsoftProgramStatus: "Member",
    madeInMexico: "Made in Mexico",
    asemLabel: "Member of ASEM, Emprendedores de México",
    asemAlt: "Seal: member of ASEM, Emprendedores de México",
  },
} as const;

export type FooterCopy = (typeof footerCopy)[FooterLang];

export const footerBrands = {
  iruzlabs: {
    name: "Iruz Labs",
    entity: "Iruz Labs SAS de CV",
    home: "https://iruzlabs.com/{lang}/",
    logoDark: "/images/logos/iruzlabs-logotipo-h-white.png",
    logoLight: "/images/logos/iruzlabs-logotipo-h-black.png",
    /** Alianzas tecnológicas y NVIDIA Inception del grupo. */
    memberships: true,
    /** Sellos de México (ASEM y «Hecho en México»), propios de Iruz Labs SAS. */
    mexicoSeals: true,
  },
  azurylabs: {
    name: "Azury Labs",
    entity: "Azury Labs LLC",
    home: "https://azurylabs.online/{lang}/",
    logoDark: "/images/logos/azurylabs-logotipo-h-white.png",
    logoLight: "/images/logos/azurylabs-logotipo-h-black.png",
    /**
     * Azury Labs LLC es la entidad del grupo en EE. UU.: comparte las alianzas
     * tecnológicas globales y NVIDIA Inception, sin sellos exclusivos de México.
     */
    memberships: true,
    mexicoSeals: false,
  },
} as const;

/** Productos del grupo, en el orden del sitio corporativo. */
export const footerProducts: ReadonlyArray<{ id: FooterProductId; label: string; href: string }> = [
  { id: "atenea", label: "Iruz Atenea", href: "https://atenea.iruzlabs.com" },
  { id: "lindex", label: "Iruz Lindex", href: "https://lindex.iruzlabs.com" },
  { id: "sales-os", label: "Iruz Sales OS", href: "https://crm.iruzlabs.com" },
  { id: "mi-negocio", label: "Iruz Mi Negocio", href: "https://minegocio.iruzlabs.com/{lang}" },
  { id: "ciee", label: "Iruz CIEE", href: "https://ciee.iruzlabs.com" },
  { id: "systems", label: "Iruz Systems", href: "https://systems.iruzlabs.com" },
  { id: "connect", label: "Iruz Connect", href: "https://connect.iruzlabs.com" },
  { id: "tracking", label: "Iruz Tracking System", href: "https://go.iruzlabs.com/+" },
];

const socialIcon = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const footerSocials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61588787630828",
    icon: socialIcon(
      '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/iruzlabs",
    icon: socialIcon(
      '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/iruzlabsmx/",
    icon: socialIcon(
      '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    ),
  },
] as const;

/** Programas y alianzas con glifo propio, ordenados por relevancia global (se muestran en gris hasta el hover). */
export const footerPartners = [
  {
    icon: '<svg width="38" height="26" viewBox="0 0 38 26" aria-hidden="true"><text x="19" y="14" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="700" font-size="15" fill="currentColor" letter-spacing="-0.5">aws</text><path d="M5 19.5c8 4.2 20 4.2 28 0" fill="none" stroke="#FF9900" stroke-width="2.2" stroke-linecap="round"/><path d="M29.5 17.2l3.8 2.1-2.6 3.3" fill="none" stroke="#FF9900" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    name: "AWS",
    status: "for Startups",
  },
  {
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="#0467DF" aria-hidden="true"><path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"/></svg>',
    name: "Meta",
    status: "Tech Provider",
  },
  {
    icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
    name: "WhatsApp",
    status: "Business Partner",
  },
] as const;

/** Logos oficiales que se usan tal cual, sin recolorear ni recortar. */
export const footerBadges = {
  elevenLabs: {
    href: "https://elevenlabs.io/startup-grants",
    alt: "ElevenLabs Grants",
    srcDark: "/images/logos/elevenlabs-grants-white.webp",
    srcLight: "/images/logos/elevenlabs-grants-black.webp",
    width: 1496,
    height: 132,
  },
  asem: {
    href: "https://asem.mx",
    src: "/images/asem/sello-verde.webp",
    width: 96,
    height: 96,
  },
  /**
   * Insignia oficial de miembro de NVIDIA Inception (SVG RGB «for screen» del
   * paquete oficial, sin modificar). La versión a color trae su propio
   * recuadro blanco y funciona sobre fondo claro y oscuro. Reglas de marca:
   * no recolorear, deformar ni recortar; sin filtros; respetar el espacio
   * libre; ancho razonable de 120 a 160 px.
   */
  nvidiaInception: {
    href: "https://www.nvidia.com/en-us/startups/",
    alt: "NVIDIA Inception Program",
    src: "/images/logos/nvidia-inception-program-badge.svg",
    width: 140,
    height: 60,
  },
  madeInMexico: {
    srcDark: "/images/logos/hem_blck-DICBBiRR.jpg",
    srcLight: "/images/logos/hem_red-BKy1oPzd.jpg",
    mask: "/images/logos/hem-outline-mask.svg",
    width: 2000,
    height: 2000,
  },
} as const;

const withLang = (template: string, lang: FooterLang) => template.replace(/\{lang\}/g, lang);

export function footerLang(value: string | undefined): FooterLang {
  return value === "en" ? "en" : "es";
}

/** Arma el contenido del footer para un sitio e idioma. */
export function buildFooter(lang: FooterLang, site: FooterSite = {}) {
  const copy = footerCopy[lang];
  const brand = footerBrands[site.brand ?? "iruzlabs"];
  const companyOrigin = site.companyOrigin ?? CORPORATE_ORIGIN;
  const company = (path: string) => `${companyOrigin}/${lang}${path}`;
  const legal = site.legal ?? {
    privacy: `${CORPORATE_ORIGIN}/{lang}/privacidad`,
    terms: `${CORPORATE_ORIGIN}/{lang}/terminos`,
  };

  const products: FooterLink[] = footerProducts.map(({ id, label, href }) => ({
    label,
    href: withLang(href, lang),
    current: id === site.product,
    external: true,
  }));
  // El producto propio del sitio va primero.
  products.sort((a, b) => Number(Boolean(b.current)) - Number(Boolean(a.current)));

  const columns: FooterColumn[] = [
    { id: "products", heading: copy.products, items: products },
    {
      id: "company",
      heading: copy.company,
      items: [
        { label: copy.about, href: company("/acerca") },
        { label: copy.team, href: company("/acerca#equipo") },
        { label: copy.contact, href: company("/acerca#contacto") },
        { label: copy.help, href: company("/contacto") },
        { label: copy.blog, href: company("/blog") },
      ],
    },
    {
      id: "legal",
      heading: copy.legal,
      items: [
        { label: copy.privacy, href: withLang(legal.privacy, lang) },
        { label: copy.terms, href: withLang(legal.terms, lang) },
      ],
    },
  ];

  return {
    lang,
    copy,
    brand,
    homeHref: companyOrigin === "" ? `/${lang}/` : withLang(brand.home, lang),
    columns,
    socials: footerSocials,
    partners: brand.memberships ? footerPartners : [],
    badges: footerBadges,
    showMemberships: brand.memberships,
    showMexicoSeals: brand.mexicoSeals,
    copyright: copy.copyright
      .replace("{year}", String(new Date().getFullYear()))
      .replace("{entity}", brand.entity),
  };
}

export type FooterModel = ReturnType<typeof buildFooter>;
