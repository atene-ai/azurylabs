import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

const root = document.querySelector("[data-hero-ecosystem-scene]");

if (root) {
  initEcosystem(root).catch(() => {
    root.closest(".hero-media")?.classList.add("has-static-fallback");
  });
}

async function initEcosystem(root) {
  const card = root.closest(".hero-media");
  const isCompact = window.matchMedia("(max-width: 640px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const particleCount = isCompact ? 8000 : 14000;
  const starCount = isCompact ? 650 : 1100;
  const morphDuration = 1500;
  const holdDuration = 2300;

  const brandDefinitions = [
    {
      name: "AZURY LABS",
      image: "/images/logos/azurylabs-logotipo-h-white.png",
    },
    {
      name: "ATENEA",
      image: "/images/logos/azurylabs-atenea-logo.png",
    },
    {
      name: "AZURY SALES OS",
      wordmark: "SALES OS",
    },
    {
      name: "AZURY MI NEGOCIO",
      wordmark: "MI NEGOCIO",
    },
    {
      name: "AZURY CIEE",
      image: "/images/logos/azurylabs-ciee-logo.png",
    },
    {
      name: "AZURY SYSTEMS",
      wordmark: "SYSTEMS",
    },
  ];

  const mark = await loadImage("/images/logos/azurylabs-isotipo-light.png");
  const targets = await Promise.all(
    brandDefinitions.map(async (brand) => {
      const canvas = brand.image
        ? createImageCanvas(await loadImage(brand.image))
        : createWordmarkCanvas(mark, brand.wordmark);

      return {
        ...brand,
        ...sampleLogo(canvas, particleCount),
      };
    }),
  );

  setThemeColors(targets, document.documentElement.dataset.theme === "light");

  const scene = new Scene();
  const camera = new PerspectiveCamera(43, 1, 0.1, 200);
  camera.position.set(0, 0, 9.4);

  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000003, 0);
  root.appendChild(renderer.domElement);

  const geometry = new BufferGeometry();
  const positions = targets[0].positions.slice();
  const colors = targets[0].colors.slice();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));

  const material = new PointsMaterial({
    size: isCompact ? 0.052 : 0.043,
    transparent: true,
    opacity: 0.94,
    vertexColors: true,
    blending: document.documentElement.dataset.theme === "light" ? NormalBlending : AdditiveBlending,
    depthWrite: false,
  });

  const particles = new Points(geometry, material);
  scene.add(particles);

  const starGeometry = new BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    starPositions[index * 3] = (Math.random() - 0.5) * 28;
    starPositions[index * 3 + 1] = (Math.random() - 0.5) * 18;
    starPositions[index * 3 + 2] = -3 - Math.random() * 24;
  }
  starGeometry.setAttribute("position", new BufferAttribute(starPositions, 3));
  const stars = new Points(
    starGeometry,
    new PointsMaterial({
      color: document.documentElement.dataset.theme === "light" ? 0x067ca0 : 0x77dfff,
      size: 0.025,
      transparent: true,
      opacity: document.documentElement.dataset.theme === "light" ? 0.2 : 0.34,
      blending: document.documentElement.dataset.theme === "light" ? NormalBlending : AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(stars);

  let currentIndex = 0;
  let targetIndex = 0;
  let morphStartedAt = 0;
  let nextMorphAt = performance.now() + holdDuration;
  let isMorphing = false;
  let isVisible = true;
  let animationFrame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const nameElement = card?.querySelector("[data-hero-brand-name]");
  const indexElement = card?.querySelector("[data-hero-brand-index]");

  function updateBrandUI(index) {
    if (nameElement) nameElement.textContent = targets[index].name;
    if (indexElement) {
      indexElement.textContent = `${String(index + 1).padStart(2, "0")} / ${String(targets.length).padStart(2, "0")}`;
    }
  }

  function resize() {
    const { width, height } = root.getBoundingClientRect();
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    camera.aspect = safeWidth / safeHeight;
    const aspect = safeWidth / safeHeight;
    camera.position.z = aspect > 1.35 ? 5 : safeWidth < 430 ? 10.5 : 9.4;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.35 : 1.75));
    renderer.setSize(safeWidth, safeHeight, false);
  }

  function startMorph(timestamp) {
    targetIndex = (currentIndex + 1) % targets.length;
    morphStartedAt = timestamp;
    isMorphing = true;
    updateBrandUI(targetIndex);
  }

  function morph(progress) {
    const eased = progress * progress * (3 - 2 * progress);
    const wave = Math.sin(progress * Math.PI) * 0.13;
    const from = targets[currentIndex];
    const to = targets[targetIndex];

    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      positions[offset] = MathUtils.lerp(from.positions[offset], to.positions[offset], eased)
        + Math.sin(index * 0.17 + progress * 18) * wave;
      positions[offset + 1] = MathUtils.lerp(from.positions[offset + 1], to.positions[offset + 1], eased)
        + Math.cos(index * 0.13 + progress * 16) * wave;
      positions[offset + 2] = MathUtils.lerp(from.positions[offset + 2], to.positions[offset + 2], eased)
        + Math.sin(index * 0.11 + progress * 20) * wave;

      colors[offset] = MathUtils.lerp(from.colors[offset], to.colors[offset], eased);
      colors[offset + 1] = MathUtils.lerp(from.colors[offset + 1], to.colors[offset + 1], eased);
      colors[offset + 2] = MathUtils.lerp(from.colors[offset + 2], to.colors[offset + 2], eased);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  function render(timestamp) {
    animationFrame = window.requestAnimationFrame(render);
    if (!isVisible || document.hidden) return;

    if (!reducedMotion && !isMorphing && timestamp >= nextMorphAt) {
      startMorph(timestamp);
    }

    if (isMorphing) {
      const progress = Math.min((timestamp - morphStartedAt) / morphDuration, 1);
      morph(progress);
      if (progress === 1) {
        currentIndex = targetIndex;
        isMorphing = false;
        nextMorphAt = timestamp + holdDuration;
      }
    }

    particles.rotation.x += (pointerY * 0.055 - particles.rotation.x) * 0.035;
    particles.rotation.y += (pointerX * 0.075 - particles.rotation.y) * 0.035;
    stars.rotation.y = timestamp * 0.000004;
    renderer.render(scene, camera);
  }

  root.addEventListener("pointermove", (event) => {
    const rect = root.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  root.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  }, { passive: true });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
  }, { threshold: 0.05 });
  visibilityObserver.observe(root);

  const themeObserver = new MutationObserver(() => {
    const isLight = document.documentElement.dataset.theme === "light";
    setThemeColors(targets, isLight);
    material.blending = isLight ? NormalBlending : AdditiveBlending;
    material.needsUpdate = true;
    stars.material.blending = isLight ? NormalBlending : AdditiveBlending;
    stars.material.color.set(isLight ? 0x067ca0 : 0x77dfff);
    stars.material.opacity = isLight ? 0.2 : 0.34;
    stars.material.needsUpdate = true;

    if (!isMorphing) {
      colors.set(targets[currentIndex].colors);
      geometry.attributes.color.needsUpdate = true;
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const destroy = () => {
    window.cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    themeObserver.disconnect();
    geometry.dispose();
    material.dispose();
    starGeometry.dispose();
    stars.material.dispose();
    renderer.dispose();
  };
  document.addEventListener("astro:before-swap", destroy, { once: true });

  updateBrandUI(0);
  resize();
  card?.classList.add("is-ready");
  root.dataset.ready = "true";
  animationFrame = window.requestAnimationFrame(render);
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Unable to load ${source}`)), { once: true });
    image.src = source;
  });
}

function createImageCanvas(image) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 560;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const maxWidth = 1030;
  const maxHeight = 430;
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  return canvas;
}

function createWordmarkCanvas(mark, wordmark) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 500;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const markSize = 265;
  const markX = 70;
  const markY = (canvas.height - markSize) / 2;
  context.drawImage(mark, markX, markY, markSize, markSize);

  context.fillStyle = "#75e8ff";
  context.font = "700 42px Arial, sans-serif";
  context.letterSpacing = "12px";
  context.fillText("IRUZ", 382, 177);

  context.fillStyle = "#f4faff";
  context.font = "800 116px Arial, sans-serif";
  context.letterSpacing = "-4px";
  context.fillText(wordmark, 374, 310);
  return canvas;
}

function sampleLogo(canvas, particleCount) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const samples = [];

  for (let y = 0; y < canvas.height; y += 3) {
    for (let x = 0; x < canvas.width; x += 3) {
      const offset = (y * canvas.width + x) * 4;
      if (imageData[offset + 3] > 55) {
        samples.push({
          x,
          y,
          red: imageData[offset] / 255,
          green: imageData[offset + 1] / 255,
          blue: imageData[offset + 2] / 255,
        });
      }
    }
  }

  const safeSamples = samples.length
    ? samples
    : [{ x: canvas.width / 2, y: canvas.height / 2, red: 0, green: 0.78, blue: 1 }];
  const positions = new Float32Array(particleCount * 3);
  const baseColors = new Float32Array(particleCount * 3);
  const sceneWidth = 8.5;

  for (let index = 0; index < particleCount; index += 1) {
    const sample = safeSamples[Math.floor(Math.random() * safeSamples.length)];
    const offset = index * 3;
    const jitter = 0.018;
    positions[offset] = (sample.x / canvas.width - 0.5) * sceneWidth + (Math.random() - 0.5) * jitter;
    positions[offset + 1] = (0.5 - sample.y / canvas.height) * sceneWidth * (canvas.height / canvas.width)
      + (Math.random() - 0.5) * jitter;
    positions[offset + 2] = (Math.random() - 0.5) * 0.32;

    const color = new Color(sample.red, sample.green, sample.blue);
    const hsl = {};
    color.getHSL(hsl);
    if (hsl.l < 0.4) color.setHSL(hsl.h, Math.min(hsl.s * 1.08, 1), 0.52);
    baseColors[offset] = color.r;
    baseColors[offset + 1] = color.g;
    baseColors[offset + 2] = color.b;
  }

  return { positions, baseColors, colors: baseColors.slice() };
}

function setThemeColors(targets, isLight) {
  targets.forEach((target) => {
    const colors = new Float32Array(target.baseColors.length);
    const color = new Color();
    const hsl = {};

    for (let index = 0; index < target.baseColors.length; index += 3) {
      color.setRGB(target.baseColors[index], target.baseColors[index + 1], target.baseColors[index + 2]);
      color.getHSL(hsl);

      if (isLight) {
        if (hsl.l > 0.66 || hsl.s < 0.16) {
          color.setRGB(0.025, 0.12, 0.19);
        } else if (hsl.l < 0.42) {
          color.setHSL(hsl.h, Math.max(hsl.s, 0.62), 0.4);
        }
      } else if (hsl.l < 0.38) {
        color.setHSL(hsl.h, Math.max(hsl.s, 0.68), 0.62);
      }

      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    target.colors = colors;
  });
}
