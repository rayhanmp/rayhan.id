import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

type LegendItem = {
  id: string;
  name: string;
  color: string;
};

type Dot = {
  id: string;
  name: string;
  x: number;
  y: number;
  legendId: string;
};

const palette = ['#ff765c', '#f2c94c', '#5b8def', '#61c5a8', '#b98cff', '#f29dce'];

const initialLegend: LegendItem[] = [];

const initialDots: Dot[] = [
  { id: 'example', name: 'Example Item', x: 50, y: 50, legendId: '' },
];

function clamp(value: number) {
  return Math.min(96, Math.max(4, value));
}

function positionFromPointer(event: { clientX: number; clientY: number }, element: HTMLDivElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100),
    y: clamp(100 - ((event.clientY - rect.top) / rect.height) * 100),
  };
}

export default function TwoDChart() {
  const plotRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number; x: number; y: number } | null>(null);
  const [mapTitle, setMapTitle] = useState('Untitled Map');
  const [xAxis, setXAxis] = useState({ name: 'X Axis', low: 'Low', high: 'High' });
  const [yAxis, setYAxis] = useState({ name: 'Y Axis', low: 'Low', high: 'High' });
  const [legends, setLegends] = useState<LegendItem[]>(initialLegend);
  const [dots, setDots] = useState<Dot[]>(initialDots);
  const [selectedDotId, setSelectedDotId] = useState<string | null>('example');
  const [editingDotId, setEditingDotId] = useState<string | null>(null);
  const [editingChartDotId, setEditingChartDotId] = useState<string | null>(null);
  const [chartDraftName, setChartDraftName] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showAxisEnds, setShowAxisEnds] = useState(false);
  const [groupMenuPosition, setGroupMenuPosition] = useState({ top: 0, left: 0 });

  function updateDot(id: string, changes: Partial<Dot>) {
    setDots((current) => current.map((dot) => (dot.id === id ? { ...dot, ...changes } : dot)));
  }

  function startEditing(id: string) {
    setSelectedDotId(id);
    setEditingDotId(id);
  }

  function startChartEditing(dot: Dot) {
    setSelectedDotId(dot.id);
    setEditingChartDotId(dot.id);
    setChartDraftName(dot.name);
  }

  function finishChartEditing(commit: boolean) {
    if (editingChartDotId && commit) updateDot(editingChartDotId, { name: chartDraftName });
    setEditingChartDotId(null);
  }

  function addDot() {
    const id = crypto.randomUUID();
    const nextDot: Dot = {
      id,
      name: 'New Dot',
      x: 50,
      y: 50,
      legendId: legends[0]?.id ?? '',
    };
    setDots((current) => [...current, nextDot]);
    setSelectedDotId(id);
  }

  function removeDot(id: string) {
    setDots((current) => current.filter((dot) => dot.id !== id));
    setSelectedDotId((current) => (current === id ? null : current));
    setEditingDotId((current) => (current === id ? null : current));
  }

  function addLegend() {
    const id = crypto.randomUUID();
    if (legends.length === 0) {
      setDots((current) => current.map((dot) => ({ ...dot, legendId: id })));
    }
    setLegends((current) => [
      ...current,
      { id, name: current.length === 0 ? 'Group A' : 'New Group', color: palette[current.length % palette.length] },
    ]);
  }

  function removeLegend(id: string) {
    const replacement = legends.find((legend) => legend.id !== id);
    setLegends((current) => current.filter((legend) => legend.id !== id));
    setDots((current) => current.map((dot) => (dot.legendId === id ? { ...dot, legendId: replacement?.id ?? '' } : dot)));
  }

  function updateLegend(id: string, changes: Partial<LegendItem>) {
    setLegends((current) => current.map((legend) => (legend.id === id ? { ...legend, ...changes } : legend)));
  }

  function downloadPng() {
    const canvas = document.createElement('canvas');
    const scale = 2;
    const width = 1600;
    const height = 1080;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(scale, scale);

    const plot = { left: 150, top: 170, width: 1320, height: 700 };
    const roundRect = (x: number, y: number, rectWidth: number, rectHeight: number, radius: number) => {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.arcTo(x + rectWidth, y, x + rectWidth, y + rectHeight, radius);
      context.arcTo(x + rectWidth, y + rectHeight, x, y + rectHeight, radius);
      context.arcTo(x, y + rectHeight, x, y, radius);
      context.arcTo(x, y, x + rectWidth, y, radius);
      context.closePath();
    };
    const textWidth = (text: string, font = '600 20px Arial') => {
      context.font = font;
      return context.measureText(text).width;
    };

    context.fillStyle = '#f3f5f9';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#253047';
    context.font = '800 46px Arial';
    context.fillText(mapTitle || 'Untitled Map', 90, 85);
    context.fillStyle = '#637087';
    context.font = '18px Arial';
    context.fillText('2D Chart', 92, 116);

    context.fillStyle = '#fbfcff';
    context.strokeStyle = '#d8deea';
    context.lineWidth = 2;
    context.fillRect(plot.left, plot.top, plot.width, plot.height);
    context.strokeRect(plot.left, plot.top, plot.width, plot.height);
    context.strokeStyle = '#e8ecf3';
    context.lineWidth = 1;
    for (let index = 1; index < 10; index += 1) {
      const x = plot.left + plot.width * index / 10;
      const y = plot.top + plot.height * index / 10;
      context.beginPath();
      context.moveTo(x, plot.top);
      context.lineTo(x, plot.top + plot.height);
      context.moveTo(plot.left, y);
      context.lineTo(plot.left + plot.width, y);
      context.stroke();
    }
    context.strokeStyle = '#a4afc1';
    context.beginPath();
    context.moveTo(plot.left, plot.top + plot.height / 2);
    context.lineTo(plot.left + plot.width, plot.top + plot.height / 2);
    context.moveTo(plot.left + plot.width / 2, plot.top);
    context.lineTo(plot.left + plot.width / 2, plot.top + plot.height);
    context.stroke();

    context.fillStyle = '#253047';
    context.font = '700 21px Arial';
    context.textAlign = 'center';
    context.fillText(xAxis.name || 'X Axis', plot.left + plot.width / 2, plot.top + plot.height + 92);
    context.save();
    context.translate(plot.left - 92, plot.top + plot.height / 2);
    context.rotate(-Math.PI / 2);
    context.fillText(yAxis.name || 'Y Axis', 0, 0);
    context.restore();
    if (showAxisEnds) {
      context.textAlign = 'right';
      context.fillStyle = '#637087';
      context.font = 'italic 17px Georgia';
      context.fillText(xAxis.low, plot.left + 18, plot.top + plot.height / 2 + 6);
      context.textAlign = 'left';
      context.fillText(xAxis.high, plot.left + plot.width - 18, plot.top + plot.height / 2 + 6);
      context.textAlign = 'center';
      context.fillText(yAxis.high, plot.left + plot.width / 2, plot.top + 24);
      context.fillText(yAxis.low, plot.left + plot.width / 2, plot.top + plot.height - 14);
    }

    dots.forEach((dot) => {
      const legend = legends.find((item) => item.id === dot.legendId) ?? legends[0];
      const x = plot.left + plot.width * dot.x / 100;
      const y = plot.top + plot.height * (1 - dot.y / 100);
      const label = dot.name || 'Unnamed Item';
      const labelFont = '600 18px Arial';
      const labelWidth = textWidth(label, labelFont) + 26;
      const labelX = dot.x > 50 ? x - labelWidth - 20 : x + 20;
      const labelY = y - 19;
      context.fillStyle = '#ffffff';
      context.strokeStyle = '#dfe4ed';
      roundRect(labelX, labelY, labelWidth, 38, 7);
      context.fill();
      context.stroke();
      context.fillStyle = '#253047';
      context.font = labelFont;
      context.textAlign = 'left';
      context.fillText(label, labelX + 13, labelY + 25);
      context.beginPath();
      context.fillStyle = legend?.color ?? '#ff765c';
      context.arc(x, y, 10, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#ffffff';
      context.lineWidth = 4;
      context.stroke();
    });

    context.textAlign = 'left';
    let legendX = 150;
    const legendY = 990;
    context.font = '600 18px Arial';
    legends.forEach((legend) => {
      context.beginPath();
      context.fillStyle = legend.color;
      context.arc(legendX + 8, legendY - 6, 8, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#253047';
      context.fillText(legend.name || 'Unnamed Group', legendX + 25, legendY);
      legendX += textWidth(legend.name || 'Unnamed Group') + 65;
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = (mapTitle || 'untitled-map').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled-map';
      link.href = url;
      link.download = `${filename}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>, id: string) {
    if (event.button !== 0 || !event.isPrimary || !plotRef.current) return;
    const dot = dots.find((item) => item.id === id);
    if (!dot) return;
    event.preventDefault();
    event.currentTarget.focus();
    const rect = plotRef.current.getBoundingClientRect();
    dragRef.current = { id, pointerId: event.pointerId,
      x: event.clientX - rect.left - rect.width * dot.x / 100,
      y: event.clientY - rect.top - rect.height * (1 - dot.y / 100) };
    plotRef.current?.setPointerCapture(event.pointerId);
    setActiveDragId(id);
    setSelectedDotId(id);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !plotRef.current) return;
    updateDot(drag.id, positionFromPointer({ clientX: event.clientX - drag.x, clientY: event.clientY - drag.y }, plotRef.current));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (plotRef.current?.hasPointerCapture(event.pointerId)) {
      plotRef.current.releasePointerCapture(event.pointerId);
    }
    setActiveDragId(null);
  }

  return (
    <div className="mapper-shell">
      <header className="mapper-header">
        <div>
          <h1>2D Chart</h1>
          <p className="mapper-intro">Map anything you want.</p>
        </div>
        <div className="mapper-header-note" aria-label="Interaction hint">
          <span>Drag to place · Select to edit</span>
        </div>
      </header>

      <div className="mapper-layout">
        <section className="map-card" aria-label="Chart map">
          <div className="map-card-topline">
            <label className="title-editor" htmlFor="map-title">
              <input id="map-title" aria-label="Map title" value={mapTitle} onChange={(event) => setMapTitle(event.target.value)} />
            </label>
            <button type="button" className="export-button" disabled title="PNG export is coming soon" aria-label="Save PNG, coming soon">
              Save PNG <span className="button-note">Soon</span>
            </button>
          </div>

          <div
            className={`chart-stage ${showAxisEnds ? 'has-axis-ends' : 'compact-axis'}`}
            ref={plotRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={() => { dragRef.current = null; setActiveDragId(null); }}
            aria-label={`${mapTitle}: interactive chart`}
          >
            <div className="quadrant quadrant-top-left" aria-hidden="true" />
            <div className="quadrant quadrant-top-right" aria-hidden="true" />
            <div className="quadrant quadrant-bottom-left" aria-hidden="true" />
            <div className="quadrant quadrant-bottom-right" aria-hidden="true" />
            <div className="axis-line axis-line-x" aria-hidden="true" />
            <div className="axis-line axis-line-y" aria-hidden="true" />

            {dots.map((dot) => {
              const legend = legends.find((item) => item.id === dot.legendId) ?? legends[0];
              const isSelected = selectedDotId === dot.id;
              return (
                <div
                  className={`chart-dot ${dot.x > 50 ? 'label-left' : ''} ${isSelected ? 'is-selected' : ''} ${activeDragId === dot.id ? 'is-dragging' : ''}`}
                  key={dot.id}
                  style={{ left: `${dot.x}%`, bottom: `${dot.y}%`, '--dot-color': legend?.color ?? '#ff765c' } as CSSProperties}
                  aria-label={`${dot.name || 'Unnamed Item'}, ${xAxis.name} ${Math.round(dot.x)}, ${yAxis.name} ${Math.round(dot.y)}`}
                >
                  <span
                    className="dot-orb"
                    role="button"
                    tabIndex={0}
                    aria-label={`Move ${dot.name || 'Unnamed Item'}`}
                    onPointerDown={(event) => handlePointerDown(event, dot.id)}
                    onKeyDown={(event) => {
                      const step = event.shiftKey ? 5 : 1;
                      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[event.key];
                      if (delta) {
                        event.preventDefault();
                        setSelectedDotId(dot.id);
                        updateDot(dot.id, { x: clamp(dot.x + delta[0]), y: clamp(dot.y + delta[1]) });
                      }
                    }}
                  />
                  {editingChartDotId === dot.id ? (
                    <input
                      className="dot-label dot-label-editor"
                      aria-label={`Edit ${dot.name || 'Unnamed Item'} on chart`}
                      autoFocus
                      value={chartDraftName}
                      onChange={(event) => setChartDraftName(event.target.value)}
                      onBlur={() => finishChartEditing(true)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') finishChartEditing(true);
                        if (event.key === 'Escape') finishChartEditing(false);
                      }}
                      onClick={(event) => event.stopPropagation()}
                    />
                  ) : (
                    <button type="button" className="dot-label" onClick={() => startChartEditing(dot)}>
                      {dot.name || 'Unnamed Item'}
                    </button>
                  )}
                </div>
              );
            })}

            <div className="axis-caption axis-caption-x">{xAxis.name}</div>
            <div className="axis-caption axis-caption-y">{yAxis.name}</div>
            {showAxisEnds && (
              <>
                <span className="axis-end axis-end-x-low">{xAxis.low}</span>
                <span className="axis-end axis-end-x-high">{xAxis.high}</span>
                <span className="axis-end axis-end-y-low">{yAxis.low}</span>
                <span className="axis-end axis-end-y-high">{yAxis.high}</span>
              </>
            )}
          </div>

          {legends.length > 0 && <div className="chart-legend" aria-label="Chart legend">
            {legends.map((legend) => <span key={legend.id}><i style={{ background: legend.color }} />{legend.name || 'Unnamed Group'}</span>)}
          </div>}
          <div className="map-card-footer">
            <span><span className="drag-symbol">✥</span> Drag a dot to move it</span>
            <span>Arrow keys move a selected dot · Shift for larger steps</span>
          </div>
        </section>

        <aside className="control-stack" aria-label="Chart controls">
          <section className="control-card axis-card">
            <div className="control-heading">
              <div><h2>Axes</h2></div>
            </div>
            <div className="axis-editor-list">
              <div className="axis-editor-row">
                <div className="axis-row-top">
                  <span className="axis-key axis-key-x">X</span>
                  <input className="axis-name-input" aria-label="X axis name" value={xAxis.name} onChange={(event) => setXAxis({ ...xAxis, name: event.target.value })} />
                </div>
                {showAxisEnds && <div className="axis-endpoints">
                  <label><span>Left</span><input aria-label="X axis left label" value={xAxis.low} onChange={(event) => setXAxis({ ...xAxis, low: event.target.value })} /></label>
                  <label><span>Right</span><input aria-label="X axis right label" value={xAxis.high} onChange={(event) => setXAxis({ ...xAxis, high: event.target.value })} /></label>
                </div>}
              </div>
              <div className="axis-editor-row">
                <div className="axis-row-top">
                  <span className="axis-key axis-key-y">Y</span>
                  <input className="axis-name-input" aria-label="Y axis name" value={yAxis.name} onChange={(event) => setYAxis({ ...yAxis, name: event.target.value })} />
                </div>
                {showAxisEnds && <div className="axis-endpoints">
                  <label><span>Bottom</span><input aria-label="Y axis bottom label" value={yAxis.low} onChange={(event) => setYAxis({ ...yAxis, low: event.target.value })} /></label>
                  <label><span>Top</span><input aria-label="Y axis top label" value={yAxis.high} onChange={(event) => setYAxis({ ...yAxis, high: event.target.value })} /></label>
                </div>}
              </div>
            </div>
            <label className="axis-option">
              <span>Show End Labels</span>
              <input type="checkbox" role="switch" checked={showAxisEnds} onChange={(event) => setShowAxisEnds(event.target.checked)} />
            </label>
          </section>

          <section className="control-card items-card">
            <div className="control-heading">
              <div><h2>Items</h2><span className="section-count">{dots.length}</span></div>
              <button className="small-action" type="button" onClick={addDot}>+ Add</button>
            </div>
            <div className="item-list">
              {dots.map((dot) => {
                const legend = legends.find((item) => item.id === dot.legendId) ?? legends[0];
                return (
                  <div
                    className={`item-row ${selectedDotId === dot.id ? 'is-selected' : ''}`}
                    key={dot.id}
                    onClick={() => startEditing(dot.id)}
                  >
                    {legends.length > 0 ? <>
                      <button
                        type="button"
                        className="item-group-trigger"
                        id={`group-trigger-${dot.id}`}
                        popoverTarget={`group-menu-${dot.id}`}
                        aria-label={`Choose group for ${dot.name || 'Unnamed Item'}`}
                        title={`Group: ${legend?.name || 'Unnamed Group'} — click to change`}
                        onClick={(event) => {
                          event.stopPropagation();
                          const rect = event.currentTarget.getBoundingClientRect();
                          setGroupMenuPosition({
                            left: Math.max(8, Math.min(rect.left, window.innerWidth - 208)),
                            top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 248)),
                          });
                        }}
                      ><span className="item-swatch" style={{ backgroundColor: legend?.color ?? '#ff765c' }} /></button>
                      <div
                        id={`group-menu-${dot.id}`}
                        popover="auto"
                        className="item-group-menu"
                        style={groupMenuPosition}
                        role="group"
                        aria-label="Choose Group"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {legends.map((group) => <button
                          type="button"
                          key={group.id}
                          className="item-group-option"
                          aria-pressed={dot.legendId === group.id}
                          onClick={(event) => {
                            updateDot(dot.id, { legendId: group.id });
                            event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover();
                            document.getElementById(`group-trigger-${dot.id}`)?.focus();
                          }}
                        >
                          <span className="item-swatch" style={{ backgroundColor: group.color }} />
                          <span>{group.name || 'Unnamed Group'}</span>
                          {dot.legendId === group.id && <span aria-hidden="true">✓</span>}
                        </button>)}
                      </div>
                    </> : <span className="item-swatch" style={{ backgroundColor: '#ff765c' }} />}
                    {editingDotId === dot.id ? (
                      <input
                        className="item-inline-editor"
                        aria-label={`Edit ${dot.name || 'Unnamed Item'}`}
                        autoFocus
                        value={dot.name}
                        onChange={(event) => updateDot(dot.id, { name: event.target.value })}
                        onBlur={() => setEditingDotId(null)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur();
                        }}
                        onClick={(event) => event.stopPropagation()}
                      />
                    ) : (
                      <button type="button" className="item-name" title="Edit name">{dot.name || 'Unnamed Item'}</button>
                    )}
                    <button type="button" className="item-remove" aria-label={`Delete ${dot.name || 'Unnamed Item'}`} onClick={(event) => { event.stopPropagation(); removeDot(dot.id); }}>×</button>
                  </div>
                );
              })}
            </div>
            {dots.length === 0 && <p className="control-help">Your map is empty. Add a thing to get started.</p>}
          </section>

          <section className="control-card legend-card">
            <div className="control-heading">
              <div><h2>Legend</h2></div>
              <button className="small-action" type="button" onClick={addLegend}>+ Group</button>
            </div>
            <div className="legend-list">
              {legends.map((legend) => (
                <div className="legend-row" key={legend.id}>
                  <input className="color-picker" aria-label={`${legend.name} color`} type="color" value={legend.color} onChange={(event) => updateLegend(legend.id, { color: event.target.value })} />
                  <input aria-label={`${legend.name} label`} value={legend.name} onChange={(event) => updateLegend(legend.id, { name: event.target.value })} />
                  <button type="button" className="remove-legend" aria-label={`Remove ${legend.name}`} onClick={() => removeLegend(legend.id)}>×</button>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

    </div>
  );
}
