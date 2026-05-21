// components/dashboard.jsx — KPI cards, type breakdown, alert widget, log feed, Dashboard page

const { useState: useSt, useEffect: useEf, useRef: useRf } = React;

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK = {
  kpi: { totalParts: 315, available: 198, lowStock: 67, outOfStock: 28, unassigned: 22 },

  stockHealth: [
  { name: 'Available', value: 198, color: 'var(--chart-2)' },
  { name: 'Low Stock', value: 67, color: 'var(--chart-3)' },
  { name: 'Out of Stock', value: 28, color: 'var(--chart-4)' },
  { name: 'Unassigned', value: 22, color: 'var(--chart-5)' }],


  typeDistribution: [
  { type: 'Electrical', count: 180, color: 'var(--chart-1)',
    segments: [{ pct: 62, color: 'var(--chart-2)' }, { pct: 22, color: 'var(--chart-3)' }, { pct: 10, color: 'var(--chart-4)' }, { pct: 6, color: 'var(--chart-5)' }] },
  { type: 'Mechanical', count: 95, color: 'var(--chart-5)',
    segments: [{ pct: 61, color: 'var(--chart-2)' }, { pct: 21, color: 'var(--chart-3)' }, { pct: 8, color: 'var(--chart-4)' }, { pct: 10, color: 'var(--chart-5)' }] },
  { type: 'Fabrication', count: 40, color: 'var(--chart-2)',
    segments: [{ pct: 70, color: 'var(--chart-2)' }, { pct: 17, color: 'var(--chart-3)' }, { pct: 5, color: 'var(--chart-4)' }, { pct: 8, color: 'var(--chart-5)' }] }],


  perType: {
    electrical: { total: 180, available: 112, lowStock: 40, outOfStock: 18, unassigned: 10 },
    mechanical: { total: 95, available: 58, lowStock: 20, outOfStock: 8, unassigned: 9 },
    fabrication: { total: 40, available: 28, lowStock: 7, outOfStock: 2, unassigned: 3 }
  },

  alertStock: [
  { id: '1', name: 'Fuse 10A 250V', code: 'MIA-EL-001', cur: 0, min: 10, sev: 'empty' },
  { id: '2', name: 'Bearing SKF 6205', code: 'MIA-ME-003', cur: 1, min: 10, sev: 'critical' },
  { id: '3', name: 'Kontaktor LC1D18', code: 'MIA-EL-002', cur: 2, min: 10, sev: 'critical' },
  { id: '4', name: 'Majun / Lap Bersih', code: 'MIA-FA-001', cur: 1, min: 15, sev: 'critical' },
  { id: '5', name: 'Terminal Block 4mm²', code: 'MIA-EL-005', cur: 5, min: 20, sev: 'low' },
  { id: '6', name: 'O-Ring NBR 30mm', code: 'MIA-ME-002', cur: 8, min: 25, sev: 'low' },
  { id: '7', name: 'Relay Omron MY2N', code: 'MIA-EL-009', cur: 3, min: 15, sev: 'low' }],


  activity: [
  { id: '1', type: 'STOCK_IN', user: 'Aldi Nugroho', part: 'Fitting AS1002F', code: 'SMC-FT-001', qty: 5, time: '09:15', date: '14 Mei 2026' },
  { id: '2', type: 'STOCK_OUT', user: 'Budi Santoso', part: 'PLC Modul Input 16DI', code: 'PLC-IO-002', qty: 2, time: '08:50', date: '14 Mei 2026' },
  { id: '3', type: 'UPDATE', user: 'Aldi Nugroho', part: 'Kontaktor LC1D18', code: 'MIA-EL-002', qty: 0, time: '08:30', date: '14 Mei 2026' },
  { id: '4', type: 'STOCK_IN', user: 'Candra Putra', part: 'Bearing SKF 6205', code: 'MIA-ME-003', qty: 10, time: '08:10', date: '14 Mei 2026' },
  { id: '5', type: 'CREATE', user: 'Aldi Nugroho', part: 'Terminal Block 4mm²', code: 'MIA-EL-005', qty: 0, time: '07:45', date: '14 Mei 2026' },
  { id: '6', type: 'STOCK_OUT', user: 'Dimas Pratama', part: 'Majun / Lap Bersih', code: 'MIA-FA-001', qty: 5, time: '16:30', date: '13 Mei 2026' },
  { id: '7', type: 'STOCK_IN', user: 'Aldi Nugroho', part: 'O-Ring NBR 30mm', code: 'MIA-ME-002', qty: 20, time: '15:00', date: '13 Mei 2026' },
  { id: '8', type: 'UPDATE', user: 'Budi Santoso', part: 'Sensor Proximity M12', code: 'EL-SN-003', qty: 0, time: '14:20', date: '13 Mei 2026' },
  { id: '9', type: 'STOCK_OUT', user: 'Eko Wibowo', part: 'Relay Omron MY2N', code: 'MIA-EL-009', qty: 3, time: '13:55', date: '13 Mei 2026' },
  { id: '10', type: 'CREATE', user: 'Aldi Nugroho', part: 'Hydraulic Seal Kit 40mm', code: 'MIA-ME-011', qty: 0, time: '09:30', date: '13 Mei 2026' }]

};

// ─── Animated count-up ───────────────────────────────────────────────────────

function useCountUp(target, duration = 900) {
  const [val, setVal] = useSt(0);
  useEf(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {setVal(target);clearInterval(id);} else
      setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target]);
  return val;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ title, rawValue, colorVar, Icon, onNavigate, page, filter }) {
  const value = useCountUp(rawValue);
  const color = `var(${colorVar})`;
  const iconBg = `color-mix(in oklch, ${color} 14%, transparent)`;
  return (
    <div
      className="kpi-card"
      style={{ borderLeftColor: color, cursor: page ? 'pointer' : 'default' }}
      onClick={() => page && onNavigate(page)}>
      
      <div className="kpi-icon" style={{ background: iconBg, color }}>
        <Icon size={20} />
      </div>
      <div className="kpi-body">
        <div className="kpi-label" style={{ fontSize: "14px" }}>{title}</div>
        <div className="kpi-value" style={{ color: color === 'var(var(--foreground))' ? 'var(--foreground)' : color }}>
          {rawValue === null ? '—' : value.toLocaleString('id-ID')}
        </div>
      </div>
    </div>);

}

// ─── Type Breakdown Card ─────────────────────────────────────────────────────

const TYPE_META = {
  electrical: { label: 'Electrical', Icon: Icons.Zap, headerBg: 'var(--type-el-bg)', headerFg: 'var(--type-el-fg)' },
  mechanical: { label: 'Mechanical', Icon: Icons.Cog, headerBg: 'var(--type-me-bg)', headerFg: 'var(--type-me-fg)' },
  fabrication: { label: 'Fabrication', Icon: Icons.Hammer, headerBg: 'var(--type-fa-bg)', headerFg: 'var(--type-fa-fg)' }
};

function MiniBar({ value, total, color }) {
  const pct = total > 0 ? Math.min(value / total * 100, 100) : 0;
  return (
    <div className="mini-bar-track">
      <div className="mini-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>);

}

function TypeBreakdownCard({ type, data, onNavigate }) {
  const meta = TYPE_META[type];
  const Icon = meta.Icon;
  const rows = [
  { key: 'available', label: 'Available', val: data.available, color: 'var(--chart-2)' },
  { key: 'lowStock', label: 'Low Stock', val: data.lowStock, color: 'var(--chart-3)' },
  { key: 'outOfStock', label: 'Out of Stock', val: data.outOfStock, color: 'var(--chart-4)' },
  { key: 'unassigned', label: 'Unassigned', val: data.unassigned, color: 'var(--chart-5)' }];

  return (
    <div className="card type-card">
      <div className="type-header" style={{ background: meta.headerBg, color: meta.headerFg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} />
          <span style={{ fontWeight: 600, fontSize: "16px" }}>{meta.label}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
          {data.total} parts
        </span>
      </div>
      <div className="type-body">
        {rows.map((r) =>
        <div
          key={r.key}
          className="type-row"
          onClick={() => onNavigate('parts')}
          style={{ cursor: 'pointer' }}>
          
            <span className="type-dot" style={{ background: r.color }} />
            <span className="type-row-label">{r.label}</span>
            <MiniBar value={r.val} total={data.total} color={r.color} />
            <span className="type-row-val">{r.val}</span>
          </div>
        )}
        <div className="type-divider" />
        <div className="type-row type-row--asset">
          <span className="type-row-label" style={{ color: 'var(--muted-foreground)' }}>Total Asset</span>
          <span className="type-row-val" style={{ color: 'var(--muted-foreground)' }} title="Akan tersedia di versi mendatang">—</span>
        </div>
      </div>
    </div>);

}

// ─── Alert Stock Widget ───────────────────────────────────────────────────────

const SEV_META = {
  empty: { label: 'Empty', Icon: Icons.CircleDashed, badgeCls: 'badge-empty', barColor: 'var(--chart-1)' },
  critical: { label: 'Critical', Icon: Icons.XCircle, badgeCls: 'badge-critical', barColor: 'var(--chart-4)' },
  low: { label: 'Low', Icon: Icons.AlertTriangle, badgeCls: 'badge-low', barColor: 'var(--chart-3)' }
};

function AlertStockWidget({ items, onNavigate }) {
  return (
    <div className="card alert-card">
      <div className="alert-header">
        <div>
          <div className="chart-card-title" style={{ fontSize: "17px" }}>⚠ Alert Stok</div>
          <div className="chart-card-sub">Part yang perlu perhatian</div>
        </div>
        <span className="badge badge-empty" style={{ alignSelf: 'flex-start' }}>{items.length} item</span>
      </div>
      <div className="alert-list">
        {items.map((item) => {
          const sm = SEV_META[item.sev];
          const Icon = sm.Icon;
          const pct = item.min > 0 ? Math.min(item.cur / item.min * 100, 100) : 0;
          const borderColor = item.sev === 'empty' ? 'var(--border)' : item.sev === 'critical' ? 'var(--chart-4)' : 'var(--chart-3)';
          return (
            <div
              key={item.id}
              className={`alert-item alert-item--${item.sev}`}
              style={{ borderLeftColor: borderColor, cursor: 'pointer' }}
              onClick={() => onNavigate('parts')}>
              
              <div className="alert-item-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={15} style={{ color: borderColor, flexShrink: 0 }} />
                  <span className="alert-item-name">{item.name}</span>
                </div>
                <span className={`badge ${sm.badgeCls}`}>{sm.label}</span>
              </div>
              <div className="alert-item-code">{item.code}</div>
              <div className="alert-item-stock">
                Stok: <strong style={{ fontFamily: 'var(--font-mono)' }}>{item.cur}</strong>
                <span style={{ color: 'var(--muted-foreground)' }}>/{item.min} min</span>
              </div>
              <div className="alert-bar-track">
                <div className="alert-bar-fill" style={{ width: `${pct}%`, background: sm.barColor }} />
              </div>
            </div>);

        })}
      </div>
      {items.length === 0 &&
      <div className="empty-state">Semua stok dalam kondisi baik 🎉</div>
      }
    </div>);

}

// ─── Transaction Log Feed ────────────────────────────────────────────────────

const ACT_META = {
  STOCK_IN: { label: 'Stock IN', color: 'var(--chart-2)', Icon: Icons.ArrowUp, bg: 'var(--act-in-bg)' },
  STOCK_OUT: { label: 'Stock OUT', color: 'var(--chart-4)', Icon: Icons.ArrowDown, bg: 'var(--act-out-bg)' },
  UPDATE: { label: 'Edit', color: 'var(--chart-1)', Icon: Icons.Edit3, bg: 'var(--act-edit-bg)' },
  CREATE: { label: 'Tambah', color: 'var(--chart-5)', Icon: Icons.Plus, bg: 'var(--act-new-bg)' }
};

function TransactionLogFeed({ items, onNavigate }) {
  return (
    <div className="card log-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title" style={{ fontSize: "17px" }}>Log Transaksi</div>
          <div className="chart-card-sub">10 aktivitas terbaru</div>
        </div>
      </div>
      <div className="log-list">
        {items.map((item, i) => {
          const am = ACT_META[item.type] || ACT_META.UPDATE;
          const Icon = am.Icon;
          return (
            <div key={item.id}>
              <div className="log-item" onClick={() => onNavigate('movements')} style={{ cursor: 'pointer' }}>
                <div className="log-icon" style={{ background: am.bg, color: am.color }}>
                  <Icon size={13} />
                </div>
                <div className="log-body">
                  <div className="log-desc">
                    <span className="log-user">{item.user.split(' ')[0]}</span>
                    {item.type === 'STOCK_IN' && <> menambahkan stok <span className="log-part">{item.part}</span> <span className="log-qty log-qty--in">+{item.qty}</span></>}
                    {item.type === 'STOCK_OUT' && <> mengambil <span className="log-part">{item.part}</span> <span className="log-qty log-qty--out">-{item.qty}</span></>}
                    {item.type === 'UPDATE' && <> mengedit <span className="log-part">{item.part}</span></>}
                    {item.type === 'CREATE' && <> menambahkan part <span className="log-part">{item.part}</span></>}
                  </div>
                  <div className="log-time">{item.date}, {item.time}</div>
                </div>
                <Icons.ChevronRight size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              </div>
              {i < items.length - 1 && <div className="log-divider" />}
            </div>);

        })}
      </div>
      <button
        className="log-footer-btn"
        onClick={() => onNavigate('movements')}>
        
        Lihat Semua →
      </button>
    </div>);

}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

function Dashboard({ refreshing, onNavigate }) {
  const d = MOCK;
  const { Wallet, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Package } = Icons;

  return (
    <div className="dashboard">
      {/* Baris 1 — KPI Cards */}
      <div className="grid grid-6">
        <KpiCard title="Total Parts" rawValue={d.kpi.totalParts} colorVar="--chart-1" Icon={Package} onNavigate={onNavigate} page="parts" />
        <KpiCard title="Available" rawValue={d.kpi.available} colorVar="--chart-2" Icon={CheckCircle2} onNavigate={onNavigate} page="parts" />
        <KpiCard title="Low Stock" rawValue={d.kpi.lowStock} colorVar="--chart-3" Icon={AlertTriangle} onNavigate={onNavigate} page="parts" />
        <KpiCard title="Out of Stock" rawValue={d.kpi.outOfStock} colorVar="--chart-4" Icon={XCircle} onNavigate={onNavigate} page="parts" />
        <KpiCard title="Unassigned" rawValue={d.kpi.unassigned} colorVar="--chart-5" Icon={HelpCircle} onNavigate={onNavigate} page="parts" />
        <KpiCard title="Total Asset" rawValue={null} colorVar="--primary" Icon={Wallet} onNavigate={onNavigate} page={null} />
      </div>

      {/* Baris 2 — Charts */}
      <div className="grid grid-2">
        <StockHealthChart data={d.stockHealth} />
        <TypeDistributionChart data={d.typeDistribution} />
      </div>

      {/* Baris 3 — Per-type breakdown */}
      <div className="grid grid-3">
        <TypeBreakdownCard type="electrical" data={d.perType.electrical} onNavigate={onNavigate} />
        <TypeBreakdownCard type="mechanical" data={d.perType.mechanical} onNavigate={onNavigate} />
        <TypeBreakdownCard type="fabrication" data={d.perType.fabrication} onNavigate={onNavigate} />
      </div>

      {/* Baris 4 — Log + Alert */}
      <div className="grid grid-12">
        <div className="col-7"><TransactionLogFeed items={d.activity} onNavigate={onNavigate} /></div>
        <div className="col-5"><AlertStockWidget items={d.alertStock} onNavigate={onNavigate} /></div>
      </div>
    </div>);

}

Object.assign(window, { Dashboard });