import { useState, useCallback } from "react";

/**
 * ProjectTimeline
 * An interactive timeline of the human reference genome saga.
 *  - Desktop: a horizontal SVG axis; hover / tap / focus / arrow-key a
 *    milestone to read its detail in the card below.
 *  - Mobile (<= 640px): a vertical timeline with every detail shown inline.
 *
 * Self-contained: no external dependencies, no Tailwind. Inherits the
 * surrounding page font. Drop into MDX as:
 *   import ProjectTimeline from '../../components/ProjectTimeline.jsx'
 *   <ProjectTimeline client:visible />
 */

const ERAS = {
  race: { label: "The race", color: "#b5642a" },
  builds: { label: "Reference builds", color: "#2f6f7e" },
  completion: { label: "Long-read era", color: "#6b6e9a" },
};

const MILESTONES = [
  { year: "1990", era: "race", title: "Project launches", detail: "NIH and the Department of Energy begin a roughly $3 billion international consortium to read all 3.2 billion bases." },
  { year: "1992", era: "race", title: "Watson resigns", detail: "The project\u2019s first director quits over the NIH\u2019s attempt to patent raw gene fragments." },
  { year: "1996", era: "race", title: "Bermuda Principles", detail: "The consortium agrees to post every base of public sequence online within 24 hours, before anyone can patent it." },
  { year: "1997", era: "race", title: "RP11 recruited", detail: "A Buffalo News ad draws twenty donors; one anonymous man's library will supply about seventy percent of the reference." },
  { year: "1998", era: "race", title: "The race turns to war", detail: "Craig Venter founds Celera, promising the genome in three years; the public project pulls its finish line forward to 2003." },
  { year: "2000", era: "race", title: "Working draft", detail: "Clinton and Blair announce a draft at the White House, \"the human genome,\" singular." },
  { year: "2001", era: "race", title: "Dual papers", detail: "The consortium publishes in Nature and Celera in Science, after a basement-pizza truce." },
  { year: "2003", era: "race", title: "\"Finished\" sequence", detail: "Declared complete on the 50th anniversary of the double helix, though the heterochromatin stayed unread." },
  { year: "2007", era: "builds", title: "Reference Consortium", detail: "Stewardship passes to the Genome Reference Consortium; Illumina acquires Solexa's short-read chemistry." },
  { year: "2009", era: "builds", title: "GRCh37 / hg19", detail: "Becomes the coordinate system for nearly all of human genetics, with hundreds of gaps still in it." },
  { year: "2013", era: "builds", title: "GRCh38 / hg38", detail: "Fixes thousands of errors and adds alternate contigs, which quietly break alignment in the immune loci." },
  { year: "2022", era: "completion", title: "T2T-CHM13", detail: "The first gapless genome, from a mole cell line with no maternal DNA to phase, adds nearly 200 million bases." },
  { year: "2023", era: "completion", title: "Y chromosome & first pangenome", detail: "HG002 completes the Y; the Human Pangenome draft delivers 47 diploid genomes, 94 haplotypes." },
  { year: "future", era: "completion", title: "Toward a pangenome", detail: "The consortium aims for 350 individuals and 700 haplotypes, a reference meant to belong to everyone." },
];

// ---- horizontal (desktop) geometry ----
const VB_W = 760;
const VB_H = 150;
const PAD = 46;
const BASE_Y = 66;
const N = MILESTONES.length;
const STEP = (VB_W - PAD * 2) / (N - 1);
const nodeX = (i) => PAD + i * STEP;
const axisLabel = (m) => (m.year === "future" ? "\u2192" : m.year);

const CSS = `
.pt-root, .pt-root * { box-sizing: border-box; }
.pt-mobile { display: none; }
@media (max-width: 640px) {
  .pt-desktop { display: none; }
  .pt-mobile { display: block; }
}
.pt-list { margin: 0.3rem 0 0; padding: 0; list-style: none; }
.pt-item { position: relative; padding: 0 0 1.5rem 2.5rem; }
.pt-item::before { content:''; position:absolute; left:9px; top:1.5rem; bottom:-0.2rem; width:3px; background:#e8e4db; }
.pt-item:last-child::before { display:none; }
.pt-dot { position:absolute; left:1px; top:0.3rem; width:20px; height:20px; border-radius:50%; border:4px solid #fcfbf8; }
.pt-yr { font-size:1.4rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; }
.pt-ti { font-size:1.75rem; font-weight:700; margin:0.15rem 0 0.3rem; color:#233038; }
.pt-de { font-size:1.5rem; line-height:1.55; color:#4a5560; }
`;

export default function ProjectTimeline() {
  const [selected, setSelected] = useState(5); // default: the 2000 working draft

  const onKeyDown = useCallback((e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(N - 1, s + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
    } else if (e.key === "Home") {
      setSelected(0);
    } else if (e.key === "End") {
      setSelected(N - 1);
    }
  }, []);

  const sel = MILESTONES[selected];
  const selColor = ERAS[sel.era].color;

  const eraKeys = ["race", "builds", "completion"];
  const segments = eraKeys.map((key) => {
    const idxs = MILESTONES.map((m, i) => (m.era === key ? i : -1)).filter((i) => i >= 0);
    return { key, x1: nodeX(idxs[0]), x2: nodeX(idxs[idxs.length - 1]), color: ERAS[key].color };
  });

  return (
    <figure className="pt-root" style={styles.figure}>
      <style>{CSS}</style>

      {/* ---------- desktop: horizontal SVG ---------- */}
      <div className="pt-desktop">
        <div style={styles.hint}>Hover, tap, or arrow-key a milestone</div>
        <div style={styles.scroll}>
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            role="group"
            aria-label="Timeline of the human reference genome, 1990 to present"
            tabIndex={0}
            onKeyDown={onKeyDown}
            style={styles.svg}
          >
            <line x1={PAD} y1={BASE_Y} x2={VB_W - PAD} y2={BASE_Y} stroke="#e2ded5" strokeWidth={2.5} />
            {segments.map((s) => (
              <line key={s.key} x1={s.x1} y1={BASE_Y} x2={s.x2} y2={BASE_Y} stroke={s.color} strokeWidth={2.5} opacity={0.55} />
            ))}

            {MILESTONES.map((m, i) => {
              const x = nodeX(i);
              const color = ERAS[m.era].color;
              const isSel = i === selected;
              return (
                <g
                  key={m.year}
                  transform={`translate(${x},${BASE_Y})`}
                  role="button"
                  aria-pressed={isSel}
                  aria-label={`${m.year}, ${m.title}`}
                  onMouseEnter={() => setSelected(i)}
                  onFocus={() => setSelected(i)}
                  onClick={() => setSelected(i)}
                  style={{ cursor: "pointer" }}
                >
                  <title>{`${m.year}, ${m.title}`}</title>
                  <rect x={-STEP / 2} y={-28} width={STEP} height={56} fill="transparent" />
                  {isSel && <circle r={13} fill={color} opacity={0.16} />}
                  <circle r={isSel ? 8 : 5} fill={isSel ? color : "#fff"} stroke={color} strokeWidth={2.4} style={{ transition: "r 140ms ease" }} />
                  <text
                    x={0}
                    y={30}
                    textAnchor="middle"
                    fontSize={17}
                    fontWeight={isSel ? 700 : 500}
                    fill={isSel ? color : "#7a7468"}
                    style={{ transition: "fill 140ms ease" }}
                  >
                    {axisLabel(m)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={styles.card}>
          <div style={{ ...styles.cardYear, color: selColor }}>
            {sel.year === "future" ? "Next" : sel.year}
            <span style={styles.cardEra}>{ERAS[sel.era].label}</span>
          </div>
          <div style={styles.cardTitle}>{sel.title}</div>
          <div style={styles.cardDetail}>{sel.detail}</div>
        </div>
      </div>

      {/* ---------- mobile: vertical timeline ---------- */}
      <div className="pt-mobile">
        <ol className="pt-list">
          {MILESTONES.map((m) => {
            const color = ERAS[m.era].color;
            return (
              <li className="pt-item" key={m.year}>
                <span className="pt-dot" style={{ background: color }} />
                <div className="pt-yr" style={{ color }}>
                  {m.year === "future" ? "Ongoing" : m.year}
                </div>
                <div className="pt-ti">{m.title}</div>
                <div className="pt-de">{m.detail}</div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* legend (shared) */}
      <div style={styles.legend}>
        {Object.values(ERAS).map((e) => (
          <span key={e.label} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: e.color }} />
            {e.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

const styles = {
  figure: { margin: "2rem 0", fontFamily: "inherit", color: "#233038", maxWidth: "100%" },
  hint: {
    fontSize: "1.1rem", letterSpacing: "0.08em", textTransform: "uppercase",
    color: "#a59d8d", marginBottom: "0.5rem",
  },
  scroll: { overflowX: "auto", overflowY: "hidden", paddingBottom: "0.25rem" },
  svg: { width: "100%", minWidth: 600, height: "auto", display: "block", outline: "none" },
  card: {
    marginTop: "0.85rem", padding: "1.25rem 1.5rem 1.35rem",
    background: "#fbfaf7", border: "1px solid #ece8df",
    borderRadius: 6, minHeight: 130,
  },
  cardYear: {
    fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
    display: "flex", alignItems: "baseline", gap: "0.6rem",
  },
  cardEra: { fontSize: "1rem", fontWeight: 600, letterSpacing: "0.08em", color: "#b3aa98" },
  cardTitle: { fontSize: "1.6rem", fontWeight: 700, margin: "0.35rem 0 0.45rem" },
  cardDetail: { fontSize: "1.35rem", lineHeight: 1.55, color: "#4a5560" },
  legend: { display: "flex", flexWrap: "wrap", gap: "1.6rem", marginTop: "0.8rem" },
  legendItem: { display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem", color: "#6a7780" },
  legendDot: { width: 11, height: 11, borderRadius: "50%", display: "inline-block" },
};