React UI components live alongside the existing Astro components in `src/components/ui`.
The TypeScript alias `@/*` maps to `src/*`, so `@/components/ui` is this project's
equivalent of `/components/ui`. This keeps reusable UI separate from page sections.

React 19 is rendered and hydrated through `@astrojs/react`. Tailwind 4 is configured
through `@tailwindcss/vite`; `src/styles/react-ui.css` maps the existing site tokens
to the gallery's semantic colors and loads utilities without replacing the site reset.
`components.json` supplies shadcn's paths. TypeScript was already enabled by Astro.

The supplied gallery and its stock-photo demo are available as
`color-filter-gallery.tsx` and `color-filter-gallery-demo.tsx`.
Use a React component from an Astro page with `client:load` (or `client:visible`).
No context provider is required. Gallery selection can be internal or controlled
with `value` and `onValueChange`; pass `columns` to control its grid.

The product section uses `ProductColorBloom`, a variant of the same circular
grayscale-to-color reveal animated with Framer Motion. Its props are the real
transparent product logo, the product's palette, and its name. Each card's existing
grid remains responsive. Pointer entry or keyboard focus reveals color; touch
devices show color immediately, and reduced-motion users get an instant change.

Integration references: [Astro React](https://v5.docs.astro.build/en/guides/integrations-guide/react/)
and [Tailwind for Astro](https://tailwindcss.com/docs/installation/framework-guides/astro).

`constellation-gallery.tsx` contains the supplied constellation interaction and
`constellation-gallery-demo.tsx` its stock-photo demo. The company page uses
`team-constellation.tsx` with published Strapi portraits, roles, biographies, and
profile links. Its connections mean membership of the Iruz team. Selection is
local React state; no provider or additional dependency is needed. The stage
responds to its measured size, pauses its frame loop offscreen and in hidden tabs,
and respects reduced motion. Team styling lives in `src/styles/team-constellation.css`.
