// components/part-detail.jsx — Part Detail slide-over panel (3 tabs)

const { useState: _usd, useMemo: _umd } = React;

function PartDetailSheet({ part, onClose }) {
  const [tab, setTab] = _usd('overview');
  const p = part;
  const { X, Zap, Cog, Hammer, Edit3, ArrowUp, ArrowDown, Package, ChevronRight } = Icons;

  const typeIcon = p.type === 'electrical' ? Zap : p.type === 'mechanical' ? Cog : Hammer;
  const TypeIcon = typeIcon;

  // Purchase records for this part
  const purchases = _umd(() => MOCK_PURCHASES.filter(r => r.partId === p.id), [p.id]);
  const movements = _umd(() => MOCK_MOVEMENTS.filter(r => r.partId === p.id), [p.id]);

  const purchaseStatusCls = { requested:'st-badge--unassign', on_order:'st-badge--low', received:'st-badge--avail', cancelled:'st-badge--inactive' };
  const purchaseStatusLabel = { requested:'Requested', on_order:'On Order', received:'Received', cancelled:'Cancelled' };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet sheet--right sheet--detail">
        {/* Header */}
        <div className="detail-header">
          <div className="detail-header-top">
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <TypeIcon size={16} style={{ color:'var(--primary)' }} />
                <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>{p.partCode}</span>
                <StatusBadge status={p.stockStatus} />
              </div>
              <h2 className="detail-title">{p.partName}</h2>
              <div style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:2 }}>
                {p.maker} · <TypeBadge type={p.type} />
              </div>
            </div>
            <button className="icon-btn" onClick={onClose}><X size={16} /></button>
          </div>

          {/* Tabs */}
          <div className="detail-tabs">
            {['overview','purchase','history'].map(t => (
              <button
                key={t}
                className={`detail-tab${tab === t ? ' detail-tab--active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'overview' ? 'Overview' : t === 'purchase' ? 'Purchase' : 'History'}
                {t === 'purchase' && purchases.length > 0 && <span className="detail-tab-count">{purchases.length}</span>}
                {t === 'history' && movements.length > 0 && <span className="detail-tab-count">{movements.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="detail-body">
          {tab === 'overview' && <OverviewTab p={p} />}
          {tab === 'purchase' && <PurchaseTab purchases={purchases} purchaseStatusCls={purchaseStatusCls} purchaseStatusLabel={purchaseStatusLabel} />}
          {tab === 'history' && <HistoryTab movements={movements} />}
        </div>
      </div>
    </>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ p }) {
  const stockPct = p.maxStock > 0 ? Math.min((p.curStock / p.maxStock) * 100, 100) : 0;
  const barColor = p.curStock === 0 ? 'var(--chart-4)' : p.curStock < p.minStock ? 'var(--chart-3)' : 'var(--chart-2)';

  return (
    <div className="detail-sections">
      {/* Identity */}
      <div className="detail-card">
        <div className="detail-card-title">Identitas Part</div>
        <div className="detail-grid">
          <DetailRow label="Part Name" value={p.partName} />
          <DetailRow label="Part Code" value={p.partCode} mono />
          <DetailRow label="Maker" value={p.maker} />
          <DetailRow label="Type" value={<TypeBadge type={p.type} />} />
          <DetailRow label="Category" value={p.category} />
          <DetailRow label="Unit" value={p.unit} />
        </div>
      </div>

      {/* Stock */}
      <div className="detail-card">
        <div className="detail-card-title">Informasi Stok</div>
        <div style={{ marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>Current Stock</span>
            <span style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)', color: barColor }}>{p.curStock}</span>
          </div>
          <div style={{ height:6, background:'var(--muted)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${stockPct}%`, background: barColor, borderRadius:3, transition:'width 600ms ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10, color:'var(--muted-foreground)', fontFamily:'var(--font-mono)' }}>
            <span>0</span>
            <span style={{ color:'var(--chart-4)' }}>Min {p.minStock}</span>
            <span style={{ color:'var(--chart-1)' }}>Std {p.stdStock}</span>
            <span style={{ color:'var(--chart-2)' }}>Max {p.maxStock}</span>
          </div>
        </div>
        <div className="detail-grid">
          <DetailRow label="Min Stock" value={p.minStock} mono />
          <DetailRow label="Std Stock" value={p.stdStock} mono />
          <DetailRow label="Max Stock" value={p.maxStock} mono />
          <DetailRow label="Status" value={<StatusBadge status={p.stockStatus} />} />
        </div>
      </div>

      {/* Storage */}
      <div className="detail-card">
        <div className="detail-card-title">Lokasi Penyimpanan</div>
        {p.sType ? (
          <div className="detail-grid">
            <DetailRow label="Alamat" value={p.storageAddr} mono />
            <DetailRow label="Storage Type" value={p.sType} mono />
            <DetailRow label="Storage Number" value={p.sNum} mono />
            <DetailRow label="Box" value={String(p.sBox).padStart(2,'0')} mono />
            <DetailRow label="Box Kecil" value={String(p.sBK).padStart(3,'0')} mono />
            <DetailRow label="Barcode" value={p.barcode || '—'} mono />
          </div>
        ) : (
          <div className="detail-empty">Belum ada lokasi — part berstatus unassigned.</div>
        )}
      </div>

      {/* Metadata */}
      <div className="detail-card">
        <div className="detail-card-title">Metadata</div>
        <div className="detail-grid">
          <DetailRow label="Updated By" value={p.updatedBy} />
          <DetailRow label="Updated At" value={p.updatedAt} mono />
          <DetailRow label="Part Status" value={p.status} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className={`detail-row-value${mono ? ' mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

// ─── Purchase Tab ─────────────────────────────────────────────────────────────

function PurchaseTab({ purchases, purchaseStatusCls, purchaseStatusLabel }) {
  if (purchases.length === 0) return <div className="detail-empty">Belum ada data purchase untuk part ini.</div>;

  return (
    <div className="detail-sections">
      <div className="detail-minitbl-wrap">
        <table className="detail-minitbl">
          <thead>
            <tr>
              <th>Date</th><th>Status</th><th>Supplier</th><th>PO #</th><th style={{textAlign:'right'}}>Qty</th><th>ETA</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(r => (
              <tr key={r.id}>
                <td className="mono">{r.date}</td>
                <td><span className={`st-badge ${purchaseStatusCls[r.status]}`}>{purchaseStatusLabel[r.status]}</span></td>
                <td>{r.supplier || '—'}</td>
                <td className="mono">{r.po || '—'}</td>
                <td className="mono" style={{textAlign:'right'}}>{r.qty}</td>
                <td className="mono">{r.eta || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({ movements }) {
  if (movements.length === 0) return <div className="detail-empty">Belum ada riwayat transaksi untuk part ini.</div>;

  return (
    <div className="detail-sections">
      <div className="detail-minitbl-wrap">
        <table className="detail-minitbl">
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th style={{textAlign:'right'}}>Qty</th><th style={{textAlign:'right'}}>Before</th><th style={{textAlign:'right'}}>After</th><th>Requestor</th><th>Project</th>
            </tr>
          </thead>
          <tbody>
            {movements.map(m => (
              <tr key={m.id}>
                <td className="mono" style={{ fontSize:12 }}>{m.date}</td>
                <td>
                  <span className={`st-badge ${m.type === 'IN' ? 'st-badge--avail' : 'st-badge--out'}`}>
                    {m.type === 'IN' ? 'IN' : 'OUT'}
                  </span>
                </td>
                <td className="mono" style={{ textAlign:'right', fontWeight:600, color: m.type === 'IN' ? 'var(--chart-2)' : 'var(--chart-4)' }}>
                  {m.type === 'IN' ? '+' : '-'}{m.qty}
                </td>
                <td className="mono" style={{ textAlign:'right' }}>{m.before}</td>
                <td className="mono" style={{ textAlign:'right', fontWeight:600 }}>{m.after}</td>
                <td>{m.requestor}</td>
                <td style={{ color: m.project ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{m.project || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { PartDetailSheet });
