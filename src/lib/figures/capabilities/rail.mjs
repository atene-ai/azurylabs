// Fig 04 · A DIN rail: three working modules stay put while a new one slides on beside them and a jumper
// bridges it onto the shared bus. Nothing already installed is moved or replaced.
import * as k from "../../iso/iso-kit.mjs";
import { ease, partsFor, span } from "../parts.mjs";

export const W = 440;
export const H = 250;
const PLATE = { x: -90, y: -32, w: 150, d: 64, r: 7 };
const RAIL = { x: -82, y: -5, w: 132, d: 10, r: 0.6 };
const RAIL_H = 1.6;
const DEPTH = { y: -18, d: 36 };
const TOP = RAIL_H + 28;
const MODULES = [
  { x: -78, w: 18 },
  { x: -59, w: 18 },
  { x: -40, w: 25 },
];
const FRESH = { x: -14, w: 18 };
const START = 24;
const BUS = { x: -76, y: 10, w: 62, d: 4, r: 0.8 };
const BRIDGE = { x: -22, y: 10, w: 24, d: 4, r: 0.8 };
const LIFT = 14;
const LOOP = 7.2;
export const STILL = 5;

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -12, 0), [0, 0, TOP + 4]],
  W,
  H,
  { pad: 16, azimuth: 38 },
);
const { at, S, L, D, base, screws } = partsFor(P);

const COPY = {
  es: {
    label: "Un riel DIN con tres módulos que ya funcionan. Un módulo nuevo se desliza a su lado, un puente lo une al bus común y su luz se enciende; los demás no se tocan.",
    read: (phase) => ["módulo nuevo · deslizando", "puente · conectando", "4 módulos · 1 bus · 0 reemplazos", "señal · cruzando el bus"][phase],
  },
  en: {
    label: "A DIN rail with three modules that already work. A new module slides on beside them, a jumper joins it to the shared bus and its light comes on; the others are left alone.",
    read: (phase) => ["new module · sliding on", "jumper · connecting", "4 modules · 1 bus · 0 replaced", "signal · crossing the bus"][phase],
  },
};

function moduleSvg({ x, w }, tone, led) {
  const plan = { x, y: DEPTH.y, w, d: DEPTH.d, r: 1.2 };
  const front = DEPTH.y + DEPTH.d;
  const cx = x + w / 2;
  const out = [];
  out.push(S(k.slabOf(plan, RAIL_H, TOP - RAIL_H, P, 3, 0.5), {
    tone,
    crease: tone === "hi" ? "lo" : "faint",
    inner: L(k.sideSeam(plan, TOP - 7, P, 3), { tone: "faint" }),
  }));
  out.push(S(k.slabOf({ x: cx - 3, y: front, w: 6, d: 1.6, r: 0.4 }, RAIL_H, 3.4, P, 2), { tone: "mid", crease: "none" }));
  const window = [[x + 2.5, front, TOP - 11], [x + w - 2.5, front, TOP - 11], [x + w - 2.5, front, TOP - 21], [x + 2.5, front, TOP - 21]];
  out.push(`<path class="iso-line" data-tone="lo" d="${k.pathOf(window.map((point) => at(point)), true)}"/>`);
  out.push(L(k.lineOnTop([x + 4, front], [x + w - 4, front], TOP - 15, P), { tone: "faint", free: true }));
  const rows = [DEPTH.y + 5, DEPTH.y + DEPTH.d - 5];
  const columns = w > 20 ? [x + 5, cx, x + w - 5] : [x + 4.5, x + w - 4.5];
  const points = rows.flatMap((y) => columns.map((px) => [px, y]));
  out.push(L(points.map(([px, py]) => k.ring(px, py, 1.7, TOP, P, 14)).join(""), { tone: "lo" }));
  out.push(D(points.map(([px, py]) => at([px, py, TOP])), { size: 0.55, tone: "mid" }));
  for (const offset of [-2.4, 0, 2.4]) {
    out.push(L(k.planOutline({ x: cx - 4, y: offset - 0.5, w: 8, d: 1, r: 0.5 }, TOP, P, 2), { tone: "faint" }));
  }
  const [lx, ly] = at([x + w - 3.5, front, TOP - 5]);
  out.push(`<circle class="cap-led" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="${(0.9 * P.scale * 1.26).toFixed(2)}"${led ? ` data-on="${led}"` : ""}${tone === "hi" ? ' data-part="led"' : ""}/>`);
  return out.join("");
}

const busSvg = (plan, lit) => [
  S(k.slabOf(plan, TOP, 1.6, P, 2, 0.3), { tone: "hi", lit }),
  D(Array.from({ length: Math.round(plan.w / 6) }, (_, index) => at([plan.x + 3 + index * 6, plan.y + plan.d / 2, TOP + 1.6])), { size: 0.45, tone: "mid" }),
].join("");

function poseAt(time) {
  const t = time % LOOP;
  const slide = t < 6.2 ? ease.out(span(t, 0.4, 1.8)) : 1 - ease.inOut(span(t, 6.2, 7.1));
  const drop = t < 6.2 ? ease.inOut(span(t, 1.9, 2.6)) : 1 - ease.inOut(span(t, 6.2, 6.6));
  const pulse = span(t, 2.9, 4.5);
  const phase = t < 1.9 ? 0 : t < 2.65 ? 1 : pulse > 0 && pulse < 1 ? 3 : 2;
  return {
    fresh: k.translateAlong(P, [(START - FRESH.x) * (1 - slide), 0, 0]),
    freshAlpha: Math.min(1, span(t, 0, 0.4) * (t < 6.2 ? 1 : 1 - span(t, 6.5, 7.1))),
    bridge: k.translateAlong(P, [0, 0, LIFT * (1 - drop)]),
    bridgeAlpha: Math.min(1, drop * 3),
    on: t >= 2.65 && t < 6.2,
    pulse,
    phase,
  };
}

const pulseAt = (share) => at([BUS.x + 2 + share * (BRIDGE.x + BRIDGE.w - BUS.x - 4), BUS.y + BUS.d / 2, TOP + 1.8]);

export function art(lang) {
  const copy = COPY[lang] ?? COPY.es;
  const pose = poseAt(STILL);
  const body = [base(PLATE)];
  body.push(`<path class="iso-halo" d="${k.haloOf({ x: -80, y: -16, w: 100, d: 32, r: 2 }, 0, 0.1, P)}" style="filter:blur(5px)"/>`);
  body.push(S(k.slabOf(RAIL, 0, RAIL_H, P, 2, 0.3), { tone: "mid" }));
  body.push(L([RAIL.y + 2.4, RAIL.y + RAIL.d - 2.4].map((y) => k.lineOnTop([RAIL.x, y], [RAIL.x + RAIL.w, y], RAIL_H, P)).join(""), { tone: "lo" }));
  for (let x = RAIL.x + 10; x < RAIL.x + RAIL.w - 6; x += 22) body.push(L(k.planOutline({ x, y: -1.2, w: 9, d: 2.4, r: 1.2 }, RAIL_H, P, 3), { tone: "lo" }));
  MODULES.forEach((module) => body.push(moduleSvg(module, "mid", "steady")));
  body.push(`<g data-part="fresh" transform="${pose.fresh}" opacity="${pose.freshAlpha.toFixed(3)}">${moduleSvg(FRESH, "hi", pose.on ? "lit" : "")}</g>`);
  const stop = { x: 44, y: -9, w: 6, d: 18, r: 1 };
  body.push(S(k.slabOf(stop, RAIL_H, 12, P, 2, 0.4), { tone: "mid" }));
  body.push(screws([[stop.x + 3, stop.y + 4, RAIL_H + 12], [stop.x + 3, stop.y + stop.d - 4, RAIL_H + 12]]));
  body.push(busSvg(BUS, false));
  body.push(`<g data-part="bridge" transform="${pose.bridge}" opacity="${pose.bridgeAlpha.toFixed(3)}">${busSvg(BRIDGE, true)}</g>`);
  const [px, py] = pulseAt(pose.pulse);
  body.push(`<circle class="cap-pulse" data-part="pulse" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1.6" opacity="0"/>`);
  return k.figureSvg({ width: W, height: H, label: copy.label, body });
}

export const readoutAt = (lang, time = STILL) => (COPY[lang] ?? COPY.es).read(poseAt(time).phase);

export function live(svg, lang) {
  const copy = COPY[lang] ?? COPY.es;
  const fresh = svg.querySelector('[data-part="fresh"]');
  const led = svg.querySelector('[data-part="led"]');
  const bridge = svg.querySelector('[data-part="bridge"]');
  const pulse = svg.querySelector('[data-part="pulse"]');
  return (time) => {
    const pose = poseAt(time);
    fresh.setAttribute("transform", pose.fresh);
    fresh.setAttribute("opacity", pose.freshAlpha.toFixed(3));
    bridge.setAttribute("transform", pose.bridge);
    bridge.setAttribute("opacity", pose.bridgeAlpha.toFixed(3));
    if (pose.on) led.setAttribute("data-on", "lit"); else led.removeAttribute("data-on");
    const [px, py] = pulseAt(pose.pulse);
    pulse.setAttribute("cx", px.toFixed(1));
    pulse.setAttribute("cy", py.toFixed(1));
    pulse.setAttribute("opacity", (Math.sin(Math.PI * pose.pulse) ** 0.5).toFixed(3));
    return copy.read(pose.phase);
  };
}
