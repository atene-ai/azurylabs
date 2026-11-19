import { FIGURES } from "../lib/figures/capabilities/index.mjs";

const still = matchMedia("(prefers-reduced-motion: reduce)");

function mount(root) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = "true";
  const figure = FIGURES[Number(root.dataset.capfig)];
  const readout = root.querySelector("[data-readout]");
  const frame = figure.live(root.querySelector("svg"), root.dataset.lang);
  let time = figure.STILL, last = 0, raf = 0, visible = false;
  const paint = (at) => {
    const text = frame(at);
    if (readout.textContent !== text) readout.textContent = text;
  };
  const tick = (now) => {
    time += last ? Math.min((now - last) / 1000, 1 / 30) : 0;
    last = now;
    paint(time);
    raf = visible && !still.matches ? requestAnimationFrame(tick) : 0;
  };
  const run = () => {
    if (raf || !visible || still.matches) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    run();
  }, { rootMargin: "120px 0px" }).observe(root);
  still.addEventListener("change", () => (still.matches ? paint(figure.STILL) : run()));
}

const mountAll = () => document.querySelectorAll("[data-capfig]").forEach(mount);
mountAll();
document.addEventListener("astro:page-load", mountAll);
