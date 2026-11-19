// Fig 03 · A flyball governor on a small engine: the balls swing out with speed, lift the sleeve and close the
// throttle through a lever, so the engine holds its speed while the load changes. A proportional loop with droop.
import * as k from "../../iso/iso-kit.mjs";
import { partsFor } from "../parts.mjs";

export const W = 440;
export const H = 250;
const PLATE = { x: -86, y: -34, w: 142, d: 68, r: 7 };
const ENGINE = { x: -72, y: -22, w: 58, d: 44, r: 4 };
const ENGINE_H = 26;
const VALVE = [-26, 0];
const SPINDLE = [24, 0];
const HUB_Z = 71;
const ARM = 24;
const LINK_AT = 12;
const LINK = 20;
const BALL = 5;
const PIVOT = [0, 0, 44.3];
const LEVER = [26, 20.4];
const PHI = [20 * (Math.PI / 180), 50 * (Math.PI / 180)];
const LOADS = [0.5, 0.72, 0.4, 0.66, 0.3, 0.58];
const STEP = 3.4;
export const STILL = 0;

const sleeveOf = (phi) => HUB_Z - LINK_AT * Math.cos(phi) - Math.sqrt(LINK ** 2 - (LINK_AT * Math.sin(phi)) ** 2);
const attachOf = (phi) => sleeveOf(phi) + 1.5;
const stemOf = (phi) => PIVOT[2] - (attachOf(phi) - PIVOT[2]) * (LEVER[0] / LEVER[1]);
const openingOf = (phi) => (stemOf(phi) - stemOf(PHI[1])) / (stemOf(PHI[0]) - stemOf(PHI[1]));
const phiFor = (rpm) => Math.acos(Math.min(Math.cos(PHI[0]), Math.max(Math.cos(PHI[1]), 0.94 * (1000 / rpm) ** 2)));
const loadAt = (time) => LOADS[Math.floor(Math.max(0, time) / STEP) % LOADS.length];
function steady(load) {
  let low = PHI[0], high = PHI[1];
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (openingOf(mid) > load) low = mid; else high = mid;
  }
  const phi = (low + high) / 2;
  return { phi, rpm: 1000 * Math.sqrt(0.94 / Math.cos(phi)), theta: 0.5 };
}

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -12, 0), [SPINDLE[0], 0, HUB_Z + 5], [SPINDLE[0] + 20, 0, 50], [SPINDLE[0] - 20, 0, 50]],
  W,
  H,
  { pad: 16, azimuth: 40 },
);
const { at, S, L, D, base, label, post, screws } = partsFor(P);
const scale = P.scale * Math.sqrt(1.6);

const COPY = {
  es: {
    label: "Un regulador centrífugo sobre un motor. Cuando sube la velocidad, las bolas se abren, levantan el manguito y una palanca cierra la válvula de admisión; cuando la carga aumenta, ocurre lo contrario. El motor mantiene su ritmo sin que nadie lo toque.",
    read: (rpm, load, opening) => `${Math.round(rpm).toLocaleString("es-MX")} rpm · carga ${Math.round(load * 100)}% · válvula ${Math.round(opening * 100)}%`,
  },
  en: {
    label: "A flyball governor on an engine. As speed rises the balls swing out, lift the sleeve and a lever closes the intake valve; when the load grows the opposite happens. The engine holds its pace with nobody touching it.",
    read: (rpm, load, opening) => `${Math.round(rpm).toLocaleString("en-US")} rpm · load ${Math.round(load * 100)}% · valve ${Math.round(opening * 100)}%`,
  },
};

const rod = (from, to, tone, width) => {
  const d = k.segment(from, to, P);
  return `<path class="iso-line" data-tone="${tone}" d="${d}" style="stroke-width:${width}"/><path class="iso-line gov-core" d="${d}" style="stroke-width:${Math.max(width - 1.2, 0.3).toFixed(2)}"/>`;
};

function ballSide(phi, theta) {
  const hub = [SPINDLE[0], SPINDLE[1], HUB_Z];
  const dir = [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), -Math.cos(phi)];
  const point = (length) => hub.map((value, axis) => value + dir[axis] * length);
  const ball = point(ARM);
  const joint = point(LINK_AT);
  const sleeveTop = [SPINDLE[0] + Math.cos(theta) * 3.4, SPINDLE[1] + Math.sin(theta) * 3.4, sleeveOf(phi) + 5];
  const [cx, cy] = at(ball);
  const r = BALL * scale;
  return {
    depth: k.depthOf(ball, P),
    svg: [
      rod(joint, sleeveTop, "mid", 1.3),
      rod(hub, point(ARM - BALL * 0.8), "hi", 1.6),
      `<circle class="gov-ball" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}"/>`,
      `<circle class="gov-glint" cx="${(cx - r * 0.35).toFixed(1)}" cy="${(cy - r * 0.4).toFixed(1)}" r="${(r * 0.28).toFixed(2)}"/>`,
    ].join(""),
  };
}

function linkageSvg(phi) {
  const stem = stemOf(phi);
  return [
    S(k.cylinder(VALVE[0], VALVE[1], 1.1, ENGINE_H + 12, stem - ENGINE_H - 12, P, 12), { tone: "hi", crease: "none" }),
    rod([VALVE[0], 0, stem], [PIVOT[0] + LEVER[1], 0, attachOf(phi)], "mid", 2.4),
    D([at([VALVE[0], 0, stem])], { size: 0.9, tone: "hi" }),
    L(k.sideRing(PIVOT, 1.6, "y", P, 14), { tone: "hi" }),
  ].join("");
}

const sleeveSvg = (phi) => S(k.cylinder(SPINDLE[0], SPINDLE[1], 3.4, sleeveOf(phi), 5, P, 20, 0.3), { tone: "mid" });

function spinSvg(phi, theta) {
  const a = ballSide(phi, theta);
  const b = ballSide(phi, theta + Math.PI);
  const [back, front] = a.depth < b.depth ? [a, b] : [b, a];
  return { back: back.svg, front: front.svg };
}

export function art(lang) {
  const copy = COPY[lang] ?? COPY.es;
  const start = steady(loadAt(STILL));
  const body = [base(PLATE)];
  body.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(ENGINE, 2), 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  body.push(S(k.slabOf(ENGINE, 0, ENGINE_H, P, 6, 0.8), { tone: "mid", inner: L([6, 10, 14, 18].map((z) => k.sideSeam(ENGINE, z, P, 6)).join(""), { tone: "lo" }) }));
  body.push(L(k.planOutline(k.insetPlan(ENGINE, 3.5), ENGINE_H, P, 6), { tone: "faint" }));
  body.push(screws(k.corners(ENGINE, 6).map(([x, y]) => [x, y, ENGINE_H])));
  body.push(label({ x: ENGINE.x + 7, y: 6, w: 20, d: 10, r: 1.2 }, ENGINE_H));
  body.push(S(k.cylinder(ENGINE.x + 14, -10, 4, ENGINE_H, 4, P, 24, 0.4), { tone: "mid" }));
  body.push(L(k.knurl(ENGINE.x + 14, -10, 4, ENGINE_H, ENGINE_H + 4, 22, P), { tone: "lo" }));
  body.push(S(k.cylinder(VALVE[0], VALVE[1], 6, ENGINE_H, 9, P, 32, 0.6), { tone: "mid" }));
  body.push(L(k.sideArc(VALVE[0], VALVE[1], 6, ENGINE_H + 4, P, 20), { tone: "faint" }));
  body.push(S(k.cylinder(VALVE[0], VALVE[1], 3.4, ENGINE_H + 9, 3, P, 24, 0.3), { tone: "mid" }));
  body.push(S(k.slabOf({ x: ENGINE.x + ENGINE.w, y: -3, w: SPINDLE[0] - 9 - ENGINE.x - ENGINE.w + 0.5, d: 6, r: 1 }, 3, 5, P, 2, 0.3), { tone: "mid" }));
  body.push(S(k.cylinder(SPINDLE[0], SPINDLE[1], 9, 0, 10, P, 40, 0.6), { tone: "mid" }));
  body.push(L(k.ring(SPINDLE[0], SPINDLE[1], 5, 10, P, 24), { tone: "lo" }));
  body.push(S(k.slabOf({ x: -4, y: -5, w: 8, d: 10, r: 1.2 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
  body.push(post(PIVOT[0], -2.6, 1.4, 3, PIVOT[2] + 1.8, { collar: false }));
  const spin = spinSvg(start.phi, start.theta);
  body.push(`<g data-part="back">${spin.back}</g>`);
  body.push(`<g data-part="linkage">${linkageSvg(start.phi)}</g>`);
  body.push(post(PIVOT[0], 2.6, 1.4, 3, PIVOT[2] + 1.8, { collar: false }));
  body.push(S(k.cylinder(SPINDLE[0], SPINDLE[1], 1.6, 10, HUB_Z - 10, P, 14), { tone: "hi", crease: "none" }));
  body.push(`<g data-part="sleeve">${sleeveSvg(start.phi)}</g>`);
  body.push(S(k.cylinder(SPINDLE[0], SPINDLE[1], 3, HUB_Z - 2, 4, P, 20, 0.3), { tone: "mid" }));
  body.push(D([at([SPINDLE[0], SPINDLE[1], HUB_Z + 2])], { size: 0.6, tone: "hi" }));
  body.push(`<g data-part="front">${spin.front}</g>`);
  return k.figureSvg({ width: W, height: H, label: copy.label, body });
}

export const readoutAt = (lang) => {
  const load = loadAt(STILL);
  const start = steady(load);
  return (COPY[lang] ?? COPY.es).read(start.rpm, load, openingOf(start.phi));
};

export function live(svg, lang) {
  const copy = COPY[lang] ?? COPY.es;
  const back = svg.querySelector('[data-part="back"]');
  const front = svg.querySelector('[data-part="front"]');
  const linkage = svg.querySelector('[data-part="linkage"]');
  const sleeve = svg.querySelector('[data-part="sleeve"]');
  const state = steady(loadAt(STILL));
  let last = null;
  return (time) => {
    const dt = last === null ? 0 : Math.min(Math.max(time - last, 0), 1 / 30);
    last = time;
    const load = loadAt(time);
    const steps = Math.ceil(dt * 240);
    for (let step = 0; step < steps; step++) {
      const h = dt / steps;
      state.rpm += 600 * (openingOf(state.phi) - load) * h;
      state.phi += (phiFor(state.rpm) - state.phi) * (1 - Math.exp(-h / 0.18));
      state.theta += 2 * Math.PI * (state.rpm / 1100) * 1.15 * h;
    }
    const spin = spinSvg(state.phi, state.theta);
    back.innerHTML = spin.back;
    front.innerHTML = spin.front;
    linkage.innerHTML = linkageSvg(state.phi);
    sleeve.innerHTML = sleeveSvg(state.phi);
    return copy.read(state.rpm, load, openingOf(state.phi));
  };
}
