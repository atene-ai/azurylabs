// The process as one line: a pallet carries three uneven pads (people, process, data) along a conveyor.
// Station 01 measures how far each pad is from the datum, station 02 drops the exact block onto each pad
// (product, AI, integration), and station 03 measures again, reads zero on all three and lights the tower.
import * as k from "../iso/iso-kit.mjs";
import { ease, partsFor, span, unit } from "./parts.mjs";

export const W = 900;
export const H = 360;
const PLATE = { x: -210, y: -50, w: 420, d: 100, r: 9 };
const BELT = { x: -198, y: -17, w: 396, d: 34, r: 4 };
const BELT_Z = 12;
const PALLET = { x: -28, y: -11, w: 56, d: 22, r: 1.5 };
const PALLET_TOP = BELT_Z + 3;
const PADS = [10, 4, 12];
const DATUM = 18;
const GAPS = PADS.map((height) => DATUM - height);
const PAD_X = [-17, 0, 17];
const PAD = { w: 12, d: 16 };
const BLOCK = { w: 10, d: 13 };
const LEVEL = PALLET_TOP + DATUM;
const STATIONS = [-125, 0, 125];
const DIAL_R = 16;
const DIAL_Z = 52;
const DIAL_TOP = DIAL_Z + 8;
const ROD = 24;
const RETRACT = LEVEL + 0.5;
const PER_TURN = 20;
const MM = 0.025;
const MAG_Z = 40;
const PEEK = 36;
const CLEAT = 12;
const ENTER = -235;
const EXIT = 240;
const LOOP = 17.2;
export const STAGES = [0, 5.3, 9.2];
export const STILL = 2.3;

const KEYS = [
  [0, ENTER], [1.6, -142], [2.5, -142], [2.9, -125], [3.8, -125], [4.2, -108], [5.1, -108],
  [6.6, 0], [9.0, 0], [10.6, 108], [11.5, 108], [11.9, 125], [12.8, 125], [13.2, 142], [15.4, 142], [17.0, EXIT], [LOOP, EXIT],
];
const PROBES = [
  [0, 1.75, 2.4, 2], [0, 3.05, 3.7, 1], [0, 4.35, 5.0, 0],
  [2, 10.75, 11.4, 2], [2, 12.05, 12.7, 1], [2, 13.35, 14.0, 0],
];
const DROPS = [6.9, 7.4, 7.9];
const FALL = 0.45;
const REFILL = 0.6;
const LIT_FROM = 14.0;

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -13, 0), [STATIONS[0], -37, 86], [STATIONS[2], -37, 86], [0, -30, 74]],
  W,
  H,
  { pad: 14, azimuth: 67 },
);
const { at, S, L, D, base, label, post, screws } = partsFor(P);
const plan = (cx, cy, w, d, r = 1) => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });

const COPY = {
  es: {
    label: "Una línea de proceso con tres estaciones. Una tarima lleva tres bloques de distinta altura: personas, proceso y datos. En la estación 01 un comparador mide cuánto le falta a cada uno; en la 02 tres cargadores (producto, IA e integración) dejan caer el bloque exacto; en la 03 se mide de nuevo, las tres lecturas dan cero y se enciende la torre de luz.",
    pads: ["personas", "proceso", "datos"],
    parts: ["producto", "IA", "integración"],
    read: {
      enter: "01 · entra el reto",
      measure: (stage, pad, value) => `0${stage} · ${pad} · ${value}`,
      travel: (stage) => ["01 · midiendo el reto", "02 · eligiendo la combinación", "03 · verificando"][stage - 1],
      drop: (part, gap) => `02 · ${part} · +${gap} mm`,
      running: (cycle) => `03 · en operación · ciclo ${cycle}`,
    },
  },
  en: {
    label: "A process line with three stations. A pallet carries three blocks of different heights: people, process and data. At station 01 an indicator measures how far each one falls short; at 02 three feeders (product, AI and integration) drop the exact block; at 03 everything is measured again, all three read zero and the tower light comes on.",
    pads: ["people", "process", "data"],
    parts: ["product", "AI", "integration"],
    read: {
      enter: "01 · the challenge arrives",
      measure: (stage, pad, value) => `0${stage} · ${pad} · ${value}`,
      travel: (stage) => ["01 · measuring the challenge", "02 · choosing the combination", "03 · verifying"][stage - 1],
      drop: (part, gap) => `02 · ${part} · +${gap} mm`,
      running: (cycle) => `03 · running · cycle ${cycle}`,
    },
  },
};

const mm = (units) => `${units * MM < -0.005 ? "−" : ""}${Math.abs(units * MM).toFixed(2)} mm`;

function palletX(t) {
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, x1] = KEYS[i];
    const [t0, x0] = KEYS[i - 1];
    if (t <= t1) return x0 === x1 ? x0 : x0 + (x1 - x0) * ease.inOut(span(t, t0, t1));
  }
  return EXIT;
}

const dropShare = (t, index) => ease.in(span(t, DROPS[index], DROPS[index] + FALL));
const refillShare = (t, index) => ease.out(span(t, DROPS[index] + FALL, DROPS[index] + FALL + REFILL));

function topAt(px, t, x) {
  let top = BELT_Z;
  if (Math.abs(x - px) <= PALLET.w / 2) top = PALLET_TOP;
  PAD_X.forEach((offset, index) => {
    if (Math.abs(x - (px + offset)) > PAD.w / 2 + 1) return;
    const placed = t >= DROPS[index] + FALL;
    top = Math.max(top, PALLET_TOP + PADS[index] + (placed ? GAPS[index] : 0));
  });
  return top;
}

function poseAt(time) {
  const cycle = Math.floor(time / LOOP);
  const t = time % LOOP;
  const x = palletX(t);
  const tips = [RETRACT, RETRACT];
  let measuring = null;
  for (const [station, from, to, pad] of PROBES) {
    const down = ease.inOut(span(t, from - 0.2, from + 0.1)) * (1 - ease.inOut(span(t, to - 0.1, to + 0.2)));
    if (down <= 0) continue;
    const slot = station === 0 ? 0 : 1;
    const surface = topAt(x, t, STATIONS[station]);
    tips[slot] = RETRACT + (surface - RETRACT) * down;
    if (down > 0.98) measuring = { station, pad };
  }
  const falling = DROPS.findIndex((at) => t >= at && t < at + FALL);
  const stage = t < STAGES[1] ? 1 : t < STAGES[2] ? 2 : 3;
  return {
    t,
    x,
    alpha: unit(t / 0.6) * (1 - unit((t - 16.2) / 0.8)),
    belt: (cycle * (EXIT - ENTER) + (x - ENTER)) % CLEAT,
    tips,
    measuring,
    falling,
    stage,
    lit: t >= LIT_FROM,
    count: 11 + cycle + (t >= LIT_FROM ? 1 : 0),
  };
}

function readOf(copy, pose) {
  const { read } = copy;
  if (pose.measuring) {
    const slot = pose.measuring.station === 0 ? 0 : 1;
    return read.measure(pose.measuring.station + 1, copy.pads[pose.measuring.pad], mm(pose.tips[slot] - LEVEL));
  }
  if (pose.falling >= 0) return read.drop(copy.parts[pose.falling], (GAPS[pose.falling] * MM).toFixed(2));
  if (pose.lit) return read.running(pose.count);
  if (pose.t < 1.6) return read.enter;
  return read.travel(pose.stage);
}

function needleAt([x, y], reading) {
  const angle = (reading / PER_TURN) * Math.PI * 2;
  return k.lineOnTop(
    [x - Math.sin(angle) * 3, y + Math.cos(angle) * 3],
    [x + Math.sin(angle) * (DIAL_R - 4), y - Math.cos(angle) * (DIAL_R - 4)],
    DIAL_TOP + 0.2,
    P,
  );
}

function standSvg(sx) {
  const out = [];
  const foot = { x: sx - 12, y: -48, w: 24, d: 20, r: 2.5 };
  out.push(S(k.slabOf(foot, 0, 9, P, 5, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf(k.insetPlan(foot, 0.8), 9, 6, P, 5, 0.6), { tone: "mid" }));
  out.push(screws([[foot.x + 4, foot.y + 4, 15], [foot.x + foot.w - 4, foot.y + 4, 15]]));
  out.push(post(sx, -38, 2.8, 15, 66));
  const clamp = plan(sx, -38, 12, 12, 2);
  out.push(S(k.slabOf(clamp, 64, 10, P, 4, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(sx, -38, 2.8, 74, 10, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(sx, -38, 3.4, 84, 2, P, 20), { tone: "mid" }));
  out.push(S(k.slabOf({ x: sx - 3, y: -32, w: 6, d: 32 - DIAL_R + 1, r: 1.5 }, 66, 4, P, 3, 0.4), { tone: "mid" }));
  out.push(screws([[sx, -28, 70], [sx, -20, 70]]));
  out.push(S(k.cylinder(sx + 7, -38, 2.2, 66, 5, P, 16), { tone: "mid" }));
  out.push(L(k.knurl(sx + 7, -38, 2.2, 66, 71, 14, P), { tone: "lo" }));
  return out.join("");
}

function dialSvg(sx) {
  const out = [];
  out.push(S(k.cylinder(sx, 0, 2.6, 38, DIAL_Z - 38, P, 16), { tone: "mid" }));
  out.push(L(k.sideArc(sx, 0, 2.6, 44, P, 12), { tone: "lo" }));
  out.push(S(k.slabOf({ x: sx - 3.5, y: -DIAL_R - 4, w: 7, d: 6, r: 1.2 }, DIAL_Z + 2, 66 - DIAL_Z - 2, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(sx, 0, DIAL_R, DIAL_Z, DIAL_TOP - DIAL_Z, P, 60, 0.7), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(sx, 0, DIAL_R, DIAL_TOP - 3, DIAL_TOP, 72, P, 0.3), { tone: "lo" }));
  out.push(L(k.sideArc(sx, 0, DIAL_R, DIAL_TOP - 3, P, 36), { tone: "faint" }));
  out.push(L(k.ring(sx, 0, DIAL_R - 2, DIAL_TOP, P, 60), { tone: "lo" }));
  const ticks = k.radialTicks(sx, 0, DIAL_R - 2.6, 40, 5, DIAL_TOP, [1.2, 2.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(S(k.slabOf({ x: sx + DIAL_R - 1, y: -2, w: 4.4, d: 4, r: 1 }, DIAL_Z + 1.5, 4.5, P, 3), { tone: "mid" }));
  out.push(L(k.ring(sx, 0, 1.4, DIAL_TOP, P, 14), { tone: "mid" }));
  return out.join("");
}

const plungerSvg = (sx) => [
  S(k.cylinder(sx, 0, 2.2, 0, 2, P, 16), { tone: "hi", lit: true }),
  S(k.cylinder(sx, 0, 1.2, 2, ROD, P, 12), { tone: "hi", crease: "none", lit: true }),
].join("");

const blockSvg = (index, z) => {
  const footprint = plan(PAD_X[index], 0, BLOCK.w, BLOCK.d, 0.8);
  return [
    S(k.slabOf(footprint, z, GAPS[index], P, 3, 0.4), { tone: "hi", crease: "lo" }),
    L(k.planOutline(k.insetPlan(footprint, 1.6), z + GAPS[index], P, 3), { tone: "faint" }),
  ].join("");
};

function palletSvg(t) {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(PALLET, 2), BELT_Z, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(PALLET, BELT_Z, PALLET_TOP - BELT_Z, P, 4, 0.5), { tone: "mid" }));
  out.push(screws([[PALLET.x + 3, PALLET.y + 3, PALLET_TOP], [PALLET.x + PALLET.w - 3, PALLET.y + 3, PALLET_TOP], [PALLET.x + 3, PALLET.y + PALLET.d - 3, PALLET_TOP], [PALLET.x + PALLET.w - 3, PALLET.y + PALLET.d - 3, PALLET_TOP]]));
  PAD_X.forEach((offset, index) => {
    const pad = plan(offset, 0, PAD.w, PAD.d, 1);
    out.push(S(k.slabOf(pad, PALLET_TOP, PADS[index], P, 3, 0.5), { tone: "hi", crease: "lo" }));
    out.push(L(k.planOutline(k.insetPlan(pad, 1.8), PALLET_TOP + PADS[index], P, 3), { tone: "faint" }));
    const seat = PALLET_TOP + PADS[index];
    const lift = (PEEK - seat) * (1 - dropShare(t, index));
    const shown = t >= DROPS[index];
    out.push(`<g data-part="drop" transform="${k.translateAlong(P, [0, 0, lift])}"${shown ? "" : ' opacity="0"'}>${blockSvg(index, seat)}</g>`);
  });
  return out.join("");
}

function magazineSvg(index, t) {
  const cx = PAD_X[index];
  const box = plan(cx, 0, 15, 20, 1.4);
  const out = [];
  const refill = t >= DROPS[index] ? GAPS[index] * (1 - refillShare(t, index)) : 0;
  out.push(`<g data-part="peek" transform="${k.translateAlong(P, [0, 0, refill])}">${blockSvg(index, PEEK)}</g>`);
  out.push(S(k.slabOf(box, MAG_Z, 26, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(box, MAG_Z + 20, P, 3), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(box, 2.2), MAG_Z + 26, P, 3), { tone: "faint" }));
  out.push(screws([[box.x + 2.5, box.y + 2.5, MAG_Z + 26], [box.x + box.w - 2.5, box.y + box.d - 2.5, MAG_Z + 26]]));
  const slot = [[cx - 1.4, 10, MAG_Z + 5], [cx + 1.4, 10, MAG_Z + 5], [cx + 1.4, 10, MAG_Z + 17], [cx - 1.4, 10, MAG_Z + 17]];
  out.push(`<path class="iso-line" data-tone="lo" d="${k.pathOf(slot.map((point) => at(point)), true)}"/>`);
  return out.join("");
}

function beltCleats(offset) {
  const lines = [];
  for (let x = BELT.x + 6; x < BELT.x + BELT.w - 6 - CLEAT; x += CLEAT) {
    lines.push(k.lineOnTop([x + offset, BELT.y + 0.6], [x + offset, BELT.y + BELT.d - 0.6], BELT_Z, P));
  }
  return L(lines.join(""), { tone: "lo" });
}

function stationPlate(sx, text) {
  const card = { x: sx - 24, y: 26, w: 30, d: 15, r: 1.4 };
  return [
    S(k.slabOf(card, 0, 0.8, P, 4), { tone: "lo", crease: "none" }),
    L(k.planOutline(k.insetPlan(card, 1.4), 0.8, P, 4), { tone: "faint" }),
    k.faceTextSvg(k.topMatrix([card.x + 4, card.y + card.d - 4.5], 0.8, P, "x"), text, { size: 7.5, tone: "hi" }),
    L([0.32, 0.55].map((share) => k.lineOnTop([card.x + 16, card.y + card.d * share], [card.x + card.w - 3.5, card.y + card.d * share], 0.8, P)).join(""), { tone: "lo", free: true }),
  ].join("");
}

const counterText = (count) => k.faceTextSvg(k.topMatrix([STATIONS[2] + 37, 35.6], 9, P, "x"), String(count).padStart(4, "0"), { size: 6, tone: "hi", anchor: "middle" });

export function art(lang) {
  const copy = COPY[lang] ?? COPY.es;
  const pose = poseAt(STILL);
  const body = [base(PLATE, { h: 9, foot: 4, inset: 26 })];
  body.push(standSvg(STATIONS[0]));
  body.push(standSvg(STATIONS[2]));
  const wall = { x: -40, y: -34, w: 80, d: 5, r: 1.2 };
  body.push(S(k.slabOf(wall, 0, 72, P, 3, 0.6), { tone: "mid", inner: L([24, 48].map((z) => k.sideSeam(wall, z, P, 3)).join(""), { tone: "faint" }) }));
  body.push(screws([[wall.x + 4, wall.y + 2.5, 72], [wall.x + wall.w - 4, wall.y + 2.5, 72]]));
  PAD_X.forEach((cx) => {
    body.push(S(k.slabOf({ x: cx - 3, y: wall.y + wall.d, w: 6, d: -10 - wall.y - wall.d, r: 1 }, 60, 5, P, 2, 0.4), { tone: "mid" }));
  });
  const tower = [STATIONS[2] + 46, -36];
  body.push(post(tower[0], tower[1], 1.3, 0, 30));
  body.push(S(k.cylinder(tower[0], tower[1], 3.2, 30, 6, P, 24, 0.3), { tone: "mid", inner: L(k.sideArc(tower[0], tower[1], 3.2, 33, P, 16), { tone: "faint" }) }));
  body.push(S(k.cylinder(tower[0], tower[1], 3.2, 36, 6, P, 24, 0.3), { tone: "mid" }));
  body.push(`<g data-part="lamp">${S(k.cylinder(tower[0], tower[1], 3.2, 42, 6, P, 24, 0.3), { tone: "hi", lit: pose.lit })}</g>`);
  body.push(S(k.cylinder(tower[0], tower[1], 3.6, 48, 1.6, P, 24, 0.3), { tone: "mid" }));
  body.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BELT, 3), 0, 0.1, P)}" style="filter:blur(5px)"/>`);
  body.push(S(k.slabOf(BELT, 0, BELT_Z, P, 6, 0.8), { tone: "mid" }));
  body.push(`<g data-part="belt">${beltCleats(pose.belt)}</g>`);
  body.push(S(k.slabOf({ x: BELT.x, y: BELT.y, w: BELT.w, d: 3, r: 1 }, BELT_Z, 4, P, 2, 0.4), { tone: "mid" }));
  body.push(`<g data-part="pallet" transform="${k.translateAlong(P, [pose.x, 0, 0])}" opacity="${pose.alpha.toFixed(3)}">${palletSvg(STILL)}</g>`);
  const rail = { x: BELT.x, y: BELT.y + BELT.d - 3, w: BELT.w, d: 3, r: 1 };
  body.push(S(k.slabOf(rail, BELT_Z, 4, P, 2, 0.4), { tone: "mid" }));
  body.push(screws(Array.from({ length: 9 }, (_, index) => [BELT.x + 12 + index * 46.5, rail.y + 1.5, BELT_Z + 4])));
  [0, 1].forEach((slot) => {
    const sx = STATIONS[slot * 2];
    body.push(`<g data-part="plunger" transform="${k.translateAlong(P, [0, 0, pose.tips[slot]])}">${plungerSvg(sx)}</g>`);
    body.push(dialSvg(sx));
    body.push(`<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt([sx, 0], pose.tips[slot] - LEVEL)}" style="stroke-width:1.1"/>`);
  });
  PAD_X.forEach((_, index) => body.push(`<g data-part="magazine">${magazineSvg(index, STILL)}</g>`));
  STATIONS.forEach((sx, index) => body.push(stationPlate(sx, `0${index + 1}`)));
  const counter = { x: STATIONS[2] + 18, y: 26, w: 38, d: 15, r: 2 };
  body.push(S(k.slabOf(counter, 0, 9, P, 4, 0.6), { tone: "mid" }));
  body.push(S(k.slabOf(k.insetPlan(counter, 4), 9, 0.1, P, 3), { tone: "lo", flat: true, crease: "none" }));
  body.push(`<g data-part="count">${counterText(pose.count)}</g>`);
  body.push(screws(k.corners(counter, 2).map(([x, y]) => [x, y, 9])));
  body.push(label({ x: PLATE.x + 12, y: 22, w: 30, d: 14, r: 1.4 }));
  return k.figureSvg({ width: W, height: H, label: copy.label, body });
}

export const readoutAt = (lang, time = STILL) => readOf(COPY[lang] ?? COPY.es, poseAt(time));
export const stageAt = (time) => poseAt(time).stage;
export const LOOP_TIME = LOOP;

export function live(svg, lang) {
  const copy = COPY[lang] ?? COPY.es;
  const one = (part) => svg.querySelector(`[data-part="${part}"]`);
  const all = (part) => [...svg.querySelectorAll(`[data-part="${part}"]`)];
  const pallet = one("pallet");
  const drops = all("drop");
  const peeks = all("peek");
  const belt = one("belt");
  const plungers = all("plunger");
  const needles = all("needle");
  const lamp = one("lamp").firstElementChild;
  const count = one("count");
  let shown = poseAt(STILL).count;
  return (time) => {
    const pose = poseAt(time);
    pallet.setAttribute("transform", k.translateAlong(P, [pose.x, 0, 0]));
    pallet.setAttribute("opacity", pose.alpha.toFixed(3));
    belt.innerHTML = beltCleats(pose.belt);
    PAD_X.forEach((_, index) => {
      const seat = PALLET_TOP + PADS[index];
      drops[index].setAttribute("transform", k.translateAlong(P, [0, 0, (PEEK - seat) * (1 - dropShare(pose.t, index))]));
      drops[index].setAttribute("opacity", pose.t >= DROPS[index] ? "1" : "0");
      const refill = pose.t >= DROPS[index] ? GAPS[index] * (1 - refillShare(pose.t, index)) : 0;
      peeks[index].setAttribute("transform", k.translateAlong(P, [0, 0, refill]));
    });
    pose.tips.forEach((tip, slot) => {
      plungers[slot].setAttribute("transform", k.translateAlong(P, [0, 0, tip]));
      needles[slot].setAttribute("d", needleAt([STATIONS[slot * 2], 0], tip - LEVEL));
    });
    lamp.toggleAttribute("data-lit", pose.lit);
    if (pose.count !== shown) { shown = pose.count; count.innerHTML = counterText(pose.count); }
    return { text: readOf(copy, pose), stage: pose.stage };
  };
}
