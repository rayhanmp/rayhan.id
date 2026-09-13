import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { stations, fares, branches, routeBetween, rupiah, fareBetween, endpointForStation } from '../data/lrtFares';
import '../styles/lrt.css';
import '../styles/lrtSchedule.css';
import '../styles/lrtMethod.css';
import { selectionAfterClick, selectionAfterDrop, type Endpoint } from '../utils/lrtSelection';
import { departuresFor, empiricalTravelMinutes, formatClock, getScheduleMode, scheduleLabel } from '../utils/lrtSchedule';
import { useLrtMapViewport } from '../utils/useLrtMapViewport';

const blue = '#304bb2', green = '#078359';
const points: [number, number][] = stations.map((_, i) => i < 8 ? [272, 64 + i * 52] : i < 14 ? [378, 538 + (i-8)*52] : [252, ({14:642,15:538,16:590,17:486} as Record<number,number>)[i]]);
const mobilePoints: [number, number][] = stations.map((_, i) => i < 8 ? [252, 70 + i * 64] : i < 14 ? [440, 590 + (i-8) * 70] : [220, ({14:800,15:660,16:730,17:590} as Record<number,number>)[i]]);
const mobileStationNameLines: Record<number, string[]> = { 4: ['Pancoran bank', 'bjb'], 9: ['Jati Bening', 'Baru'], 15: ['Kampung', 'Rambutan'], 17: ['Taman Mini', '(TMII)'] };
const shortNames: Record<number,string> = {0:'Dukuh Atas BNI',4:'Pancoran bank bjb',17:'Taman Mini (TMII)'};
type DragPosition = { endpoint: Endpoint; x: number; y: number; drop: number | null };
type ActiveDrag = { endpoint: Endpoint; index: number; pointerId: number; startX: number; startY: number; moved: boolean };
function Icon({type}:{type:'train'|'swap'|'arrow'|'reset'}) {
 return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{type==='train'?<><rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 11h14M9 3v8M7 21l2-3m8 3-2-3"/><path d="M8 15h1m6 0h1"/></>:type==='swap'?<><path d="M5 8h14l-4-4M19 16H5l4 4"/></>:type==='reset'?<><path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/></>:<><path d="M4 12h16m-6-6 6 6-6 6"/></>}</svg>;
}
function ExternalLinkIcon() {
 return <svg className="external-link-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2h5v5M14 2 7.5 8.5"/><path d="M13 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3.5"/></svg>;
}

export default function LrtCalculator() {
 const [from,setFrom] = useState<number|null>(null), [to,setTo] = useState<number|null>(null);
 const [target,setTarget] = useState<'from'|'to'>('from');
 const [peak,setPeak] = useState(true);
 const [now,setNow] = useState(() => new Date());
 useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer); }, []);
 const svgRef = useRef<SVGSVGElement>(null);
 const activeDrag = useRef<ActiveDrag|null>(null);
 const suppressClick = useRef(false);
 const suppressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const [dragPosition,setDragPosition] = useState<DragPosition|null>(null);
 function cancelEndpointDrag() { activeDrag.current=null; setDragPosition(null); }
 function suppressMapClick() {
  suppressClick.current=true;
  if(suppressTimer.current) clearTimeout(suppressTimer.current);
  suppressTimer.current=setTimeout(()=>{suppressClick.current=false;},250);
 }
 useEffect(()=>()=>{if(suppressTimer.current) clearTimeout(suppressTimer.current);},[]);
 const mapViewport = useLrtMapViewport(cancelEndpointDrag,()=>activeDrag.current!==null,suppressMapClick);
 const mapPoints = mapViewport.mobile ? mobilePoints : points;
 const trunkXs = mapViewport.mobile ? [220,284] : [252,292];
 const ready = from !== null && to !== null;
 const route = ready ? routeBetween(from,to) : [];
 const travelMinutes = ready ? empiricalTravelMinutes(route) : 0;
 const raw = ready ? fares[from][to] : 0;
 const total = ready ? fareBetween(from,to,peak) : 0;
 function selectStation(index:number) {
  if (suppressClick.current) return;
  const next = selectionAfterClick({from,to,target}, index);
  setFrom(next.from); setTo(next.to); setTarget(next.target);
 }
 function dragLocation(event: PointerEvent<SVGSVGElement>): {x:number;y:number;drop:number|null} | null {
  const matrix = svgRef.current?.getScreenCTM();
  if (!matrix) return null;
  const point = new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
  const hit = document.elementsFromPoint(event.clientX,event.clientY).map(element=>element.closest('[data-station-index]')).find(Boolean);
  let drop = hit ? Number(hit.getAttribute('data-station-index')) : null;
  if (drop === null) {
   let distance = 28;
   mapPoints.forEach(([x,y],index)=>{const d=Math.hypot(point.x-x,point.y-y);if(d<distance){distance=d;drop=index;}});
  }
  return {x:point.x,y:point.y,drop};
 }
 function startDrag(event: PointerEvent<SVGGElement>, index:number, endpoint:Endpoint) {
  if (event.button!==0 || !event.isPrimary || !svgRef.current || mapViewport.multiplePointers()) return;
  event.preventDefault(); event.stopPropagation();
  activeDrag.current={endpoint,index,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};
  svgRef.current.setPointerCapture(event.pointerId);
 }
 function moveDrag(event: PointerEvent<SVGSVGElement>) {
  const drag = activeDrag.current;
  if (!drag || drag.pointerId!==event.pointerId) return;
  if (Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>5) drag.moved=true;
  if (!drag.moved) return;
  const location = dragLocation(event);
  if (location) setDragPosition({endpoint:drag.endpoint,...location});
 }
 function finishDrag(event: PointerEvent<SVGSVGElement>, cancelled=false) {
  const drag=activeDrag.current;
  if (!drag || drag.pointerId!==event.pointerId) return;
  activeDrag.current=null; setDragPosition(null);
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  if (!cancelled) {
   if (drag.moved) {
    const next=selectionAfterDrop({from,to,target},drag.endpoint,dragLocation(event)?.drop??null);
    setFrom(next.from);setTo(next.to);setTarget(next.target);
   } else selectStation(drag.index);
  }
  suppressClick.current=true;
  window.setTimeout(()=>{suppressClick.current=false;},0);
 }
 function reset() { const drag=activeDrag.current; activeDrag.current=null; setDragPosition(null); if(drag&&svgRef.current?.hasPointerCapture(drag.pointerId)) svgRef.current.releasePointerCapture(drag.pointerId); mapViewport.reset(); setFrom(null); setTo(null); setTarget('from'); }
 const scheduleMode = getScheduleMode(now);
 const currentMinute = now.getHours() * 60 + now.getMinutes();
 const currentDateLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
 const nextDepartures = from !== null ? departuresFor(from, scheduleMode, currentMinute, 3) : [];
 return <div className="lrt-app">
  <header className="lrt-header"><a href="/lrt/" className="lrt-brand"><span className="brand-icon"><Icon type="train"/></span><span>Kalkulator <b>LRT Jabodebek</b></span></a></header>
  <main className="lrt-main">
   <div className="calculator-grid">
    <section className="map-panel" aria-label="Peta interaktif LRT Jabodebek">
     <div className="map-toolbar"><span><i className="live-dot"/>PETA JALUR</span><span className="map-instruction" aria-live="polite">{dragPosition?(dragPosition.drop===null?'Lepas di stasiun':`Lepas di ${stations[dragPosition.drop]}`):ready?'Klik atau tarik A/B':<>Pilih stasiun <b>{endpointForStation(0,from,to,target)==='from'?'asal':'tujuan'}</b></>}</span><button className="reset-button" onClick={reset} aria-label="Hapus pilihan stasiun"><Icon type="reset"/>Reset</button></div>
     {mapViewport.mobile&&<div className="map-navigation"><div role="group" aria-label="Pembesaran peta"><button onClick={()=>mapViewport.zoom(1/1.5)} disabled={!mapViewport.zoomed} aria-label="Perkecil peta">−</button><button onClick={()=>mapViewport.zoom(1.5)} disabled={mapViewport.maxZoom} aria-label="Perbesar peta">+</button><button onClick={mapViewport.showAll} disabled={!mapViewport.zoomed} aria-label="Tampilkan seluruh peta"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button></div></div>}
     <div className={`map-canvas ${mapViewport.mobile?'touch-map mobile-layout':''} ${mapViewport.zoomed?'is-zoomed':''} ${dragPosition?'is-dragging':''}`}><svg ref={svgRef} viewBox={mapViewport.viewBox} role="group" aria-label="Klik stasiun atau tarik penanda A dan B untuk mengubah perjalanan. Di mobile, cubit untuk memperbesar dan geser peta." onPointerDownCapture={e=>{if(suppressTimer.current) clearTimeout(suppressTimer.current);suppressClick.current=false;mapViewport.down(e);}} onPointerMove={e=>{mapViewport.move(e);moveDrag(e);}} onPointerUp={e=>{finishDrag(e);mapViewport.end(e);}} onPointerCancel={e=>{finishDrag(e,true);mapViewport.end(e);}} onLostPointerCapture={e=>{if(activeDrag.current?.pointerId===e.pointerId) cancelEndpointDrag();mapViewport.end(e);}} onKeyDown={e=>{if(e.key==='Escape'){cancelEndpointDrag();mapViewport.reset();}}}>
      <g fill="none" strokeWidth={mapViewport.mobile?13:8} strokeLinecap="round" strokeLinejoin="round">
       <path d={mapViewport.mobile?'M220 70V800':'M252 64V642'} stroke={blue} opacity=".2"/><path d={mapViewport.mobile?'M284 70V518 Q284 535 305 546 L420 580 Q440 588 440 590V1010':'M292 64V448 Q292 458 305 471 L365 526 Q378 538 378 548V798'} stroke={green} opacity=".2"/>
       {branches.map((line,branch)=>line.slice(1).map((index,j)=> {
        const prev=line[j]; const selected=route.includes(prev)&&route.includes(index); const x1=prev<8?trunkXs[branch]:mapPoints[prev][0],y1=mapPoints[prev][1]; const x2=index<8?trunkXs[branch]:mapPoints[index][0],y2=mapPoints[index][1];
        const d=prev===7&&branch===1?(mapViewport.mobile?`M284 ${y1}V530 Q284 544 305 550 L420 580 Q440 588 440 590`:`M292 ${y1}V448 Q292 458 305 471 L365 526 Q378 538 378 548`):`M${x1} ${y1}L${x2} ${y2}`;
        return <path key={`${branch}-${index}`} d={d} stroke={branch===0?blue:green} opacity={ready?(selected?1:.15):1}/>;
       }))}
      </g>
      {mapViewport.mobile?<g className="line-badges"><rect x="196" y="18" width="48" height="27" rx="13" fill={blue}/><text x="220" y="36" textAnchor="middle">CB</text><rect x="260" y="18" width="48" height="27" rx="13" fill={green}/><text x="284" y="36" textAnchor="middle">BK</text><rect x="196" y="835" width="48" height="27" rx="13" fill={blue}/><text x="220" y="853" textAnchor="middle">CB</text><rect x="416" y="1030" width="48" height="27" rx="13" fill={green}/><text x="440" y="1048" textAnchor="middle">BK</text></g>:<g className="line-badges"><rect x="228" y="14" width="45" height="25" rx="12" fill={blue}/><text x="250" y="31" textAnchor="middle">CB</text><rect x="281" y="14" width="45" height="25" rx="12" fill={green}/><text x="303" y="31" textAnchor="middle">BK</text><rect x="230" y="675" width="45" height="25" rx="12" fill={blue}/><text x="252" y="692" textAnchor="middle">CB</text><rect x="356" y="830" width="45" height="25" rx="12" fill={green}/><text x="378" y="847" textAnchor="middle">BK</text></g>}
      {stations.map((name,index)=> {
       const [x,y]=mapPoints[index]; const common=index<8, left=index>=14;
       const selected=from===index||to===index;
       const clickEndpoint=endpointForStation(index,from,to,target);
       const color=left?blue:green;
       const labelX=mapViewport.mobile?(common?330:left?184:480):(common?332:left?220:412);
       const labelLines=mapViewport.mobile ? (mobileStationNameLines[index]??[shortNames[index]||name]) : [shortNames[index]||name];
       const code=common?index+1:left?branches[0].indexOf(index)+1:branches[1].indexOf(index)+1;
       return <g key={name} data-station-index={index} role="button" tabIndex={0} aria-label={`${name}${from===index?', stasiun asal':''}${to===index?', stasiun tujuan':''}`} aria-pressed={selected} className={`station ${selected?'selected':''} ${dragPosition?.drop===index?'drop-target':''}`} onClick={()=>selectStation(index)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ') {e.preventDefault();selectStation(index);}}}>
        <title>{`${name} — pilih sebagai ${clickEndpoint==='from'?'asal':'tujuan'}`}</title>
        <rect className="station-hit" x={mapViewport.mobile?(left?20:common?154:420):(left?24:common?226:352)} y={y-(mapViewport.mobile?30:22)} width={mapViewport.mobile?(left?190:common?350:220):(left?248:common?330:295)} height={mapViewport.mobile?60:44} rx="10" fill="transparent"/>
        {common ? trunkXs.map((cx,b)=><g key={cx}><circle cx={cx} cy={y} r={mapViewport.mobile?18:11} fill="white" stroke={b===0?blue:green} strokeWidth={mapViewport.mobile?4:3}/><text className="station-code" x={cx} y={y+(mapViewport.mobile?4.5:3.5)} textAnchor="middle" fill={b===0?blue:green}>{String(code).padStart(2,'0')}</text></g>):<><circle cx={x} cy={y} r={mapViewport.mobile?18:11} fill="white" stroke={color} strokeWidth={mapViewport.mobile?4:3}/><text className="station-code" x={x} y={y+(mapViewport.mobile?4.5:3.5)} textAnchor="middle" fill={color}>{String(code).padStart(2,'0')}</text></>}
        {(['from','to'] as const).filter(endpoint=>(endpoint==='from'?from:to)===index).map(endpoint=>{
         const cx=(common?mapPoints[index][0]:x)+(from===to?(endpoint==='from'?-20:20):0);
         const cy=y;
         return <g key={endpoint} className="endpoint-handle" onPointerDown={e=>startDrag(e,index,endpoint)}><title>{`Tarik ${endpoint==='from'?'A':'B'} ke stasiun lain`}</title><circle cx={cx} cy={cy} r={mapViewport.mobile?30:22} fill="transparent"/><circle cx={cx} cy={cy} r={mapViewport.mobile?23:16} fill="#192c3c" stroke="white" strokeWidth="3"/><text x={cx} y={cy+(mapViewport.mobile?6:5)} textAnchor="middle" className="selection-letter">{endpoint==='from'?'A':'B'}</text></g>;
        })}
        <text className="station-name" x={labelX} y={labelLines.length>1?y-3:y+6} textAnchor={left?'end':'start'}>{labelLines.map((line,lineIndex)=><tspan key={lineIndex} x={labelX} dy={lineIndex===0?0:20}>{line}</tspan>)}</text>
       </g>;
      })}
      {dragPosition&&<g className="drag-marker" transform={`translate(${dragPosition.x},${dragPosition.y})`} aria-hidden="true"><circle r="23" fill="white" opacity=".8"/><circle r="18" fill="#192c3c" stroke="#e89a23" strokeWidth="3"/><text y="5" textAnchor="middle" className="selection-letter">{dragPosition.endpoint==='from'?'A':'B'}</text></g>}
     </svg></div>
     <div className="map-footer"><span><b>A</b> Stasiun asal</span><span><b>B</b> Stasiun tujuan</span></div>
    </section>
    <aside className="journey-panel">
     <section className="journey-card"><div className="card-heading"><h2>Perjalananmu</h2><span className="step-label">{ready?'2 / 2':from!==null?'1 / 2':'0 / 2'} dipilih</span></div>
      <div className="station-fields">
       <div className={`station-field ${target==='from'?'active':''}`}><span className="field-marker">A</span><label htmlFor="origin">Dari stasiun</label><select id="origin" value={from??''} onFocus={()=>setTarget('from')} onChange={e=>{setFrom(e.target.value===''?null:Number(e.target.value));setTarget('to');}}><option value="">Pilih stasiun asal</option>{stations.map((name,i)=><option key={name} value={i}>{name}</option>)}</select></div>
       <button className="swap-button" onClick={()=>{setFrom(to);setTo(from);}} aria-label="Tukar stasiun asal dan tujuan"><Icon type="swap"/></button>
       <div className={`station-field ${target==='to'?'active':''}`}><span className="field-marker destination">B</span><label htmlFor="destination">Ke stasiun</label><select id="destination" value={to??''} onFocus={()=>setTarget('to')} onChange={e=>{setTo(e.target.value===''?null:Number(e.target.value));setTarget('from');}}><option value="">Pilih stasiun tujuan</option>{stations.map((name,i)=><option key={name} value={i}>{name}</option>)}</select></div>
      </div>
      <h3>Waktu perjalanan</h3><div className="period-toggle" role="group" aria-label="Pilih periode tarif"><button className={peak?'chosen':''} aria-pressed={peak} onClick={()=>setPeak(true)}>Jam sibuk</button><button className={!peak?'chosen':''} aria-pressed={!peak} onClick={()=>setPeak(false)}>Di luar jam sibuk/libur</button></div>
      <p className="period-explanation">{peak?'Senin–Jumat, 06.00–08.59 & 16.00–19.59 WIB.':'Hari kerja, 09.00–15.59 & 20.00–05.59 WIB. Sepanjang Sabtu, Minggu, dan libur nasional.'}</p>
      <div className="fare-result" aria-live="polite" aria-atomic="true"><div className="fare-top"><span>Tarif perjalanan</span><span className="fare-tag">{peak?'JAM SIBUK':'DI LUAR JAM SIBUK'}</span></div><div className={`fare-value ${!ready?'empty':''}`}>{ready?rupiah(total):'Rp—'}</div>{!ready&&<p>Pilih asal dan tujuan untuk melihat tarif.</p>}
       {ready&&<div className="fare-breakdown"><div><span>Tarif pada tabel</span><b>{rupiah(raw)}</b></div><div><span>Batas maksimal {peak?'jam sibuk':'di luar jam sibuk'}</span><b>{rupiah(peak?20000:10000)}</b></div>{raw>total&&<div className="savings"><span>Potongan batas tarif</span><b>−{rupiah(raw-total)}</b></div>}</div>}
      </div>
      {from!==null&&<section className="schedule-card" aria-live="polite"><div className="schedule-heading"><div><h3>Keberangkatan berikutnya</h3><p>{currentDateLabel} · {scheduleLabel(scheduleMode)}</p></div><span className="schedule-clock"><b>JAM SEKARANG</b><strong>{formatClock(currentMinute)} WIB</strong></span></div>{nextDepartures.length?<div className="departure-list">{nextDepartures.map((departure,i)=><div className="departure-row" key={`${departure}-${i}`}><span className="departure-time">{formatClock(departure)}</span><span className="departure-label">{i===0?'Berikutnya':`+${i+1} kereta`}</span>{ready&&<span className="arrival-time">Estimasi tiba {formatClock(departure+travelMinutes)} WIB</span>}</div>)}</div>:<p className="schedule-empty">Tidak ada keberangkatan lagi hari ini.</p>}{ready?<details className="schedule-method"><summary>Cara menghitung estimasi</summary><p>Durasi <b>{travelMinutes} menit</b> adalah jumlah ΔT pada setiap segmen rute. ΔT diambil dari selisih waktu keberangkatan kereta yang sama di dua stasiun berurutan.</p></details>:<p className="schedule-footnote">Pilih tujuan untuk melihat estimasi tiba.</p>}</section>}
     </section>
    </aside>
   </div>
  </main>
  <footer className="lrt-page-footer"><span className="official-links">Data berdasarkan situs resmi LRT Jabodebek: <a href="https://lrtjabodebek.kai.id/informasi-tarif" target="_blank" rel="noreferrer">Informasi tarif <ExternalLinkIcon /></a> dan <a href="https://lrtjabodebek.kai.id/jadwal-keberangkatan" target="_blank" rel="noreferrer">Jadwal keberangkatan <ExternalLinkIcon /></a>.</span><span className="disclaimer">Disclaimer: Kalkulator nonresmi. Informasi bersifat estimasi dan dapat berubah. Verifikasi sebelum berangkat.</span></footer>
 </div>;
}
