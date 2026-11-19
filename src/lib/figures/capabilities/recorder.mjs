// Fig 05 · An upright strip-chart recorder: the pen draws the measured signal, and when the trend crosses a
// printed threshold the selector flips and the process reverses half a second later.
import * as k from "../../iso/iso-kit.mjs";
import { ease, partsFor, span } from "../parts.mjs";

export const W = 440;
export const H = 250;
const PLATE = { x: -86, y: -34, w: 170, d: 66, r: 7 };
const WALL = { x: -50, y: -13, w: 90, d: 7, r: 1.2 };
const WALL_H = 46;
const FACE = WALL.y + WALL.d + 0.2;
const ROLL_R = 5;
const ROLLS = [-55, 45];
const PAPER = { from: -55, to: 45, low: 8, high: 40 };
const PEN_X = 20;
const SPEED = 9;
const GRID = 8;
const PERIOD = 11;
const BAND = [0.3, 0.72];
const LIMITS = [0.34, 0.68];
const SWITCH = { x: 46, y: 10, w: 28, d: 12, r: 2 };
export const STILL = 8.6;

const zOf = (value) => PAPER.low + 3 + value * (PAPER.high - PAPER.low - 6);
const tri = (time) => {
  const phase = ((time % PERIOD) + PERIOD) % PERIOD / PERIOD;
  const up = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  return BAND[0] + (BAND[1] - BAND[0]) * up;
};
const signal = (time) => tri(time) + 0.035 * Math.sin(time * 5.3) + 0.022 * Math.sin(time * 11.7 + 1.3) + 0.015 * Math.sin(time * 2.1 + 0.4);
const lag = (LIMITS[0] - BAND[0]) / ((BAND[1] - BAND[0]) * 2 / PERIOD);
const decisionAt = (time) => (tri(time + lag) < tri(time + lag - 0.01) ? "B" : "A");

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -12, 0), [WALL.x, WALL.y, WALL_H + 4], [WALL.x + WALL.w, WALL.y, WALL_H + 4]],
  W,
  H,
  { pad: 16, azimuth: 34 },
);
const { at, S, L, D, base, label, screws } = partsFor(P);
const face = k.sideMatrix([0, FACE], 0, P, "left");

const COPY = {
  es: {
    label: "Un registrador de gráfica vertical. La pluma traza la señal medida; cuando la tendencia cruza el umbral impreso, el selector cambia de posición y medio segundo después la tendencia se invierte.",
    read: (sample, value, decision) => `muestra ${sample} · ${value.toFixed(2)} · ajuste ${decision === "A" ? "↑" : "↓"}`,
  },
  en: {
    label: "An upright strip-chart recorder. The pen traces the measured signal; when the trend crosses the printed threshold the selector flips, and half a second later the trend reverses.",
    read: (sample, value, decision) => `sample ${sample} · ${value.toFixed(2)} · adjust ${decision === "A" ? "↑" : "↓"}`,
  },
};

function paperSvg(time) {
  const shift = (time * SPEED) % GRID;
  const vertical = [];
  for (let u = PAPER.to - shift; u > PAPER.from; u -= GRID) vertical.push(`M${u.toFixed(2)} ${-PAPER.high}V${-PAPER.low}`);
  const trace = [];
  for (let u = PEN_X; u >= PAPER.from; u -= 1) trace.push([u, -zOf(signal(time - (PEN_X - u) / SPEED))]);
  return [
    `<path class="iso-line" data-tone="faint" d="${vertical.join("")}"/>`,
    `<path class="iso-line rec-trace" data-tone="lit" d="${k.pathOf(trace)}"/>`,
  ].join("");
}

function staticPaper() {
  const horizontal = [];
  for (let z = PAPER.low + GRID / 2; z < PAPER.high; z += GRID / 2) horizontal.push(`M${PAPER.from} ${-z}H${PAPER.to}`);
  return [
    `<rect class="rec-paper" x="${PAPER.from}" y="${-PAPER.high}" width="${PAPER.to - PAPER.from}" height="${PAPER.high - PAPER.low}"/>`,
    `<path class="iso-line" data-tone="faint" d="${horizontal.join("")}"/>`,
    `<path class="iso-line" data-tone="mid" d="${LIMITS.map((value) => `M${PAPER.from} ${(-zOf(value)).toFixed(2)}H${PAPER.to}`).join("")}"/>`,
  ].join("");
}

function carriageSvg(z) {
  return [
    S(k.slabOf({ x: PEN_X - 1, y: FACE, w: 2, d: 4.2 - FACE, r: 0.4 }, z - 0.6, 1.2, P, 2), { tone: "hi", lit: true }),
    S(k.slabOf({ x: PEN_X - 5, y: 4, w: 10, d: 6, r: 1 }, z - 3, 6, P, 2, 0.4), { tone: "mid" }),
    screws([[PEN_X - 3, 7, z + 3], [PEN_X + 3, 7, z + 3]]),
  ].join("");
}

function poseAt(time) {
  const value = signal(time);
  const decision = decisionAt(time);
  const sinceFlip = Math.min(...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((step) => (decisionAt(time - step * 0.1) === decision ? Infinity : step * 0.1)));
  const knob = decision === "B" ? ease.out(span(sinceFlip === Infinity ? 1 : sinceFlip, 0, 0.4)) : 1 - ease.out(span(sinceFlip === Infinity ? 1 : sinceFlip, 0, 0.4));
  return { value, decision, knob, pen: zOf(value), sample: Math.floor(time * 4) };
}

export function art(lang) {
  const copy = COPY[lang] ?? COPY.es;
  const pose = poseAt(STILL);
  const body = [base(PLATE)];
  body.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan({ x: -60, y: -14, w: 110, d: 10, r: 2 }, 1), 0, 0.1, P)}" style="filter:blur(5px)"/>`);
  for (const x of ROLLS) {
    body.push(S(k.cylinder(x, FACE - ROLL_R, ROLL_R + 1.6, 0, 3, P, 28, 0.4), { tone: "mid" }));
  }
  body.push(S(k.slabOf(WALL, 0, WALL_H, P, 4, 0.8), { tone: "mid" }));
  body.push(screws([[WALL.x + 4, WALL.y + 3.5, WALL_H], [WALL.x + WALL.w - 4, WALL.y + 3.5, WALL_H]]));
  for (const x of ROLLS) {
    body.push(S(k.cylinder(x, FACE - ROLL_R, ROLL_R, 3, 40, P, 28), { tone: "hi", crease: "lo", inner: L([PAPER.low, PAPER.high].map((z) => k.sideArc(x, FACE - ROLL_R, ROLL_R, z, P, 20)).join(""), { tone: "lo" }) }));
    body.push(S(k.cylinder(x, FACE - ROLL_R, 2, 43, 2.5, P, 16), { tone: "mid" }));
  }
  body.push(`<g transform="${face}"><clipPath id="rec-clip"><rect x="${PAPER.from}" y="${-PAPER.high}" width="${PAPER.to - PAPER.from}" height="${PAPER.high - PAPER.low}"/></clipPath>${staticPaper()}<g clip-path="url(#rec-clip)" data-part="paper">${paperSvg(STILL)}</g></g>`);
  body.push(S(k.slabOf({ x: PEN_X - 6, y: FACE, w: 12, d: 10, r: 1 }, WALL_H - 4, 4, P, 2, 0.4), { tone: "mid" }));
  body.push(S(k.cylinder(PEN_X, 7, 1.3, 0, WALL_H - 4, P, 14), { tone: "mid", crease: "none" }));
  body.push(S(k.cylinder(PEN_X, 7, 3.2, 0, 3, P, 20, 0.3), { tone: "mid" }));
  body.push(`<g data-part="carriage" transform="${k.translateAlong(P, [0, 0, pose.pen])}">${carriageSvg(0)}</g>`);
  body.push(S(k.slabOf(SWITCH, 0, 5, P, 3, 0.5), { tone: "mid" }));
  body.push(L(k.planOutline({ x: SWITCH.x + 6, y: SWITCH.y + 5, w: 16, d: 2, r: 1 }, 5, P, 3), { tone: "lo" }));
  const lamps = [[SWITCH.x + 3.5, SWITCH.y + 3], [SWITCH.x + SWITCH.w - 3.5, SWITCH.y + 3]].map(([x, y]) => at([x, y, 5]));
  body.push(lamps.map(([x, y], index) => `<circle class="cap-led" data-lamp="${index ? "B" : "A"}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.1 * P.scale * 1.26).toFixed(2)}"${(index ? "B" : "A") === pose.decision ? ' data-on="lit"' : ""}/>`).join(""));
  body.push(`<g data-part="knob" transform="${k.translateAlong(P, [12 * pose.knob, 0, 0])}">${S(k.slabOf({ x: SWITCH.x + 6, y: SWITCH.y + 3.5, w: 4, d: 5, r: 0.8 }, 5, 4, P, 2, 0.4), { tone: "hi" })}</g>`);
  body.push(k.wireSvg(at([WALL.x + WALL.w, WALL.y + WALL.d / 2, 6]), at([SWITCH.x + 2, SWITCH.y + 2, 5]), { via: [at([WALL.x + WALL.w + 8, WALL.y + WALL.d / 2, 0.2]), at([SWITCH.x - 2, SWITCH.y + 2, 0.2])], tone: "lo" }));
  body.push(label({ x: -78, y: 12, w: 28, d: 12, r: 1.4 }));
  return k.figureSvg({ width: W, height: H, label: copy.label, body });
}

export const readoutAt = (lang, time = STILL) => {
  const pose = poseAt(time);
  return (COPY[lang] ?? COPY.es).read(pose.sample, pose.value, pose.decision);
};

export function live(svg, lang) {
  const copy = COPY[lang] ?? COPY.es;
  const paper = svg.querySelector('[data-part="paper"]');
  const carriage = svg.querySelector('[data-part="carriage"]');
  const knob = svg.querySelector('[data-part="knob"]');
  const lamps = [...svg.querySelectorAll("[data-lamp]")];
  return (time) => {
    const pose = poseAt(time);
    paper.innerHTML = paperSvg(time);
    carriage.setAttribute("transform", k.translateAlong(P, [0, 0, pose.pen]));
    knob.setAttribute("transform", k.translateAlong(P, [12 * pose.knob, 0, 0]));
    lamps.forEach((lamp) => (lamp.dataset.lamp === pose.decision ? lamp.setAttribute("data-on", "lit") : lamp.removeAttribute("data-on")));
    return copy.read(pose.sample, pose.value, pose.decision);
  };
}
