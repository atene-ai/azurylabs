// Shared drawing helpers for the small capability figures: one call per recurring part.
import * as k from "../iso/iso-kit.mjs";

export function partsFor(P) {
  const at = (point) => k.iso(point, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (points, style) => k.dotsSvg(points, style);
  const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  const halo = (plan, z, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, 0.1, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ""}/>`;

  function base(plan, { h = 8, foot = 4, inset = 18 } = {}) {
    const out = [`<path class="iso-halo" d="${k.haloOf(plan, -h - foot, h, P)}"/>`];
    for (const [x, y] of byDepth(k.corners(plan, inset))) {
      out.push(S(k.cylinder(x, y, 6, -h - foot, 1.4, P, 24), { tone: "lo" }));
      out.push(S(k.cylinder(x, y, 4.6, -h - foot + 1.4, foot - 1.4, P, 24), { tone: "mid" }));
    }
    out.push(S(k.slabOf(plan, -h, h, P, 8, 1.4), { tone: "mid" }));
    out.push(L(k.planOutline(k.insetPlan(plan, 4.5), 0, P), { tone: "lo" }));
    const screws = k.corners(plan, 9);
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
    out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
    return out.join("");
  }

  function label(plan, z = 0) {
    const out = [S(k.slabOf(plan, z, 0.8, P, 4), { tone: "lo", crease: "none" })];
    out.push(L(k.planOutline(k.insetPlan(plan, 1.4), z + 0.8, P, 4), { tone: "faint" }));
    const rows = [0.3, 0.5, 0.7].map((share, index) => {
      const y = plan.y + plan.d * share;
      const length = (plan.w - 8) * [0.6, 0.4, 0.75][index];
      return k.lineOnTop([plan.x + 3.5, y], [plan.x + 3.5 + length, y], z + 0.8, P);
    });
    out.push(L(rows.join(""), { tone: "lo", free: true }));
    return out.join("");
  }

  function knob(cx, cy, r, z, h = 4, { pointer = true } = {}) {
    return [
      S(k.cylinder(cx, cy, r, z, h, P, 28), { tone: "mid" }),
      L(k.knurl(cx, cy, r, z, z + h, Math.round(r * 6), P), { tone: "lo" }),
      pointer ? L(k.lineOnTop([cx, cy], [cx + r * 0.75, cy], z + h, P), { tone: "hi" }) : "",
    ].join("");
  }

  function post(cx, cy, r, z0, z1, { collar = true } = {}) {
    const out = [];
    if (collar) out.push(S(k.cylinder(cx, cy, r + 1.8, z0, 3.5, P, 24), { tone: "mid" }));
    out.push(S(k.cylinder(cx, cy, r, z0 + (collar ? 3.5 : 0), z1 - z0 - (collar ? 3.5 : 0), P, 24), { tone: "mid", crease: "none" }));
    return out.join("");
  }

  const screws = (points, size = 0.45) => D(points.map(at), { size });

  return { at, S, L, D, byDepth, halo, base, label, knob, post, screws };
}

export const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
};
export const unit = (value) => Math.min(1, Math.max(0, value));
export const span = (t, from, to) => unit((t - from) / (to - from));
