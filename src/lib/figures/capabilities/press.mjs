// Fig 01 · A bench press with a ready-made die: one stroke punches all six holes in each blank.
import * as k from "../../iso/iso-kit.mjs";
import { ease, partsFor, span } from "../parts.mjs";

export const W = 440;
export const H = 250;
const PLATE = { x: -100, y: -40, w: 200, d: 80, r: 7 };
const BED = { x: -92, y: -18, w: 142, d: 36, r: 2 };
const BED_TOP = 10;
const SHEET = { x: -14, y: -14, w: 28, d: 28, r: 1 };
const SHEET_H = 1.4;
const PUNCHES = [-7, 0, 7].flatMap((x) => [-5.5, 5.5].map((y) => [x, y]));
const POSTS = [-27, 27];
const HEAD = { x: -10, y: -32, w: 20, d: 64, r: 3 };
const HEAD_Z = 66;
const REST = 34;
const HIT = BED_TOP + SHEET_H + 4;
const MAG_X = -66;
const TRAY = { x: 56, y: -16, w: 38, d: 32, r: 2 };
const OUT_X = 75;
const LAYER = 1.4;
const LOOP = 5.2;
export const STILL = LOOP * 2 + 2.2;

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -12, 0), [0, 0, 96], [PLATE.x + PLATE.w, 0, 8]],
  W,
  H,
  { pad: 16, azimuth: 40 },
);
const { at, S, L, D, halo, base, label, post, screws } = partsFor(P);

const COPY = {
  es: {
    label: "Una prensa de banco con un troquel ya hecho. Cada lámina entra desde el cargador, la prensa baja una vez y salen las seis perforaciones juntas; la pieza terminada cae a la bandeja.",
    read: (count, punched) => `pieza ${String(count).padStart(2, "0")} · ${punched ? "6 perforaciones" : "en el troquel"} · 1 golpe`,
  },
  en: {
    label: "A bench press with a ready-made die. Each blank comes out of the magazine, the press comes down once and all six holes are punched together; the finished part drops into the tray.",
    read: (count, punched) => `part ${String(count).padStart(2, "0")} · ${punched ? "6 holes" : "in the die"} · 1 stroke`,
  },
};

const sheetSvg = (punched) => [
  S(k.slabOf(SHEET, BED_TOP, SHEET_H, P, 3, 0.4), { tone: "hi", lit: true }),
  `<g data-part="holes" opacity="${punched ? 1 : 0}">${PUNCHES.map(([x, y]) => `<path class="iso-fill" style="fill:var(--anatomy-shade-0)" d="${k.ring(x, y, 1.5, BED_TOP + SHEET_H, P, 14)}"/>`).join("")}${L(PUNCHES.map(([x, y]) => k.ring(x, y, 1.5, BED_TOP + SHEET_H, P, 14)).join(""), { tone: "hi" })}</g>`,
].join("");

const stackPlan = { x: TRAY.x + 5, y: -14, w: 28, d: 28, r: 1 };
export const stackSvg = (count) => (count ? [
  S(k.slabOf(stackPlan, 2, count * LAYER, P, 3, 0.3), {
    tone: "hi",
    inner: L(Array.from({ length: count - 1 }, (_, index) => k.sideSeam(stackPlan, 2 + (index + 1) * LAYER, P, 3)).join(""), { tone: "lo" }),
  }),
  L(PUNCHES.map(([x, y]) => k.ring(x + TRAY.x + 19, y, 1.5, 2 + count * LAYER, P, 14)).join(""), { tone: "mid" }),
].join("") : "");

function ramSvg() {
  const out = [];
  out.push(S(k.cylinder(0, 0, 2.6, REST + 11, HEAD_Z - HIT - 11 + 2, P, 18), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: -12, y: -12, w: 24, d: 24, r: 2 }, REST + 3, 8, P, 3, 0.5), { tone: "mid" }));
  out.push(screws([[-8, -8, REST + 11], [8, -8, REST + 11], [-8, 8, REST + 11], [8, 8, REST + 11]]));
  for (const [x, y] of [...PUNCHES].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(x, y, 1.3, REST - 4, 4, P, 14), { tone: "hi", crease: "none" }));
  }
  out.push(S(k.slabOf({ x: -11, y: -11, w: 22, d: 22, r: 1 }, REST, 3, P, 3, 0.4), { tone: "hi", crease: "lo" }));
  return out.join("");
}

export function art(lang) {
  const copy = COPY[lang] ?? COPY.es;
  const pose = poseAt(STILL);
  const body = [base(PLATE)];
  body.push(halo(k.insetPlan(BED, 2), 0, 4));
  body.push(S(k.slabOf(BED, 0, BED_TOP, P, 4, 0.8), { tone: "mid" }));
  for (const y of [-17, 15]) body.push(S(k.slabOf({ x: BED.x, y, w: BED.w, d: 2, r: 0.6 }, BED_TOP, 1.6, P, 2, 0.3), { tone: "lo" }));
  body.push(L(k.planOutline({ x: -16, y: -14.5, w: 32, d: 29, r: 1 }, BED_TOP, P, 3), { tone: "faint" }));
  body.push(L(PUNCHES.map(([x, y]) => k.ring(x, y, 1.6, BED_TOP, P, 14)).join(""), { tone: "faint" }));
  body.push(label({ x: -88, y: 22, w: 30, d: 12, r: 1.4 }));
  body.push(post(0, POSTS[0], 3.2, 0, HEAD_Z));
  body.push(S(k.slabOf(TRAY, 0, 2, P, 4, 0.5), { tone: "mid" }));
  body.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: 2, r: 0.6 }, 2, 6, P, 2, 0.3), { tone: "mid" }));
  body.push(`<g data-part="stack">${stackSvg(pose.stacked)}</g>`);
  body.push(`<g data-part="sheet" transform="${pose.sheet}"${pose.hidden ? ' opacity="0"' : ""}>${sheetSvg(pose.punched)}</g>`);
  const mag = { x: MAG_X - 15, y: -15, w: 30, d: 30, r: 1 };
  body.push(S(k.slabOf({ x: MAG_X - 14, y: -14, w: 28, d: 28, r: 1 }, BED_TOP + SHEET_H, 9, P, 3, 0.3), {
    tone: "hi",
    inner: L([1, 2, 3, 4, 5].map((n) => k.sideSeam({ x: MAG_X - 14, y: -14, w: 28, d: 28, r: 1 }, BED_TOP + SHEET_H + n * 1.5, P, 3)).join(""), { tone: "lo" }),
  }));
  for (const [x, y] of k.corners(mag, 0).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    body.push(S(k.slabOf({ x: x - 1.2, y: y - 1.2, w: 2.4, d: 2.4, r: 0.5 }, BED_TOP, 16, P, 2), { tone: "mid", crease: "none" }));
  }
  body.push(`<g data-part="ram" transform="${pose.ram}">${ramSvg()}</g>`);
  body.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y + TRAY.d - 2, w: TRAY.w, d: 2, r: 0.6 }, 2, 6, P, 2, 0.3), { tone: "mid" }));
  body.push(S(k.slabOf({ x: TRAY.x + TRAY.w - 2, y: TRAY.y, w: 2, d: TRAY.d, r: 0.6 }, 2, 6, P, 2, 0.3), { tone: "mid" }));
  body.push(post(0, POSTS[1], 3.2, 0, HEAD_Z));
  body.push(S(k.slabOf(HEAD, HEAD_Z, 8, P, 4, 0.6), { tone: "mid" }));
  body.push(screws(POSTS.map((y) => [0, y, HEAD_Z + 8])));
  body.push(S(k.cylinder(0, 0, 9, HEAD_Z + 8, 17, P, 40, 0.6), { tone: "mid" }));
  body.push(L([HEAD_Z + 14, HEAD_Z + 20].map((z) => k.sideArc(0, 0, 9, z, P, 24)).join(""), { tone: "faint" }));
  body.push(S(k.cylinder(0, 0, 10, HEAD_Z + 25, 3, P, 40, 0.5), { tone: "mid" }));
  body.push(L(k.ring(0, 0, 5, HEAD_Z + 28, P, 24), { tone: "lo" }));
  body.push(D([at([0, 0, HEAD_Z + 28])], { size: 0.6, tone: "hi" }));
  return k.figureSvg({ width: W, height: H, label: copy.label, body });
}

function poseAt(time) {
  const t = time % LOOP;
  const count = (Math.floor(time / LOOP) % 6) + 1;
  const landed = t >= 3.85;
  let x = MAG_X + (0 - MAG_X) * ease.inOut(span(t, 0, 1.2));
  if (t > 2.6) x = OUT_X * ease.inOut(span(t, 2.6, 3.5));
  const down = t < 1.75 ? ease.in(span(t, 1.2, 1.75)) : 1 - ease.out(span(t, 1.75, 2.6));
  return {
    count,
    stacked: landed ? count : count - 1,
    sheet: k.translateAlong(P, [x, 0, -(BED_TOP - 2 - (count - 1) * LAYER) * ease.in(span(t, 3.5, 3.85))]),
    hidden: landed,
    ram: k.translateAlong(P, [0, 0, -(REST - HIT) * down]),
    punched: t >= 1.75,
  };
}

export const readoutAt = (lang, time = STILL) => {
  const pose = poseAt(time);
  return (COPY[lang] ?? COPY.es).read(pose.count, pose.punched);
};

export function live(svg, lang) {
  const copy = COPY[lang] ?? COPY.es;
  const sheet = svg.querySelector('[data-part="sheet"]');
  const holes = svg.querySelector('[data-part="holes"]');
  const ram = svg.querySelector('[data-part="ram"]');
  const stack = svg.querySelector('[data-part="stack"]');
  let shown = poseAt(STILL).stacked;
  return (time) => {
    const pose = poseAt(time);
    if (pose.stacked !== shown) { shown = pose.stacked; stack.innerHTML = stackSvg(pose.stacked); }
    sheet.setAttribute("transform", pose.sheet);
    sheet.setAttribute("opacity", pose.hidden ? "0" : "1");
    ram.setAttribute("transform", pose.ram);
    holes.setAttribute("opacity", pose.punched ? "1" : "0");
    return copy.read(pose.count, pose.punched);
  };
}
