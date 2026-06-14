import { useState, useEffect, useCallback, useRef } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Clone-by-clone (hierarchical shotgun) vs whole-genome shotgun
   An animated figure contrasting how the two strategies handle repeats.

   Two layouts share one render path:
     • landscape (wide screens)  — 20 reads, the original figure
     • portrait  (narrow/mobile) — 12 reads, stacked taller, reads stay horizontal
   The figure measures its own container and picks the layout that fits.
   ────────────────────────────────────────────────────────────────────────── */

const MAX = 4;
const BEAT_MS = 2000;
const NARROW_PX = 480; // container narrower than this → portrait layout

const COL = {
  hierarchical: "#2f6f7e",
  wgs: "#b5642a",
  unit: "#ccd4d7",
  read: "#5d7077",
  repeat: "#7c5ea6",
  misjoin: "#b23b30",
  good: "#4e7d57",
  ink: "#233038",
  muted: "#6a7780",
};

const CAPS = {
  hierarchical: [
    "Start with a whole chromosome, far too long to read in a single pass.",
    "First build a physical map: order thousands of overlapping BAC clones (~150 kb each) into a tiling path.",
    "Sequence each mapped clone on its own, shredding it into short reads.",
    "Assemble within that small window, where a repeat can only be confused with a copy nearby.",
    "Stitch the windows back along the map. Building the map is what made this slow.",
  ],
  wgs: [
    "Start with the whole genome and skip the map entirely.",
    "Shatter everything at once into a single pool of reads.",
    "A computer chains every read together by overlap, with nothing to say where each belongs.",
    "Identical repeats far apart can fuse by mistake, collapsing the sequence between them.",
    "No map means assembly can begin right away. Long identical repeats are the trade-off.",
  ],
};

const PHASE = {
  hierarchical: ["Chromosome", "Physical map", "Shred clones", "Assemble windows", "Stitched"],
  wgs: ["Genome", "Shatter", "Reassemble blind", "Repeats fuse", "Possible repeats collapse"],
};

/* ── deterministic, evenly-spread scatter (jittered grid) ─────────────────── */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPool(seed, N, box) {
  const { cols, rows, x0, x1, y0, y1, readW, readH } = box;
  const cw = (x1 - x0) / cols;
  const ch = (y1 - y0) / rows;
  const rnd = mulberry32(seed);
  const cells = Array.from({ length: N }, (_, k) => k);
  for (let k = cells.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [cells[k], cells[j]] = [cells[j], cells[k]];
  }
  return cells.map((cell) => {
    const col = cell % cols;
    const row = Math.floor(cell / cols);
    const cx = x0 + (col + 0.5) * cw + (rnd() - 0.5) * cw * 0.55;
    const cy = y0 + (row + 0.5) * ch + (rnd() - 0.5) * ch * 0.55;
    return { x: cx - readW / 2, y: cy - readH / 2 };
  });
}

/* step-2 "reassemble blind": reads gather into ONE scrambled overlap chain.
   The order is wrong (there is no map), the repeat reads clump together, and a
   faint thread shows the computer linking reads purely by overlap. */
function buildReasm(order, geo) {
  const { VB_W, READ_Y, READ_W, READ_H, spacing } = geo;
  const N = order.length;
  const startX = (VB_W - ((N - 1) * spacing + READ_W)) / 2;
  const pos = new Array(N);
  order.forEach((readIdx, k) => {
    const jitter = ((k * 37) % 8) - 4;
    pos[readIdx] = { x: startX + k * spacing, y: READ_Y + jitter };
  });
  const link = order.map((idx) => ({
    x: pos[idx].x + READ_W / 2,
    y: pos[idx].y + READ_H / 2,
  }));
  return { pos, link };
}

const local = (i) => ({ dx: ((i * 53) % 30) - 15, dy: ((i * 37) % 26) - 8 });
const gentle = (i) => ({ dx: ((i * 29) % 22) - 11, dy: ((i * 23) % 16) - 6 });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* assemble a complete geometry object from a compact config */
function makeLayout(cfg) {
  const L = { ...cfg };
  L.isRepeat = (i) => cfg.REPEAT_A.includes(i) || cfg.REPEAT_B.includes(i);
  L.repOffset = cfg.REPEAT_B[0] - cfg.REPEAT_A[0];
  L.assembledX = (i) => cfg.LEFT + i * cfg.UNIT_W + (cfg.UNIT_W - cfg.READ_W) / 2;
  L.POOL_A = buildPool(cfg.seed, cfg.N, {
    ...cfg.poolBox,
    readW: cfg.READ_W,
    readH: cfg.READ_H,
  });
  const reasm = buildReasm(cfg.REASM_ORDER, {
    VB_W: cfg.VB_W,
    READ_Y: cfg.READ_Y,
    READ_W: cfg.READ_W,
    READ_H: cfg.READ_H,
    spacing: cfg.reasmSpacing,
  });
  L.REASM = reasm.pos;
  L.REASM_LINK = reasm.link;
  L.repAcx = cfg.LEFT + (cfg.REPEAT_A[0] + 0.5) * cfg.UNIT_W;
  L.repBcx = cfg.LEFT + (cfg.REPEAT_B[0] + 0.5) * cfg.UNIT_W;
  return L;
}

const LANDSCAPE = makeLayout({
  mode: "landscape",
  VB_W: 600,
  VB_H: 340,
  N: 20,
  LEFT: 60,
  UNIT_W: 24,
  UNIT_H: 30,
  BAR_Y: 134,
  READ_Y: 184,
  READ_W: 18,
  READ_H: 11,
  REPEAT_A: [4, 5],
  REPEAT_B: [14, 15],
  CLONES: [
    { s: 0, e: 6, row: 0, label: "C1" },
    { s: 4, e: 10, row: 1, label: "C2" },
    { s: 9, e: 15, row: 0, label: "C3" },
    { s: 13, e: 19, row: 1, label: "C4" },
  ],
  REASM_ORDER: [7, 2, 11, 0, 9, 16, 4, 5, 14, 15, 3, 18, 8, 13, 1, 10, 19, 6, 12, 17],
  reasmSpacing: 18,
  seed: 11,
  poolBox: { cols: 5, rows: 4, x0: 40, x1: 552, y0: 168, y1: 218 },
  clampLocal: { x: [24, 558], y: [150, 210] },
  clampShatterReduced: { x: [18, 564], y: [160, 220] },
  phaseY: 42,
  cloneY: [68, 92],
  noteY: 190,
  captionBox: { x: 60, y: 233, w: 480, h: 50 },
  dotsY: 308,
  dotGap: 17,
});

const PORTRAIT = makeLayout({
  mode: "portrait",
  VB_W: 360,
  VB_H: 400,
  N: 12,
  LEFT: 36,
  UNIT_W: 24,
  UNIT_H: 32,
  BAR_Y: 118,
  READ_Y: 162,
  READ_W: 18,
  READ_H: 11,
  REPEAT_A: [3, 4],
  REPEAT_B: [9, 10],
  CLONES: [
    { s: 0, e: 4, row: 0, label: "C1" },
    { s: 3, e: 7, row: 1, label: "C2" },
    { s: 6, e: 10, row: 0, label: "C3" },
    { s: 8, e: 11, row: 1, label: "C4" },
  ],
  REASM_ORDER: [5, 1, 0, 3, 4, 9, 10, 8, 2, 11, 7, 6],
  reasmSpacing: 18,
  seed: 11,
  poolBox: { cols: 3, rows: 4, x0: 28, x1: 332, y0: 180, y1: 250 },
  clampLocal: { x: [18, 342], y: [158, 196] },
  clampShatterReduced: { x: [14, 346], y: [150, 210] },
  phaseY: 20,
  cloneY: [52, 76],
  noteY: 176,
  captionBox: { x: 18, y: 268, w: 324, h: 72 },
  dotsY: 360,
  dotGap: 17,
});

/* where each read sits, and its colour, at a given step */
function readState(L, i, method, step, reduced) {
  const ax = L.assembledX(i);
  const ay = L.READ_Y;
  const baseFill = L.isRepeat(i) ? COL.repeat : COL.read;

  if (method === "hierarchical") {
    if (step <= 1) return { x: ax, y: ay, opacity: 0, fill: baseFill };
    if (step === 2) {
      const { dx, dy } = (reduced ? gentle : local)(i);
      const c = L.clampLocal;
      return {
        x: clamp(ax + dx, c.x[0], c.x[1]),
        y: clamp(ay + dy, c.y[0], c.y[1]),
        opacity: 1,
        fill: baseFill,
      };
    }
    if (step === 3) return { x: ax, y: ay, opacity: 1, fill: baseFill };
    return { x: ax, y: ay, opacity: 0, fill: baseFill }; // reads retire; stitched bar shown
  }

  // whole-genome shotgun
  if (step === 0) return { x: ax, y: ay, opacity: 0, fill: baseFill };

  if (step === 1) {
    // shatter: a wide, chaotic pool of fragments
    if (reduced) {
      const { dx, dy } = gentle(i);
      const c = L.clampShatterReduced;
      return {
        x: clamp(ax + dx, c.x[0], c.x[1]),
        y: clamp(ay + dy, c.y[0], c.y[1]),
        opacity: 1,
        fill: baseFill,
      };
    }
    const p = L.POOL_A[i];
    return { x: p.x, y: p.y, opacity: 1, fill: baseFill };
  }

  if (step === 2) {
    // reassemble blind: gather into one scrambled overlap chain
    const p = L.REASM[i];
    return { x: p.x, y: p.y, opacity: 1, fill: baseFill };
  }

  // step >= 3: the (mis)assembly
  if (L.isRepeat(i)) {
    if (!reduced && L.REPEAT_B.includes(i)) {
      // a distant repeat copy is mistakenly placed onto the first one
      return { x: L.assembledX(i - L.repOffset) + 3, y: ay, opacity: 1, fill: COL.misjoin };
    }
    return { x: ax, y: ay, opacity: 1, fill: COL.misjoin };
  }
  return { x: ax, y: ay, opacity: 1, fill: COL.read };
}

/* staggered delays so motion reads as a living pool, not a lockstep grid */
function readDelay(i, method, step, reduced) {
  if (reduced) return 0;
  if (method === "hierarchical") {
    if (step === 2) return ((i * 53) % 12) * 26;
    if (step === 3) return i * 24;
    return ((i * 31) % 8) * 18;
  }
  if (step === 1) return ((i * 53) % 14) * 24;
  if (step === 2) return ((i * 53) % 12) * 28; // reads converge into the chain one by one
  if (step === 3) return i * 22;
  return 0;
}

export default function CloneVsShotgun() {
  const wrapRef = useRef(null);
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < NARROW_PX
  );
  const [method, setMethod] = useState("hierarchical");
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState(0);
  const [reduced, setReduced] = useState(false);

  // pick the layout that fits the figure's own width
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setIsNarrow(w < NARROW_PX);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    setStep(0);
    const timers = [];
    for (let s = 1; s <= MAX; s++) {
      timers.push(setTimeout(() => setStep(s), s * BEAT_MS));
    }
    return () => timers.forEach(clearTimeout);
  }, [method, runId]);

  const replay = useCallback(() => setRunId((r) => r + 1), []);

  const L = isNarrow ? PORTRAIT : LANDSCAPE;
  const accent = COL[method];

  const tx = (move, fade) =>
    reduced
      ? "transform 200ms ease, opacity 200ms ease"
      : `transform ${move}ms cubic-bezier(.42,0,.2,1), opacity ${fade}ms ease`;

  const barDim = method === "hierarchical" && (step === 2 || step === 3) ? 0.3 : 1;
  const barOpacity = () => {
    if (method === "wgs") return step === 1 || step === 2 ? 0 : 1;
    return barDim;
  };
  const unitFill = (i) => {
    if (method === "wgs" && step >= 3 && L.isRepeat(i)) return COL.misjoin;
    return L.isRepeat(i) ? COL.repeat : COL.unit;
  };

  const showClones = method === "hierarchical" && step >= 1 && step < 4;
  const showPool = method === "wgs" && (step === 1 || step === 2);
  const showChain = method === "wgs" && step === 2;
  const showMisjoin = method === "wgs" && step >= 3;
  const showKept = method === "hierarchical" && step >= 4;

  const poolHint =
    method === "wgs"
      ? step === 1
        ? "One pool, no positions known"
        : step === 2
        ? "Matched by overlap \u2014 true order unknown"
        : ""
      : "";

  const barMidX = L.LEFT + (L.N * L.UNIT_W) / 2;
  const hintY = L.BAR_Y + L.UNIT_H / 2 + 4;

  const ctrlFont = isNarrow ? "1.1rem" : "1.05rem";
  const legendFont = isNarrow ? "1.4rem" : "1.5rem";
  const captionFont = isNarrow ? "15px" : "13px";

  return (
    <figure ref={wrapRef} style={styles.figure}>
      <style>{`
        @keyframes cvsMarch { to { stroke-dashoffset: -180; } }
        .cvs-arc { animation: cvsMarch 6s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .cvs-arc { animation: none; } }
      `}</style>

      <div style={styles.controls}>
        <div style={styles.toggle} role="group" aria-label="Choose a sequencing strategy">
          <button
            onClick={() => setMethod("hierarchical")}
            aria-pressed={method === "hierarchical"}
            style={{
              ...styles.tbtn,
              ...styles.tbtnFirst,
              fontSize: ctrlFont,
              ...(method === "hierarchical"
                ? { background: COL.hierarchical, color: "#fff" }
                : {}),
            }}
          >
            Clone-by-clone
          </button>
          <button
            onClick={() => setMethod("wgs")}
            aria-pressed={method === "wgs"}
            style={{
              ...styles.tbtn,
              ...styles.tbtnLast,
              fontSize: ctrlFont,
              ...(method === "wgs" ? { background: COL.wgs, color: "#fff" } : {}),
            }}
          >
            Whole-genome shotgun
          </button>
        </div>
        <button
          onClick={replay}
          style={{ ...styles.replay, fontSize: ctrlFont }}
          aria-label="Replay the animation"
        >
          {"\u21BB Replay"}
        </button>
      </div>
      <div style={styles.stage}>
        <svg
          viewBox={`0 0 ${L.VB_W} ${L.VB_H}`}
          style={styles.svg}
          role="img"
          aria-label={`Animation of the ${
            method === "hierarchical" ? "clone-by-clone" : "whole-genome shotgun"
          } sequencing strategy`}
        >
          {/* phase tag, centered */}
          <text
            x={L.VB_W / 2}
            y={L.phaseY}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill={accent}
            letterSpacing="0.02em"
          >
            {PHASE[method][step]}
          </text>

          {/* tiling-path clones (clone-by-clone only) */}
          {L.CLONES.map((c) => {
            const x = L.LEFT + c.s * L.UNIT_W;
            const w = (c.e - c.s + 1) * L.UNIT_W;
            const y = c.row === 0 ? L.cloneY[0] : L.cloneY[1];
            return (
              <g key={c.label} style={{ opacity: showClones ? 1 : 0, transition: "opacity 600ms ease" }}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={20}
                  rx={4}
                  fill="rgba(47,111,126,0.14)"
                  stroke={COL.hierarchical}
                  strokeWidth={1.2}
                />
                <text x={x + w / 2} y={y + 14} textAnchor="middle" fontSize={12} fontWeight={600} fill={COL.hierarchical}>
                  {c.label}
                </text>
              </g>
            );
          })}

          {/* the genome bar, segment by segment */}
          {Array.from({ length: L.N }, (_, i) => (
            <rect
              key={`u${i}`}
              x={L.LEFT + i * L.UNIT_W}
              y={L.BAR_Y}
              width={L.UNIT_W - 1}
              height={L.UNIT_H}
              rx={2}
              fill={unitFill(i)}
              style={{ opacity: barOpacity(), transition: "opacity 700ms ease, fill 500ms ease" }}
            />
          ))}
          <rect
            x={L.LEFT - 1}
            y={L.BAR_Y - 1}
            width={L.N * L.UNIT_W}
            height={L.UNIT_H + 2}
            rx={4}
            fill="none"
            stroke="#c4ccce"
            strokeWidth={1}
            style={{ opacity: showPool ? 0.3 : 1, transition: "opacity 700ms ease" }}
          />

          {/* one-pool / overlap hint while reads float free */}
          <text
            x={barMidX}
            y={hintY}
            textAnchor="middle"
            fontSize={13}
            fontStyle="italic"
            fill={COL.muted}
            style={{ opacity: showPool ? 0.85 : 0, transition: "opacity 500ms ease" }}
          >
            {poolHint}
          </text>

          {/* assembly chain: faint thread linking reads by overlap (reassemble-blind) */}
          <polyline
            points={L.REASM_LINK.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={COL.muted}
            strokeWidth={1.2}
            strokeDasharray="3 3"
            strokeLinejoin="round"
            style={{ opacity: showChain ? 0.55 : 0, transition: "opacity 500ms ease" }}
          />

          {/* repeat-fusion indicator */}
          <path
            className={showMisjoin ? "cvs-arc" : undefined}
            d={`M ${L.repAcx} ${L.BAR_Y - 2} Q ${(L.repAcx + L.repBcx) / 2} ${L.BAR_Y - 70} ${L.repBcx} ${L.BAR_Y - 2}`}
            fill="none"
            stroke={COL.misjoin}
            strokeWidth={2.2}
            strokeDasharray="5 4"
            style={{ opacity: showMisjoin ? 1 : 0, transition: "opacity 500ms ease" }}
          />

          {/* reads */}
          {Array.from({ length: L.N }, (_, i) => {
            const r = readState(L, i, method, step, reduced);
            return (
              <g
                key={`r${i}`}
                style={{
                  transform: `translate(${r.x}px, ${r.y}px)`,
                  opacity: r.opacity,
                  transition: tx(950, 450),
                  transitionDelay: `${readDelay(i, method, step, reduced)}ms`,
                }}
              >
                <rect width={L.READ_W} height={L.READ_H} rx={3} fill={r.fill} />
              </g>
            );
          })}

          {/* neutral outcome note (clone-by-clone) */}
          <text
            x={barMidX}
            y={L.noteY}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill={COL.hierarchical}
            style={{ opacity: showKept ? 1 : 0, transition: "opacity 500ms ease" }}
          >
            Each repeat stayed in its own window
          </text>

          {/* step caption, centered above progress */}
          <foreignObject x={L.captionBox.x} y={L.captionBox.y} width={L.captionBox.w} height={L.captionBox.h}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                fontFamily: "inherit",
                fontSize: captionFont,
                fontWeight: 500,
                color: COL.ink,
                textAlign: "center",
                lineHeight: 1.4,
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {CAPS[method][step]}
            </div>
          </foreignObject>

          {/* progress dots, centered inside the box */}
          {Array.from({ length: MAX + 1 }, (_, s) => {
            const cx = L.VB_W / 2 + (s - MAX / 2) * L.dotGap;
            const active = s === step;
            return (
              <g
                key={`d${s}`}
                style={{
                  transform: `translate(${cx}px, ${L.dotsY}px) scale(${active ? 1.35 : 1})`,
                  transition: "transform 300ms ease",
                }}
              >
                <circle
                  cx={0}
                  cy={0}
                  r={4}
                  fill={s <= step ? accent : "#dcd8cf"}
                  style={{ transition: "fill 300ms ease" }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div style={styles.legend}>
        <span style={{ ...styles.legendItem, fontSize: legendFont }}>
          <span style={{ ...styles.sw, background: COL.read }} /> Read
        </span>
        <span style={{ ...styles.legendItem, fontSize: legendFont }}>
          <span style={{ ...styles.sw, background: COL.repeat }} /> Repeat
        </span>
        <span style={{ ...styles.legendItem, fontSize: legendFont }}>
          <span style={{ ...styles.sw, background: COL.misjoin }} /> Mis-assembly
        </span>
      </div>
    </figure>
  );
}

const styles = {
  figure: { margin: "2rem 0", fontFamily: "inherit", color: COL.ink, maxWidth: "100%" },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    marginBottom: "0.45rem",
    minHeight: 0,
  },
  toggle: { display: "flex", gap: 0 },
  tbtn: {
    fontFamily: "inherit",
    fontWeight: 600,
    padding: "0.25rem 0.75rem",
    background: "#fff",
    color: "#5b6670",
    border: "1px solid #e0dcd2",
    cursor: "pointer",
    transition: "background 160ms ease, color 160ms ease",
    lineHeight: 1.15,
  },
  tbtnFirst: {
    borderRadius: "7px 0 0 7px",
  },
  tbtnLast: {
    borderRadius: "0 7px 7px 0",
    borderLeft: "none",
  },
  replay: {
    fontFamily: "inherit",
    fontWeight: 600,
    padding: "0.25rem 0.75rem",
    background: "#fbfaf7",
    color: "#6a7780",
    border: "1px solid #e0dcd2",
    borderRadius: 7,
    cursor: "pointer",
    lineHeight: 1.15,
  },
  subtitle: { fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.01em", marginBottom: "0.5rem" },
  stage: { background: "#fcfbf8", border: "1px solid #ece8df", borderRadius: 8, padding: "0.4rem" },
  svg: { width: "100%", height: "auto", display: "block" },
  legend: { display: "flex", flexWrap: "wrap", gap: "1.2rem", marginTop: "0.8rem" },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    color: COL.muted,
  },
  sw: { width: 11, height: 11, borderRadius: 2, display: "inline-block" },
};