// components/master-part.jsx — Master Part page: table, dropdown filters, forms

const { useState: _us, useEffect: _ue, useMemo: _um, useRef: _ur } = React;

// ─── Status / Type badge helpers ──────────────────────────────────────────────

// ─── Shared mutable lists (extendable via CreatableSelect) ────────────────────
const UNIT_LIST = ['PCS', 'SET', 'MTR', 'KG', 'LBR', 'BTG', 'ROL', 'PAK'];
const PROJECT_LIST = ['Line 1 Repair', 'Line 1 Upgrade', 'Line 2 PM', 'Line 3 Maintenance', 'Line 3 Sensor Replace', 'Line 4 Install', 'Jig Assembly', 'Jig Fabrication', 'Panel Assembly', 'Panel Wiring', 'Workshop Cleaning'];

// ─── CreatableSelect — dropdown with "Tambah baru" ───────────────────────────

function CreatableSelect({ value, onChange, options, placeholder, addLabel, style }) {
  const [open, setOpen] = _us(false);
  const [adding, setAdding] = _us(false);
  const [newVal, setNewVal] = _us('');
  const ref = _ur(null);
  const inputRef = _ur(null);

  _ue(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setAdding(false); setNewVal(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  _ue(() => { if (adding && inputRef.current) inputRef.current.focus(); }, [adding]);

  const handleAdd = () => {
    const trimmed = newVal.trim().toUpperCase();
    if (trimmed && !options.includes(trimmed)) {
      options.push(trimmed);
    }
    if (trimmed) onChange(trimmed);
    setNewVal(''); setAdding(false); setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
    if (e.key === 'Escape') { setAdding(false); setNewVal(''); }
  };

  return (
    <div className="dropdown-wrap" ref={ref} style={{ position:'relative', ...style }}>
      <button
        type="button"
        className="sm-input sm-select"
        style={{ textAlign:'left', display:'flex', alignItems:'center', cursor:'pointer', color: value ? 'var(--foreground)' : 'var(--muted-foreground)' }}
        onClick={() => { setOpen(o => !o); setAdding(false); }}
      >
        {value || placeholder || 'Pilih...'}
      </button>
      {open && (
        <div className="dropdown-menu" style={{ minWidth:'100%', maxHeight:220, overflowY:'auto', padding:4, top:'calc(100% + 4px)', left:0, right:0 }}>
          {placeholder && (
            <button className={`dropdown-item${!value ? ' dropdown-item--active' : ''}`} style={{ fontSize:12.5 }} onClick={() => { onChange(''); setOpen(false); }}>
              <span style={{ color:'var(--muted-foreground)' }}>{placeholder}</span>
            </button>
          )}
          {options.map(o => (
            <button key={o} className={`dropdown-item${o === value ? ' dropdown-item--active' : ''}`} style={{ fontSize:12.5 }} onClick={() => { onChange(o); setOpen(false); }}>
              {o}
            </button>
          ))}
          <div className="dropdown-divider" />
          {adding ? (
            <div style={{ padding:'4px 6px', display:'flex', gap:4 }}>
              <input
                ref={inputRef}
                type="text"
                className="sm-input"
                style={{ height:30, fontSize:12, padding:'0 8px' }}
                placeholder="Ketik baru..."
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="mp-btn mp-btn--primary"
                style={{ height:30, padding:'0 10px', fontSize:11, flexShrink:0 }}
                onClick={handleAdd}
              >OK</button>
            </div>
          ) : (
            <button className="dropdown-item" style={{ fontSize:12.5, color:'var(--primary)', fontWeight:500 }} onClick={() => setAdding(true)}>
              <Icons.Plus size={13} />
              <span>{addLabel || 'Tambah baru'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Status / Type badge helpers (continued) ──────────────────────────────────

const STATUS_MAP = {
  available:    { label:'Available',     cls:'st-badge--avail'    },
  low_stock:    { label:'Low Stock',     cls:'st-badge--low'      },
  out_of_stock: { label:'Out of Stock',  cls:'st-badge--out'      },
  unassigned:   { label:'Unassigned',    cls:'st-badge--unassign' },
  inactive:     { label:'Inactive',      cls:'st-badge--inactive' },
};
const TYPE_MAP = {
  electrical:  { label:'Electrical',  cls:'tp-badge--el' },
  mechanical:  { label:'Mechanical',  cls:'tp-badge--me' },
  fabrication: { label:'Fabrication', cls:'tp-badge--fa' },
};
function StatusBadge({ status }) {
  const m = STATUS_MAP[status];
  return m ? <span className={`st-badge ${m.cls}`}>{m.label}</span> : null;
}
function TypeBadge({ type }) {
  const m = TYPE_MAP[type];
  return m ? <span className={`tp-badge ${m.cls}`}>{m.label}</span> : null;
}

// ─── Reusable Filter Dropdown ─────────────────────────────────────────────────

function FilterDropdown({ label, icon, options, selected, onChange }) {
  const [open, setOpen] = _us(false);
  const ref = _ur(null);
  _ue(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = (val) => {
    const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val];
    onChange(next);
  };

  const hasActive = selected.length > 0;

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button
        className={`mp-filter-btn${hasActive ? ' mp-filter-btn--active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {icon}
        <span>{label}</span>
        {hasActive && <span className="mp-filter-count">{selected.length}</span>}
        <Icons.ChevronDown size={13} style={{ color: 'var(--muted-foreground)', marginLeft: -2 }} />
      </button>
      {open && (
        <div className="dropdown-menu" style={{ minWidth: 190, maxHeight: 300, overflowY: 'auto', padding: '6px' }}>
          {selected.length > 0 && (
            <>
              <button className="dropdown-item" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }} onClick={() => { onChange([]); }}>
                Reset filter
              </button>
              <div className="dropdown-divider" />
            </>
          )}
          {options.map(o => {
            const checked = selected.includes(o.value);
            return (
              <label key={o.value} className={`filter-check${checked ? ' filter-check--on' : ''}`} style={{ borderRadius: 6 }}>
                <input type="checkbox" checked={checked} onChange={() => toggle(o.value)} />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────

function SortDropdown({ sort, onSort }) {
  const [open, setOpen] = _us(false);
  const ref = _ur(null);
  _ue(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const sortOptions = [
    { key: 'partName', label: 'Part Name' },
    { key: 'partCode', label: 'Part Code' },
    { key: 'maker', label: 'Maker' },
    { key: 'curStock', label: 'Stock' },
    { key: 'updatedAt', label: 'Updated At' },
  ];
  const current = sortOptions.find(o => o.key === sort.key);

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button className="mp-filter-btn" onClick={() => setOpen(o => !o)}>
        <Icons.ArrowUpDown size={14} />
        <span>{current?.label || 'Sort'}</span>
        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>
        <Icons.ChevronDown size={13} style={{ color: 'var(--muted-foreground)', marginLeft: -2 }} />
      </button>
      {open && (
        <div className="dropdown-menu" style={{ minWidth: 170 }}>
          {sortOptions.map(o => (
            <button
              key={o.key}
              className={`dropdown-item${sort.key === o.key ? ' dropdown-item--active' : ''}`}
              onClick={() => {
                onSort(prev => prev.key === o.key
                  ? { key: o.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                  : { key: o.key, dir: 'asc' });
                setOpen(false);
              }}
            >
              <span>{o.label}</span>
              {sort.key === o.key && <span style={{ marginLeft: 'auto', fontSize: 12 }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tambah Part Form (3-step Sheet) ──────────────────────────────────────────

function TambahPartSheet({ open, onClose }) {
  const [step, setStep] = _us(1);
  const [form, setForm] = _us({
    partName: '', partCode: '', maker: '', type: 'electrical', category: '', unit: 'PCS',
    description: '', remarks: '', price: '',
    minStock: '', stdStock: '', maxStock: '', initialStock: '',
    storageType: '', storageNumber: '', storageBox: '', storageBoxKecil: '',
  });
  const [submitted, setSubmitted] = _us(false);

  if (!open) return null;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const TYPES = [
    { value: 'electrical', label: 'Electrical' },
    { value: 'mechanical', label: 'Mechanical' },
    { value: 'fabrication', label: 'Fabrication' },
  ];

  const canStep2 = form.partName && form.partCode && form.maker && form.category && form.unit;
  const canStep3 = true;

  const genBarcode = () => {
    if (!form.storageType || !form.storageNumber || !form.storageBox || !form.storageBoxKecil) return '—';
    const tn = form.storageType.charCodeAt(0) - 64;
    return `${tn}${form.storageNumber}${String(form.storageBox).padStart(2,'0')}${String(form.storageBoxKecil).padStart(3,'0')}`;
  };

  // Storage redundancy check
  const storageAddr = form.storageType && form.storageNumber && form.storageBox && form.storageBoxKecil
    ? `${form.storageType}-${form.storageNumber}-${String(form.storageBox).padStart(2,'0')}-${String(form.storageBoxKecil).padStart(3,'0')}`
    : null;
  const storageConflict = storageAddr ? isStorageInUse(storageAddr) : false;
  const barcodeVal = genBarcode();
  const barcodeConflict = barcodeVal !== '—' ? isBarcodeInUse(barcodeVal) : false;
  const hasConflict = storageConflict || barcodeConflict;

  const handleSubmit = () => { if (hasConflict) return; setSubmitted(true); };
  const handleReset = () => {
    setStep(1); setSubmitted(false);
    setForm({ partName:'', partCode:'', maker:'', type:'electrical', category:'', unit:'PCS', description:'', remarks:'', price:'', minStock:'', stdStock:'', maxStock:'', initialStock:'', storageType:'', storageNumber:'', storageBox:'', storageBoxKecil:'' });
  };

  const stepLabels = ['Identitas Part', 'Lokasi & Stok', 'Preview'];

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet sheet--right" style={{ width: 480 }}>
        <div className="sheet-header">
          <h3 className="sheet-title">Tambah Part Baru</h3>
          <button className="icon-btn" onClick={onClose}><Icons.X size={16} /></button>
        </div>

        {/* Step indicator */}
        <div className="tp-steps">
          {stepLabels.map((lbl, i) => (
            <div key={i} className={`tp-step${step === i+1 ? ' tp-step--active' : ''}${step > i+1 ? ' tp-step--done' : ''}`}>
              <div className="tp-step-num">{step > i+1 ? '✓' : i+1}</div>
              <span className="tp-step-label">{lbl}</span>
            </div>
          ))}
        </div>

        <div className="sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Part Berhasil Ditambahkan</div>
              <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20 }}>
                <strong>{form.partName}</strong> ({form.partCode})
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="mp-btn mp-btn--outline" onClick={handleReset}>Tambah Lagi</button>
                <button className="mp-btn mp-btn--primary" onClick={onClose}>Selesai</button>
              </div>
            </div>
          ) : step === 1 ? (
            <>
              <div className="um-field">
                <label className="sm-form-label">Part Name <span className="sm-required">*</span></label>
                <input className="sm-input" placeholder="Nama part..." value={form.partName} onChange={e => set('partName', e.target.value)} />
              </div>
              <div className="um-field">
                <label className="sm-form-label">Part Code <span className="sm-required">*</span></label>
                <input className="sm-input" style={{ fontFamily:'var(--font-mono)' }} placeholder="MIA-EL-XXX" value={form.partCode} onChange={e => set('partCode', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="um-field">
                  <label className="sm-form-label">Maker <span className="sm-required">*</span></label>
                  <input className="sm-input" placeholder="Manufacturer" value={form.maker} onChange={e => set('maker', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Type <span className="sm-required">*</span></label>
                  <select className="sm-input sm-select" value={form.type} onChange={e => set('type', e.target.value)}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="um-field">
                  <label className="sm-form-label">Category <span className="sm-required">*</span></label>
                  <input className="sm-input" placeholder="e.g. Sensor, Relay..." value={form.category} onChange={e => set('category', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Unit <span className="sm-required">*</span></label>
                  <CreatableSelect value={form.unit} onChange={v => set('unit', v)} options={UNIT_LIST} addLabel="Tambah unit baru" />
                </div>
              </div>
              <div className="um-field">
                <label className="sm-form-label">Description</label>
                <textarea className="sm-input" style={{ height: 60, paddingTop: 8, resize: 'vertical' }} placeholder="Deskripsi opsional..." value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="um-field">
                <label className="sm-form-label">Price per Unit <span className="sm-required">*</span></label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--muted-foreground)', fontWeight:500 }}>Rp</span>
                  <input className="sm-input" type="number" min="0" style={{ fontFamily:'var(--font-mono)', paddingLeft:34 }} placeholder="0" value={form.price} onChange={e => set('price', e.target.value)} />
                </div>
              </div>
              <div className="um-field">
                <label className="sm-form-label">Remarks</label>
                <input className="sm-input" placeholder="Catatan opsional..." value={form.remarks} onChange={e => set('remarks', e.target.value)} />
              </div>
            </>
          ) : step === 2 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: -4 }}>Stock Thresholds</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                <div className="um-field">
                  <label className="sm-form-label">Min <span className="sm-required">*</span></label>
                  <input className="sm-input" type="number" min="0" style={{ fontFamily:'var(--font-mono)' }} value={form.minStock} onChange={e => set('minStock', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Std</label>
                  <input className="sm-input" type="number" min="0" style={{ fontFamily:'var(--font-mono)' }} value={form.stdStock} onChange={e => set('stdStock', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Max</label>
                  <input className="sm-input" type="number" min="0" style={{ fontFamily:'var(--font-mono)' }} value={form.maxStock} onChange={e => set('maxStock', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Initial</label>
                  <input className="sm-input" type="number" min="0" style={{ fontFamily:'var(--font-mono)' }} value={form.initialStock} onChange={e => set('initialStock', e.target.value)} />
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8, marginBottom: -4 }}>Storage Location <span style={{ fontWeight: 400, color: 'var(--muted-foreground)', fontSize: 12 }}>(opsional)</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                <div className="um-field">
                  <label className="sm-form-label">Type</label>
                  <select className="sm-input sm-select" value={form.storageType} onChange={e => set('storageType', e.target.value)}>
                    <option value="">—</option>
                    {['A','B','C','D','E'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Number</label>
                  <input className="sm-input" type="number" min="1" style={{ fontFamily:'var(--font-mono)' }} value={form.storageNumber} onChange={e => set('storageNumber', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Box</label>
                  <input className="sm-input" type="number" min="1" style={{ fontFamily:'var(--font-mono)' }} value={form.storageBox} onChange={e => set('storageBox', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Box Kecil</label>
                  <input className="sm-input" type="number" min="1" style={{ fontFamily:'var(--font-mono)' }} value={form.storageBoxKecil} onChange={e => set('storageBoxKecil', e.target.value)} />
                </div>
              </div>
              {form.storageType && form.storageNumber && form.storageBox && form.storageBoxKecil && (
                <>
                  <div className="tp-barcode-preview">
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Barcode:</span>
                    <span className="mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>{genBarcode()}</span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                      {form.storageType}-{form.storageNumber}-{String(form.storageBox).padStart(2,'0')}-{String(form.storageBoxKecil).padStart(3,'0')}
                    </span>
                  </div>
                  {hasConflict && (
                    <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'10px 14px', background:'oklch(from var(--chart-4) l c h / 0.05)', borderRadius:8, border:'1px solid oklch(from var(--chart-4) l c h / 0.15)' }}>
                      <Icons.AlertTriangle size={16} style={{ color:'var(--chart-4)', flexShrink:0, marginTop:1 }} />
                      <div style={{ fontSize:12.5 }}>
                        <div style={{ fontWeight:600, color:'var(--chart-4)' }}>Storage sudah digunakan!</div>
                        <div style={{ color:'var(--muted-foreground)', marginTop:2 }}>Alamat <code className="mono" style={{ fontSize:11 }}>{storageAddr}</code> sedang digunakan oleh part aktif. Nonaktifkan part tersebut terlebih dahulu untuk membebaskan lokasi ini.</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* Step 3: Preview */
            <>
              <div className="tp-preview-card">
                <div className="tp-preview-title">Identitas Part</div>
                <div className="tp-preview-grid">
                  <div className="tp-preview-row"><span>Part Name</span><span style={{ fontWeight: 500 }}>{form.partName}</span></div>
                  <div className="tp-preview-row"><span>Part Code</span><span className="mono">{form.partCode}</span></div>
                  <div className="tp-preview-row"><span>Maker</span><span>{form.maker}</span></div>
                  <div className="tp-preview-row"><span>Type</span><span><TypeBadge type={form.type} /></span></div>
                  <div className="tp-preview-row"><span>Category</span><span>{form.category}</span></div>
                  <div className="tp-preview-row"><span>Unit</span><span>{form.unit}</span></div>
                  <div className="tp-preview-row"><span>Price</span><span className="mono">{form.price ? fmtPrice(Number(form.price)) : '—'}</span></div>
                  {form.description && <div className="tp-preview-row"><span>Description</span><span>{form.description}</span></div>}
                </div>
              </div>
              <div className="tp-preview-card">
                <div className="tp-preview-title">Stok & Lokasi</div>
                <div className="tp-preview-grid">
                  <div className="tp-preview-row"><span>Min / Std / Max</span><span className="mono">{form.minStock || 0} / {form.stdStock || '—'} / {form.maxStock || '—'}</span></div>
                  <div className="tp-preview-row"><span>Initial Stock</span><span className="mono">{form.initialStock || 0}</span></div>
                  <div className="tp-preview-row"><span>Storage</span><span className="mono">{form.storageType ? `${form.storageType}-${form.storageNumber}-${String(form.storageBox).padStart(2,'0')}-${String(form.storageBoxKecil).padStart(3,'0')}` : '— (Unassigned)'}</span></div>
                  {form.storageType && <div className="tp-preview-row"><span>Barcode</span><span className="mono" style={{ fontWeight: 600 }}>{genBarcode()}</span></div>}
                  <div className="tp-preview-row"><span>Status</span><span>{form.storageType ? <StatusBadge status="available" /> : <StatusBadge status="unassigned" />}</span></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer buttons */}
        {!submitted && (
          <div className="tp-footer">
            {step > 1 && <button className="mp-btn mp-btn--outline" onClick={() => setStep(s => s - 1)}>Kembali</button>}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
              <button
                className="mp-btn mp-btn--primary"
                style={{ opacity: (step === 1 && !canStep2) || (step === 2 && hasConflict) ? 0.5 : 1, pointerEvents: (step === 1 && !canStep2) || (step === 2 && hasConflict) ? 'none' : 'auto' }}
                onClick={() => setStep(s => s + 1)}
              >
                Lanjut
              </button>
            ) : (
              <button className="mp-btn mp-btn--primary" onClick={handleSubmit}>
                <Icons.Plus size={14} /> Simpan Part
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Import Dialog ────────────────────────────────────────────────────────────

function ImportDialog({ open, onClose }) {
  const [step, setStep] = _us('upload'); // 'upload' | 'preview' | 'result'
  const [fileName, setFileName] = _us('');
  const fileRef = _ur(null);

  if (!open) return null;

  const mockRows = [
    { code:'MIA-EL-101', name:'Capacitor 100uF', maker:'Nichicon', status:'ok' },
    { code:'MIA-EL-102', name:'Resistor 10K', maker:'Yageo', status:'ok' },
    { code:'MIA-EL-001', name:'Fuse 10A 250V', maker:'Bussmann', status:'skip' },
    { code:'MIA-ME-101', name:'Bearing 6206', maker:'NSK', status:'ok' },
    { code:'', name:'Unknown Part', maker:'', status:'error' },
  ];

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setTimeout(() => setStep('preview'), 500);
  };

  const handleImport = () => {
    setTimeout(() => setStep('result'), 800);
  };

  const handleReset = () => { setStep('upload'); setFileName(''); };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="um-dialog" style={{ maxWidth: 540 }}>
        <div className="um-dialog-header">
          <h3 className="um-dialog-title">
            {step === 'upload' && 'Import Part dari Excel'}
            {step === 'preview' && 'Preview Data Import'}
            {step === 'result' && 'Hasil Import'}
          </h3>
          <button className="icon-btn" onClick={onClose}><Icons.X size={16} /></button>
        </div>
        <div className="um-dialog-body">
          {step === 'upload' && (
            <div>
              <div
                className="ps-dropzone"
                style={{ maxWidth: '100%', padding: '32px 20px' }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => handleFile(e.target.files?.[0])} />
                <div className="ps-dropzone-icon" style={{ marginBottom: 10 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="ps-dropzone-title" style={{ fontSize: 14 }}>Drop file atau klik browse</div>
                <div className="ps-dropzone-sub">Format: .xlsx / .xls / .csv</div>
              </div>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button className="text-btn" style={{ fontSize: 13 }}>Download Template Import</button>
              </div>
            </div>
          )}
          {step === 'preview' && (
            <div>
              <div className="ps-file-bar" style={{ marginBottom: 12 }}>
                <div className="ps-file-info">
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{fileName}</span>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{mockRows.length} baris</span>
                </div>
                <button className="text-btn text-btn--sm" onClick={handleReset}>Ganti</button>
              </div>
              <div className="mp-table-wrap" style={{ maxHeight: 240, overflow: 'auto' }}>
                <table className="mp-table" style={{ fontSize: 12 }}>
                  <thead><tr>
                    <th style={{ width: 30 }}>No</th>
                    <th>Part Code</th><th>Part Name</th><th>Maker</th><th style={{ width: 80 }}>Status</th>
                  </tr></thead>
                  <tbody>
                    {mockRows.map((r, i) => (
                      <tr key={i} className="mp-row">
                        <td style={{ textAlign:'center' }}>{i+1}</td>
                        <td className="mono">{r.code || <span style={{ color:'var(--chart-4)' }}>—</span>}</td>
                        <td>{r.name}</td>
                        <td>{r.maker || '—'}</td>
                        <td>
                          {r.status === 'ok' && <span className="st-badge st-badge--avail" style={{ fontSize: 10 }}>Ready</span>}
                          {r.status === 'skip' && <span className="st-badge st-badge--low" style={{ fontSize: 10 }}>Duplikat</span>}
                          {r.status === 'error' && <span className="st-badge st-badge--out" style={{ fontSize: 10 }}>Error</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm-summary-strip" style={{ marginTop: 12 }}>
                <div className="sm-summary-item"><span className="sm-summary-dot" style={{ background:'var(--chart-2)' }} /><span className="sm-summary-label">Ready</span><span className="sm-summary-value mono">3</span></div>
                <div className="sm-summary-divider" />
                <div className="sm-summary-item"><span className="sm-summary-dot" style={{ background:'var(--chart-3)' }} /><span className="sm-summary-label">Skip</span><span className="sm-summary-value mono">1</span></div>
                <div className="sm-summary-divider" />
                <div className="sm-summary-item"><span className="sm-summary-dot" style={{ background:'var(--chart-4)' }} /><span className="sm-summary-label">Error</span><span className="sm-summary-value mono">1</span></div>
              </div>
            </div>
          )}
          {step === 'result' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Import Selesai</div>
              <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>
                3 part berhasil ditambahkan, 1 duplikat di-skip, 1 error.
              </div>
              <div className="sm-summary-strip" style={{ justifyContent: 'center' }}>
                <div className="sm-summary-item"><span className="sm-summary-dot" style={{ background:'var(--chart-2)' }} /><span className="sm-summary-label">Berhasil</span><span className="sm-summary-value mono" style={{ color:'var(--chart-2)' }}>3</span></div>
                <div className="sm-summary-divider" />
                <div className="sm-summary-item"><span className="sm-summary-dot" style={{ background:'var(--chart-3)' }} /><span className="sm-summary-label">Skip</span><span className="sm-summary-value mono">1</span></div>
                <div className="sm-summary-divider" />
                <div className="sm-summary-item"><span className="sm-summary-dot" style={{ background:'var(--chart-4)' }} /><span className="sm-summary-label">Error</span><span className="sm-summary-value mono">1</span></div>
              </div>
            </div>
          )}
        </div>
        <div className="um-dialog-footer">
          {step === 'upload' && <button className="mp-btn mp-btn--outline" onClick={onClose}>Batal</button>}
          {step === 'preview' && (
            <>
              <button className="mp-btn mp-btn--outline" onClick={handleReset}>Kembali</button>
              <button className="mp-btn mp-btn--primary" onClick={handleImport}>Import 3 Part</button>
            </>
          )}
          {step === 'result' && <button className="mp-btn mp-btn--primary" onClick={onClose}>Selesai</button>}
        </div>
      </div>
    </>
  );
}

// ─── Export Dialog ─────────────────────────────────────────────────────────────

function ExportDialog({ open, onClose, totalParts }) {
  const [format, setFormat] = _us('xlsx');
  const [exported, setExported] = _us(false);

  if (!open) return null;

  const handleExport = () => {
    setTimeout(() => setExported(true), 600);
  };

  const handleClose = () => { setExported(false); onClose(); };

  return (
    <>
      <div className="sheet-overlay" onClick={handleClose} />
      <div className="um-dialog" style={{ maxWidth: 380 }}>
        <div className="um-dialog-header">
          <h3 className="um-dialog-title">{exported ? 'Export Berhasil' : 'Export Master Part'}</h3>
          <button className="icon-btn" onClick={handleClose}><Icons.X size={16} /></button>
        </div>
        <div className="um-dialog-body">
          {exported ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📥</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>File siap diunduh</div>
              <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                master-parts-export.{format} — {totalParts} part
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 14 }}>
                Export seluruh data master part ({totalParts} part aktif) ke file spreadsheet.
              </p>
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
                Export
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Edit Part Sheet ──────────────────────────────────────────────────────────

function EditPartSheet({ part, open, onClose }) {
  const [form, setForm] = _us(null);
  _ue(() => {
    if (part && open) {
      setForm({
        partName: part.partName, partCode: part.partCode, maker: part.maker,
        type: part.type, category: part.category, unit: part.unit,
        description: '', remarks: '', price: String(part.price || ''),
        minStock: String(part.minStock), stdStock: String(part.stdStock), maxStock: String(part.maxStock),
      });
    }
  }, [part, open]);

  const [saved, setSaved] = _us(false);

  if (!open || !form) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const TYPES = [{ value:'electrical', label:'Electrical' },{ value:'mechanical', label:'Mechanical' },{ value:'fabrication', label:'Fabrication' }];

  const handleSave = () => { setSaved(true); };
  const handleClose = () => { setSaved(false); onClose(); };

  return (
    <>
      <div className="sheet-overlay" onClick={handleClose} />
      <div className="sheet sheet--right" style={{ width: 460 }}>
        <div className="sheet-header">
          <h3 className="sheet-title">Edit Part</h3>
          <button className="icon-btn" onClick={handleClose}><Icons.X size={16} /></button>
        </div>
        <div className="sheet-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {saved ? (
            <div style={{ textAlign:'center', padding:'36px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Part Berhasil Diperbarui</div>
              <div style={{ fontSize:13, color:'var(--muted-foreground)', marginBottom:20 }}>
                <strong>{form.partName}</strong> ({form.partCode})
              </div>
              <button className="mp-btn mp-btn--primary" onClick={handleClose}>Selesai</button>
            </div>
          ) : (
            <>
              <div className="tp-preview-card" style={{ padding:'10px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>{part.partCode}</span>
                  <StatusBadge status={part.stockStatus} />
                </div>
              </div>
              <div className="um-field">
                <label className="sm-form-label">Part Name <span className="sm-required">*</span></label>
                <input className="sm-input" value={form.partName} onChange={e => set('partName', e.target.value)} />
              </div>
              <div className="um-field">
                <label className="sm-form-label">Part Code <span className="sm-required">*</span></label>
                <input className="sm-input" style={{ fontFamily:'var(--font-mono)' }} value={form.partCode} onChange={e => set('partCode', e.target.value)} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="um-field">
                  <label className="sm-form-label">Maker <span className="sm-required">*</span></label>
                  <input className="sm-input" value={form.maker} onChange={e => set('maker', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Type</label>
                  <select className="sm-input sm-select" value={form.type} onChange={e => set('type', e.target.value)}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="um-field">
                  <label className="sm-form-label">Category</label>
                  <input className="sm-input" value={form.category} onChange={e => set('category', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Unit</label>
                  <CreatableSelect value={form.unit} onChange={v => set('unit', v)} options={UNIT_LIST} addLabel="Tambah unit baru" />
                </div>
              </div>
              <div className="um-field">
                <label className="sm-form-label">Price per Unit</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--muted-foreground)', fontWeight:500 }}>Rp</span>
                  <input className="sm-input" type="number" min="0" style={{ fontFamily:'var(--font-mono)', paddingLeft:34 }} value={form.price} onChange={e => set('price', e.target.value)} />
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:600, marginTop:4, marginBottom:-4 }}>Stock Thresholds</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <div className="um-field">
                  <label className="sm-form-label">Min</label>
                  <input className="sm-input" type="number" min="0" style={{ fontFamily:'var(--font-mono)' }} value={form.minStock} onChange={e => set('minStock', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Std</label>
                  <input className="sm-input" type="number" min="0" style={{ fontFamily:'var(--font-mono)' }} value={form.stdStock} onChange={e => set('stdStock', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Max</label>
                  <input className="sm-input" type="number" min="0" style={{ fontFamily:'var(--font-mono)' }} value={form.maxStock} onChange={e => set('maxStock', e.target.value)} />
                </div>
              </div>
              <div className="um-field">
                <label className="sm-form-label">Description</label>
                <textarea className="sm-input" style={{ height:52, paddingTop:8, resize:'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="um-field">
                <label className="sm-form-label">Remarks</label>
                <input className="sm-input" value={form.remarks} onChange={e => set('remarks', e.target.value)} />
              </div>
            </>
          )}
        </div>
        {!saved && (
          <div className="tp-footer">
            <button className="mp-btn mp-btn--outline" onClick={handleClose}>Batal</button>
            <div style={{ flex:1 }} />
            <button className="mp-btn mp-btn--primary" onClick={handleSave}>
              <Icons.Edit3 size={14} /> Simpan Perubahan
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Nonaktifkan Part Dialog ──────────────────────────────────────────────────

function DeactivatePartDialog({ part, open, onClose }) {
  const [done, setDone] = _us(false);
  if (!open || !part) return null;

  const handleConfirm = () => { setDone(true); };
  const handleClose = () => { setDone(false); onClose(); };

  return (
    <>
      <div className="sheet-overlay" onClick={handleClose} />
      <div className="um-dialog" style={{ maxWidth:400 }}>
        <div className="um-dialog-header">
          <h3 className="um-dialog-title">{done ? 'Part Dinonaktifkan' : 'Nonaktifkan Part'}</h3>
          <button className="icon-btn" onClick={handleClose}><Icons.X size={16} /></button>
        </div>
        <div className="um-dialog-body">
          {done ? (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Part berhasil dinonaktifkan</div>
              <div style={{ fontSize:13, color:'var(--muted-foreground)' }}>
                <strong>{part.partName}</strong> ({part.partCode}) — lokasi telah dibebaskan.
              </div>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'oklch(from var(--chart-4) l c h / 0.05)', borderRadius:10, border:'1px solid oklch(from var(--chart-4) l c h / 0.12)', marginBottom:14 }}>
                <Icons.AlertTriangle size={20} style={{ color:'var(--chart-4)', flexShrink:0 }} />
                <div style={{ fontSize:13 }}>
                  <div style={{ fontWeight:600 }}>Tindakan ini dapat dibatalkan.</div>
                  <div style={{ color:'var(--muted-foreground)', fontSize:12 }}>Part bisa diaktifkan kembali nanti.</div>
                </div>
              </div>
              <div className="tp-preview-card">
                <div className="tp-preview-grid">
                  <div className="tp-preview-row"><span>Part Name</span><span style={{ fontWeight:500 }}>{part.partName}</span></div>
                  <div className="tp-preview-row"><span>Part Code</span><span className="mono">{part.partCode}</span></div>
                  <div className="tp-preview-row"><span>Maker</span><span>{part.maker}</span></div>
                  <div className="tp-preview-row"><span>Storage</span><span className="mono">{part.storageAddr}</span></div>
                  <div className="tp-preview-row"><span>Current Stock</span><span className="mono" style={{ fontWeight:600 }}>{part.curStock} {part.unit}</span></div>
                </div>
              </div>
              <p style={{ fontSize:13, color:'var(--muted-foreground)', marginTop:12 }}>
                Part akan di-set inactive. Lokasi storage (<code className="mono" style={{ fontSize:12 }}>{part.storageAddr}</code>) akan dibebaskan dan bisa digunakan part lain.
              </p>
            </>
          )}
        </div>
        <div className="um-dialog-footer">
          {done ? (
            <button className="mp-btn mp-btn--primary" onClick={handleClose}>Selesai</button>
          ) : (
            <>
              <button className="mp-btn mp-btn--outline" onClick={handleClose}>Batal</button>
              <button className="mp-btn" style={{ background:'var(--destructive)', color:'white' }} onClick={handleConfirm}>
                <Icons.X size={14} /> Nonaktifkan
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Assign Location Sheet (for Unassigned parts) ─────────────────────────────

function AssignLocationSheet({ part, open, onClose }) {
  const [form, setForm] = _us({ storageType:'', storageNumber:'', storageBox:'', storageBoxKecil:'' });
  const [done, setDone] = _us(false);

  if (!open || !part) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const genBarcode = () => {
    if (!form.storageType || !form.storageNumber || !form.storageBox || !form.storageBoxKecil) return null;
    const tn = form.storageType.charCodeAt(0) - 64;
    return `${tn}${form.storageNumber}${String(form.storageBox).padStart(2,'0')}${String(form.storageBoxKecil).padStart(3,'0')}`;
  };

  // Storage redundancy check
  const storageAddr = form.storageType && form.storageNumber && form.storageBox && form.storageBoxKecil
    ? `${form.storageType}-${form.storageNumber}-${String(form.storageBox).padStart(2,'0')}-${String(form.storageBoxKecil).padStart(3,'0')}`
    : null;
  const storageConflict = storageAddr ? isStorageInUse(storageAddr) : false;
  const barcode = genBarcode();
  const barcodeConflict = barcode ? isBarcodeInUse(barcode) : false;
  const hasConflict = storageConflict || barcodeConflict;

  const canSubmit = form.storageType && form.storageNumber && form.storageBox && form.storageBoxKecil && !hasConflict;

  const handleSubmit = () => { setDone(true); };
  const handleClose = () => { setDone(false); setForm({ storageType:'', storageNumber:'', storageBox:'', storageBoxKecil:'' }); onClose(); };

  return (
    <>
      <div className="sheet-overlay" onClick={handleClose} />
      <div className="sheet sheet--right" style={{ width:400 }}>
        <div className="sheet-header">
          <h3 className="sheet-title">Assign Lokasi</h3>
          <button className="icon-btn" onClick={handleClose}><Icons.X size={16} /></button>
        </div>
        <div className="sheet-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {done ? (
            <div style={{ textAlign:'center', padding:'36px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Lokasi Berhasil Di-assign</div>
              <div style={{ fontSize:13, color:'var(--muted-foreground)', marginBottom:8 }}>
                <strong>{part.partName}</strong>
              </div>
              <div className="tp-barcode-preview" style={{ maxWidth:200, margin:'0 auto' }}>
                <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>Barcode:</span>
                <span className="mono" style={{ fontSize:20, fontWeight:700, letterSpacing:2 }}>{barcode}</span>
              </div>
              <div style={{ marginTop:16 }}>
                <button className="mp-btn mp-btn--primary" onClick={handleClose}>Selesai</button>
              </div>
            </div>
          ) : (
            <>
              {/* Part info */}
              <div className="tp-preview-card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{part.partName}</div>
                    <div className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>{part.partCode}</div>
                  </div>
                  <StatusBadge status="unassigned" />
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'oklch(from var(--chart-3) l c h / 0.06)', borderRadius:8, border:'1px solid oklch(from var(--chart-3) l c h / 0.15)' }}>
                <Icons.AlertTriangle size={16} style={{ color:'oklch(0.55 0.15 70)', flexShrink:0 }} />
                <span style={{ fontSize:12.5, color:'var(--foreground)' }}>Part ini belum memiliki lokasi storage. Assign lokasi untuk mengaktifkan.</span>
              </div>

              <div style={{ fontSize:13, fontWeight:600, marginBottom:-4 }}>Storage Location</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div className="um-field">
                  <label className="sm-form-label">Type <span className="sm-required">*</span></label>
                  <select className="sm-input sm-select" value={form.storageType} onChange={e => set('storageType', e.target.value)}>
                    <option value="">Pilih</option>
                    {['A','B','C','D','E'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Number <span className="sm-required">*</span></label>
                  <input className="sm-input" type="number" min="1" style={{ fontFamily:'var(--font-mono)' }} value={form.storageNumber} onChange={e => set('storageNumber', e.target.value)} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div className="um-field">
                  <label className="sm-form-label">Box <span className="sm-required">*</span></label>
                  <input className="sm-input" type="number" min="1" style={{ fontFamily:'var(--font-mono)' }} value={form.storageBox} onChange={e => set('storageBox', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">Box Kecil <span className="sm-required">*</span></label>
                  <input className="sm-input" type="number" min="1" style={{ fontFamily:'var(--font-mono)' }} value={form.storageBoxKecil} onChange={e => set('storageBoxKecil', e.target.value)} />
                </div>
              </div>

              {barcode && (
                <>
                  <div className="tp-barcode-preview">
                    <span style={{ fontSize:12, color:'var(--muted-foreground)' }}>Barcode yang akan di-generate:</span>
                    <span className="mono" style={{ fontSize:20, fontWeight:700, letterSpacing:2 }}>{barcode}</span>
                    <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>
                      {form.storageType}-{form.storageNumber}-{String(form.storageBox).padStart(2,'0')}-{String(form.storageBoxKecil).padStart(3,'0')}
                    </span>
                  </div>
                  {hasConflict && (
                    <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'10px 14px', background:'oklch(from var(--chart-4) l c h / 0.05)', borderRadius:8, border:'1px solid oklch(from var(--chart-4) l c h / 0.15)' }}>
                      <Icons.AlertTriangle size={16} style={{ color:'var(--chart-4)', flexShrink:0, marginTop:1 }} />
                      <div style={{ fontSize:12.5 }}>
                        <div style={{ fontWeight:600, color:'var(--chart-4)' }}>Storage sudah digunakan!</div>
                        <div style={{ color:'var(--muted-foreground)', marginTop:2 }}>Alamat <code className="mono" style={{ fontSize:11 }}>{storageAddr}</code> sedang digunakan oleh part aktif. Nonaktifkan part tersebut terlebih dahulu.</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        {!done && (
          <div className="tp-footer">
            <button className="mp-btn mp-btn--outline" onClick={handleClose}>Batal</button>
            <div style={{ flex:1 }} />
            <button
              className="mp-btn mp-btn--primary"
              style={{ opacity: canSubmit ? 1 : 0.5, pointerEvents: canSubmit ? 'auto' : 'none' }}
              onClick={handleSubmit}
            >
              Assign Lokasi
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Storage History Dialog ───────────────────────────────────────────────────

function StorageHistoryDialog({ storageAddr, open, onClose }) {
  if (!open || !storageAddr || storageAddr === '—') return null;
  const history = getStorageHistory(storageAddr);
  const currentPart = PARTS_DATA.find(p => p.storageAddr === storageAddr && p.status !== 'inactive');

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="um-dialog" style={{ maxWidth: 480 }}>
        <div className="um-dialog-header">
          <h3 className="um-dialog-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Icons.Package size={18} style={{ color:'var(--primary)' }} />
            Riwayat Storage
          </h3>
          <button className="icon-btn" onClick={onClose}><Icons.X size={16} /></button>
        </div>
        <div className="um-dialog-body">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <span className="mono" style={{ fontSize:16, fontWeight:700, letterSpacing:1, color:'var(--primary)' }}>{storageAddr}</span>
            {currentPart ? (
              <span className="st-badge st-badge--avail" style={{ fontSize:10 }}>In Use</span>
            ) : (
              <span className="st-badge st-badge--inactive" style={{ fontSize:10 }}>Available</span>
            )}
          </div>

          {currentPart && (
            <div className="tp-preview-card" style={{ marginBottom:14 }}>
              <div className="tp-preview-title" style={{ fontSize:12 }}>Saat ini digunakan oleh</div>
              <div className="tp-preview-grid">
                <div className="tp-preview-row"><span>Part Name</span><span style={{ fontWeight:500 }}>{currentPart.partName}</span></div>
                <div className="tp-preview-row"><span>Part Code</span><span className="mono">{currentPart.partCode}</span></div>
                <div className="tp-preview-row"><span>Status</span><span><StatusBadge status={currentPart.stockStatus} /></span></div>
              </div>
            </div>
          )}

          <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>History Penggunaan</div>
          {history.length === 0 ? (
            <div className="detail-empty">Belum ada riwayat penggunaan untuk storage ini.</div>
          ) : (
            <div className="detail-minitbl-wrap">
              <table className="detail-minitbl">
                <thead>
                  <tr>
                    <th>Part Code</th><th>Part Name</th><th>Assigned</th><th>Released</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td className="mono">{h.partCode}</td>
                      <td>{h.partName}</td>
                      <td className="mono" style={{ fontSize:11 }}>{h.assignedAt}</td>
                      <td className="mono" style={{ fontSize:11 }}>{h.releasedAt || '—'}</td>
                      <td>
                        {h.status === 'active'
                          ? <span className="st-badge st-badge--avail" style={{ fontSize:10 }}>Active</span>
                          : <span className="st-badge st-badge--inactive" style={{ fontSize:10 }}>Released</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop:10, fontSize:12, color:'var(--muted-foreground)', padding:'8px 10px', background:'var(--muted)', borderRadius:6 }}>
            Storage hanya bisa digunakan oleh 1 part aktif. Part harus dinonaktifkan terlebih dahulu agar storage bisa dipakai oleh part baru.
          </div>
        </div>
        <div className="um-dialog-footer">
          <button className="mp-btn mp-btn--primary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </>
  );
}

// ─── Purchase Part Form Sheet ─────────────────────────────────────────────────

function PurchasePartSheet({ part, open, onClose }) {
  const [form, setForm] = _us({ supplier:'', qty:'', eta:'', po:'', notes:'' });
  const [submitted, setSubmitted] = _us(false);

  if (!open || !part) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canSubmit = form.supplier.trim() && parseInt(form.qty) > 0;
  const totalPrice = part.price && form.qty ? part.price * parseInt(form.qty) : 0;

  const handleSubmit = () => { if (canSubmit) setSubmitted(true); };
  const handleClose = () => { setSubmitted(false); setForm({ supplier:'', qty:'', eta:'', po:'', notes:'' }); onClose(); };

  return (
    <>
      <div className="sheet-overlay" onClick={handleClose} />
      <div className="sheet sheet--right" style={{ width:440 }}>
        <div className="sheet-header">
          <h3 className="sheet-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--primary)' }}>
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            Purchase Part
          </h3>
          <button className="icon-btn" onClick={handleClose}><Icons.X size={16} /></button>
        </div>
        <div className="sheet-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {submitted ? (
            <div style={{ textAlign:'center', padding:'36px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Purchase Request Submitted</div>
              <div style={{ fontSize:13, color:'var(--muted-foreground)', marginBottom:6 }}>
                <strong>{part.partName}</strong> ({part.partCode})
              </div>
              <div className="sm-summary-strip" style={{ justifyContent:'center', marginBottom:16 }}>
                <div className="sm-summary-item"><span className="sm-summary-label">Qty</span><span className="sm-summary-value mono">{form.qty} {part.unit}</span></div>
                <div className="sm-summary-divider" />
                <div className="sm-summary-item"><span className="sm-summary-label">Supplier</span><span className="sm-summary-value" style={{ fontSize:13 }}>{form.supplier}</span></div>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                <button className="mp-btn mp-btn--primary" onClick={handleClose}>Selesai</button>
              </div>
            </div>
          ) : (
            <>
              {/* Part info */}
              <div className="sm-part-info">
                <div className="sm-part-info-header">
                  <span style={{ fontWeight:600, fontSize:14 }}>{part.partName}</span>
                  <StatusBadge status={part.stockStatus} />
                </div>
                <div className="sm-part-info-grid">
                  <div className="sm-part-info-row"><span className="sm-info-label">Part Code</span><span className="sm-info-value mono">{part.partCode}</span></div>
                  <div className="sm-part-info-row"><span className="sm-info-label">Maker</span><span className="sm-info-value">{part.maker}</span></div>
                  <div className="sm-part-info-row"><span className="sm-info-label">Current Stock</span><span className="sm-info-value mono" style={{ fontWeight:600, color: part.curStock === 0 ? 'var(--chart-4)' : 'var(--chart-3)' }}>{part.curStock} {part.unit}</span></div>
                  <div className="sm-part-info-row"><span className="sm-info-label">Min Stock</span><span className="sm-info-value mono">{part.minStock} {part.unit}</span></div>
                  <div className="sm-part-info-row"><span className="sm-info-label">Price/Unit</span><span className="sm-info-value mono">{fmtPrice(part.price)}</span></div>
                </div>
                {/* Recommended qty */}
                <div style={{ marginTop:8, padding:'6px 10px', background:'oklch(from var(--primary) l c h / 0.05)', borderRadius:6, border:'1px solid oklch(from var(--primary) l c h / 0.12)', fontSize:12, color:'var(--foreground)' }}>
                  Rekomendasi order: <strong className="mono">{Math.max(0, part.stdStock - part.curStock)} {part.unit}</strong> <span style={{ color:'var(--muted-foreground)' }}>(kembali ke std stock)</span>
                </div>
              </div>

              <div className="um-field">
                <label className="sm-form-label">Supplier <span className="sm-required">*</span></label>
                <input className="sm-input" placeholder="Nama supplier..." value={form.supplier} onChange={e => set('supplier', e.target.value)} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="um-field">
                  <label className="sm-form-label">Quantity <span className="sm-required">*</span></label>
                  <input className="sm-input" type="number" min="1" style={{ fontFamily:'var(--font-mono)' }} placeholder="0" value={form.qty} onChange={e => set('qty', e.target.value)} />
                </div>
                <div className="um-field">
                  <label className="sm-form-label">ETA</label>
                  <input className="sm-input" type="date" style={{ fontFamily:'var(--font-mono)' }} value={form.eta} onChange={e => set('eta', e.target.value)} />
                </div>
              </div>
              {totalPrice > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'var(--muted)', borderRadius:8, fontSize:13 }}>
                  <span style={{ color:'var(--muted-foreground)' }}>Estimasi Total</span>
                  <span className="mono" style={{ fontWeight:700, fontSize:15 }}>{fmtPrice(totalPrice)}</span>
                </div>
              )}
              <div className="um-field">
                <label className="sm-form-label">PO Number</label>
                <input className="sm-input" style={{ fontFamily:'var(--font-mono)' }} placeholder="PO-2026-XXXX" value={form.po} onChange={e => set('po', e.target.value)} />
              </div>
              <div className="um-field">
                <label className="sm-form-label">Notes</label>
                <textarea className="sm-input" style={{ height:52, paddingTop:8, resize:'vertical' }} placeholder="Catatan tambahan..." value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </>
          )}
        </div>
        {!submitted && (
          <div className="tp-footer">
            <button className="mp-btn mp-btn--outline" onClick={handleClose}>Batal</button>
            <div style={{ flex:1 }} />
            <button className="mp-btn mp-btn--primary" style={{ opacity: canSubmit ? 1 : 0.5, pointerEvents: canSubmit ? 'auto' : 'none' }} onClick={handleSubmit}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              Submit Purchase
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Row Action Dropdown ──────────────────────────────────────────────────────

function RowActions({ part, onViewDetail, onEdit, onDeactivate, onAssign, onPurchase }) {
  const [open, setOpen] = _us(false);
  const ref = _ur(null);
  _ue(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const isLowOrOut = part.stockStatus === 'low_stock' || part.stockStatus === 'out_of_stock';
  return (
    <div className="dropdown-wrap" ref={ref}>
      <button className="row-action-btn" onClick={() => setOpen(o => !o)}>···</button>
      {open && (
        <div className="dropdown-menu dropdown-menu--right" style={{ minWidth: 170 }}>
          <button className="dropdown-item" onClick={() => { onViewDetail(part); setOpen(false); }}><Icons.Search size={14}/><span>Lihat Detail</span></button>
          <button className="dropdown-item" onClick={() => { onEdit(part); setOpen(false); }}><Icons.Edit3 size={14}/><span>Edit Part</span></button>
          {part.status === 'unassigned' && (
            <button className="dropdown-item" onClick={() => { onAssign(part); setOpen(false); }}>
              <Icons.Package size={14} style={{ color:'var(--chart-1)' }} /><span>Assign Lokasi</span>
            </button>
          )}
          <div className="dropdown-divider" />
          <button className="dropdown-item" onClick={() => setOpen(false)}><Icons.ArrowUp size={14} style={{color:'var(--chart-2)'}}/><span>Stock IN</span></button>
          <button className="dropdown-item" onClick={() => setOpen(false)}><Icons.ArrowDown size={14} style={{color:'var(--chart-4)'}}/><span>Stock OUT</span></button>
          {isLowOrOut && (
            <button className="dropdown-item" onClick={() => { onPurchase(part); setOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--primary)' }}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <span>Purchase Part</span>
            </button>
          )}
          <div className="dropdown-divider" />
          {part.status === 'active' && (
            <button className="dropdown-item dropdown-item--danger" onClick={() => { onDeactivate(part); setOpen(false); }}>
              <Icons.X size={14}/><span>Nonaktifkan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, pageSize, onPageChange }) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="pagination">
      <span className="pagination-info">Menampilkan <strong>{from}–{to}</strong> dari <strong>{total}</strong> part</span>
      <div className="pagination-btns">
        <button className="pg-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</button>
        {pages.map((p, i) => p === '...' ? <span key={i} className="pg-ellipsis">…</span> : <button key={i} className={`pg-btn${p === page ? ' pg-btn--active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>)}
        <button className="pg-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>›</button>
      </div>
    </div>
  );
}

// ─── Master Part Page ─────────────────────────────────────────────────────────

function MasterPartPage({ onNavigate, isAdmin }) {
  const [search, setSearch] = _us('');
  const [filters, setFilters] = _us({ type:[], stockStatus:[], maker:[], category:[], status:[] });
  const [sort, setSort] = _us({ key:'partName', dir:'asc' });
  const [page, setPage] = _us(1);
  const pageSize = 15;
  const [selectedPart, setSelectedPart] = _us(null);
  const [showInactive, setShowInactive] = _us(false);
  const [addPartOpen, setAddPartOpen] = _us(false);
  const [importOpen, setImportOpen] = _us(false);
  const [exportOpen, setExportOpen] = _us(false);
  const [editPart, setEditPart] = _us(null);
  const [deactivatePart, setDeactivatePart] = _us(null);
  const [assignPart, setAssignPart] = _us(null);
  const [storageHistoryAddr, setStorageHistoryAddr] = _us(null);
  const [purchasePart, setPurchasePart] = _us(null);

  const filtered = _um(() => {
    return PARTS_DATA.filter(p => {
      if (!showInactive && p.status === 'inactive' && !filters.status?.includes('inactive')) return false;
      if (search) {
        const s = search.toLowerCase().trim();
        const isNum = /^\d+$/.test(s);
        if (isNum) { if (!(p.barcode || '').includes(s)) return false; }
        else { if (!p.partName.toLowerCase().includes(s) && !p.partCode.toLowerCase().includes(s) && !p.maker.toLowerCase().includes(s)) return false; }
      }
      if (filters.type.length && !filters.type.includes(p.type)) return false;
      if (filters.stockStatus.length && !filters.stockStatus.includes(p.stockStatus)) return false;
      if (filters.maker.length && !filters.maker.includes(p.maker)) return false;
      if (filters.category.length && !filters.category.includes(p.category)) return false;
      if (filters.status.length && !filters.status.includes(p.status)) return false;
      return true;
    });
  }, [search, filters, showInactive]);

  const sorted = _um(() => {
    return [...filtered].sort((a, b) => {
      let va = a[sort.key], vb = b[sort.key];
      if (va == null) va = ''; if (vb == null) vb = '';
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb+'').toLowerCase(); }
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
  _ue(() => { setPage(1); }, [search, filters]);

  const handleSort = (key) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const activeFilterCount = Object.values(filters).reduce((s, a) => s + a.length, 0);
  const chips = [];
  Object.entries(filters).forEach(([key, vals]) => {
    vals.forEach(v => chips.push({ key, value: v, label: `${key === 'stockStatus' ? 'Status' : key}: ${v}` }));
  });
  const removeChip = (k, v) => setFilters(f => ({ ...f, [k]: f[k].filter(x => x !== v) }));

  const SortIcon = ({ col }) => {
    if (sort.key !== col) return <span className="sort-icon sort-icon--idle">↕</span>;
    return <span className="sort-icon">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const cols = [
    { key:'_no', label:'No', w:44, align:'center', sortable:false },
    { key:'partName', label:'Part Name', w:200, sortable:true },
    { key:'partCode', label:'Part Code', w:120, mono:true, sortable:true },
    { key:'maker', label:'Maker', w:120, sortable:true },
    { key:'type', label:'Type', w:100, sortable:true },
    { key:'category', label:'Category', w:100, sortable:true },
    { key:'storageAddr', label:'Storage', w:110, mono:true, sortable:true },
    { key:'barcode', label:'Barcode', w:90, mono:true, sortable:true },
    { key:'price', label:'Price', w:110, mono:true, align:'right', sortable:true },
    { key:'curStock', label:'Stock', w:62, mono:true, align:'right', sortable:true },
    { key:'minStock', label:'Min', w:52, mono:true, align:'right', sortable:true },
    { key:'stdStock', label:'Std', w:52, mono:true, align:'right', sortable:true },
    { key:'maxStock', label:'Max', w:52, mono:true, align:'right', sortable:true },
    { key:'unit', label:'Unit', w:50, sortable:false },
    { key:'stockStatus', label:'Status', w:110, sortable:true },
    { key:'updatedBy', label:'Updated By', w:120, sortable:true },
    { key:'updatedAt', label:'Updated', w:100, mono:true, sortable:true },
    { key:'_actions', label:'', w:48, sortable:false },
  ];

  // Filter dropdown options
  const stockStatusOpts = [
    { value:'available', label:'Available' },{ value:'low_stock', label:'Low Stock' },
    { value:'out_of_stock', label:'Out of Stock' },{ value:'unassigned', label:'Unassigned' },
  ];
  const typeOpts = [
    { value:'electrical', label:'Electrical' },{ value:'mechanical', label:'Mechanical' },{ value:'fabrication', label:'Fabrication' },
  ];
  const makerOpts = ALL_MAKERS.map(m => ({ value: m, label: m }));
  const categoryOpts = ALL_CATEGORIES.map(c => ({ value: c, label: c }));

  return (
    <div className="mp-page">
      {/* Toolbar */}
      <div className="mp-toolbar">
        <div className="mp-toolbar-left">
          <div className="mp-search">
            <Icons.Search size={15} className="mp-search-icon" />
            <input type="text" placeholder="Cari part name, code, barcode..." value={search} onChange={e => setSearch(e.target.value)} className="mp-search-input" />
            {search && <button className="mp-search-clear" onClick={() => setSearch('')}>×</button>}
          </div>
          <FilterDropdown label="Status" options={stockStatusOpts} selected={filters.stockStatus} onChange={v => setFilters(f => ({ ...f, stockStatus: v }))} />
          <FilterDropdown label="Type" options={typeOpts} selected={filters.type} onChange={v => setFilters(f => ({ ...f, type: v }))} />
          <FilterDropdown label="Maker" options={makerOpts} selected={filters.maker} onChange={v => setFilters(f => ({ ...f, maker: v }))} />
          <FilterDropdown label="Category" options={categoryOpts} selected={filters.category} onChange={v => setFilters(f => ({ ...f, category: v }))} />
          <SortDropdown sort={sort} onSort={setSort} />
        </div>
        {isAdmin && (
          <div className="mp-toolbar-right">
            <button className="mp-btn mp-btn--outline" onClick={() => setImportOpen(true)}>Import</button>
            <button className="mp-btn mp-btn--outline" onClick={() => setExportOpen(true)}>Export</button>
            <button className="mp-btn mp-btn--primary" onClick={() => setAddPartOpen(true)}><Icons.Plus size={14}/><span>Tambah Part</span></button>
          </div>
        )}
      </div>

      {/* Filter chips */}
      {chips.length > 0 && (
        <div className="mp-chips">
          {chips.map((c, i) => (
            <span key={i} className="mp-chip">{c.label}<button className="mp-chip-x" onClick={() => removeChip(c.key, c.value)}>×</button></span>
          ))}
          <button className="text-btn text-btn--sm" onClick={() => setFilters({ type:[], stockStatus:[], maker:[], category:[], status:[] })}>Clear All</button>
        </div>
      )}

      {/* Table */}
      <div className="mp-table-wrap">
        <table className="mp-table">
          <thead><tr>{cols.map(c => (
            <th key={c.key} style={{ width: c.w, minWidth: c.w, textAlign: c.align || 'left' }} className={c.sortable ? 'th-sortable' : ''} onClick={() => c.sortable && handleSort(c.key)}>
              <span>{c.label}</span>{c.sortable && <SortIcon col={c.key} />}
            </th>
          ))}</tr></thead>
          <tbody>
            {paginated.length === 0 && <tr><td colSpan={cols.length} className="mp-empty">Tidak ada part yang cocok dengan filter.</td></tr>}
            {paginated.map((p, idx) => {
              const rowCls = p.status === 'inactive' ? 'mp-row--inactive' : p.status === 'unassigned' ? 'mp-row--unassigned' : '';
              const no = (page - 1) * pageSize + idx + 1;
              const isLowOrOut = p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock';
              return (
                <tr key={p.id} className={`mp-row ${rowCls}`}>
                  <td style={{ textAlign:'center' }}>{no}</td>
                  <td><button className="mp-part-link" onClick={() => setSelectedPart(p)}>{p.partName}</button></td>
                  <td className="mono">{p.partCode}</td>
                  <td>{p.maker}</td>
                  <td><TypeBadge type={p.type} /></td>
                  <td>{p.category}</td>
                  <td>{p.storageAddr !== '—' ? (
                    <button className="mp-part-link mono" style={{ fontSize:12 }} onClick={() => setStorageHistoryAddr(p.storageAddr)}>{p.storageAddr}</button>
                  ) : <span className="mono">—</span>}</td>
                  <td className="mono">{p.barcode || '—'}</td>
                  <td className="mono" style={{ textAlign:'right', fontSize:12 }}>{p.price ? fmtPrice(p.price) : '—'}</td>
                  <td className="mono" style={{ textAlign:'right', fontWeight:600, color: p.curStock === 0 ? 'var(--chart-4)' : p.curStock < p.minStock ? 'var(--chart-3)' : 'var(--foreground)' }}>{p.curStock}</td>
                  <td className="mono" style={{ textAlign:'right', color:'var(--chart-4)' }}>{p.minStock}</td>
                  <td className="mono" style={{ textAlign:'right', color:'var(--chart-1)' }}>{p.stdStock}</td>
                  <td className="mono" style={{ textAlign:'right', color:'var(--chart-2)' }}>{p.maxStock}</td>
                  <td>{p.unit}</td>
                  <td>{isLowOrOut ? (
                    <button style={{ background:'none', border:'none', cursor:'pointer', padding:0 }} onClick={() => setPurchasePart(p)} title="Klik untuk purchase part">
                      <StatusBadge status={p.stockStatus} />
                    </button>
                  ) : (
                    <StatusBadge status={p.stockStatus} />
                  )}</td>
                  <td className="mp-cell-muted">{p.updatedBy?.split(' ')[0]}</td>
                  <td className="mono mp-cell-muted">{p.updatedAt}</td>
                  <td><RowActions part={p} onViewDetail={setSelectedPart} onEdit={setEditPart} onDeactivate={setDeactivatePart} onAssign={setAssignPart} onPurchase={setPurchasePart} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={sorted.length} pageSize={pageSize} onPageChange={setPage} />

      {/* Modals */}
      <TambahPartSheet open={addPartOpen} onClose={() => setAddPartOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} totalParts={PARTS_DATA.filter(p => p.status !== 'inactive').length} />
      <EditPartSheet part={editPart} open={!!editPart} onClose={() => setEditPart(null)} />
      <DeactivatePartDialog part={deactivatePart} open={!!deactivatePart} onClose={() => setDeactivatePart(null)} />
      <AssignLocationSheet part={assignPart} open={!!assignPart} onClose={() => setAssignPart(null)} />
      <StorageHistoryDialog storageAddr={storageHistoryAddr} open={!!storageHistoryAddr} onClose={() => setStorageHistoryAddr(null)} />
      <PurchasePartSheet part={purchasePart} open={!!purchasePart} onClose={() => setPurchasePart(null)} />
      {selectedPart && <PartDetailSheet part={selectedPart} onClose={() => setSelectedPart(null)} />}
    </div>
  );
}

Object.assign(window, { MasterPartPage, StatusBadge, TypeBadge, Pagination, StorageHistoryDialog, PurchasePartSheet, CreatableSelect, UNIT_LIST, PROJECT_LIST });
