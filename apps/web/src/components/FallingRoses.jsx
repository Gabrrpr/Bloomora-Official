import { useEffect, useRef, useState } from "react";

/* ── Flower A: 8-petal bright pink (reference match) ── */
const FLOWER_A = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <ellipse cx='50' cy='30' rx='11' ry='17' fill='#f472b6' transform='rotate(0   50 50)'/>
  <ellipse cx='50' cy='30' rx='11' ry='17' fill='#ec4899' transform='rotate(45  50 50)'/>
  <ellipse cx='50' cy='30' rx='11' ry='17' fill='#f472b6' transform='rotate(90  50 50)'/>
  <ellipse cx='50' cy='30' rx='11' ry='17' fill='#ec4899' transform='rotate(135 50 50)'/>
  <ellipse cx='50' cy='30' rx='11' ry='17' fill='#f472b6' transform='rotate(180 50 50)'/>
  <ellipse cx='50' cy='30' rx='11' ry='17' fill='#ec4899' transform='rotate(225 50 50)'/>
  <ellipse cx='50' cy='30' rx='11' ry='17' fill='#f472b6' transform='rotate(270 50 50)'/>
  <ellipse cx='50' cy='30' rx='11' ry='17' fill='#ec4899' transform='rotate(315 50 50)'/>
  <circle cx='50' cy='50' r='17' fill='#fbbf24'/>
  <circle cx='50' cy='50' r='10' fill='#f59e0b'/>
  <circle cx='46' cy='46' r='3'  fill='#fef9c3' opacity='0.7'/>
</svg>`;

/* ── Flower B: 6-petal deep pink, large ── */
const FLOWER_B = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <ellipse cx='50' cy='29' rx='12' ry='18' fill='#db2777' transform='rotate(0   50 50)'/>
  <ellipse cx='50' cy='29' rx='12' ry='18' fill='#be185d' transform='rotate(60  50 50)'/>
  <ellipse cx='50' cy='29' rx='12' ry='18' fill='#db2777' transform='rotate(120 50 50)'/>
  <ellipse cx='50' cy='29' rx='12' ry='18' fill='#be185d' transform='rotate(180 50 50)'/>
  <ellipse cx='50' cy='29' rx='12' ry='18' fill='#db2777' transform='rotate(240 50 50)'/>
  <ellipse cx='50' cy='29' rx='12' ry='18' fill='#be185d' transform='rotate(300 50 50)'/>
  <circle cx='50' cy='50' r='16' fill='#fef08a'/>
  <circle cx='50' cy='50' r='9'  fill='#fbbf24'/>
  <circle cx='46' cy='46' r='3'  fill='white' opacity='0.5'/>
</svg>`;

/* ── Flower C: 5-petal blush, small accent ── */
const FLOWER_C = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <ellipse cx='50' cy='30' rx='10' ry='16' fill='#fbcfe8' transform='rotate(0   50 50)'/>
  <ellipse cx='50' cy='30' rx='10' ry='16' fill='#f9a8d4' transform='rotate(72  50 50)'/>
  <ellipse cx='50' cy='30' rx='10' ry='16' fill='#fbcfe8' transform='rotate(144 50 50)'/>
  <ellipse cx='50' cy='30' rx='10' ry='16' fill='#f9a8d4' transform='rotate(216 50 50)'/>
  <ellipse cx='50' cy='30' rx='10' ry='16' fill='#fbcfe8' transform='rotate(288 50 50)'/>
  <circle cx='50' cy='50' r='15' fill='#fef9c3'/>
  <circle cx='50' cy='50' r='8'  fill='#fbbf24'/>
  <circle cx='47' cy='47' r='2.5' fill='white' opacity='0.6'/>
</svg>`;

/* ── Leaf A: tall narrow with veins ── */
const LEAF_A = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <path d='M50 8 C76 22 78 52 50 92 C22 52 24 22 50 8Z' fill='#4ade80'/>
  <path d='M50 8 Q51 50 50 92'           stroke='#15803d' stroke-width='2.5' fill='none' stroke-linecap='round'/>
  <path d='M50 34 Q63 37 70 30'         stroke='#15803d' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  <path d='M50 34 Q37 37 30 30'         stroke='#15803d' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  <path d='M50 52 Q64 55 72 47'         stroke='#15803d' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  <path d='M50 52 Q36 55 28 47'         stroke='#15803d' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  <path d='M50 68 Q61 70 67 63'         stroke='#15803d' stroke-width='1.2' fill='none' stroke-linecap='round'/>
  <path d='M50 68 Q39 70 33 63'         stroke='#15803d' stroke-width='1.2' fill='none' stroke-linecap='round'/>
</svg>`;

/* ── Leaf B: wide round leaf ── */
const LEAF_B = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <path d='M50 12 C88 24 90 62 50 90 C10 62 12 24 50 12Z' fill='#86efac'/>
  <path d='M50 12 Q51 52 50 90'          stroke='#16a34a' stroke-width='2.5' fill='none' stroke-linecap='round'/>
  <path d='M50 38 Q67 41 75 32'         stroke='#16a34a' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  <path d='M50 38 Q33 41 25 32'         stroke='#16a34a' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  <path d='M50 56 Q68 59 77 50'         stroke='#16a34a' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  <path d='M50 56 Q32 59 23 50'         stroke='#16a34a' stroke-width='1.5' fill='none' stroke-linecap='round'/>
</svg>`;

const encode = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const BG = {
  FA: encode(FLOWER_A),
  FB: encode(FLOWER_B),
  FC: encode(FLOWER_C),
  LA: encode(LEAF_A),
  LB: encode(LEAF_B),
};

const SIZE = {
  FA: () => {
    const band = Math.random();
    if (band < 0.33) return 18 + Math.random() * 12;
    if (band < 0.66) return 40 + Math.random() * 20;
    return 70 + Math.random() * 25;
  },
  FB: () => {
    const band = Math.random();
    if (band < 0.4) return 50 + Math.random() * 20;
    return 80 + Math.random() * 30;
  },
  FC: () => 10 + Math.random() * 18,
  LA: () => {
    const band = Math.random();
    if (band < 0.5) return 22 + Math.random() * 20;
    return 55 + Math.random() * 35;
  },
  LB: () => {
    const band = Math.random();
    if (band < 0.5) return 18 + Math.random() * 18;
    return 50 + Math.random() * 30;
  },
};

function pickType() {
  const r = Math.random();
  if (r < 0.28) return "FA";
  if (r < 0.52) return "FB";
  if (r < 0.68) return "FC";
  if (r < 0.84) return "LA";
  return "LB";
}

const ITEMS = Array.from({ length: 52 }, (_, i) => {
  const type = pickType();
  const size = SIZE[type]();
  const sizeFactor = size / 50;
  const duration   = (8 + Math.random() * 8) * Math.max(0.7, Math.min(1.4, sizeFactor));
  const swayAmp    = (30 + Math.random() * 50) / Math.max(0.8, sizeFactor);
  const swayDur    = (3 + Math.random() * 4)  * Math.max(0.8, sizeFactor);
  const spinSpeed  = (60 + Math.random() * 120) / sizeFactor;

  return {
    id: i, type, size,
    left:     -5 + Math.random() * 110,
    duration,
    delay:    Math.random() * 10,
    swayAmp,
    swayDur,
    spinSpeed,
  };
});

const STYLE_ID = "bloomora-flowers-v4";

export default function FallingRoses() {
  const injected = useRef(false);

  // Read initial state from localStorage; default to enabled
  const [enabled, setEnabled] = useState(() =>
    localStorage.getItem("bloomora-falling-roses") !== "false"
  );

  // Listen for toggle events dispatched by AdminHero
  useEffect(() => {
    const handler = (e) => setEnabled(e.detail?.enabled ?? true);
    window.addEventListener("bloomora:roses-toggle", handler);
    return () => window.removeEventListener("bloomora:roses-toggle", handler);
  }, []);

  useEffect(() => {
    if (injected.current || document.getElementById(STYLE_ID)) return;
    injected.current = true;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes pf-fall {
        0%   { top: -110px; opacity: 0; }
        7%   { opacity: 1; }
        90%  { opacity: 0.95; }
        100% { top: 112vh;  opacity: 0; }
      }
      @keyframes pf-sway {
        0%   { transform: translateX(0)               rotate(0deg)                    scale(1);    }
        18%  { transform: translateX(var(--sa))        rotate(calc(var(--ss) * 0.18))  scale(0.97); }
        36%  { transform: translateX(0)               rotate(calc(var(--ss) * 0.36))  scale(1.02); }
        54%  { transform: translateX(calc(var(--sa) * -0.8)) rotate(calc(var(--ss) * 0.54)) scale(0.98); }
        72%  { transform: translateX(calc(var(--sa) * 0.4))  rotate(calc(var(--ss) * 0.72)) scale(1.01); }
        88%  { transform: translateX(calc(var(--sa) * -0.3)) rotate(calc(var(--ss) * 0.88)) scale(0.99); }
        100% { transform: translateX(0)               rotate(var(--ss))               scale(1);    }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(STYLE_ID)?.remove(); injected.current = false; };
  }, []);

  // Return nothing when disabled — no DOM, no animation cost
  if (!enabled) return null;

  return (
    <div
      style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:1, overflow:"hidden" }}
      aria-hidden="true"
    >
      {ITEMS.map((f) => (
        <div
          key={f.id}
          style={{
            position:       "absolute",
            left:           `${f.left}%`,
            top:            "-110px",
            width:          `${f.size}px`,
            height:         `${f.size}px`,
            background:     BG[f.type],
            backgroundSize: "100% 100%",
            "--sa":         `${f.swayAmp}px`,
            "--ss":         `${f.spinSpeed}deg`,
            animation: [
              `pf-fall ${f.duration}s cubic-bezier(0.25,0.1,0.25,1) ${f.delay}s 1 forwards`,
              `pf-sway ${f.swayDur}s  cubic-bezier(0.45,0,0.55,1)   ${f.delay}s 1 forwards`,
            ].join(", "),
          }}
        />
      ))}
    </div>
  );
}