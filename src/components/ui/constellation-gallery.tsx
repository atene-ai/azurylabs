"use client";

import * as React from "react";
import "../../styles/react-ui.css";

export interface ConstellationItem {
  src: string;
  alt?: string;
  title?: string;
  tags: string[];
}
export interface ConstellationGalleryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  items: ConstellationItem[];
  starSize?: number;
  drift?: number;
  seed?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  onSelect?: (index: number, item: ConstellationItem) => void;
  onHoverChange?: (index: number | null) => void;
  locale?: "es" | "en";
  ref?: React.Ref<HTMLDivElement>;
}
type Point = { x: number; y: number };
type Edge = [number, number];
const GATHER_MS = 650;
const LINE_MS = 420;
const IDLE_BEFORE_AUTOPLAY_MS = 2400;
function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function scatter(count: number, seed: number, minDist: number, aspect = 0.625): Point[] {
  const random = mulberry32(seed);
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    let best: Point | null = null;
    let bestScore = -1;
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = { x: 10 + random() * 80, y: 13 + random() * 72 };
      const nearest = points.reduce((m, p) => Math.min(m, Math.hypot(candidate.x - p.x, (candidate.y - p.y) * aspect)), Infinity);
      if (nearest >= minDist) { best = candidate; break; }
      if (nearest > bestScore) { bestScore = nearest; best = candidate; }
    }
    points.push(best ?? { x: 50, y: 50 });
  }
  return points;
}
function spanningTree(indices: number[], at: (index: number) => Point): Edge[] {
  if (indices.length < 2) return [];
  const inTree = new Set<number>([indices[0]!]);
  const edges: Edge[] = [];
  while (inTree.size < indices.length) {
    let best: Edge | null = null, bestDist = Infinity;
    for (const a of inTree) {
      for (const b of indices) {
        if (inTree.has(b)) continue;
        const pa = at(a), pb = at(b), distance = Math.hypot(pa.x - pb.x, pa.y - pb.y);
        if (distance < bestDist) { bestDist = distance; best = [a, b]; }
      }
    }
    if (!best) break;
    inTree.add(best[1]); edges.push(best);
  }
  return edges;
}

export function ConstellationGallery({
  items, starSize = 85, drift = 10, seed = 7, autoplay = false, autoplayInterval = 8300,
  onSelect, onHoverChange, locale = "en", ref, className, style, ...rest
}: ConstellationGalleryProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const starRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const wrapRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [autoTag, setAutoTag] = React.useState<string | null>(null);
  const [gathered, setGathered] = React.useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [box, setBox] = React.useState({ width: 900, height: 560 });
  const [visible, setVisible] = React.useState(false);
  const live = React.useRef({ raf: 0, start: 0, lastInput: -Infinity, lines: new Map<string, SVGLineElement>(), flights: [] as Animation[] });
  const setRootRef = (node: HTMLDivElement | null) => {
    stageRef.current = node;
    if (typeof ref === "function") ref(node); else if (ref) ref.current = node;
  };
  const positions = React.useMemo(() => scatter(items.length, seed, (starSize + 20) / Math.max(1, box.width) * 100, box.height / Math.max(1, box.width)), [items.length, seed, starSize, box]);
  const tags = React.useMemo(() => Array.from(new Set(items.flatMap((item) => item.tags))), [items]);
  const phases = React.useMemo(() => {
    const random = mulberry32(seed + 1);
    return items.map(() => ({ px: random() * Math.PI * 2, py: random() * Math.PI * 2, fx: 0.18 + random() * 0.12, fy: 0.14 + random() * 0.12 }));
  }, [items, seed]);
  const focusIndex = gathered ?? hovered;
  const activeTags = React.useMemo(() => {
    if (focusIndex !== null) return new Set(items[focusIndex]?.tags ?? []);
    if (autoTag) return new Set([autoTag]);
    return null;
  }, [focusIndex, autoTag, items]);
  const members = React.useMemo(() => !activeTags ? null : items.map((_, i) => i).filter((i) => items[i]!.tags.some((tag) => activeTags.has(tag))), [activeTags, items]);
  const memberSet = React.useMemo(() => members ? new Set(members) : null, [members]);
  const label = focusIndex !== null ? items[focusIndex]?.title ?? items[focusIndex]?.tags.join(" · ") : autoTag;

  React.useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(preference.matches);
    onMotion(); preference.addEventListener("change", onMotion);
    return () => preference.removeEventListener("change", onMotion);
  }, []);
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      setBox((previous) => previous.width === width && previous.height === height ? previous : { width, height });
    });
    const visibility = new IntersectionObserver(([entry]) => setVisible(entry!.isIntersecting));
    resize.observe(stage); visibility.observe(stage);
    return () => { resize.disconnect(); visibility.disconnect(); };
  }, []);

  // One frame loop for drift and the connections; suspend it offscreen or in a hidden tab.
  React.useEffect(() => {
    const stage = stageRef.current, svg = svgRef.current;
    if (!stage || !svg) return;
    const s = live.current;
    const edges = members ? spanningTree(members, (i) => ({ x: positions[i]!.x * box.width / 100, y: positions[i]!.y * box.height / 100 })) : [];
    const wanted = new Set(edges.map(([a, b]) => `${a}-${b}`));
    for (const [key, line] of s.lines) if (!wanted.has(key)) { line.remove(); s.lines.delete(key); }
    for (const [a, b] of edges) {
      const key = `${a}-${b}`;
      if (s.lines.has(key)) continue;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("data-edge", key); line.setAttribute("stroke", "currentColor");
      line.setAttribute("stroke-width", "1.25"); line.setAttribute("stroke-linecap", "round");
      svg.appendChild(line); s.lines.set(key, line);
      if (!reducedMotion) line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: LINE_MS, easing: "ease-out" });
    }
    const drawLines = () => {
      if (!s.lines.size) return;
      const rect = stage.getBoundingClientRect();
      const centers = new Map<number, Point>();
      members?.forEach((index) => {
        const r = starRefs.current[index]?.getBoundingClientRect();
        if (r) centers.set(index, { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 });
      });
      for (const [key, line] of s.lines) {
        const [a, b] = key.split("-").map(Number) as [number, number];
        const pa = centers.get(a), pb = centers.get(b);
        if (!pa || !pb) continue;
        line.setAttribute("x1", pa.x.toFixed(1)); line.setAttribute("y1", pa.y.toFixed(1));
        line.setAttribute("x2", pb.x.toFixed(1)); line.setAttribute("y2", pb.y.toFixed(1));
      }
    };
    const frame = (now: number) => {
      s.raf = 0;
      if (!s.start) s.start = now;
      const t = (now - s.start) / 1000;
      const still = reducedMotion || drift === 0 || gathered !== null;
      for (let i = 0; i < items.length; i++) {
        const star = starRefs.current[i], p = phases[i]!;
        if (!star) continue;
        const dx = still ? 0 : Math.sin(t * p.fx * Math.PI * 2 + p.px) * drift;
        const dy = still ? 0 : Math.cos(t * p.fy * Math.PI * 2 + p.py) * drift;
        star.style.translate = `${dx.toFixed(2)}px ${dy.toFixed(2)}px`;
      }
      drawLines();
      if ((!still || s.flights.length > 0) && visible && !document.hidden) s.raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (document.hidden || !visible) { cancelAnimationFrame(s.raf); s.raf = 0; return; }
      if (!s.raf) s.raf = requestAnimationFrame(frame);
    };
    kick(); document.addEventListener("visibilitychange", kick);
    return () => { document.removeEventListener("visibilitychange", kick); cancelAnimationFrame(s.raf); s.raf = 0; };
  }, [members, positions, phases, items.length, drift, gathered, reducedMotion, visible, box]);
  React.useEffect(() => {
    if (!autoplay || reducedMotion || !visible || tags.length === 0) return;
    let cursor = -1;
    const tick = () => {
      const idle = performance.now() - live.current.lastInput > IDLE_BEFORE_AUTOPLAY_MS;
      if (document.hidden || !idle || hovered !== null || gathered !== null) { setAutoTag(null); return; }
      cursor = (cursor + 1) % tags.length; setAutoTag(tags[cursor] ?? null);
    };
    tick(); const timer = window.setInterval(tick, autoplayInterval);
    return () => window.clearInterval(timer);
  }, [autoplay, autoplayInterval, tags, hovered, gathered, reducedMotion, visible]);

  const flyTo = React.useCallback((index: number | null) => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = live.current;
    for (const flight of s.flights) flight.cancel();
    s.flights = [];
    const rect = stage.getBoundingClientRect();
    const ringMembers = index === null ? [] : items.map((_, i) => i).filter((i) => i !== index && items[i]!.tags.some((tag) => items[index]!.tags.includes(tag)));
    const captionReserve = index !== null && items[index]?.title ? 90 : 48;
    const freeHeight = Math.max(100, rect.height - captionReserve);
    const centerY = freeHeight / 2 / rect.height * 100;
    const ringScale = Math.min(1.15, Math.max(0.65, (2 * Math.PI * Math.min(rect.width, freeHeight) * 0.34 / Math.max(1, ringMembers.length) / starSize) * 0.85));
    const radius = Math.max(0, Math.min(Math.min(rect.width, freeHeight) * 0.34, freeHeight / 2 - starSize * ringScale / 2 - 8));
    const heroScale = Math.max(0.8, Math.min(freeHeight * 0.5, rect.width * 0.32, (radius - starSize * ringScale / 2) * 2 - 12) / starSize);
    for (let i = 0; i < items.length; i++) {
      const wrap = wrapRefs.current[i];
      if (!wrap) continue;
      const home = positions[i]!;
      let target = { x: home.x, y: home.y, scale: 1 };
      if (index !== null) {
        if (i === index) target = { x: 50, y: centerY, scale: heroScale };
        else {
          const k = ringMembers.indexOf(i);
          if (k >= 0) {
            const angle = -Math.PI / 2 + k / ringMembers.length * Math.PI * 2;
            target = { x: 50 + Math.cos(angle) * radius / rect.width * 100, y: centerY + Math.sin(angle) * radius / rect.height * 100, scale: ringScale };
          }
        }
      }
      const dx = (target.x - home.x) / 100 * rect.width, dy = (target.y - home.y) / 100 * rect.height;
      const to = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${target.scale.toFixed(3)})`;
      const from = getComputedStyle(wrap).transform;
      wrap.style.transform = to;
      if (reducedMotion) continue;
      const flight = wrap.animate([{ transform: from === "none" ? "translate(0px, 0px) scale(1)" : from }, { transform: to }], { duration: GATHER_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      s.flights.push(flight);
      flight.finished.then(() => { s.flights = s.flights.filter((f) => f !== flight); }).catch(() => undefined);
    }
  }, [items, positions, starSize, reducedMotion]);
  const gather = React.useCallback((index: number | null) => {
    live.current.lastInput = performance.now(); setGathered(index); flyTo(index);
    if (index !== null) onSelect?.(index, items[index]!);
  }, [flyTo, onSelect, items]);
  React.useEffect(() => { if (gathered !== null) flyTo(gathered); }, [box, starSize, positions, reducedMotion]);
  React.useEffect(() => {
    if (gathered === null) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") gather(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gathered, gather]);
  React.useEffect(() => { const s = live.current; return () => { cancelAnimationFrame(s.raf); s.flights.forEach((flight) => flight.cancel()); }; }, []);
  const hover = (index: number | null) => { setHovered(index); onHoverChange?.(index); };
  const hero = gathered !== null ? items[gathered] : null;
  return <div ref={setRootRef} data-slot="constellation-gallery" data-state={gathered !== null ? "gathered" : activeTags ? "lit" : "idle"}
    className={cx("relative isolate aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground", className)} style={style}
    onPointerMove={() => { live.current.lastInput = performance.now(); }}
    onClick={(event) => { if (gathered !== null && event.target === event.currentTarget) gather(null); }} {...rest}>
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60" style={{ background: "radial-gradient(ellipse at 50% 40%, color-mix(in srgb, currentColor 7%, transparent), transparent 70%)" }} />
    <svg ref={svgRef} aria-hidden className="pointer-events-none absolute inset-0 size-full text-foreground/45" />
    {items.map((item, index) => {
      const p = positions[index]!, isMember = memberSet ? memberSet.has(index) : true, isFocus = focusIndex === index, isHero = gathered === index;
      return <div key={`${item.src}-${index}`} ref={(node) => { wrapRefs.current[index] = node; }} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, width: starSize, height: starSize, marginLeft: -starSize / 2, marginTop: -starSize / 2, zIndex: isHero ? 30 : isMember && memberSet ? 20 : 10 }}>
        <button ref={(node) => { starRefs.current[index] = node; }} type="button" data-star data-index={index} data-member={memberSet ? isMember : undefined} data-hero={isHero || undefined}
          aria-label={item.title ?? item.alt ?? `Image ${index + 1}`} aria-pressed={isHero}
          onPointerEnter={() => { live.current.lastInput = performance.now(); hover(index); }} onPointerLeave={() => hover(null)} onFocus={() => hover(index)} onBlur={() => hover(null)} onClick={() => gather(isHero ? null : index)}
          className={cx("block size-full overflow-hidden rounded-full border border-border bg-muted shadow-md transition-[opacity,scale,box-shadow] duration-300", "focus-visible:[outline:2px_solid_transparent] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card", memberSet && !isMember && "opacity-25", memberSet && isMember && !isHero && "scale-110 shadow-[0_0_24px_-4px_currentColor]", isFocus && !isHero && "scale-125", isHero && "rounded-2xl")}
          style={{ transition: isHero ? "border-radius 0.4s" : undefined }}>
          <img src={item.src} alt={item.alt ?? ""} loading="lazy" decoding="async" draggable={false} className="size-full object-cover" />
        </button>
      </div>;
    })}
    {label && gathered === null && <div data-label className="pointer-events-none absolute left-4 top-4 rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">{label}</div>}
    {hero && <div data-caption className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center">
      <div className="flex flex-col items-center gap-0.5 rounded-xl border border-border bg-background/80 px-4 py-2 text-center backdrop-blur">
        {hero.title && <p className="text-sm font-semibold">{hero.title}</p>}
        <p className="text-[11px] text-muted-foreground">{hero.tags.join(" · ")} · {locale === "es" ? "Esc para volver" : "Esc to scatter"}</p>
      </div>
    </div>}
  </div>;
}
export default ConstellationGallery;
