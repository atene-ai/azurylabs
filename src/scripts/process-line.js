import { LOOP_TIME, STAGES, STILL, live } from "../lib/figures/process-line.mjs";

const still = matchMedia("(prefers-reduced-motion: reduce)");
const ENDS = [STAGES[1], STAGES[2], LOOP_TIME];
const HELD = [2.3, 8.6, 14.6];

function mount(root) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = "true";
  const frame = live(root.querySelector("svg"), root.dataset.lang);
  const readout = root.querySelector("[data-readout]");
  const buttons = [...root.querySelectorAll("[data-step]")];
  let time = STILL, last = 0, raf = 0, visible = false;

  const paint = (at) => {
    const { text, stage } = frame(at);
    if (readout.textContent !== text) readout.textContent = text;
    const t = at % LOOP_TIME;
    buttons.forEach((button, index) => {
      const on = index === stage - 1;
      button.toggleAttribute("data-active", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.style.setProperty("--progress", on ? ((t - STAGES[index]) / (ENDS[index] - STAGES[index])).toFixed(3) : "0");
    });
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

  buttons.forEach((button, index) => button.addEventListener("click", () => {
    time = Math.floor(time / LOOP_TIME) * LOOP_TIME + (still.matches ? HELD[index] : STAGES[index] + 0.01);
    paint(time);
    run();
  }));
  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    run();
  }, { rootMargin: "120px 0px" }).observe(root);
  still.addEventListener("change", () => (still.matches ? paint(time) : run()));
}

const mountAll = () => document.querySelectorAll('[data-figure="process-line"]').forEach(mount);
mountAll();
document.addEventListener("astro:page-load", mountAll);
