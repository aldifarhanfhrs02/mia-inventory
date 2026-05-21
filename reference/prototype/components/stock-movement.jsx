// components/stock-movement.jsx — Stock Movement page

const { useState: smUs, useEffect: smUe, useMemo: smUm, useRef: smUr } = React;

// ─── Mock NIK Data ───────────────────────────────────────────────────────────

const NIK_DATABASE = [
  { nik:'NIK001', name:'Aldi Nugroho', dept:'Maintenance' },
  { nik:'NIK002', name:'Budi Santoso', dept:'Maintenance' },
  { nik:'NIK003', name:'Candra Putra', dept:'Production' },
  { nik:'NIK004', name:'Dimas Pratama', dept:'Production' },
  { nik:'NIK005', name:'Eko Wibowo', dept:'Engineering' },
  { nik:'NIK006', name:'Fajar Hidayat', dept:'Quality' },
  { nik:'NIK007', name:'Gunawan Setiawan', dept:'Warehouse' },
];

function lookupNIK(nik) {
  if (!nik) return null;
  return NIK_DATABASE.find(n => n.nik.toLowerCase() === nik.trim().toLowerCase()) || null;
}

// ─── Mock Movement Data ──────────────────────────────────────────────────────

const MOVEMENT_DATA = [
  { id:'m01', partId:'15', partName:'Fitting AS1002F', partCode:'MIA-ME-003', maker:'SMC', unit:'PCS', partType:'mechanical', type:'IN', qty:5, before:15, after:20, requestorNik:'NIK001', requestor:'Aldi Nugroho', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'', date:'2026-05-14', time:'09:15' },
  { id:'m02', partId:'3',  partName:'PLC Modul Input 16DI', partCode:'MIA-EL-003', maker:'Mitsubishi', unit:'PCS', partType:'electrical', type:'OUT', qty:2, before:10, after:8, requestorNik:'NIK002', requestor:'Budi Santoso', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Line 3 Maintenance', date:'2026-05-14', time:'08:50' },
  { id:'m03', partId:'13', partName:'Bearing SKF 6205', partCode:'MIA-ME-001', maker:'SKF', unit:'PCS', partType:'mechanical', type:'IN', qty:10, before:5, after:15, requestorNik:'NIK003', requestor:'Candra Putra', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'', date:'2026-05-14', time:'08:10' },
  { id:'m04', partId:'2',  partName:'Kontaktor LC1D18', partCode:'MIA-EL-002', maker:'Schneider', unit:'PCS', partType:'electrical', type:'OUT', qty:3, before:5, after:2, requestorNik:'NIK002', requestor:'Budi Santoso', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Line 3 Maintenance', date:'2026-05-14', time:'07:45' },
  { id:'m05', partId:'14', partName:'O-Ring NBR 30mm', partCode:'MIA-ME-002', maker:'NOK', unit:'PCS', partType:'mechanical', type:'IN', qty:20, before:8, after:28, requestorNik:'NIK001', requestor:'Aldi Nugroho', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'', date:'2026-05-14', time:'07:30' },
  { id:'m06', partId:'23', partName:'Majun / Lap Bersih', partCode:'MIA-FA-001', maker:'Local', unit:'KG', partType:'fabrication', type:'OUT', qty:5, before:6, after:1, requestorNik:'NIK004', requestor:'Dimas Pratama', inputer:'ADM002', inputerName:'Budi Santoso', project:'Workshop Cleaning', date:'2026-05-13', time:'16:30' },
  { id:'m07', partId:'6',  partName:'Sensor Proximity M12', partCode:'MIA-EL-006', maker:'Keyence', unit:'PCS', partType:'electrical', type:'OUT', qty:1, before:13, after:12, requestorNik:'NIK005', requestor:'Eko Wibowo', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Line 1 Repair', date:'2026-05-13', time:'15:20' },
  { id:'m08', partId:'14', partName:'O-Ring NBR 30mm', partCode:'MIA-ME-002', maker:'NOK', unit:'PCS', partType:'mechanical', type:'IN', qty:15, before:0, after:15, requestorNik:'NIK001', requestor:'Aldi Nugroho', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'', date:'2026-05-13', time:'15:00' },
  { id:'m09', partId:'4',  partName:'Relay Omron MY2N', partCode:'MIA-EL-004', maker:'Omron', unit:'PCS', partType:'electrical', type:'OUT', qty:3, before:6, after:3, requestorNik:'NIK005', requestor:'Eko Wibowo', inputer:'ADM002', inputerName:'Budi Santoso', project:'Line 2 PM', date:'2026-05-13', time:'13:55' },
  { id:'m10', partId:'12', partName:'Cable Duct 40x40', partCode:'MIA-EL-012', maker:'Panduit', unit:'MTR', partType:'electrical', type:'OUT', qty:5, before:30, after:25, requestorNik:'NIK003', requestor:'Candra Putra', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Panel Wiring', date:'2026-05-13', time:'11:00' },
  { id:'m11', partId:'21', partName:'Spring Compression 20x40', partCode:'MIA-ME-009', maker:'Misumi', unit:'PCS', partType:'mechanical', type:'IN', qty:10, before:20, after:30, requestorNik:'NIK002', requestor:'Budi Santoso', inputer:'ADM002', inputerName:'Budi Santoso', project:'', date:'2026-05-13', time:'10:30' },
  { id:'m12', partId:'5',  partName:'Terminal Block 4mm²', partCode:'MIA-EL-005', maker:'Phoenix Contact', unit:'PCS', partType:'electrical', type:'OUT', qty:8, before:13, after:5, requestorNik:'NIK004', requestor:'Dimas Pratama', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Panel Assembly', date:'2026-05-12', time:'16:00' },
  { id:'m13', partId:'16', partName:'Cylinder SC 40x100', partCode:'MIA-ME-004', maker:'SMC', unit:'PCS', partType:'mechanical', type:'OUT', qty:1, before:4, after:3, requestorNik:'NIK003', requestor:'Candra Putra', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Jig Assembly', date:'2026-05-12', time:'14:20' },
  { id:'m14', partId:'24', partName:'Plate Aluminium A5052 3mm', partCode:'MIA-FA-002', maker:'Local', unit:'LBR', partType:'fabrication', type:'IN', qty:5, before:5, after:10, requestorNik:'NIK004', requestor:'Dimas Pratama', inputer:'ADM003', inputerName:'Dimas Pratama', project:'', date:'2026-05-12', time:'10:00' },
  { id:'m15', partId:'8',  partName:'Power Supply 24V 5A', partCode:'MIA-EL-008', maker:'Mean Well', unit:'PCS', partType:'electrical', type:'OUT', qty:1, before:5, after:4, requestorNik:'NIK005', requestor:'Eko Wibowo', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Line 4 Install', date:'2026-05-12', time:'09:15' },
  { id:'m16', partId:'7',  partName:'MCB 16A 1P', partCode:'MIA-EL-007', maker:'Schneider', unit:'PCS', partType:'electrical', type:'IN', qty:10, before:8, after:18, requestorNik:'NIK001', requestor:'Aldi Nugroho', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'', date:'2026-05-11', time:'14:30' },
  { id:'m17', partId:'17', partName:'Belt Timing HTD 5M-450', partCode:'MIA-ME-005', maker:'Gates', unit:'PCS', partType:'mechanical', type:'OUT', qty:2, before:3, after:1, requestorNik:'NIK002', requestor:'Budi Santoso', inputer:'ADM002', inputerName:'Budi Santoso', project:'Line 2 PM', date:'2026-05-11', time:'11:00' },
  { id:'m18', partId:'26', partName:'Bracket Custom L-Type', partCode:'MIA-FA-004', maker:'Custom', unit:'PCS', partType:'fabrication', type:'IN', qty:8, before:4, after:12, requestorNik:'NIK003', requestor:'Candra Putra', inputer:'ADM003', inputerName:'Candra Putra', project:'', date:'2026-05-10', time:'16:00' },
  { id:'m19', partId:'9',  partName:'Inverter 1.5kW FR-D720', partCode:'MIA-EL-009', maker:'Mitsubishi', unit:'PCS', partType:'electrical', type:'OUT', qty:1, before:3, after:2, requestorNik:'NIK004', requestor:'Dimas Pratama', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Line 1 Upgrade', date:'2026-05-10', time:'10:30' },
  { id:'m20', partId:'1',  partName:'Fuse 10A 250V', partCode:'MIA-EL-001', maker:'Bussmann', unit:'PCS', partType:'electrical', type:'OUT', qty:5, before:5, after:0, requestorNik:'NIK004', requestor:'Dimas Pratama', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Line 1 Repair', date:'2026-05-10', time:'14:20' },
  { id:'m21', partId:'1',  partName:'Fuse 10A 250V', partCode:'MIA-EL-001', maker:'Bussmann', unit:'PCS', partType:'electrical', type:'OUT', qty:3, before:8, after:5, requestorNik:'NIK005', requestor:'Eko Wibowo', inputer:'ADM002', inputerName:'Budi Santoso', project:'Line 2 PM', date:'2026-05-05', time:'09:15' },
  { id:'m22', partId:'18', partName:'Coupling Jaw L-100', partCode:'MIA-ME-006', maker:'Lovejoy', unit:'PCS', partType:'mechanical', type:'IN', qty:3, before:1, after:4, requestorNik:'NIK002', requestor:'Budi Santoso', inputer:'ADM002', inputerName:'Budi Santoso', project:'', date:'2026-05-09', time:'13:40' },
  { id:'m23', partId:'10', partName:'Timer Relay H3CR-A', partCode:'MIA-EL-010', maker:'Omron', unit:'PCS', partType:'electrical', type:'IN', qty:4, before:2, after:6, requestorNik:'NIK001', requestor:'Aldi Nugroho', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'', date:'2026-05-09', time:'09:00' },
  { id:'m24', partId:'25', partName:'Rod Stainless SUS304 Ø10', partCode:'MIA-FA-003', maker:'Local', unit:'BTG', partType:'fabrication', type:'OUT', qty:2, before:8, after:6, requestorNik:'NIK003', requestor:'Candra Putra', inputer:'ADM003', inputerName:'Candra Putra', project:'Jig Fabrication', date:'2026-05-08', time:'15:30' },
  { id:'m25', partId:'11', partName:'Photoelectric Sensor PQ-RD21', partCode:'MIA-EL-011', maker:'Keyence', unit:'PCS', partType:'electrical', type:'OUT', qty:2, before:2, after:0, requestorNik:'NIK005', requestor:'Eko Wibowo', inputer:'ADM001', inputerName:'Aldi Nugroho', project:'Line 3 Sensor Replace', date:'2026-05-08', time:'10:00' },
];

// ─── Filters ─────────────────────────────────────────────────────────────────

const SM_TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'IN', label: 'Stock IN' },
  { value: 'OUT', label: 'Stock OUT' },
];

const PART_TYPE_FILTERS = [
  { value: 'all', label: 'All Part Types' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'fabrication', label: 'Fabrication' },
];

function parseDateStr(d) {
  const parts = d.split('-');
  return new Date(+parts[0], +parts[1] - 1, +parts[2]);
}

function filterByCalendar(items, from, to) {
  if (!from && !to) return items;
  return items.filter(m => {
    const d = parseDateStr(m.date);
    if (from) { const f = parseDateStr(from); f.setHours(0,0,0,0); if (d < f) return false; }
    if (to)   { const t = parseDateStr(to);   t.setHours(23,59,59,999); if (d > t) return false; }
    return true;
  });
}

// ─── Stock IN/OUT Sheet ──────────────────────────────────────────────────────

function StockSheet({ mode, onClose }) {
  const [scanValue, setScanValue] = smUs('');
  const [foundPart, setFoundPart] = smUs(null);
  const [qty, setQty] = smUs('');
  const [requestorNik, setRequestorNik] = smUs('');
  const [resolvedRequestor, setResolvedRequestor] = smUs(null);
  const [nikError, setNikError] = smUs(false);
  const [project, setProject] = smUs('');
  const [submitted, setSubmitted] = smUs(false);
  const [notFound, setNotFound] = smUs(false);
  const inputRef = smUr(null);

  smUe(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  // Auto-lookup NIK
  smUe(() => {
    if (!requestorNik.trim()) { setResolvedRequestor(null); setNikError(false); return; }
    const found = lookupNIK(requestorNik);
    if (found) { setResolvedRequestor(found); setNikError(false); }
    else { setResolvedRequestor(null); setNikError(requestorNik.trim().length >= 4); }
  }, [requestorNik]);

  const isIN = mode === 'IN';
  const accentColor = isIN ? 'var(--chart-2)' : 'var(--chart-4)';
  const label = isIN ? 'Stock IN' : 'Stock OUT';

  const handleScan = () => {
    if (!scanValue.trim()) return;
    const s = scanValue.trim().toLowerCase();
    const isNum = /^\d+$/.test(s);
    const part = PARTS_DATA.find(p => {
      if (p.status !== 'active') return false;
      if (isNum) return (p.barcode || '') === s;
      return p.partCode.toLowerCase() === s;
    });
    if (part) { setFoundPart(part); setNotFound(false); }
    else { setFoundPart(null); setNotFound(true); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleScan(); };

  const qtyNum = parseInt(qty) || 0;
  const previewAfter = foundPart ? (isIN ? foundPart.curStock + qtyNum : foundPart.curStock - qtyNum) : 0;
  const outExceeds = !isIN && foundPart && qtyNum > foundPart.curStock;
  const canSubmit = foundPart && qtyNum > 0 && resolvedRequestor && !outExceeds;

  const handleSubmit = () => { if (!canSubmit) return; setSubmitted(true); };
  const handleReset = () => {
    setScanValue(''); setFoundPart(null); setQty('');
    setRequestorNik(''); setResolvedRequestor(null); setNikError(false);
    setProject(''); setSubmitted(false); setNotFound(false);
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet sheet--right" style={{ width: 420 }}>
        <div className="sheet-header">
          <h3 className="sheet-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            {isIN ? <Icons.ArrowUp size={18} style={{ color: accentColor }} /> : <Icons.ArrowDown size={18} style={{ color: accentColor }} />}
            <span>{label}</span>
          </h3>
          <button className="icon-btn" onClick={onClose}><Icons.X size={16} /></button>
        </div>
        <div className="sheet-body" style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {submitted ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Transaction Successful</div>
              <div style={{ fontSize:13, color:'var(--muted-foreground)', marginBottom:6 }}>
                {label}: <strong>{foundPart?.partName}</strong>
              </div>
              <div className="sm-preview" style={{ borderLeftColor: accentColor, justifyContent:'center', margin:'12px 0 20px' }}>
                <span className="mono" style={{ fontWeight:600 }}>
                  {foundPart?.curStock} → {previewAfter} {foundPart?.unit}
                </span>
                <span className="mono" style={{ color: accentColor, fontWeight:700, fontSize:13 }}>
                  ({isIN ? '+' : '-'}{qtyNum})
                </span>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                <button className="mp-btn mp-btn--outline" onClick={handleReset}>New Transaction</button>
                <button className="mp-btn mp-btn--primary" onClick={onClose}>Done</button>
              </div>
            </div>
          ) : (
            <>
              {/* Scan field */}
              <div>
                <label className="sm-form-label">Scan / Search Part</label>
                <div style={{ display:'flex', gap:6 }}>
                  <div style={{ position:'relative', flex:1 }}>
                    <Icons.Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted-foreground)', pointerEvents:'none' }} />
                    <input ref={inputRef} type="text" className="sm-input" style={{ paddingLeft:32 }} placeholder="Barcode or Part Code..." value={scanValue} onChange={e => { setScanValue(e.target.value); setNotFound(false); }} onKeyDown={handleKeyDown} />
                  </div>
                  <button className="mp-btn mp-btn--primary" style={{ flexShrink:0 }} onClick={handleScan}>Search</button>
                </div>
                <div className="sm-form-hint">Number = barcode · Alphanumeric = Part Code</div>
                {notFound && <div className="sm-not-found">Part not found. Please check the barcode or part code.</div>}
              </div>

              {/* Part info */}
              {foundPart && (
                <div className="sm-part-info">
                  <div className="sm-part-info-header">
                    <span style={{ fontWeight:600, fontSize:14 }}>{foundPart.partName}</span>
                    <StatusBadge status={foundPart.stockStatus} />
                  </div>
                  <div className="sm-part-info-grid">
                    <div className="sm-part-info-row"><span className="sm-info-label">Part Code</span><span className="sm-info-value mono">{foundPart.partCode}</span></div>
                    <div className="sm-part-info-row"><span className="sm-info-label">Maker</span><span className="sm-info-value">{foundPart.maker}</span></div>
                    <div className="sm-part-info-row"><span className="sm-info-label">Unit</span><span className="sm-info-value">{foundPart.unit}</span></div>
                    <div className="sm-part-info-row"><span className="sm-info-label">Current Stock</span><span className="sm-info-value mono" style={{ fontWeight:600 }}>{foundPart.curStock} {foundPart.unit}</span></div>
                  </div>
                  {qtyNum > 0 && (
                    <div className="sm-preview" style={{ borderLeftColor: accentColor }}>
                      <span style={{ color:'var(--muted-foreground)', fontSize:12 }}>Preview:</span>
                      <span className="mono" style={{ fontWeight:600 }}>{foundPart.curStock} → {previewAfter} {foundPart.unit}</span>
                      <span className="mono" style={{ color: accentColor, fontWeight:700, fontSize:12 }}>({isIN ? '+' : '-'}{qtyNum})</span>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction fields */}
              {foundPart && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div>
                    <label className="sm-form-label">Quantity <span className="sm-required">*</span></label>
                    <input type="number" className="sm-input" placeholder="0" min="1" value={qty} onChange={e => setQty(e.target.value)} style={{ fontFamily:'var(--font-mono)' }} />
                    {outExceeds && <div className="sm-error">Quantity exceeds available stock ({foundPart.curStock} {foundPart.unit})</div>}
                  </div>
                  <div>
                    <label className="sm-form-label">NIK Requestor <span className="sm-required">*</span></label>
                    <input type="text" className="sm-input" style={{ fontFamily:'var(--font-mono)' }} placeholder="Masukkan NIK, contoh: NIK001" value={requestorNik} onChange={e => setRequestorNik(e.target.value)} />
                    {resolvedRequestor && (
                      <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'oklch(from var(--chart-2) l c h / 0.06)', borderRadius:8, border:'1px solid oklch(from var(--chart-2) l c h / 0.15)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--chart-2)', flexShrink:0 }}><path d="M20 6 9 17l-5-5"/></svg>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600 }}>{resolvedRequestor.name}</div>
                          <div style={{ fontSize:11, color:'var(--muted-foreground)' }}>{resolvedRequestor.dept} · {resolvedRequestor.nik}</div>
                        </div>
                      </div>
                    )}
                    {nikError && (
                      <div className="sm-error">NIK tidak ditemukan. Pastikan NIK yang dimasukkan benar.</div>
                    )}
                    <div className="sm-form-hint">Masukkan NIK karyawan (e.g. NIK001 – NIK007)</div>
                  </div>
                  <div>
                    <label className="sm-form-label">Inputer</label>
                    <input type="text" className="sm-input sm-input--disabled" value="Aldi Nugroho (ADM001)" disabled />
                  </div>
                  <div>
                    <label className="sm-form-label">Project</label>
                    <CreatableSelect value={project} onChange={setProject} options={PROJECT_LIST} placeholder="— Select project (optional) —" addLabel="Tambah project baru" />
                  </div>

                  <button
                    className="mp-btn mp-btn--primary"
                    style={{ width:'100%', justifyContent:'center', marginTop:8, height:44, background: canSubmit ? accentColor : 'var(--muted)', color: canSubmit ? 'white' : 'var(--muted-foreground)', opacity: canSubmit ? 1 : 0.7, pointerEvents: canSubmit ? 'auto' : 'none' }}
                    onClick={handleSubmit}
                  >
                    {isIN ? <><Icons.ArrowUp size={15} /> Confirm Stock IN</> : <><Icons.ArrowDown size={15} /> Confirm Stock OUT</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Small Dropdown (reused) ─────────────────────────────────────────────────

function SmDropdown({ value, options, onChange, icon: IconComp }) {
  const [open, setOpen] = smUs(false);
  const ref = smUr(null);
  smUe(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const current = options.find(o => o.value === value);
  return (
    <div className="dropdown-wrap" ref={ref}>
      <button className="mp-filter-btn" onClick={() => setOpen(o => !o)} style={{ gap:6 }}>
        {IconComp && <IconComp size={14} />}
        <span>{current?.label || value}</span>
        <Icons.ChevronDown size={13} style={{ color:'var(--muted-foreground)' }} />
      </button>
      {open && (
        <div className="dropdown-menu" style={{ minWidth:160 }}>
          {options.map(o => (
            <button key={o.value} className={`dropdown-item${o.value === value ? ' dropdown-item--active' : ''}`} onClick={() => { onChange(o.value); setOpen(false); }}>{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Export Dialog ────────────────────────────────────────────────────────────

function SmExportDialog({ open, onClose, filtered, dateFrom, dateTo }) {
  const [format, setFormat] = smUs('xlsx');
  const [exported, setExported] = smUs(false);

  if (!open) return null;

  const handleExport = () => { setTimeout(() => setExported(true), 600); };
  const handleClose = () => { setExported(false); onClose(); };

  const rangeLabel = dateFrom && dateTo
    ? `${fmtDate(dateFrom)} — ${fmtDate(dateTo)}`
    : dateFrom ? `Dari ${fmtDate(dateFrom)}`
    : dateTo ? `Sampai ${fmtDate(dateTo)}`
    : 'Semua tanggal';

  return (
    <>
      <div className="sheet-overlay" onClick={handleClose} />
      <div className="um-dialog" style={{ maxWidth:400 }}>
        <div className="um-dialog-header">
          <h3 className="um-dialog-title">{exported ? 'Export Berhasil' : 'Export Stock Movement'}</h3>
          <button className="icon-btn" onClick={handleClose}><Icons.X size={16} /></button>
        </div>
        <div className="um-dialog-body">
          {exported ? (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📥</div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>File siap diunduh</div>
              <div style={{ fontSize:13, color:'var(--muted-foreground)' }}>
                stock-movement-export.{format} — {filtered.length} transaksi
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:13, color:'var(--muted-foreground)', marginBottom:6 }}>Data yang akan di-export:</div>
                <div className="sm-summary-strip" style={{ flexWrap:'wrap', gap:8 }}>
                  <div className="sm-summary-item"><span className="sm-summary-label">Transactions</span><span className="sm-summary-value mono">{filtered.length}</span></div>
                  <div className="sm-summary-divider" />
                  <div className="sm-summary-item"><span className="sm-summary-label">Period</span><span className="sm-summary-value" style={{ fontSize:12 }}>{rangeLabel}</span></div>
                </div>
              </div>
              <div className="um-field">
                <label className="sm-form-label">Format</label>
                <div className="um-role-select">
                  <button className={`um-role-opt${format === 'xlsx' ? ' um-role-opt--active' : ''}`} onClick={() => setFormat('xlsx')}>.xlsx</button>
                  <button className={`um-role-opt${format === 'csv' ? ' um-role-opt--active' : ''}`} onClick={() => setFormat('csv')}>.csv</button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="um-dialog-footer">
          {exported ? (
            <button className="mp-btn mp-btn--primary" onClick={handleClose}>Selesai</button>
          ) : (
            <>
              <button className="mp-btn mp-btn--outline" onClick={handleClose}>Batal</button>
              <button className="mp-btn mp-btn--primary" onClick={handleExport}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Export {filtered.length} Transaksi
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Format date ─────────────────────────────────────────────────────────────

function fmtDate(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m, day] = d.split('-');
  return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
}

// ─── Stock Movement Page ─────────────────────────────────────────────────────

function StockMovementPage({ onNavigate, isAdmin }) {
  const [search, setSearch] = smUs('');
  const [dateFrom, setDateFrom] = smUs('');
  const [dateTo, setDateTo] = smUs('');
  const [typeFilter, setTypeFilter] = smUs('all');
  const [partTypeFilter, setPartTypeFilter] = smUs('all');
  const [page, setPage] = smUs(1);
  const pageSize = 15;
  const [sheetMode, setSheetMode] = smUs(null);
  const [exportOpen, setExportOpen] = smUs(false);

  const filtered = smUm(() => {
    let items = [...MOVEMENT_DATA];
    items = filterByCalendar(items, dateFrom, dateTo);
    if (typeFilter !== 'all') items = items.filter(m => m.type === typeFilter);
    if (partTypeFilter !== 'all') items = items.filter(m => m.partType === partTypeFilter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      items = items.filter(m => m.partName.toLowerCase().includes(s) || m.partCode.toLowerCase().includes(s) || m.requestor.toLowerCase().includes(s) || (m.requestorNik || '').toLowerCase().includes(s) || (m.project || '').toLowerCase().includes(s));
    }
    return items;
  }, [search, dateFrom, dateTo, typeFilter, partTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  smUe(() => { setPage(1); }, [search, dateFrom, dateTo, typeFilter, partTypeFilter]);

  const summaryIN = filtered.filter(m => m.type === 'IN').reduce((s, m) => s + m.qty, 0);
  const summaryOUT = filtered.filter(m => m.type === 'OUT').reduce((s, m) => s + m.qty, 0);
  const countIN = filtered.filter(m => m.type === 'IN').length;
  const countOUT = filtered.filter(m => m.type === 'OUT').length;

  const CalendarIcon = (p) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );

  const hasDateFilter = dateFrom || dateTo;

  const cols = [
    { key:'date', label:'Date', w:110, mono:true },
    { key:'time', label:'Time', w:70, mono:true },
    { key:'partName', label:'Part Name', w:180 },
    { key:'partCode', label:'Part Code', w:115, mono:true },
    { key:'partType', label:'Type', w:90 },
    { key:'in', label:'IN', w:66, mono:true, align:'right' },
    { key:'out', label:'OUT', w:66, mono:true, align:'right' },
    { key:'after', label:'Final Stock', w:75, mono:true, align:'right' },
    { key:'requestor', label:'Requestor', w:140 },
    { key:'inputer', label:'Inputer', w:100 },
    { key:'project', label:'Project', w:150 },
  ];

  return (
    <div className="mp-page">
      {/* Toolbar */}
      <div className="mp-toolbar">
        <div className="mp-toolbar-left" style={{ flexWrap:'wrap' }}>
          <div className="mp-search">
            <Icons.Search size={15} className="mp-search-icon" />
            <input type="text" placeholder="Search part, NIK, requestor, project..." value={search} onChange={e => setSearch(e.target.value)} className="mp-search-input" />
            {search && <button className="mp-search-clear" onClick={() => setSearch('')}>×</button>}
          </div>
          <SmDropdown value={typeFilter} options={SM_TYPE_FILTERS} onChange={setTypeFilter} icon={Icons.ArrowUpDown} />
          <SmDropdown value={partTypeFilter} options={PART_TYPE_FILTERS} onChange={setPartTypeFilter} />
        </div>
        {isAdmin && (
          <div className="mp-toolbar-right">
            <button className="mp-btn mp-btn--outline" onClick={() => setExportOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export
            </button>
            <button className="mp-btn sm-btn--stock-in" onClick={() => setSheetMode('IN')}><Icons.ArrowUp size={14} /> Stock IN</button>
            <button className="mp-btn sm-btn--stock-out" onClick={() => setSheetMode('OUT')}><Icons.ArrowDown size={14} /> Stock OUT</button>
          </div>
        )}
      </div>

      {/* Calendar date range */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <CalendarIcon size={15} />
        <span style={{ fontSize:12.5, fontWeight:500, color:'var(--muted-foreground)' }}>Periode:</span>
        <input type="date" className="sm-input" style={{ width:150, height:32, fontSize:12, fontFamily:'var(--font-mono)' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>s/d</span>
        <input type="date" className="sm-input" style={{ width:150, height:32, fontSize:12, fontFamily:'var(--font-mono)' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        {hasDateFilter && (
          <button className="text-btn text-btn--sm" onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ fontSize:12 }}>Reset tanggal</button>
        )}
      </div>

      {/* Summary */}
      <div className="sm-summary-strip">
        <div className="sm-summary-item"><span className="sm-summary-label">Total Transactions</span><span className="sm-summary-value mono">{filtered.length}</span></div>
        <div className="sm-summary-divider" />
        <div className="sm-summary-item"><span className="sm-summary-dot" style={{ background:'var(--chart-2)' }} /><span className="sm-summary-label">IN</span><span className="sm-summary-value mono" style={{ color:'var(--chart-2)' }}>{countIN} <span className="sm-summary-sub">(+{summaryIN})</span></span></div>
        <div className="sm-summary-divider" />
        <div className="sm-summary-item"><span className="sm-summary-dot" style={{ background:'var(--chart-4)' }} /><span className="sm-summary-label">OUT</span><span className="sm-summary-value mono" style={{ color:'var(--chart-4)' }}>{countOUT} <span className="sm-summary-sub">(-{summaryOUT})</span></span></div>
      </div>

      {/* Table */}
      <div className="mp-table-wrap">
        <table className="mp-table sm-table">
          <thead><tr>{cols.map(c => <th key={c.key} style={{ width:c.w, minWidth:c.w, textAlign:c.align||'left' }}>{c.label}</th>)}</tr></thead>
          <tbody>
            {paginated.length === 0 && <tr><td colSpan={cols.length} className="mp-empty">No transactions match the current filters.</td></tr>}
            {paginated.map(m => (
              <tr key={m.id} className="mp-row">
                <td className="mono sm-date-cell">{fmtDate(m.date)}</td>
                <td className="mono sm-time-cell">{m.time}</td>
                <td><button className="mp-part-link" onClick={() => onNavigate('parts')}>{m.partName}</button></td>
                <td className="mono">{m.partCode}</td>
                <td><TypeBadge type={m.partType} /></td>
                <td className="mono" style={{ textAlign:'right' }}>{m.type === 'IN' && <span className="sm-qty-in">+{m.qty}</span>}</td>
                <td className="mono" style={{ textAlign:'right' }}>{m.type === 'OUT' && <span className="sm-qty-out">-{m.qty}</span>}</td>
                <td className="mono" style={{ textAlign:'right', fontWeight:500 }}>{m.after}</td>
                <td>
                  <div style={{ fontSize:12.5 }}>{m.requestor}</div>
                  <div className="mono" style={{ fontSize:10.5, color:'var(--muted-foreground)' }}>{m.requestorNik}</div>
                </td>
                <td className="sm-inputer-cell">{m.inputerName?.split(' ')[0]}</td>
                <td className="sm-project-cell">{m.project || <span style={{ color:'var(--muted-foreground)' }}>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />}
      {filtered.length > 0 && totalPages <= 1 && (
        <div className="pagination"><span className="pagination-info">Showing <strong>{filtered.length}</strong> transactions</span></div>
      )}

      {/* Stock IN/OUT Sheet */}
      {sheetMode && <StockSheet mode={sheetMode} onClose={() => setSheetMode(null)} />}

      {/* Export Dialog */}
      <SmExportDialog open={exportOpen} onClose={() => setExportOpen(false)} filtered={filtered} dateFrom={dateFrom} dateTo={dateTo} />
    </div>
  );
}

Object.assign(window, { StockMovementPage, MOVEMENT_DATA });
