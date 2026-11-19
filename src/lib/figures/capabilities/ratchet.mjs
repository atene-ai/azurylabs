// Fig 06 · A ratchet: each stroke of the lever turns the wheel one tooth, the holding pawl clicks into the next gap
// so it never slips back, and a counter keeps the running total.
import * as k from "../../iso/iso-kit.mjs";
import { ease, partsFor, span } from "../parts.mjs";

export const W = 440;
export const H = 250;
const PLATE = { x: -78, y: -46, w: 148, d: 92, r: 7 };
const CENTRE = [-12, -2];
const TEETH = 18;
const STEP = (Math.PI * 2) / TEETH;
const ROOT = 21;
const TIP = 27;
const WHEEL_Z = 10;
const WHEEL_H = 6;
const PIVOT = [30, -20];
const CONTACT = Math.atan2(PIVOT[1] - CENTRE[1], PIVOT[0] - CENTRE[0]) + 0.12;
const LEVER = { length: 44, from: 2.1, z: WHEEL_Z + WHEEL_H + 3 };
const COUNTER = { x: 22, y: 16, w: 40, d: 18, r: 2 };
const STROKE = 1.5;
export const STILL = 128 * STROKE + 1.0;

const radiusAt = (local) => {
  const phase = ((local % STEP) + STEP) % STEP / STEP;
  return phase < 0.18 ? ROOT + (TIP - ROOT) * (phase / 0.18) : TIP - (TIP - ROOT) * ((phase - 0.18) / 0.82);
};

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -12, 0), [CENTRE[0], CENTRE[1], LEVER.z + 12]],
  W,
  H,
  { pad: 16, azimuth: 40 },
);
const { at, S, L, D, base, label, knob, post, screws } = partsFor(P);

const COPY = {
  es: {
    label: "Un trinquete: cada golpe de palanca gira la rueda un diente, el trinquete de retención cae en el siguiente hueco para que nunca retroceda y un contador suma el avance.",
    read: (count) => `avance ${String(count).padStart(4, "0")} · retroceso 0`,
  },
  en: {
    label: "A ratchet: each stroke of the lever turns the wheel one tooth, the holding pawl drops into the next gap so it never slips back, and a counter adds up the progress.",
    read: (count) => `advance ${String(count).padStart(4, "0")} · slip 0`,
  },
};

function wheelSvg(theta) {
  const [cx, cy] = CENTRE;
  const top = WHEEL_Z + WHEEL_H;
  const centreDepth = k.depthOf([cx, cy, 0], P);
  const teeth = Array.from({ length: TEETH }, (_, i) => {
    const a = theta + i * STEP;
    const ring = [[a, ROOT - 0.4], [a + STEP * 0.18, TIP], [a + STEP * 0.4, radiusAt(STEP * 0.4)], [a + STEP * 0.7, radiusAt(STEP * 0.7)], [a + STEP, ROOT - 0.4]]
      .map(([angle, r]) => [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    const mid = a + STEP * 0.4;
    return { depth: k.depthOf([cx + Math.cos(mid) * TIP, cy + Math.sin(mid) * TIP, 0], P), svg: S(k.extrude(ring, WHEEL_Z, WHEEL_H, P, { bevel: 0.3 }), { tone: "hi", crease: "lo" }) };
  }).sort((p, q) => p.depth - q.depth);
  const holes = [0, 1, 2, 3].map((index) => {
    const a = theta + index * (Math.PI / 2) + STEP / 2;
    return k.ring(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, 3, top, P, 18);
  });
  return [
    ...teeth.filter((tooth) => tooth.depth < centreDepth).map((tooth) => tooth.svg),
    S(k.cylinder(cx, cy, ROOT, WHEEL_Z, WHEEL_H, P, 64, 0.5), { tone: "hi", crease: "lo" }),
    ...teeth.filter((tooth) => tooth.depth >= centreDepth).map((tooth) => tooth.svg),
    `<path class="iso-top" d="${k.ring(cx, cy, ROOT - 0.2, top, P, 72)}"/>`,
    L(k.ring(cx, cy, ROOT - 0.2, top, P, 72), { tone: "faint" }),
    `<path class="iso-fill" style="fill:var(--anatomy-shade-0)" d="${holes.join("")}"/>`,
    L(holes.join(""), { tone: "lo" }),
    L(k.ring(cx, cy, 7, top, P, 32), { tone: "faint" }),
  ].join("");
}

function pawlSvg(theta) {
  const r = radiusAt(CONTACT - theta);
  const tip = [CENTRE[0] + Math.cos(CONTACT) * (r - 0.6), CENTRE[1] + Math.sin(CONTACT) * (r - 0.6)];
  const dx = tip[0] - PIVOT[0], dy = tip[1] - PIVOT[1];
  const length = Math.hypot(dx, dy);
  const [ux, uy] = [dx / length, dy / length];
  const [nx, ny] = [-uy, ux];
  const ring = [
    [PIVOT[0] + nx * 3 - ux * 3, PIVOT[1] + ny * 3 - uy * 3],
    [tip[0] + nx * 1.6 - ux * 2.6, tip[1] + ny * 1.6 - uy * 2.6],
    [tip[0], tip[1]],
    [tip[0] - nx * 1.2 - ux * 1.4, tip[1] - ny * 1.2 - uy * 1.4],
    [PIVOT[0] - nx * 3 - ux * 3, PIVOT[1] - ny * 3 - uy * 3],
  ];
  return S(k.extrude(ring, WHEEL_Z + 1, 3.4, P, { convex: false, bevel: 0.3 }), { tone: "mid" });
}

function leverSvg(alpha) {
  const [cx, cy] = CENTRE;
  const end = [cx + Math.cos(alpha) * LEVER.length, cy + Math.sin(alpha) * LEVER.length];
  const [ux, uy] = [Math.cos(alpha), Math.sin(alpha)];
  const [nx, ny] = [-uy, ux];
  const ring = [
    [cx + nx * 6.5, cy + ny * 6.5],
    [end[0] + nx * 3, end[1] + ny * 3],
    [end[0] + ux * 3, end[1] + uy * 3],
    [end[0] - nx * 3, end[1] - ny * 3],
    [cx - nx * 6.5, cy - ny * 6.5],
    [cx - ux * 6.5, cy - uy * 6.5],
  ];
  return [
    S(k.extrude(ring, LEVER.z, 2.6, P, { bevel: 0.4 }), { tone: "hi", lit: true }),
    S(k.cylinder(end[0], end[1], 3.4, LEVER.z + 2.6, 9, P, 24, 0.4), { tone: "mid" }),
    L(k.knurl(end[0], end[1], 3.4, LEVER.z + 2.6, LEVER.z + 11.6, 20, P), { tone: "lo" }),
    S(k.cylinder(cx, cy, 4.2, LEVER.z + 2.6, 2.4, P, 24, 0.4), { tone: "mid" }),
    D([at([cx, cy, LEVER.z + 5])], { size: 0.6, tone: "hi" }),
  ].join("");
}

function counterSvg(count) {
  const text = String(count).padStart(4, "0");
  return k.faceTextSvg(k.topMatrix([COUNTER.x + COUNTER.w / 2, COUNTER.y + COUNTER.d / 2 + 2.4], 10, P, "x"), text, { size: 7, tone: "hi", anchor: "middle" });
}

function poseAt(time) {
  const count = Math.floor(time / STROKE);
  const t = time % STROKE;
  const forward = ease.inOut(span(t, 0.1, 0.7));
  const back = ease.inOut(span(t, 0.8, 1.35));
  const theta = (count + forward) * STEP;
  return { count: count + (t >= 0.7 ? 1 : 0), theta, alpha: LEVER.from + (forward - back) * STEP };
}

export function art(lang) {
  const copy = COPY[lang] ?? COPY.es;
  const pose = poseAt(STILL);
  const body = [base(PLATE)];
  body.push(`<path class="iso-halo" d="${k.haloOf({ x: CENTRE[0] - 24, y: CENTRE[1] - 24, w: 48, d: 48, r: 24 }, 0, 0.1, P)}" style="filter:blur(5px)"/>`);
  body.push(S(k.cylinder(CENTRE[0], CENTRE[1], 11, 0, 3, P, 40, 0.5), { tone: "mid" }));
  body.push(S(k.cylinder(CENTRE[0], CENTRE[1], 8, 3, WHEEL_Z - 3, P, 36, 0.4), { tone: "mid" }));
  body.push(screws([0, 1, 2, 3].map((index) => [CENTRE[0] + Math.cos(index * Math.PI / 2 + 0.6) * 9.5, CENTRE[1] + Math.sin(index * Math.PI / 2 + 0.6) * 9.5, 3])));
  body.push(`<g data-part="wheel">${wheelSvg(pose.theta)}</g>`);
  body.push(post(PIVOT[0], PIVOT[1], 2.2, 0, WHEEL_Z + 6));
  body.push(`<g data-part="pawl">${pawlSvg(pose.theta)}</g>`);
  body.push(D([at([PIVOT[0], PIVOT[1], WHEEL_Z + 6])], { size: 0.6, tone: "hi" }));
  const hooks = [PIVOT[0] + 2.6, PIVOT[0] + 18];
  const spring = k.coil(hooks[0], hooks[1], [PIVOT[1] - 1.5, WHEEL_Z + 2.7], 1.3, 6, "x", P);
  body.push(post(hooks[1] + 1.6, PIVOT[1] - 1.5, 1.6, 0, WHEEL_Z + 6, { collar: true }));
  body.push(L(spring.back, { tone: "lo" }), L(spring.front, { tone: "mid" }));
  body.push(D(hooks.map((x) => at([x, PIVOT[1] - 1.5 + 1.3, WHEEL_Z + 2.7])), { size: 0.7, tone: "hi" }));
  body.push(`<g data-part="lever">${leverSvg(pose.alpha)}</g>`);
  body.push(S(k.slabOf(COUNTER, 0, 10, P, 4, 0.6), { tone: "mid" }));
  const window = { x: COUNTER.x + 5, y: COUNTER.y + 4, w: COUNTER.w - 10, d: COUNTER.d - 8, r: 1 };
  body.push(S(k.slabOf(window, 10, 0.1, P, 3), { tone: "lo", flat: true, crease: "none" }));
  body.push(`<g data-part="count">${counterSvg(pose.count)}</g>`);
  body.push(screws(k.corners(COUNTER, 2.4).map(([x, y]) => [x, y, 10])));
  body.push(knob(COUNTER.x + COUNTER.w + 4, COUNTER.y + COUNTER.d / 2, 2.6, 3, 4));
  body.push(label({ x: -70, y: 26, w: 28, d: 12, r: 1.4 }));
  return k.figureSvg({ width: W, height: H, label: copy.label, body });
}

export const readoutAt = (lang, time = STILL) => (COPY[lang] ?? COPY.es).read(poseAt(time).count);

export function live(svg, lang) {
  const copy = COPY[lang] ?? COPY.es;
  const wheel = svg.querySelector('[data-part="wheel"]');
  const pawl = svg.querySelector('[data-part="pawl"]');
  const lever = svg.querySelector('[data-part="lever"]');
  const counter = svg.querySelector('[data-part="count"]');
  let shown = poseAt(STILL).count;
  let turned = poseAt(STILL).theta;
  let swung = poseAt(STILL).alpha;
  return (time) => {
    const pose = poseAt(time);
    if (pose.theta !== turned) {
      turned = pose.theta;
      wheel.innerHTML = wheelSvg(pose.theta);
      pawl.innerHTML = pawlSvg(pose.theta);
    }
    if (pose.alpha !== swung) { swung = pose.alpha; lever.innerHTML = leverSvg(pose.alpha); }
    if (pose.count !== shown) { shown = pose.count; counter.innerHTML = counterSvg(pose.count); }
    return copy.read(pose.count);
  };
}
