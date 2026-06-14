import React, { useState, useEffect, useRef } from "react";

/**
 * ReferenceDependencyCascade
 * ---------------------------------------------------------------------------
 * An interactive figure for the "Why the old reference persists" section.
 * The reader switches the active reference build; an upstream insertion
 * renumbers the shared coordinate (chr1:12,345 -> 13,545), liftover frays in
 * the rewritten region, and the breakage ripples down every dependent layer.
 *
 * Usage in Astro / MDX:
 *   import ReferenceDependencyCascade from "../components/ReferenceDependencyCascade.jsx";
 *   <ReferenceDependencyCascade client:visible />
 *
 * Props:
 *   autoLoop   — if true, cycles broken/stable on a timer instead of the
 *                one-time scroll-in demo (default false).
 *   startBroken — initial state (default false).
 * ---------------------------------------------------------------------------
 */

const CHR = "chr1";
const COORD_OLD = "12,345";
const COORD_NEW = "13,545";

const LAYERS = [
  {
    key: "align",
    eyebrow: "Alignment",
    tokens: ["BAM", "CRAM"],
    stable: "Reads sit at their positions. CRAM decodes against the reference.",
    broken: "Reads must be re-mapped. CRAM can't decode without GRCh37.",
  },
  {
    key: "variants",
    eyebrow: "Variant calls",
    tokens: ["VCF"],
    stable: "Each row is a position and an allele.",
    broken: "The row still says 12,345, but the base is now at 13,545.",
  },
  {
    key: "knowledge",
    eyebrow: "Knowledge bases",
    tokens: ["gnomAD", "ClinVar", "dbSNP"],
    stable: "Frequencies and classifications resolve to the position.",
    broken: "Every entry is keyed to the old coordinate.",
  },
  {
    key: "report",
    eyebrow: "Clinical report",
    tokens: [],
    stable: "Variant confirmed, Pathogenic.",
    broken: "Coordinates moved. Re-map and re-validate before reporting.",
  },
];

const CSS = `
.rgc {
  --ink:#233038; --muted:#4a5560; --faint:#6a7780;
  --line:#ece8df; --surf:#fbfaf7; --surf2:#faf8f3;
  --blue:#2f6f7e; --green:#4e7d57; --verm:#b5642a;
  --verm-tint:#fdf6ef; --blue-tint:#eef5f4; --green-tint:#eef4ec;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-family: var(--sans);
  color: var(--ink);
  max-width: 100%;
  margin: 2rem 0;
  -webkit-font-smoothing: antialiased;
}
.rgc * { box-sizing: border-box; }

.rgc-head { margin-bottom: 18px; }
.rgc-eyebrow {
  font-size: 1.5rem; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--verm);
}
.rgc-title {
  font-size: 1.75rem; font-weight: 700; line-height: 1.3;
  margin: 4px 0 2px;
}
.rgc-instr { font-size: 1.4rem; color: var(--muted); }

.rgc-bar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap; margin: 16px 0 14px;
}
.rgc-seg {
  display: inline-flex;
}
.rgc-seg button {
  appearance: none; border: 1px solid var(--line); cursor: pointer; background: var(--surf);
  padding: 10px 18px; font-family: var(--sans);
  font-size: 1.3rem; color: var(--muted); line-height: 1.15;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: background .18s, color .18s;
}
.rgc-seg button:first-child { border-radius: 6px 0 0 6px; }
.rgc-seg button:last-child { border-radius: 0 6px 6px 0; border-left: none; }
.rgc-seg button small { display: block; font-size: 0.9rem; opacity: .75; font-weight: 500; }
.rgc-seg button[aria-pressed="true"] {
  background: #233038; color: #fff; font-weight: 600;
}
.rgc-seg button.is-new[aria-pressed="true"] { background: var(--verm); color: #fff; }
.rgc-seg button:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }

.rgc-chip {
  display: inline-flex; align-items: baseline; gap: 2px;
  font-family: var(--mono); font-size: 1.2rem; font-weight: 600;
  padding: 6px 11px; border-radius: 6px;
  border: 1px solid var(--line); background: var(--surf);
}
.rgc-animate .rgc-chip { transition: border-color .5s ease, background .5s ease, color .5s ease; }
.rgc-chip .k { color: var(--faint); }
.rgc-chip .num {
  position: relative; display: inline-block;
  height: 1.2em; overflow: hidden; vertical-align: bottom;
}
.rgc-chip .num span {
  display: block; transition: transform .42s cubic-bezier(.5,.1,.2,1), opacity .42s;
  color: var(--blue);
}
.rgc-chip .num .n38 { position: absolute; top: 0; left: 0; transform: translateY(105%); opacity: 0; color: var(--verm); }
.rgc.is-broken .rgc-chip { border-color: var(--verm); background: var(--verm-tint); }
.rgc.is-broken .rgc-chip .n37 { transform: translateY(-105%); opacity: 0; }
.rgc.is-broken .rgc-chip .n38 { transform: translateY(0); opacity: 1; }

.rgc-rail { width: 100%; height: auto; display: block; margin: 2px 0 20px; }
.rgc-rail .g38, .rgc-rail .chains, .rgc-rail .frays { opacity: 0; }
.rgc-animate .rgc-rail .g38, .rgc-animate .rgc-rail .chains { transition: opacity .6s ease; }
.rgc-animate .rgc-rail .frays { transition: opacity .6s ease; transition-delay: .15s; }
.rgc-rail .ins { transform: scaleX(0); transform-origin: left center; transform-box: fill-box; }
.rgc-animate .rgc-rail .ins { transition: transform .6s ease .05s; }
.rgc.is-broken .rgc-rail .g38, .rgc.is-broken .rgc-rail .chains { opacity: 1; }
.rgc.is-broken .rgc-rail .frays { opacity: 1; }
.rgc.is-broken .rgc-rail .ins { transform: scaleX(1); }

.rgc-stack { display: flex; flex-direction: column; }
.rgc-link { width: 3px; height: 22px; background: var(--faint); position: relative; margin: 0 auto; border-radius: 2px; }
.rgc-link::after {
  content: ""; position: absolute; left: -5px; bottom: -2px;
  border-left: 6.5px solid transparent; border-right: 6.5px solid transparent;
  border-top: 8px solid var(--faint);
}

.rgc-card { border: 1px solid var(--line); border-radius: 6px; background: var(--surf); padding: 13px 15px; transition: background .5s ease, border-color .5s ease; overflow-wrap: break-word; }
.rgc-card[data-revealed="true"] { background: var(--verm-tint); border-color: var(--verm); }

.rgc-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap; }
.rgc-card-eyebrow { font-size: 1.1rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
.rgc-tok {
  font-family: var(--mono); font-size: 1.2rem; font-weight: 600;
  padding: 2px 8px; border-radius: 4px; background: var(--surf2);
  border: 1px solid var(--line); color: var(--faint);
}
.rgc-status { display: flex; align-items: flex-start; gap: 8px; }
.rgc-mark-wrap { flex: 0 0 auto; width: 20px; height: 20px; margin-top: 4px; }
.rgc-mark-wrap svg { width: 20px; height: 20px; display: block; }
.rgc-text { font-size: 1.35rem; line-height: 1.5; color: var(--ink); flex: 1; }
.rgc-card[data-revealed="true"] + .rgc-link { background: var(--verm); }
.rgc-card[data-revealed="true"] + .rgc-link::after { border-top-color: var(--verm); }

.rgc-foot {
  margin-top: 16px; padding: 12px 15px; border-radius: 6px;
  border: 1px solid var(--line); background: var(--surf2);
  font-size: 1.35rem; line-height: 1.5; color: var(--muted);
}
.rgc-animate .rgc-foot { transition: background .5s ease, border-color .5s ease, color .5s ease; }
.rgc.is-broken .rgc-foot {
  background: var(--verm-tint); border-color: var(--verm);
  color: #7a4a1a;
}
.rgc-foot strong { color: inherit; font-weight: 650; }

@media (prefers-reduced-motion: reduce) {
  .rgc-animate *, .rgc-animate .rgc-chip .num span { transition-duration: 0s !important; }
}
@media (max-width: 460px) {
  .rgc-eyebrow { font-size: 1.2rem; }
  .rgc-instr { font-size: 1.1rem; }
  .rgc-bar { gap: 10px; }
  .rgc-seg button { font-size: 1rem; padding: 8px 12px; }
  .rgc-seg button small { font-size: 0.75rem; }
  .rgc-text { font-size: 1rem; }
  .rgc-card { padding: 10px 12px; }
  .rgc-card-eyebrow { font-size: 0.95rem; }
  .rgc-tok { font-size: 0.9rem; }
  .rgc-chip { font-size: 0.95rem; }
  .rgc-foot { font-size: 1rem; }
  .rgc-mark-wrap { margin-top: 3px; }
}
`;

function Check({ color }) {
  return (
    <svg className="rgc-mark" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.5 l3 3 l6 -7" fill="none" stroke={color} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Alert({ color }) {
  return (
    <svg className="rgc-mark" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2 L15 14 L1 14 Z" fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <line x1="8" y1="6.5" x2="8" y2="10" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.95" fill={color} />
    </svg>
  );
}

function Rail() {
  return (
    <svg className="rgc-rail" viewBox="0 0 460 156" role="img"
         aria-label="Two reference builds. An insertion in the new build renumbers the shared coordinate, and the liftover chain frays where the sequence was rewritten.">
      <text x="40" y="22" fontSize="11" fontWeight="700" fill="#2f6f7e">GRCh37</text>
      <text x="98" y="22" fontSize="10.5" fill="#6a7780">Current</text>
      <line x1="40" y1="36" x2="430" y2="36" stroke="#d4cfc5" strokeWidth="1.4" />
      {[96, 156, 216, 360].map((x) => (
        <line key={x} x1={x} y1="32" x2={x} y2="40" stroke="#e0dcd2" strokeWidth="1" />
      ))}
      <circle cx="288" cy="36" r="4.5" fill="#2f6f7e" />

      <g className="chains">
        <line x1="96" y1="42" x2="96" y2="118" stroke="#2f6f7e" strokeWidth="0.8" />
        <line x1="156" y1="42" x2="156" y2="118" stroke="#2f6f7e" strokeWidth="0.8" />
        <line x1="360" y1="42" x2="384" y2="118" stroke="#2f6f7e" strokeWidth="0.8" />
        <text x="126" y="80" fontSize="9" fontWeight="700" fill="#6a7780" textAnchor="middle">Chain</text>
      </g>
      <g className="frays">
        <line x1="288" y1="42" x2="298" y2="78" stroke="#b5642a" strokeWidth="1.3" strokeDasharray="3 2" />
        <line x1="304" y1="92" x2="312" y2="118" stroke="#b5642a" strokeWidth="1.3" strokeDasharray="3 2" />
        <path d="M297 80 l8 8 M305 80 l-8 8" stroke="#b5642a" strokeWidth="1.5" strokeLinecap="round" />
        <text x="335" y="82" fontSize="8" fontWeight="700" fill="#b5642a" textAnchor="middle">
          <tspan x="335" dy="0">Liftover</tspan>
          <tspan x="335" dy="9">Fray</tspan>
        </text>
      </g>

      <g className="g38">
        <text x="40" y="144" fontSize="11" fontWeight="700" fill="#b5642a">GRCh38</text>
        <text x="98" y="144" fontSize="10.5" fill="#6a7780">New build</text>
        <line x1="40" y1="124" x2="430" y2="124" stroke="#d4cfc5" strokeWidth="1.4" />
        {[96, 156, 384].map((x) => (
          <line key={x} x1={x} y1="120" x2={x} y2="128" stroke="#e0dcd2" strokeWidth="1" />
        ))}
        <rect className="ins" x="216" y="117" width="26" height="14" rx="2" fill="#b5642a" />
        <circle cx="312" cy="124" r="4.5" fill="#b5642a" />
      </g>
    </svg>
  );
}

export default function ReferenceDependencyCascade({ autoLoop = false, startBroken = false }) {
  const [broken, setBroken] = useState(startBroken);
  const [animating, setAnimating] = useState(false);
  const [revealed, setRevealed] = useState(Array(LAYERS.length).fill(false));
  const rootRef = useRef(null);

  function switchTo(newState) {
    if (newState === broken) return;
    if (newState) {
      setBroken(true);
      setAnimating(true);
      setRevealed(Array(LAYERS.length).fill(false));
      LAYERS.forEach((_, i) => {
        setTimeout(() => {
          setRevealed(prev => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * 750);
      });
      setTimeout(() => setAnimating(false), LAYERS.length * 750 + 1000);
    } else {
      setAnimating(false);
      setBroken(false);
      setRevealed(Array(LAYERS.length).fill(false));
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!autoLoop) return;
    const reduce = window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setBroken((b) => !b), 6000);
    return () => clearInterval(id);
  }, [autoLoop]);

  return (
    <div className={"rgc" + (broken ? " is-broken" : "") + (animating ? " rgc-animate" : "")} ref={rootRef}>
      <style>{CSS}</style>

      <div className="rgc-head">
        <div className="rgc-eyebrow">Everything downstream is pinned to one coordinate</div>
        <div className="rgc-instr">Switch the active build to see what a new coordinate system breaks.</div>
      </div>

      <div className="rgc-bar">
        <div className="rgc-seg" role="group" aria-label="Active reference build">
          <button type="button" aria-pressed={!broken} onClick={() => switchTo(false)}>
            GRCh37<small>current</small>
          </button>
          <button type="button" className="is-new" aria-pressed={broken} onClick={() => switchTo(true)}>
            GRCh38<small>new build</small>
          </button>
        </div>
        <span className="rgc-chip" aria-live="polite">
          <span className="k">{CHR}:</span>
          <span className="num">
            <span className="n37">{COORD_OLD}</span>
            <span className="n38">{COORD_NEW}</span>
          </span>
        </span>
      </div>

      <Rail />

      <div className="rgc-stack">
        {LAYERS.map((l, i) => (
          <React.Fragment key={l.key}>
            <div
              className="rgc-card"
              data-revealed={revealed[i]}
            >
              <div className="rgc-card-top">
                <span className="rgc-card-eyebrow">{l.eyebrow}</span>
                {l.tokens.map((t) => (
                  <span key={t} className="rgc-tok">{t}</span>
                ))}
              </div>
              <div className="rgc-status">
                <span className="rgc-mark-wrap">
                  {revealed[i] ? <Alert color="#D55E00" /> : <Check color="#009E73" />}
                </span>
                <span className="rgc-text">
                  {revealed[i] ? l.broken : l.stable}
                </span>
              </div>
            </div>
            {i < LAYERS.length - 1 && (
              <div className="rgc-link" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="rgc-foot" aria-live="polite">
        {broken ? (
          <span>
            The coordinate differs between builds. Each layer has to be re-mapped
            and re-validated, commonly requiring realignment to the new reference
            genome.
          </span>
        ) : (
          <span>
            All four layers share the same coordinate. Everything is consistent.
          </span>
        )}
      </div>
    </div>
  );
}
