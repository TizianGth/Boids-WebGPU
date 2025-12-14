import { startRenderer, BoidOptions } from "../gpu/renderer";

let boidOptions: BoidOptions = {
  speed: 0.016,
  amount: 500,
  size: 1,
  viewRadius: 0.12,
  separationRadius: 0.05,
  cohesionWeight: 0.01,
  alignmentWeight: 0.05,
  separationWeight: 0.03,
  maxSpeed: 0.2,
  maxForce: 0.06,
  smooth: 0.18,
  jitter: 0.02,
  maxBoids: 10000,
};

const canvas = document.getElementById("gpuCanvas") as HTMLCanvasElement;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const panel = document.getElementById("panel")!;
addInputEventListeners();
startRenderer(canvas, boidOptions);

// handles panel input
function addInputEventListeners() {
  function parseFloat(str: string) {
    return Number.parseFloat(str);
  }

  const hint = document.getElementById("hint");
  function setHint(str: string, e: MouseEvent) {
    if (!hint) return;
    hint.textContent = str;
    hint.style.left = e.pageX - 20 - panel.offsetLeft + "px";
    hint.style.top = e.pageY + 20 - panel.offsetTop + "px";
  }
  function showHint() {
    if (!hint) return;
    hint.style.display = "block";
  }
  function hideHint() {
    if (!hint) return;
    hint.style.display = "none";
  }

  let dragging = false,
    offsetX = 0,
    offsetY = 0;

  panel.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.closest("input")) {
      return;
    }
    dragging = true;
    offsetX = e.clientX - panel.offsetLeft;
    offsetY = e.clientY - panel.offsetTop;
    document.body.style.setProperty("cursor", "grabbing", "important");
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    panel.style.left = e.clientX - offsetX + "px";
    panel.style.top = e.clientY - offsetY + "px";
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.setProperty("cursor", "grab", "important");
  });

  const speedInput = document.getElementById("speed") as HTMLInputElement;
  const amountInput = document.getElementById("amount") as HTMLInputElement;
  const sizeInput = document.getElementById("size") as HTMLInputElement;
  const viewRadiusInput = document.getElementById(
    "view_radius"
  ) as HTMLInputElement;
  const sepRadiusInput = document.getElementById(
    "sep_radius"
  ) as HTMLInputElement;
  const cohWeightInput = document.getElementById(
    "coh_weight"
  ) as HTMLInputElement;
  const alignWeightInput = document.getElementById(
    "align_weight"
  ) as HTMLInputElement;
  const sepWeightInput = document.getElementById(
    "sep_weight"
  ) as HTMLInputElement;
  const maxSpeedInput = document.getElementById(
    "max_speed"
  ) as HTMLInputElement;
  const maxForceInput = document.getElementById(
    "max_force"
  ) as HTMLInputElement;
  const smoothInput = document.getElementById("smooth") as HTMLInputElement;
  const jitterInput = document.getElementById("jitter") as HTMLInputElement;

  speedInput.addEventListener("input", () => {
    boidOptions.speed = parseFloat(speedInput.value);
  });
  sizeInput.addEventListener("input", () => {
    boidOptions.size = parseFloat(sizeInput.value);
  });
  viewRadiusInput.addEventListener("input", () => {
    boidOptions.viewRadius = parseFloat(viewRadiusInput.value);
  });
  sepRadiusInput.addEventListener("input", () => {
    boidOptions.separationRadius = parseFloat(sepRadiusInput.value);
  });
  cohWeightInput.addEventListener("input", () => {
    boidOptions.cohesionWeight = parseFloat(cohWeightInput.value);
  });
  alignWeightInput.addEventListener("input", () => {
    boidOptions.alignmentWeight = parseFloat(alignWeightInput.value);
  });
  sepWeightInput.addEventListener("input", () => {
    boidOptions.separationWeight = parseFloat(sepWeightInput.value);
  });
  maxSpeedInput.addEventListener("input", () => {
    boidOptions.maxSpeed = parseFloat(maxSpeedInput.value);
  });
  maxForceInput.addEventListener("input", () => {
    boidOptions.maxForce = parseFloat(maxForceInput.value);
  });
  smoothInput.addEventListener("input", () => {
    boidOptions.smooth = parseFloat(smoothInput.value);
  });
  jitterInput.addEventListener("input", () => {
    boidOptions.jitter = parseFloat(jitterInput.value);
  });

  amountInput.addEventListener("input", () => {
    const x = parseFloat(amountInput.value);
    boidOptions.amount = x >= boidOptions.maxBoids ? boidOptions.maxBoids : x;
    amountInput.value = boidOptions.amount.toString();
  });

  speedInput.value = boidOptions.speed.toString();
  amountInput.value = boidOptions.amount.toString();
  sizeInput.value = boidOptions.size.toString();
  viewRadiusInput.value = boidOptions.viewRadius.toString();
  sepRadiusInput.value = boidOptions.separationRadius.toString();
  cohWeightInput.value = boidOptions.cohesionWeight.toString();
  alignWeightInput.value = boidOptions.alignmentWeight.toString();
  sepWeightInput.value = boidOptions.separationWeight.toString();
  maxSpeedInput.value = boidOptions.maxSpeed.toString();
  maxForceInput.value = boidOptions.maxForce.toString();
  smoothInput.value = boidOptions.smooth.toString();
  jitterInput.value = boidOptions.jitter.toString();

  speedInput.addEventListener("mousemove", (e) => {
    setHint(speedInput.value.toString(), e);
  });
  sizeInput.addEventListener("mousemove", (e) => {
    setHint(sizeInput.value.toString(), e);
  });
  viewRadiusInput.addEventListener("mousemove", (e) => {
    setHint(viewRadiusInput.value.toString(), e);
  });
  sepRadiusInput.addEventListener("mousemove", (e) => {
    setHint(sepRadiusInput.value.toString(), e);
  });
  cohWeightInput.addEventListener("mousemove", (e) => {
    setHint(cohWeightInput.value.toString(), e);
  });
  alignWeightInput.addEventListener("mousemove", (e) => {
    setHint(alignWeightInput.value.toString(), e);
  });
  sepWeightInput.addEventListener("mousemove", (e) => {
    setHint(sepWeightInput.value.toString(), e);
  });
  maxSpeedInput.addEventListener("mousemove", (e) => {
    setHint(maxSpeedInput.value.toString(), e);
  });
  maxForceInput.addEventListener("mousemove", (e) => {
    setHint(maxForceInput.value.toString(), e);
  });
  smoothInput.addEventListener("mousemove", (e) => {
    setHint(smoothInput.value.toString(), e);
  });
  jitterInput.addEventListener("mousemove", (e) => {
    setHint(jitterInput.value.toString(), e);
  });

  speedInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  sizeInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  viewRadiusInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  sepRadiusInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  cohWeightInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  alignWeightInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  sepWeightInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  maxSpeedInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  maxForceInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  smoothInput.addEventListener("mouseenter", (e) => {
    showHint();
  });
  jitterInput.addEventListener("mouseenter", (e) => {
    showHint();
  });

  speedInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  sizeInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  viewRadiusInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  sepRadiusInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  cohWeightInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  alignWeightInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  sepWeightInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  maxSpeedInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  maxForceInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  smoothInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  jitterInput.addEventListener("mouseleave", (e) => {
    hideHint();
  });

  const speedE = document.getElementById("sSpeed") as HTMLInputElement;
  const amountE = document.getElementById("sAmount") as HTMLInputElement;
  const sizeE = document.getElementById("sSize") as HTMLInputElement;
  const viewRadiusE = document.getElementById(
    "sViewRadius"
  ) as HTMLInputElement;
  const sepRadiusE = document.getElementById("sSepRadius") as HTMLInputElement;
  const cohWeightE = document.getElementById("sCohWeight") as HTMLInputElement;
  const alignWeightE = document.getElementById(
    "sAlignWeight"
  ) as HTMLInputElement;
  const sepWeightE = document.getElementById("sSepWeight") as HTMLInputElement;
  const maxSpeedE = document.getElementById("sMaxSpeed") as HTMLInputElement;
  const maxForceE = document.getElementById("sMaxForce") as HTMLInputElement;
  const smoothE = document.getElementById("sSmooth") as HTMLInputElement;
  const jitterE = document.getElementById("sJitter") as HTMLInputElement;

  speedE.addEventListener("mousemove", (e) => {
    setHint("Base movement rate before steering forces apply", e);
  });
  amountE.addEventListener("mousemove", (e) => {
    setHint("Total number of boids", e);
  });
  sizeE.addEventListener("mousemove", (e) => {
    setHint("Visual scale of each boid", e);
  });
  viewRadiusE.addEventListener("mousemove", (e) => {
    setHint("Distance at which boids detect neighbors", e);
  });
  sepRadiusE.addEventListener("mousemove", (e) => {
    setHint("Minimum personal space to avoid crowding", e);
  });
  cohWeightE.addEventListener("mousemove", (e) => {
    setHint("Pull toward the average neighbor position", e);
  });
  alignWeightE.addEventListener("mousemove", (e) => {
    setHint("Tendency to match neighbor direction", e);
  });
  sepWeightE.addEventListener("mousemove", (e) => {
    setHint("Strength of steering away from close boids", e);
  });
  maxSpeedE.addEventListener("mousemove", (e) => {
    setHint("Upper limit of boid velocity", e);
  });
  maxForceE.addEventListener("mousemove", (e) => {
    setHint("Maximum steering influence", e);
  });
  smoothE.addEventListener("mousemove", (e) => {
    setHint("Dampens sudden steering changes", e);
  });
  jitterE.addEventListener("mousemove", (e) => {
    setHint("Small random offset to reduce rigid motion", e);
  });

  speedE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  amountE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  sizeE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  viewRadiusE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  alignWeightE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  sepRadiusE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  cohWeightE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  sepWeightE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  maxSpeedE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  maxForceE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  smoothE.addEventListener("mouseenter", (e) => {
    showHint();
  });
  jitterE.addEventListener("mouseenter", (e) => {
    showHint();
  });

  speedE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  amountE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  sizeE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  viewRadiusE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  alignWeightE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  sepRadiusE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  cohWeightE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  sepWeightE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  maxSpeedE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  maxForceE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  smoothE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
  jitterE.addEventListener("mouseleave", (e) => {
    hideHint();
  });
}
