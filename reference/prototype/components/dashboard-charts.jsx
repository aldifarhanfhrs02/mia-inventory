// components/dashboard-charts.jsx — Donut + Horizontal Bar charts (pure SVG/HTML)

const { useState: useStateC, useEffect: useEffectC } = React;

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ data, total, size = 220 }) {
  const [hovered, setHovered] = useStateC(null);
  const cx = size / 2,cy = size / 2;
  const outerR = size / 2 - 14;
  const innerR = outerR * 0.62;

  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const sa = angle;
    const sweep = total > 0 ? d.value / total * 2 * Math.PI : 0;
    angle += sweep;
    return { ...d, sa, ea: angle, sweep };
  });

  const arc = (sa, ea, or, ir) => {
    const eps = 0.001;
    if (ea - sa >= 2 * Math.PI - eps) ea = sa + 2 * Math.PI - eps;
    const x1 = cx + or * Math.cos(sa),y1 = cy + or * Math.sin(sa);
    const x2 = cx + or * Math.cos(ea),y2 = cy + or * Math.sin(ea);
    const ix1 = cx + ir * Math.cos(ea),iy1 = cy + ir * Math.sin(ea);
    const ix2 = cx + ir * Math.cos(sa),iy2 = cy + ir * Math.sin(sa);
    const lg = ea - sa > Math.PI ? 1 : 0;
    return `M${x1} ${y1} A${or} ${or} 0 ${lg} 1 ${x2} ${y2} L${ix1} ${iy1} A${ir} ${ir} 0 ${lg} 0 ${ix2} ${iy2}Z`;
  };

  const hov = hovered !== null ? slices[hovered] : null;

  return (
    <div className="donut-wrap">
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}>
        
        {slices.map((s, i) =>
        <path
          key={i}
          d={arc(s.sa, s.ea, outerR + (hovered === i ? 4 : 0), innerR)}
          fill={s.color}
          opacity={hovered === null || hovered === i ? 1 : 0.45}
          style={{ cursor: 'pointer', transition: 'opacity 150ms, d 150ms' }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)} />

        )}
        {/* Center */}
        <text
          x={cx} y={cy - 10}
          textAnchor="middle"
          style={{ fontSize: 26, fontWeight: 600, fill: 'var(--foreground)', fontFamily: 'var(--font-sans)' }}>
          
          {hov ? hov.value : total}
        </text>
        <text
          x={cx} y={cy + 14}
          textAnchor="middle"
          style={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}>
          
          {hov ? hov.name : 'Total Parts'}
        </text>
        {hov &&
        <text x={cx} y={cy + 30} textAnchor="middle"
        style={{ fontSize: 11, fill: hov.color, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
            {(hov.value / total * 100).toFixed(1)}%
          </text>
        }
      </svg>

      {/* Legend */}
      <div className="donut-legend">
        {data.map((d, i) =>
        <div
          key={i}
          className="legend-item"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{ opacity: hovered === null || hovered === i ? 1 : 0.5, cursor: 'default', transition: 'opacity 150ms' }}>
          
            <span className="legend-dot" style={{ background: d.color }} />
            <span className="legend-label">{d.name}</span>
            <span className="legend-val">{d.value}</span>
          </div>
        )}
      </div>
    </div>);

}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────

function HorizontalBarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const [mounted, setMounted] = useStateC(false);
  const [hovered, setHovered] = useStateC(null);
  useEffectC(() => {const t = setTimeout(() => setMounted(true), 100);return () => clearTimeout(t);}, []);

  const SEGMENT_LABELS = [
    { name: 'Available', color: 'var(--chart-2)' },
    { name: 'Low Stock', color: 'var(--chart-3)' },
    { name: 'Out of Stock', color: 'var(--chart-4)' },
    { name: 'Unassigned', color: 'var(--chart-5)' },
  ];

  return (
    <div className="hbar-chart">
      {data.map((d, i) =>
      <div key={i} className="hbar-row" style={{ position: 'relative' }}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}>
          <div className="hbar-label">{d.type}</div>
          <div className="hbar-track">
            <div
            className="hbar-fill"
            style={{
              width: mounted ? `${d.count / maxVal * 100}%` : '0%',
              background: d.color,
              transitionDelay: `${i * 120}ms`
            }} />
          
            {/* Sub-bars for status breakdown */}
            <div className="hbar-segments" style={{ width: mounted ? `${d.count / maxVal * 100}%` : '0%', transitionDelay: `${i * 120}ms` }}>
              {d.segments && d.segments.map((s, j) =>
            <div key={j} style={{ width: `${s.pct}%`, background: s.color, height: '100%' }} />
            )}
            </div>
          </div>
          <div className="hbar-value">{d.count}</div>

          {/* Hover tooltip */}
          {hovered === i && d.segments && (
            <div className="hbar-tooltip">
              <div className="hbar-tooltip-title">{d.type} — {d.count} parts</div>
              <div className="hbar-tooltip-rows">
                {d.segments.map((s, j) => {
                  const segCount = Math.round(d.count * s.pct / 100);
                  return (
                    <div key={j} className="hbar-tooltip-row">
                      <span className="legend-dot" style={{ background: SEGMENT_LABELS[j].color }} />
                      <span className="hbar-tooltip-label">{SEGMENT_LABELS[j].name}</span>
                      <span className="hbar-tooltip-val">{segCount}</span>
                      <span className="hbar-tooltip-pct">{s.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>);

}

// ─── Stock Health Card ────────────────────────────────────────────────────────

function StockHealthChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title" style={{ fontSize: "18px" }}>Stock Health</div>
          <div className="chart-card-sub">Part Stock Condition</div>
        </div>
      </div>
      <div className="chart-card-body" style={{ display: 'flex', justifyContent: 'center' }}>
        <DonutChart data={data} total={total} size={200} />
      </div>
    </div>);

}

// ─── Type Distribution Card ───────────────────────────────────────────────────

function TypeDistributionChart({ data }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title" style={{ fontSize: "18px" }}>Distribution Type</div>
          <div className="chart-card-sub">Number of parts per type category</div>
        </div>
      </div>
      <div className="chart-card-body">
        <HorizontalBarChart data={data} />
      </div>
    </div>);

}

Object.assign(window, { StockHealthChart, TypeDistributionChart });