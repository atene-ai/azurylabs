"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import "../../styles/react-ui.css";
import "../../styles/product-artwork.css";

export type ColorName = "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink";
export type ColorFilterValue = ColorName | "all";
export interface ColorFilterItem {
  src: string;
  alt?: string;
  title?: string;
  color?: ColorName;
}
export interface ColorFilterGalleryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  items: ColorFilterItem[];
  columns?: number;
  aspect?: string;
  gap?: number;
  value?: ColorFilterValue;
  defaultValue?: ColorFilterValue;
  onValueChange?: (value: ColorFilterValue) => void;
  autoplay?: boolean;
  interval?: number;
  bloomDuration?: number;
  ref?: React.Ref<HTMLDivElement>;
}
const COLORS: ColorName[] = ["red", "orange", "yellow", "green", "blue", "purple", "pink"];
const SWATCH: Record<ColorName, string> = {
  red: "#ef4444", orange: "#f97316", yellow: "#eab308", green: "#22c55e",
  blue: "#3b82f6", purple: "#8b5cf6", pink: "#ec4899",
};
const LABEL: Record<ColorName, string> = {
  red: "Red", orange: "Orange", yellow: "Yellow", green: "Green", blue: "Blue", purple: "Purple", pink: "Pink",
};
const IDLE_MS = 6000;
const READY_FALLBACK_MS = 1500;
function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function bucketOf(hue: number, saturation = 1, value = 1): ColorName {
  if ((hue >= 330 || hue < 22) && saturation < 0.6 && value > 0.62) return "pink";
  if (hue < 12 || hue >= 345) return "red";
  if (hue < 37) return "orange";
  if (hue < 68) return "yellow";
  if (hue < 170) return "green";
  if (hue < 255) return "blue";
  if (hue < 290) return "purple";
  return "pink";
}
function detectColor(src: string): Promise<ColorName | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0, size, size);
        const { data } = context.getImageData(0, 0, size, size);
        const bins = new Array<number>(36).fill(0);
        const satSum = new Array<number>(36).fill(0);
        const valSum = new Array<number>(36).fill(0);
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3]! < 128) continue; // Transparent logos must not vote as black pixels.
          const r = data[i]! / 255, g = data[i + 1]! / 255, b = data[i + 2]! / 255;
          const max = Math.max(r, g, b), delta = max - Math.min(r, g, b);
          const saturation = max === 0 ? 0 : delta / max;
          if (saturation < 0.25 || max < 0.18) continue;
          let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
          hue = (hue * 60 + 360) % 360;
          const bin = Math.floor(hue / 10) % 36, weight = saturation * max;
          bins[bin] = (bins[bin] ?? 0) + weight;
          satSum[bin] = (satSum[bin] ?? 0) + saturation * weight;
          valSum[bin] = (valSum[bin] ?? 0) + max * weight;
        }
        let best = -1, bestWeight = 0;
        for (let k = 0; k < 36; k++) {
          const weight = (bins[(k + 35) % 36] ?? 0) * 0.5 + (bins[k] ?? 0) + (bins[(k + 1) % 36] ?? 0) * 0.5;
          if (weight > bestWeight) { bestWeight = weight; best = k; }
        }
        if (best < 0) return resolve(null);
        const total = bins[best] ?? 0;
        resolve(bucketOf(best * 10 + 5, total ? (satSum[best] ?? 0) / total : 1, total ? (valSum[best] ?? 0) / total : 1));
      } catch { resolve(null); }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function ColorFilterGallery({
  items, columns = 4, aspect = "5 / 4", gap = 8, value: controlledValue,
  defaultValue = "red", onValueChange, autoplay = true, interval = 2800,
  bloomDuration = 750, ref, className, ...rest
}: ColorFilterGalleryProps) {
  const [internalValue, setInternalValue] = React.useState<ColorFilterValue>(defaultValue);
  const value = controlledValue ?? internalValue;
  const [detected, setDetected] = React.useState<Record<string, ColorName | null>>({});
  const [ready, setReady] = React.useState(false);
  const [hovered, setHovered] = React.useState<{ index: number; x: number; y: number } | null>(null);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const pausedUntil = React.useRef(0);
  const valueRef = React.useRef(value);
  valueRef.current = value;
  const requested = React.useRef(new Set<string>());
  const chipRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const colorOf = React.useCallback((item: ColorFilterItem): ColorName | null => item.color ?? detected[item.src] ?? null, [detected]);
  const counts = React.useMemo(() => {
    const map = new Map<ColorName, number>();
    for (const item of items) { const color = colorOf(item); if (color) map.set(color, (map.get(color) ?? 0) + 1); }
    return map;
  }, [items, colorOf]);
  const present = React.useMemo(() => COLORS.filter((color) => (counts.get(color) ?? 0) > 0), [counts]);
  const choices: ColorFilterValue[] = ["all", ...present];
  const choose = React.useCallback((next: ColorFilterValue, fromUser: boolean) => {
    if (fromUser) pausedUntil.current = Date.now() + IDLE_MS;
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
  }, [controlledValue, onValueChange]);
  React.useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(preference.matches);
    onMotion();
    preference.addEventListener("change", onMotion);
    return () => preference.removeEventListener("change", onMotion);
  }, []);
  React.useEffect(() => {
    for (const item of items) {
      if (item.color || requested.current.has(item.src)) continue;
      requested.current.add(item.src);
      detectColor(item.src).then((color) => setDetected((prev) => ({ ...prev, [item.src]: color })));
    }
  }, [items]);
  React.useEffect(() => {
    let done = false;
    const markReady = () => { if (!done) setReady(true); done = true; };
    const first = valueRef.current;
    const awaited = items.filter((item) => first === "all" || item.color === first);
    const gate = awaited.length > 0 ? awaited : items;
    let loaded = 0;
    const images = items.map((item) => {
      const image = new Image(); image.decoding = "async";
      if (gate.includes(item)) image.onload = image.onerror = () => { loaded += 1; if (loaded >= gate.length) markReady(); };
      image.src = item.src;
      return image;
    });
    if (gate.length === 0) markReady();
    const fallback = window.setTimeout(markReady, READY_FALLBACK_MS);
    return () => { done = true; window.clearTimeout(fallback); for (const image of images) image.onload = image.onerror = null; };
  }, [items]);
  React.useEffect(() => {
    if (!autoplay || reducedMotion || !ready || present.length === 0) return;
    const sequence: ColorFilterValue[] = [...present, "all"];
    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const at = sequence.indexOf(valueRef.current);
      choose(sequence[(at + 1) % sequence.length]!, false);
    }, interval);
    return () => window.clearInterval(timer);
  }, [autoplay, reducedMotion, ready, present, interval, choose]);
  const onChipKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const at = Math.max(0, choices.indexOf(value));
    const next = (at + (event.key === "ArrowRight" ? 1 : -1) + choices.length) % choices.length;
    choose(choices[next]!, true); chipRefs.current[next]?.focus();
  };
  const matchRank = new Map<number, number>();
  items.forEach((item, index) => { if (value === "all" || colorOf(item) === value) matchRank.set(index, matchRank.size); });
  const hoveredColor = hovered ? colorOf(items[hovered.index] ?? { src: "" }) : null;
  const shown = value === "all" ? items.length : (counts.get(value) ?? 0);
  const status = value === "all" ? `All ${shown} photos` : `${shown} ${shown === 1 ? "photo" : "photos"} in ${LABEL[value].toLowerCase()}`;
  return (
    <div ref={ref} data-slot="color-filter-gallery" data-value={value} data-ready={ready || undefined} className={cx("w-full text-foreground", className)} {...rest}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div role="radiogroup" aria-label="Filter photos by color" className="flex flex-wrap gap-1" onKeyDown={onChipKey}>
          {choices.map((choice, i) => {
            const selected = value === choice, count = choice === "all" ? items.length : (counts.get(choice) ?? 0);
            return <button key={choice} ref={(node) => { chipRefs.current[i] = node; }} type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} data-chip={choice} data-hint={choice !== "all" && hoveredColor === choice ? "" : undefined} onClick={() => choose(choice, true)}
              className={cx("inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-[background-color,border-color,color,box-shadow] duration-200", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", selected ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-accent")}
              style={choice !== "all" && hoveredColor === choice && !selected ? { boxShadow: `0 0 0 2px ${SWATCH[choice]}55` } : undefined}>
              <span aria-hidden className="size-2.5 rounded-full ring-1 ring-black/10" style={{ background: choice === "all" ? "conic-gradient(#ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ec4899, #ef4444)" : SWATCH[choice] }} />
              {choice === "all" ? "All" : LABEL[choice]} <span className="tabular-nums opacity-60">{count}</span>
            </button>;
          })}
        </div>
        <p data-status aria-live="polite" className="text-xs text-muted-foreground">{status}</p>
      </div>
      <div role="list" className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap }}>
        {items.map((item, index) => {
          const color = colorOf(item), rank = matchRank.get(index), matches = rank !== undefined;
          const isHovered = hovered?.index === index;
          const colored = ready && (matches || isHovered), dimmed = ready && !matches && !isHovered;
          const originX = isHovered ? hovered.x : 50, originY = isHovered ? hovered.y : 50;
          const delay = colored && !isHovered && rank !== undefined ? Math.min(rank * 70, 420) : 0;
          return <div key={`${item.src}-${index}`} role="listitem" className="min-w-0">
            <button type="button" data-photo={index} data-color={color ?? undefined} data-colored={colored || undefined} aria-label={`${item.title ?? item.alt ?? `Photo ${index + 1}`}${color ? `, ${LABEL[color].toLowerCase()}` : ""}. Show ${color ? LABEL[color].toLowerCase() : "all"} photos`} onClick={() => choose(color ?? "all", true)}
              onPointerEnter={(event) => { if (event.pointerType === "touch") return; const rect = event.currentTarget.getBoundingClientRect(); setHovered({ index, x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 }); }}
              onPointerLeave={() => setHovered((current) => current?.index === index ? null : current)} onFocus={() => setHovered({ index, x: 50, y: 50 })} onBlur={() => setHovered((current) => current?.index === index ? null : current)}
              className={cx("group relative block w-full overflow-hidden rounded-xl bg-muted text-left outline-none ease-out", "transition-[opacity,transform] duration-500", "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background")}
              style={{ aspectRatio: aspect, opacity: dimmed ? 0.42 : 1, transform: dimmed ? "scale(0.97)" : "scale(1)" }}>
              <img src={item.src} alt={item.alt ?? item.title ?? ""} draggable={false} className="absolute inset-0 size-full object-cover" style={{ filter: "grayscale(1) contrast(1.06)" }} />
              <img src={item.src} alt="" aria-hidden data-bloom draggable={false} className="absolute inset-0 size-full object-cover" style={{ clipPath: `circle(${colored ? 150 : 0}% at ${originX}% ${originY}%)`, transition: reducedMotion ? "none" : colored ? `clip-path ${bloomDuration}ms cubic-bezier(0.22, 0.8, 0.2, 1) ${delay}ms` : `clip-path ${Math.round(bloomDuration * 0.55)}ms cubic-bezier(0.4, 0, 1, 1)` }} />
              {color && <span aria-hidden className="absolute left-2 top-2 size-2.5 rounded-full ring-2 ring-white/80 transition-[opacity,transform] duration-300" style={{ background: SWATCH[color], opacity: colored ? 1 : 0, transform: colored ? "scale(1)" : "scale(0.4)", transitionDelay: colored ? `${delay + bloomDuration * 0.4}ms` : "0ms" }} />}
              {item.title && <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-medium text-white transition-opacity duration-300" style={{ opacity: colored ? 1 : 0 }}>{item.title}</span>}
            </button>
          </div>;
        })}
      </div>
    </div>
  );
}

export interface ProductColorBloomProps {
  id: string;
  src?: string;
  alt: string;
  width: number;
  height: number;
  wordmark?: string;
  background: string;
  colors: string[];
  mirrored?: boolean;
}
const PRODUCT_CIRCLES = [
  [0, 65, 148], [14, 12, 104], [24, 0, 48], [42, 103, 92],
  [62, 0, 88], [80, 8, 124], [99, 35, 62], [92, 82, 140],
  [76, 103, 54], [10, 103, 66], [97, 0, 36], [2, 5, 32],
];
function ProductArtwork({ decorative = false, ...props }: ProductColorBloomProps & { decorative?: boolean }) {
  return <div className={`product-artwork product-artwork--${props.id}`} style={{ background: props.background }}>
    <div className="product-artwork__circles" aria-hidden="true">
      {PRODUCT_CIRCLES.map(([x, y, size], index) => <span key={index} className="product-artwork__circle" style={{
        "--x": `${props.mirrored ? 100 - x! : x}%`, "--y": `${y}%`, "--size": `${size}px`, "--bubble-color": props.colors[index % props.colors.length],
      } as React.CSSProperties} />)}
    </div>
    {props.src ? <img className="product-artwork__logo" src={props.src} alt={decorative ? "" : props.alt} width={props.width} height={props.height} loading="lazy" decoding="async" draggable={false} /> :
      <div className="product-artwork__wordmark" aria-label={decorative ? undefined : props.alt}>
        <img src="/images/logos/iruzlabs-isotipo-black.png" alt="" width={512} height={512} loading="lazy" />
        <span><small>IRUZ</small><strong>{props.wordmark}</strong></span>
      </div>}
  </div>;
}

// The gallery's grayscale-to-color bloom adapted to the product card artwork.
export function ProductColorBloom(props: ProductColorBloomProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const [colored, setColored] = React.useState(false);
  const [touch, setTouch] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 50, y: 50 });
  const reducedMotion = useReducedMotion();
  React.useEffect(() => {
    const card = root.current?.closest("[data-product-motion]");
    let hovering = false;
    const preference = window.matchMedia("(hover: none)");
    const onTouch = () => setTouch(preference.matches);
    const onFocus = () => { setOrigin({ x: 50, y: 50 }); setColored(true); };
    const onBlur = (event: Event) => {
      if (!hovering && !card?.contains((event as FocusEvent).relatedTarget as Node | null)) setColored(false);
    };
    const onEnter = (event: Event) => {
      if (hovering) return;
      hovering = true;
      const pointer = event as PointerEvent;
      const rect = root.current!.getBoundingClientRect();
      setOrigin({ x: Math.max(0, Math.min(100, (pointer.clientX - rect.left) / rect.width * 100)), y: Math.max(0, Math.min(100, (pointer.clientY - rect.top) / rect.height * 100)) });
      setColored(true);
    };
    const onLeave = () => { hovering = false; if (!card?.matches(":focus-within")) setColored(false); };
    onTouch();
    preference.addEventListener("change", onTouch);
    card?.addEventListener("pointerenter", onEnter);
    card?.addEventListener("pointermove", onEnter, { passive: true });
    card?.addEventListener("pointerleave", onLeave);
    card?.addEventListener("focusin", onFocus);
    card?.addEventListener("focusout", onBlur);
    return () => {
      preference.removeEventListener("change", onTouch);
      card?.removeEventListener("pointerenter", onEnter);
      card?.removeEventListener("pointermove", onEnter);
      card?.removeEventListener("pointerleave", onLeave);
      card?.removeEventListener("focusin", onFocus);
      card?.removeEventListener("focusout", onBlur);
    };
  }, []);
  return <div ref={root} className="product-color-bloom" data-colored={colored || touch || reducedMotion || undefined}>
    <div className="product-color-bloom__base"><ProductArtwork {...props} /></div>
    <motion.div aria-hidden="true" className="product-color-bloom__color" data-bloom initial={false}
      animate={{ clipPath: `circle(${colored || touch || reducedMotion ? 150 : 0}% at ${origin.x}% ${origin.y}%)` }}
      transition={{ duration: reducedMotion ? 0 : colored ? 0.75 : 0.42, ease: colored ? [0.22, 0.8, 0.2, 1] : [0.4, 0, 1, 1] }}>
      <ProductArtwork {...props} decorative />
    </motion.div>
  </div>;
}

export default ColorFilterGallery;
