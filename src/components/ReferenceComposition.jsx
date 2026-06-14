import { useState } from "react";

const GROUPS = [
  ["African", 24, "#2f6f8f"],
  ["Americas", 16, "#b3742b"],
  ["Asian", 6, "#5f8a3a"],
  ["European", 1, "#8a5a8c"],
];

export default function ReferenceComposition() {
  const [view, setView] = useState("grch38");

  return (
    <div className="rgw rcp">
      <style>{css}</style>

      <div className="rcp-head">
        <span className="rcp-eyebrow">Who the reference is</span>
        <p className="rcp-title">From one donor to a population</p>
      </div>

      <div className="rcp-controls" role="group" aria-label="Reference">
        {[["grch38", "GRCh38 (linear)"], ["pangenome", "HPRC pangenome (draft)"]].map(([v, label]) => (
          <button key={v} className={"rcp-btn" + (view === v ? " is-on" : "")}
            aria-pressed={view === v} onClick={() => setView(v)}>{label}</button>
        ))}
      </div>

      {view === "grch38" ? <Grch38 /> : <Pangenome />}
    </div>
  );
}

function Grch38() {
  const X = 60, W = 600, Y = 96, H = 50;
  const rp11 = 0.70;
  const rp11W = rp11 * W;
  const others = 20;
  const restW = W - rp11W;
  return (
    <>
      <div className="rcp-stat">
        <b>1 donor ≈ 70%</b><span>plus about 20 others, merged into a single line</span>
      </div>
      <svg viewBox="0 0 720 200" className="rcp-svg" role="img"
        aria-label="GRCh38 is about 70 percent one donor">
        <rect x={X} y={Y} width={rp11W} height={H} rx="5" fill="var(--accent)" />
        <text x={X + rp11W / 2} y={Y + H / 2 + 5} textAnchor="middle"
          fontSize="14" fontWeight="700" fill="var(--paper)" fontFamily="var(--rg-sans)">
          RP11 — Buffalo donor
        </text>
        {Array.from({ length: others }).map((_, i) => {
          const ow = restW / others;
          const ox = X + rp11W + i * ow;
          return <rect key={i} x={ox + 0.6} y={Y} width={ow - 1.2} height={H} rx="2"
            fill="color-mix(in srgb, var(--muted) 38%, var(--paper))"
            stroke="var(--line)" strokeWidth="0.75" />;
        })}
        <line x1={X} y1={Y + H + 10} x2={X + rp11W} y2={Y + H + 10} stroke="var(--accent)" strokeWidth="1.5" />
        <text x={X + rp11W / 2} y={Y + H + 26} textAnchor="middle" className="rcp-lab">~70%</text>
        <text x={X + rp11W + restW / 2} y={Y + H + 26} textAnchor="middle" className="rcp-lab">~20 donors</text>
        <text x={X} y={Y - 14} className="rcp-lab">One linear sequence per chromosome</text>
      </svg>
      <p className="rcp-foot">
        Recruited at the Roswell Park Cancer Institute in 1997, the donor known as RP11 supplied a cloning
        library so stable it came to dominate the assembly. Consent forms reportedly expected no donor to
        exceed about 10 percent.
      </p>
    </>
  );
}

function Pangenome() {
  const total = GROUPS.reduce((s, g) => s + g[1], 0);
  const cells = [];
  GROUPS.forEach(([name, n, color]) => {
    for (let i = 0; i < n; i++) cells.push(color);
  });
  const cols = 12, cw = 44, ch = 26, gap = 7;
  const gridX = 60, gridY = 30;

  return (
    <>
      <div className="rcp-stat">
        <b>47 donors · 94 haplotypes</b><span>each genome a phased pair, kept separate in the graph</span>
      </div>
      <svg viewBox="0 0 720 220" className="rcp-svg" role="img"
        aria-label="HPRC draft: 47 individuals across ancestry groups">
        {cells.map((color, i) => {
          const r = Math.floor(i / cols), c = i % cols;
          return (
            <rect key={i} x={gridX + c * (cw + gap)} y={gridY + r * (ch + gap)}
              width={cw} height={ch} rx="4" fill={color} opacity="0.92" />
          );
        })}
        <g transform="translate(60, 168)">
          {GROUPS.map(([name, n, color], i) => (
            <g key={name} transform={`translate(${i * 158}, 0)`}>
              <rect x="0" y="0" width="14" height="14" rx="3" fill={color} />
              <text x="20" y="12" className="rcp-legend">{name} · {n}</text>
            </g>
          ))}
        </g>
      </svg>
      <p className="rcp-foot">
        Drawn from openly consented 1000 Genomes cell lines, the draft inverts the old balance: about half
        the individuals have African ancestry and only one is of European ancestry, the reverse of the
        sample that anchored GRCh38.
      </p>
    </>
  );
}

const css = `
.rgw.rcp{font-family:var(--rg-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  --ink:var(--rg-ink,#1c1917);--paper:var(--rg-paper,#fbfaf7);--line:var(--rg-line,#e3ddd0);
  --muted:var(--rg-muted,#78716c);--accent:var(--rg-accent,#1d4ed8);
  --mono:var(--rg-mono, ui-monospace,"SF Mono",Menlo,Consolas,monospace);
  color:var(--ink);border:1px solid var(--line);border-radius:12px;
  background:var(--paper);padding:20px 20px 16px;max-width:760px;margin:1.5rem 0;}
.rcp-head{margin-bottom:14px;}
.rcp-eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600;}
.rcp-title{margin:.3rem 0 0;font-size:1.05rem;font-weight:650;line-height:1.3;}
.rcp-controls{display:inline-flex;border-radius:8px;margin-bottom:6px;flex-wrap:wrap;}
.rcp-btn{appearance:none;border:1px solid var(--line);background:transparent;color:var(--muted);
  font:inherit;font-size:13px;padding:7px 13px;cursor:pointer;transition:background .15s,color .15s;
  margin:0 0 0 -1px;position:relative;}
.rcp-btn:first-child{border-radius:8px 0 0 8px;margin-left:0;}
.rcp-btn:last-child{border-radius:0 8px 8px 0;}
.rcp-btn:hover{color:var(--ink);}
.rcp-btn.is-on{background:var(--ink);color:var(--paper);z-index:1;}
.rcp-btn:focus-visible{outline:2px solid var(--accent);outline-offset:-2px;}
.rcp-stat{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 10px;margin:10px 0 2px;}
.rcp-stat b{font-size:1.15rem;font-weight:700;font-variant-numeric:tabular-nums;}
.rcp-stat span{font-size:12.5px;color:var(--muted);}
.rcp-svg{width:100%;height:auto;display:block;margin:2px 0;}
.rcp-lab{font-size:11px;fill:var(--muted);font-family:var(--rg-sans);}
.rcp-legend{font-size:12px;fill:var(--ink);font-family:var(--rg-sans);}
.rcp-foot{font-size:12px;color:var(--muted);line-height:1.5;margin:10px 0 0;}
@media (prefers-reduced-motion:reduce){.rgw.rcp *{transition:none!important;}}
`;
