// Fig 02 · A contour gauge: a row of pins slides until each one rests on the edge of a one-off part, copying its profile.
import * as k from "../../iso/iso-kit.mjs";
import { ease, partsFor, span, unit } from "../parts.mjs";

export const W = 440;
export const H = 250;
const PLATE = { x: -96, y: -40, w: 192, d: 82, r: 7 };
const FENCE = { x: -62, y: -32, w: 124, d: 4, r: 1 };
const PIECE_H = 10;
const PIECE_HALF = 52;
const PINS = 24;
const PITCH = 3.7;
const PIN = { w: 1.9, length: 30, z: 4, h: 2.4 };
const COMB = { x: -50, y: 16, w: 100, d: 12, r: 1.5 };
const HOME = 13;
const LOOP = 6.4;
export const STILL = LOOP * 3 + 4.4;

const pinX = (index) => (index - (PINS - 1) / 2) * PITCH;
const profileOf = (cycle) => {
  const a = 1.3 + ((cycle * 2.399) % 6.28);
  const b = 0.7 + ((cycle * 1.618) % 6.28);
  return (x) => 2 + 4.2 * Math.sin(x / 10 + a) + 2.6 * Math.sin(x / 4.6 + b) + (Math.abs(x - 14 * Math.sin(cycle)) < 8 ? 3 : 0);
};

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -12, 0), [0, 0, 18]],
  W,
  H,
  { pad: 18, azimuth: 36 },
);
const { at, S, L, halo, base, label, knob, screws } = partsFor(P);

const COPY = {
  es: {
    label: "Una galga de perfil: veinticuatro agujas deslizan en un peine hasta apoyarse en el borde de una pieza única y copian su forma exacta. En cada ciclo llega una pieza distinta.",
    read: (cycle, touching, loading) => `pieza ${String(cycle).padStart(2, "0")} · ${loading ? "nueva forma" : touching < PINS ? `midiendo ${touching}/${PINS}` : `${PINS} agujas · copia exacta`}`,
  },
  en: {
    label: "A contour gauge: twenty-four pins slide in a comb until each rests on the edge of a one-off part and copies its exact shape. A different part arrives every cycle.",
    read: (cycle, touching, loading) => `part ${String(cycle).padStart(2, "0")} · ${loading ? "new shape" : touching < PINS ? `measuring ${touching}/${PINS}` : `${PINS} pins · exact copy`}`,
  },
};

function pieceSvg(cycle) {
  const edge = profileOf(cycle);
  const front = [];
  for (let x = PIECE_HALF; x >= -PIECE_HALF; x -= 1.5) front.push([x, edge(x)]);
  const ring = [[-PIECE_HALF, FENCE.y + FENCE.d], [PIECE_HALF, FENCE.y + FENCE.d], ...front];
  const plan = { x: -PIECE_HALF, y: FENCE.y + FENCE.d, w: PIECE_HALF * 2, d: 30, r: 0 };
  return [
    halo(k.insetPlan(plan, 2), 0, 4),
    S(k.extrude(ring, 0, PIECE_H, P, { convex: false, bevel: 0.5 }), { tone: "hi", crease: "lo" }),
    L(k.planOutline({ x: -PIECE_HALF + 4, y: FENCE.y + FENCE.d + 3, w: 22, d: 6, r: 1 }, PIECE_H, P, 3), { tone: "faint" }),
  ].join("");
}

const pinPlan = (index) => ({ x: pinX(index) - PIN.w / 2, y: 0, w: PIN.w, d: PIN.length, r: 0.5 });
const pinSvg = (index) => S(k.slabOf(pinPlan(index), PIN.z, PIN.h, P, 2, 0.3), { tone: "hi", lit: true });

function poseAt(time) {
  const cycle = Math.floor(time / LOOP) + 1;
  const t = time % LOOP;
  const edge = profileOf(cycle);
  const swap = span(t, 0.9, 2.1);
  const pins = Array.from({ length: PINS }, (_, index) => {
    const reach = edge(pinX(index)) + 0.3;
    const out = ease.out(span(t, 2.2 + index * 0.045, 2.75 + index * 0.045));
    const back = ease.inOut(span(t, 0, 0.8));
    const settled = t >= 2.2 ? HOME + (reach - HOME) * out : HOME + (profileOf(cycle - 1)(pinX(index)) + 0.3 - HOME) * (1 - back);
    return settled;
  });
  const touching = t < 2.2 ? 0 : pins.filter((y, index) => Math.abs(y - edge(pinX(index)) - 0.3) < 0.05).length;
  return {
    cycle,
    pins,
    old: k.translateAlong(P, [50 * ease.in(unit(swap * 2)), 0, 0]),
    oldAlpha: 1 - unit(swap * 2),
    fresh: k.translateAlong(P, [-50 * (1 - ease.out(unit(swap * 2 - 1))), 0, 0]),
    freshAlpha: unit(swap * 2 - 1),
    lock: t >= 2.2 + PINS * 0.045 + 0.6 ? 1 : 0,
    loading: t < 2.2,
    touching,
  };
}

function lockSvg(turn) {
  const [x, y] = [COMB.x + COMB.w + 6, COMB.y + COMB.d / 2];
  const angle = turn * Math.PI * 0.5;
  return L(k.lineOnTop([x, y], [x + Math.cos(angle) * 3.6, y + Math.sin(angle) * 3.6], 9, P), { tone: "hi" });
}

export function art(lang) {
  const copy = COPY[lang] ?? COPY.es;
  const pose = poseAt(STILL);
  const body = [base(PLATE)];
  body.push(S(k.slabOf(FENCE, 0, 9, P, 3, 0.5), { tone: "mid" }));
  body.push(screws([[FENCE.x + 4, FENCE.y + 2, 9], [FENCE.x + FENCE.w - 4, FENCE.y + 2, 9]]));
  body.push(`<g data-part="old" transform="${pose.old}" opacity="${pose.oldAlpha.toFixed(3)}">${pieceSvg(pose.cycle - 1)}</g>`);
  body.push(`<g data-part="fresh" transform="${pose.fresh}" opacity="${pose.freshAlpha.toFixed(3)}">${pieceSvg(pose.cycle)}</g>`);
  body.push(S(k.slabOf(COMB, 0, PIN.z, P, 3, 0.5), { tone: "mid" }));
  body.push(L(Array.from({ length: PINS + 1 }, (_, index) => k.lineOnTop([pinX(index) - PITCH / 2, COMB.y], [pinX(index) - PITCH / 2, COMB.y + COMB.d], PIN.z, P)).join(""), { tone: "faint" }));
  body.push(screws([[COMB.x + 2.5, COMB.y + 3, PIN.z], [COMB.x + 2.5, COMB.y + COMB.d - 3, PIN.z]]));
  for (let index = 0; index < PINS; index++) {
    body.push(`<g data-part="pin" transform="${k.translateAlong(P, [0, pose.pins[index], 0])}">${pinSvg(index)}</g>`);
  }
  const clamp = { x: -50, y: COMB.y + 3, w: 100, d: 6, r: 1.2 };
  body.push(S(k.slabOf(clamp, PIN.z + PIN.h, 2.4, P, 3, 0.4), { tone: "mid" }));
  body.push(screws([-34, -12, 12, 34].map((x) => [x, clamp.y + clamp.d / 2, PIN.z + PIN.h + 2.4])));
  body.push(S(k.slabOf({ x: COMB.x + COMB.w, y: COMB.y + 4, w: 3, d: 4, r: 0.6 }, 2.5, 3, P, 2), { tone: "mid", crease: "none" }));
  body.push(knob(COMB.x + COMB.w + 6, COMB.y + COMB.d / 2, 4, 2, 7, { pointer: false }));
  body.push(`<g data-part="lock">${lockSvg(pose.lock)}</g>`);
  body.push(label({ x: -88, y: 22, w: 28, d: 12, r: 1.4 }));
  return k.figureSvg({ width: W, height: H, label: copy.label, body });
}

export const readoutAt = (lang, time = STILL) => {
  const pose = poseAt(time);
  return (COPY[lang] ?? COPY.es).read(pose.cycle, pose.touching, pose.loading);
};

export function live(svg, lang) {
  const copy = COPY[lang] ?? COPY.es;
  const old = svg.querySelector('[data-part="old"]');
  const fresh = svg.querySelector('[data-part="fresh"]');
  const pins = [...svg.querySelectorAll('[data-part="pin"]')];
  const lock = svg.querySelector('[data-part="lock"]');
  let cycle = poseAt(STILL).cycle;
  let locked = -1;
  return (time) => {
    const pose = poseAt(time);
    if (pose.cycle !== cycle) {
      cycle = pose.cycle;
      old.innerHTML = pieceSvg(cycle - 1);
      fresh.innerHTML = pieceSvg(cycle);
    }
    old.setAttribute("transform", pose.old);
    old.setAttribute("opacity", pose.oldAlpha.toFixed(3));
    fresh.setAttribute("transform", pose.fresh);
    fresh.setAttribute("opacity", pose.freshAlpha.toFixed(3));
    pins.forEach((pin, index) => pin.setAttribute("transform", k.translateAlong(P, [0, pose.pins[index], 0])));
    if (pose.lock !== locked) { locked = pose.lock; lock.innerHTML = lockSvg(pose.lock); }
    return copy.read(pose.cycle, pose.touching, pose.loading);
  };
}
