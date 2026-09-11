import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  NormalBlending,
  OrthographicCamera,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

const root = document.querySelector("[data-hero-atom]");

if (root) {
  initAtom(root).catch(() => {
    root.classList.add("has-static-fallback");
  });
}

async function initAtom(root) {
  const compact = window.matchMedia("(max-width: 640px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const particleCount = compact ? 2100 : 4400;
  const logo = await loadImage("/images/logos/azurylabs-isotipo-black.png");
  const target = sampleMark(logo, particleCount);
  const isLight = document.documentElement.dataset.theme === "light";

  const scene = new Scene();
  const camera = new OrthographicCamera(-5, 5, 5, -5, 0.1, 40);
  camera.position.z = 10;

  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  root.appendChild(renderer.domElement);

  const logoGroup = new Group();
  const logoGeometry = new BufferGeometry();
  logoGeometry.setAttribute("position", new BufferAttribute(target, 3));
  const logoMaterial = new PointsMaterial({
    color: isLight ? 0x061b2a : 0xe7f7ff,
    size: compact ? 0.052 : 0.043,
    transparent: true,
    opacity: 0.93,
    blending: isLight ? NormalBlending : AdditiveBlending,
    depthWrite: false,
  });
  logoGroup.add(new Points(logoGeometry, logoMaterial));
  scene.add(logoGroup);

  const orbitColor = new Color(isLight ? 0x009cc7 : 0x66e5ff);
  const orbitSystems = [
    createOrbit(4.38, 2.72, -0.38, 0.00038, orbitColor, compact),
    createOrbit(3.58, 3.68, 0.56, -0.00048, orbitColor, compact),
    createOrbit(4.82, 1.94, 1.05, 0.00031, orbitColor, compact),
  ];
  orbitSystems.forEach((orbit) => scene.add(orbit.points));

  let animationFrame = 0;
  let visible = true;
  let pointerX = 0;
  let pointerY = 0;

  function resize() {
    const { width, height } = root.getBoundingClientRect();
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    const aspect = safeWidth / safeHeight;
    const viewHeight = 10;
    camera.left = -(viewHeight * aspect) / 2;
    camera.right = (viewHeight * aspect) / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.3 : 1.65));
    renderer.setSize(safeWidth, safeHeight, false);
  }

  function applyTheme() {
    const light = document.documentElement.dataset.theme === "light";
    logoMaterial.color.set(light ? 0x061b2a : 0xe7f7ff);
    logoMaterial.blending = light ? NormalBlending : AdditiveBlending;
    logoMaterial.needsUpdate = true;

    orbitSystems.forEach((orbit) => {
      orbit.material.color.set(light ? 0x009cc7 : 0x66e5ff);
      orbit.material.blending = light ? NormalBlending : AdditiveBlending;
      orbit.material.opacity = light ? 0.7 : 0.82;
      orbit.material.needsUpdate = true;
    });
  }

  function render(timestamp) {
    animationFrame = window.requestAnimationFrame(render);
    if (!visible || document.hidden) return;

    if (!reducedMotion) {
      orbitSystems.forEach((orbit) => updateOrbit(orbit, timestamp));
      const pulse = 1 + Math.sin(timestamp * 0.0011) * 0.018;
      logoGroup.scale.setScalar(pulse);
      logoGroup.rotation.x += (pointerY * 0.035 - logoGroup.rotation.x) * 0.025;
      logoGroup.rotation.y += (pointerX * 0.04 - logoGroup.rotation.y) * 0.025;
    }

    renderer.render(scene, camera);
  }

  root.addEventListener("pointermove", (event) => {
    const bounds = root.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  }, { passive: true });

  root.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  }, { passive: true });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { threshold: 0.05 });
  visibilityObserver.observe(root);
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const destroy = () => {
    window.cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    themeObserver.disconnect();
    logoGeometry.dispose();
    logoMaterial.dispose();
    orbitSystems.forEach((orbit) => {
      orbit.geometry.dispose();
      orbit.material.dispose();
    });
    renderer.dispose();
  };
  document.addEventListener("astro:before-swap", destroy, { once: true });

  resize();
  applyTheme();
  root.classList.add("is-ready");
  if (reducedMotion) {
    orbitSystems.forEach((orbit) => updateOrbit(orbit, 0));
    renderer.render(scene, camera);
  } else {
    animationFrame = window.requestAnimationFrame(render);
  }
}

function createOrbit(radiusX, radiusY, rotation, speed, color, compact) {
  const trailLength = compact ? 10 : 14;
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(trailLength * 3), 3));
  const material = new PointsMaterial({
    color,
    size: compact ? 0.1 : 0.084,
    transparent: true,
    opacity: 0.8,
    blending: document.documentElement.dataset.theme === "light" ? NormalBlending : AdditiveBlending,
    depthWrite: false,
  });
  return {
    geometry,
    material,
    points: new Points(geometry, material),
    radiusX,
    radiusY,
    rotation,
    speed,
    trailLength,
  };
}

function updateOrbit(orbit, timestamp) {
  const position = orbit.geometry.attributes.position;
  const phase = timestamp * orbit.speed;
  const cosine = Math.cos(orbit.rotation);
  const sine = Math.sin(orbit.rotation);

  for (let index = 0; index < orbit.trailLength; index += 1) {
    const angle = phase - index * 0.11;
    const x = Math.cos(angle) * orbit.radiusX;
    const y = Math.sin(angle) * orbit.radiusY;
    const offset = index * 3;
    position.array[offset] = x * cosine - y * sine;
    position.array[offset + 1] = x * sine + y * cosine;
    position.array[offset + 2] = 0.3 - index * 0.012;
  }

  position.needsUpdate = true;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Unable to load ${source}`)), { once: true });
    image.src = source;
  });
}

function sampleMark(image, particleCount) {
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 560;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const size = 384;
  context.drawImage(image, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size);

  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const samples = [];
  for (let y = 0; y < canvas.height; y += 3) {
    for (let x = 0; x < canvas.width; x += 3) {
      if (data[(y * canvas.width + x) * 4 + 3] > 55) samples.push([x, y]);
    }
  }

  const positions = new Float32Array(particleCount * 3);
  const fallback = [canvas.width / 2, canvas.height / 2];
  for (let index = 0; index < particleCount; index += 1) {
    const sample = samples[Math.floor(Math.random() * samples.length)] ?? fallback;
    const offset = index * 3;
    positions[offset] = (sample[0] / canvas.width - 0.5) * 3.05 + (Math.random() - 0.5) * 0.018;
    positions[offset + 1] = (0.5 - sample[1] / canvas.height) * 3.05 + (Math.random() - 0.5) * 0.018;
    positions[offset + 2] = (Math.random() - 0.5) * 0.12;
  }
  return positions;
}
