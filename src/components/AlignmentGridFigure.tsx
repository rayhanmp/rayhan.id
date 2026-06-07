import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

const C = {
  bg: "#f4f1ea",
  card: "#f6f3ed",
  ink: "#262d49",
  sub: "#3b426a",
  navy: "#2b3563",
  slate: "#54639c",
  peri: "#93a0cf",
  mauve: "#a98fb6",
  pathFill: "#d3dbf0",
  grid: "#cdc7bb",
  bracket: "#9a93b3",
  label: "#6a6a93",
  accent: "#c0613c",
  match: "#5b7570",
  gap: "#9a93b3",
};

const PUR = new Set(["A", "G"]), PYR = new Set(["C", "T"]);
const GAP_OPEN = -2, GAP_EXT = -1;
const NEG = -1e9;
const subScore = (a: string, b: string): number => a === b ? 1 : (PUR.has(a) && PUR.has(b)) || (PYR.has(a) && PYR.has(b)) ? -1 : -2;
const subType = (a: string, b: string): string => a === b ? "Match" : (PUR.has(a) && PUR.has(b)) || (PYR.has(a) && PYR.has(b)) ? "Transition" : "Transversion";

const PAIRS: [string, string][] = [
  ["GATTACA", "GCATGCA"],
  ["ACGTC", "AGTC"],
  ["GGAATCC", "GAATC"],
];

interface NWResult {
  S: number[][];
  M: number[][];
  X: number[][];
  Y: number[][];
  path: [number, number][];
  a1: string;
  a2: string;
  score: number;
}

function nwCompute(s1: string, s2: string): NWResult {
  const n = s1.length, m = s2.length;
  const mk = (v: number): number[][] => Array.from({ length: n + 1 }, () => Array(m + 1).fill(v));
  const M = mk(NEG), X = mk(NEG), Y = mk(NEG), B = mk(NEG);
  M[0][0] = 0; B[0][0] = 0;
  for (let i = 1; i <= n; i++) { X[i][0] = GAP_OPEN + i * GAP_EXT; B[i][0] = X[i][0]; }
  for (let j = 1; j <= m; j++) { Y[0][j] = GAP_OPEN + j * GAP_EXT; B[0][j] = Y[0][j]; }
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const bp = Math.max(M[i - 1][j - 1], X[i - 1][j - 1], Y[i - 1][j - 1]);
      M[i][j] = subScore(s1[i - 1], s2[j - 1]) + bp;
      X[i][j] = Math.max(M[i - 1][j] + GAP_OPEN + GAP_EXT, X[i - 1][j] + GAP_EXT);
      Y[i][j] = Math.max(M[i][j - 1] + GAP_OPEN + GAP_EXT, Y[i][j - 1] + GAP_EXT);
      B[i][j] = Math.max(M[i][j], X[i][j], Y[i][j]);
    }
  let i = n, j = m, a1 = "", a2 = "";
  const path: [number, number][] = [[n, m]];
  let st = B[n][m] === M[n][m] ? "M" : B[n][m] === X[n][m] ? "X" : "Y";
  let guard = 0;
  while ((i > 0 || j > 0) && guard++ < 4000) {
    if (st === "M") {
      a1 = s1[i - 1] + a1; a2 = s2[j - 1] + a2;
      const bp = M[i][j] - subScore(s1[i - 1], s2[j - 1]);
      i--; j--;
      st = M[i][j] === bp ? "M" : X[i][j] === bp ? "X" : "Y";
    } else if (st === "X") {
      a1 = s1[i - 1] + a1; a2 = "-" + a2;
      const open = X[i][j] === M[i - 1][j] + GAP_OPEN + GAP_EXT;
      i--; st = open ? "M" : "X";
    } else {
      a1 = "-" + a1; a2 = s2[j - 1] + a2;
      const open = Y[i][j] === M[i][j - 1] + GAP_OPEN + GAP_EXT;
      j--; st = open ? "M" : "Y";
    }
    path.push([i, j]);
  }
  path.reverse();
  return { S: B, M, X, Y, path, a1, a2, score: B[n][m] };
}

const BASE_NAMES: Record<string, string> = {
  A: "Adenine", C: "Cytosine", G: "Guanine", T: "Thymine",
};

const fmt = (v: number): string => (v <= -1e8 ? "−\u221e" : String(v));
const CELL = 42, PAD = 26;

interface BreakdownBase {
  base: true;
  text: string;
}

interface BreakdownCell {
  base: false;
  i: number;
  j: number;
  diag: number;
  up: number;
  left: number;
  val: number;
  type: string;
  sc: number;
  win: { diag: boolean; up: boolean; left: boolean };
}

type Breakdown = BreakdownBase | BreakdownCell;

const AlignmentGridFigure = () => {
  const [pairIndex, setPairIndex] = useState(0);
  const [phase, setPhase] = useState<"filling" | "tracing" | "done">("filling");
  const [fillCount, setFillCount] = useState(0);
  const [traceCount, setTraceCount] = useState(0);
  const [activeFill, setActiveFill] = useState<number[] | null>(null);
  const [hoverCell, setHoverCell] = useState<number[] | null>(null);
  const [showNote, setShowNote] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [s1, s2] = PAIRS[pairIndex];
  const n = s1.length, m = s2.length;
  const model = useMemo(() => nwCompute(s1, s2), [s1, s2]);
  const { S, M, X, Y, path, a1, a2, score } = model;

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const runAll = useCallback((idx: number) => {
    clearTimers();
    setPairIndex(idx);
    setPhase("filling"); setFillCount(0); setTraceCount(0);
    setHoverCell(null); setActiveFill(null);
    const [q1, q2] = PAIRS[idx];
    const nn = q1.length, mm = q2.length;
    const total = (nn + 1) * (mm + 1);
    const FILL = 36, TRACE = 240, START = 320;
    let t = START;
    for (let k = 0; k < total; k++) {
      const i = Math.floor(k / (mm + 1)), j = k % (mm + 1);
      timers.current.push(setTimeout(() => { setFillCount(k + 1); setActiveFill([i, j]); }, t));
      t += FILL;
    }
    t += 150;
    timers.current.push(setTimeout(() => { setPhase("tracing"); setActiveFill(null); }, t));
    const p = nwCompute(q1, q2).path;
    for (let k = 0; k < p.length; k++)
      timers.current.push(setTimeout(() => setTraceCount(k + 1), t + k * TRACE));
    t += p.length * TRACE + 140;
    timers.current.push(setTimeout(() => setPhase("done"), t));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runAll(0), 450);
    return () => { clearTimeout(t); clearTimers(); };
  }, [runAll]);

  const gx0 = PAD + CELL, gy0 = PAD + CELL;
  const cx = (j: number): number => gx0 + j * CELL;
  const cy = (i: number): number => gy0 + i * CELL;
  const VB_W = gx0 + (m + 1) * CELL + PAD;
  const VB_H = gy0 + (n + 1) * CELL + PAD;
  const half = (CELL - 1.5) / 2;
  const idxOf = (i: number, j: number): number => i * (m + 1) + j;

  const traceSet = useMemo(() => {
    const s = new Set<string>();
    for (let k = 0; k < traceCount; k++) s.add(path[k][0] + "," + path[k][1]);
    return s;
  }, [traceCount, path]);

  const breakdown = (i: number, j: number): Breakdown => {
    if (i === 0 && j === 0) return { base: true, text: "S(0, 0) = 0" };
    if (i === 0) return { base: true, text: `S(0, ${j}) = gap open + ${j} × extend = ${S[0][j]}` };
    if (j === 0) return { base: true, text: `S(${i}, 0) = gap open + ${i} × extend = ${S[i][0]}` };
    const diag = M[i][j], up = X[i][j], left = Y[i][j], val = S[i][j];
    return {
      base: false, i, j, diag, up, left, val,
      type: subType(s1[i - 1], s2[j - 1]), sc: subScore(s1[i - 1], s2[j - 1]),
      win: { diag: diag === val, up: up === val, left: left === val },
    };
  };

  const canHover = phase === "done";
  const active: number[] | null = hoverCell && canHover ? hoverCell : null;
  const activeBD: Breakdown | null = active ? breakdown(active[0], active[1]) : null;

  const preds: number[][] = [];
  if (activeBD && !activeBD.base) {
    const [i, j] = active!;
    if (activeBD.win.diag) preds.push([i - 1, j - 1]);
    if (activeBD.win.up) preds.push([i - 1, j]);
    if (activeBD.win.left) preds.push([i, j - 1]);
  }

  return (
    <div className="nw-figure">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=Source+Serif+4:ital,wght@0,600;0,700;1,400&display=swap');
        :root{ --sans:'Source Sans 3','Helvetica Neue',Helvetica,Arial,sans-serif;
               --serif:'Source Serif 4',Georgia,'Times New Roman',serif;
               --mono:'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace; }
        .nw-figure{ background:${C.bg}; padding:28px 18px 36px; font-family:var(--sans);
          margin-bottom:48px; width:100%; box-sizing:border-box; color:${C.ink}; }

        .nw-wrap{ max-width:600px; margin:0 auto; animation:nwFade .8s ease both; }
        @keyframes nwFade{ from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:none;} }


        .nw-pulse{ animation:nwPulse .5s ease; transform-origin:center; transform-box:fill-box; }
        @keyframes nwPulse{ 0%{transform:scale(1);} 45%{transform:scale(1.45);} 100%{transform:scale(1);} }
        .nw-hit{ cursor:pointer; }
        .nw-btn{ font-family:var(--sans); font-size:13px; padding:7px 13px; border-radius:7px;
          border:1px solid ${C.bracket}; background:${C.card}; color:${C.sub}; cursor:pointer;
          transition:all .18s ease; letter-spacing:.2px; display:inline-flex; align-items:center; }
        .nw-btn .seq{ font-family:var(--mono); font-size:12px; letter-spacing:.3px; }
        .nw-btn:hover{ border-color:${C.slate}; color:${C.ink}; }
        .nw-btn.on{ background:${C.navy}; border-color:${C.navy}; color:#fff; }
        .nw-btn:disabled{ opacity:.5; cursor:default; }
        .nw-run{ background:${C.accent}; border-color:${C.accent}; color:#fff; }
        .nw-run:hover{ filter:brightness(1.06); color:#fff; }
        .nw-readout{ min-height:72px; margin-top:8px; display:flex; align-items:center;
          justify-content:center; text-align:center; background:${C.card}; border-radius:8px;
          padding:10px 14px; border:1px solid ${C.grid}; }
        .nw-aln{ font-family:var(--mono); font-size:19px; letter-spacing:6px; line-height:1.3; text-align:center; }
        .nw-note{ max-width:560px; margin:20px auto 0; text-align:center; font-family:var(--sans);
          font-size:12px; line-height:1.55; color:${C.label}; }
        .nw-top-result{ display:flex; justify-content:center; margin-top:10px; }
        .nw-note .lead{ font-family:var(--serif); font-style:italic; color:${C.sub}; cursor:pointer; user-select:none; }
        .nw-note .lead:hover{ color:${C.ink}; }
        .nw-note-body{ font-size:12px; line-height:1.55; color:${C.label}; margin-top:8px; animation:nwFade .3s ease both; }
      `}</style>

      <div className="nw-wrap">
        <div className="nw-top-result">
          <Result a1={a1} a2={a2} score={score} dim={phase !== "done"} />
        </div>

        <div style={{ marginTop: 32, marginBottom: 4, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {PAIRS.map((p, i) => (
            <button key={i} className={`nw-btn ${pairIndex === i ? "on" : ""}`}
                    disabled={phase !== "done"} onClick={() => runAll(i)}>
              <span className="seq">{p[0]} / {p[1]}</span>
            </button>
          ))}
          <button className="nw-btn nw-run" disabled={phase !== "done"} onClick={() => runAll(pairIndex)}>Replay</button>
        </div>

        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%"
             style={{ display: "block", marginTop: 4, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}
             onMouseLeave={() => setHoverCell(null)}>
          <defs>
            <filter id="nwGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor={C.navy} floodOpacity="0.45" />
            </filter>
            <marker id="nwArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={C.navy} />
            </marker>
            <marker id="nwArrowFaint" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={C.slate} />
            </marker>
          </defs>

          {Array.from({ length: n + 1 }).map((_, i) =>
            Array.from({ length: m + 1 }).map((_, j) => {
              const onPath = traceSet.has(i + "," + j);
              return (
                <rect key={`g${i}-${j}`} x={cx(j)} y={cy(i)} width={CELL - 1.5} height={CELL - 1.5}
                      rx="2" fill={onPath ? C.pathFill : "#ffffff"} stroke={C.grid} strokeWidth="1" opacity={idxOf(i, j) < fillCount ? (onPath ? 1 : 0.7) : 0.12} />
              );
            })
          )}

          {Array.from({ length: Math.max(0, traceCount) }).map((_, k) => {
            const [i, j] = path[k];
            return (
              <rect key={`p${i}-${j}`} x={cx(j)} y={cy(i)} width={CELL - 1.5} height={CELL - 1.5}
                    rx="2" fill={C.pathFill} stroke={C.navy} strokeWidth="0.6" strokeOpacity="0.5" />
            );
          })}

          {preds.map(([i, j], k) => (
            <rect key={`pr${k}`} x={cx(j) + 1.5} y={cy(i) + 1.5} width={CELL - 4.5} height={CELL - 4.5}
                  rx="2" fill="none" stroke={C.slate} strokeWidth="1.6" strokeDasharray="3 2" />
          ))}

          {active && !traceSet.has(active[0] + "," + active[1]) && (
            <rect x={cx(active[1]) + 1} y={cy(active[0]) + 1} width={CELL - 3.5} height={CELL - 3.5}
                  rx="2" fill="none" stroke={C.accent} strokeWidth="2" />
          )}

          {Array.from({ length: n + 1 }).map((_, i) =>
            Array.from({ length: m + 1 }).map((_, j) => {
              if (idxOf(i, j) >= fillCount) return null;
              const onPath = traceSet.has(i + "," + j);
              const pulsing = activeFill && activeFill[0] === i && activeFill[1] === j;
              return (
                <text key={`v${i}-${j}`} x={cx(j) + half} y={cy(i) + half + 5}
                      className={pulsing ? "nw-pulse" : ""} textAnchor="middle"
                      fontFamily="var(--sans)" fontSize="14.5"
                      fontWeight={onPath || pulsing ? 700 : 400}
                      fill={pulsing ? C.accent : onPath ? C.navy : C.bracket}>
                  {S[i][j]}
                </text>
              );
            })
          )}

          {Array.from({ length: Math.max(0, traceCount - 1) }).map((_, k) => {
            const [ai, aj] = path[k], [bi, bj] = path[k + 1];
            const x0 = cx(aj) + half, y0 = cy(ai) + half, x1 = cx(bj) + half, y1 = cy(bi) + half;
            const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), sh = 15;
            return (
              <line key={`a${k}`} x1={x0 + (dx / L) * sh} y1={y0 + (dy / L) * sh}
                    x2={x1 - (dx / L) * sh} y2={y1 - (dy / L) * sh}
                    stroke={C.navy} strokeWidth="2.5" filter="url(#nwGlow)" markerEnd="url(#nwArrow)" />
            );
          })}

          {active && preds.map(([i, j], k) => {
            const x0 = cx(j) + half, y0 = cy(i) + half, x1 = cx(active[1]) + half, y1 = cy(active[0]) + half;
            const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), sh = 15;
            return (
              <line key={`ha${k}`} x1={x0 + (dx / L) * sh} y1={y0 + (dy / L) * sh}
                    x2={x1 - (dx / L) * sh} y2={y1 - (dy / L) * sh}
                    stroke={C.slate} strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#nwArrowFaint)" />
            );
          })}

          <text x={cx(0) + half} y={PAD + half + 5} textAnchor="middle" fontFamily="var(--mono)" fontSize="16" fill={C.bracket}>–</text>
          <text x={PAD + half} y={cy(0) + half + 5} textAnchor="middle" fontFamily="var(--mono)" fontSize="16" fill={C.bracket}>–</text>
          {s2.split("").map((ch, j) => (
            <g key={`h2${j}`}>
              <title>{BASE_NAMES[ch] || ch}</title>
              <text x={cx(j + 1) + half} y={PAD + half + 6} textAnchor="middle"
                    fontFamily="var(--mono)" fontSize="17" fontWeight="700" fill={C.navy}
                    style={{ cursor: "default" }}>
                {ch}
              </text>
            </g>
          ))}
          {s1.split("").map((ch, i) => (
            <g key={`h1${i}`}>
              <title>{BASE_NAMES[ch] || ch}</title>
              <text x={PAD + half} y={cy(i + 1) + half + 6} textAnchor="middle"
                    fontFamily="var(--mono)" fontSize="17" fontWeight="700" fill={C.navy}
                    style={{ cursor: "default" }}>
                {ch}
              </text>
            </g>
          ))}

          {canHover && Array.from({ length: n + 1 }).map((_, i) =>
            Array.from({ length: m + 1 }).map((_, j) => (
              <rect key={`hit${i}-${j}`} className="nw-hit" x={cx(j)} y={cy(i)}
                    width={CELL - 1.5} height={CELL - 1.5} fill="transparent"
                    onMouseEnter={() => setHoverCell([i, j])} />
            ))
          )}
        </svg>

        <div className="nw-readout">
          {activeBD && !activeBD.base ? (
            <ReadoutCell bd={activeBD} s1={s1} s2={s2} />
          ) : activeBD && activeBD.base ? (
            <div style={{ fontFamily: "var(--mono)", fontSize: 14.5, color: C.sub }}>{activeBD.text}</div>
          ) : !active && activeFill && phase === "filling" ? (
            <FillingNote bd={breakdown(activeFill[0], activeFill[1])} />
          ) : null}
        </div>
        {phase === "done" && (
          <div style={{ textAlign: "center", marginTop: 9, fontSize: 12, color: C.label }}>
            Hover any cell to see why it holds that score.
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <span title="Match: identical bases score +1" style={{ cursor: "help", fontSize: 12, color: C.label, background: C.card, border: "1px solid " + C.bracket, borderRadius: 12, padding: "2px 10px" }}>● +1</span>
          <span title="Transition: purine↔purine or pyrimidine↔pyrimidine, costs −1" style={{ cursor: "help", fontSize: 12, color: C.label, background: C.card, border: "1px solid " + C.bracket, borderRadius: 12, padding: "2px 10px" }}>◐ −1</span>
          <span title="Transversion: purine↔pyrimidine, costs −2" style={{ cursor: "help", fontSize: 12, color: C.label, background: C.card, border: "1px solid " + C.bracket, borderRadius: 12, padding: "2px 10px" }}>◑ −2</span>
          <span title="Gap open: starting a gap costs −2" style={{ cursor: "help", fontSize: 12, color: C.label, background: C.card, border: "1px solid " + C.bracket, borderRadius: 12, padding: "2px 10px" }}>┆ −2</span>
          <span title="Gap extend: extending a gap costs −1 each step" style={{ cursor: "help", fontSize: 12, color: C.label, background: C.card, border: "1px solid " + C.bracket, borderRadius: 12, padding: "2px 10px" }}>┆┆ −1</span>
        </div>

        <div className="nw-note">
          <span className="lead" onClick={() => setShowNote(!showNote)}>
            {showNote ? "▾ " : "▸ "}A Note on the Algorithm
          </span>
          {showNote && (
            <div className="nw-note-body">
              Needleman-Wunsch with Gotoh affine gap penalties. Substitution scores are illustrative, real protein/DNA work uses empirically derived matrices. Local alignment (Smith-Waterman) and heuristics (BLAST, minimap2) are used in practice. Where ties occur, only one optimal path is drawn.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TermProps {
  label: string;
  val: number;
  win: boolean;
}

const Term = ({ label, val, win }: TermProps) => (
  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", margin: "0 6px" }}>
    <span style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: win ? 700 : 400, color: win ? C.accent : C.sub }}>{fmt(val)}</span>
    <span style={{ fontSize: 10, color: win ? C.accent : C.label, letterSpacing: ".03em" }}>{label}</span>
  </span>
);

interface ReadoutCellProps {
  bd: BreakdownCell;
  s1: string;
  s2: string;
}

const ReadoutCell = ({ bd, s1, s2 }: ReadoutCellProps) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 2 }}>
    <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: C.sub }}>S({bd.i},{bd.j}) = max(</span>
    <Term label="Diagonal" val={bd.diag} win={bd.win.diag} />
    <Term label="Gap ↑" val={bd.up} win={bd.win.up} />
    <Term label="Gap ←" val={bd.left} win={bd.win.left} />
    <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: C.sub }}>) =</span>
    <span style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 700, color: C.accent, marginLeft: 6 }}>{bd.val}</span>
    <span style={{ fontSize: 11, color: C.label, width: "100%", marginTop: 4 }}>
      {s1[bd.i - 1]} vs {s2[bd.j - 1]}: {bd.type}, substitution {bd.sc >= 0 ? "+" : ""}{bd.sc}
    </span>
  </div>
);

interface FillingNoteProps {
  bd: Breakdown;
}

const FillingNote = ({ bd }: FillingNoteProps) => (
  <div style={{ fontFamily: "var(--mono)", fontSize: 13.5, color: C.sub }}>
    {bd.base ? bd.text : `S(${bd.i}, ${bd.j}) = max(${fmt(bd.diag)}, ${fmt(bd.up)}, ${fmt(bd.left)}) = ${bd.val}`}
  </div>
);

interface ResultProps {
  a1: string;
  a2: string;
  score: number;
  dim: boolean;
}

const Result = ({ a1, a2, score, dim }: ResultProps) => {
  const cols = a1.split("").map((c: string, k: number) => ({ c1: c, c2: a2[k] }));
  const colOf = (c1: string, c2: string): string => (c1 === "-" || c2 === "-") ? C.gap : c1 === c2 ? C.ink : C.accent;
  return (
    <div style={{ opacity: dim ? 0.32 : 1, transition: "opacity .4s ease", textAlign: "center" }}>
      <div className="nw-aln">{cols.map((p, k) => <span key={k} style={{ color: colOf(p.c1, p.c2) }}>{p.c1}</span>)}</div>
      <div className="nw-aln" style={{ color: C.match, marginTop: -1 }}>
        {cols.map((p, k) => <span key={k}>{p.c1 === p.c2 && p.c1 !== "-" ? "|" : "\u00A0"}</span>)}
      </div>
      <div className="nw-aln">{cols.map((p, k) => <span key={k} style={{ color: colOf(p.c1, p.c2) }}>{p.c2}</span>)}</div>
    </div>
  );
};

export default AlignmentGridFigure;