// components/part-search.jsx — Part Search page: file upload, matching, results table

const { useState: psUs, useMemo: psUm, useRef: psUr, useCallback: psCb } = React;

// ─── Mock search input data (simulates uploaded Excel rows) ──────────────────

const MOCK_SEARCH_ROWS = [
  { row: 1, partCode: 'MIA-EL-001', partName: 'Fuse 10A 250V', maker: 'Bussmann', qtyNeeded: 5 },
  { row: 2, partCode: 'MIA-EL-002', partName: 'Kontaktor LC1D18', maker: 'Schneider', qtyNeeded: 3 },
  { row: 3, partCode: 'MIA-ME-003', partName: 'Fitting AS1002F', maker: 'SMC', qtyNeeded: 10 },
  { row: 4, partCode: 'MIA-EL-003', partName: 'PLC Modul Input 16DI', maker: 'Mitsubishi', qtyNeeded: 2 },
  { row: 5, partCode: 'MIA-ME-001', partName: 'Bearing SKF 6205', maker: 'SKF', qtyNeeded: 5 },
  { row: 6, partCode: 'MIA-EL-007', partName: 'MCB 16A 1P', maker: 'Schneider', qtyNeeded: 3 },
  { row: 7, partCode: 'MIA-FA-002', partName: 'Plate Aluminium A5052 3mm', maker: 'Local', qtyNeeded: 2 },
  { row: 8, partCode: 'MIA-ME-009', partName: 'Spring Compression 20x40', maker: 'Misumi', qtyNeeded: 5 },
  { row: 9, partCode: '', partName: 'Proximity Sensor', maker: 'Keyence', qtyNeeded: 3 },
  { row: 10, partCode: '', partName: 'Relay 24V DC', maker: 'Omron', qtyNeeded: 4 },
  { row: 11, partCode: 'MIA-EL-005', partName: 'Terminal Block 4mm²', maker: 'Phoenix Contact', qtyNeeded: 25 },
  { row: 12, partCode: 'MIA-ME-005', partName: 'Belt Timing HTD 5M-450', maker: 'Gates', qtyNeeded: 2 },
  { row: 13, partCode: '', partName: 'Motor Servo 750W', maker: 'Yaskawa', qtyNeeded: 1 },
  { row: 14, partCode: 'XYZ-FAKE-01', partName: 'Widget Unknown', maker: 'Unknown', qtyNeeded: 10 },
  { row: 15, partCode: '', partName: 'Seal Hydraulic 50mm', maker: 'Parker', qtyNeeded: 6 },
  { row: 16, partCode: 'MIA-EL-008', partName: 'Power Supply 24V 5A', maker: 'Mean Well', qtyNeeded: 1 },
  { row: 17, partCode: 'MIA-FA-004', partName: 'Bracket Custom L-Type', maker: 'Custom', qtyNeeded: 4 },
  { row: 18, partCode: '', partName: 'Cable Gland PG-16', maker: '', qtyNeeded: 20 },
  { row: 19, partCode: 'MIA-ME-006', partName: 'Coupling Jaw L-100', maker: 'Lovejoy', qtyNeeded: 2 },
  { row: 20, partCode: 'MIA-EL-006', partName: 'Sensor Proximity M12', maker: 'Keyence', qtyNeeded: 3 },
];

// ─── Matching algorithm (mirrors backend logic) ─────────────────────────────

function runMatching(searchRows) {
  const activeParts = PARTS_DATA.filter(p => p.status === 'active');

  return searchRows.map(sr => {
    // Level 1: Part code exact match
    if (sr.partCode) {
      const codeNorm = sr.partCode.trim().toUpperCase();
      const match = activeParts.find(p => p.partCode.toUpperCase() === codeNorm);
      if (match) {
        if (sr.qtyNeeded > match.curStock) {
          return {
            ...sr, status: 'shortage', matchedPart: match,
            candidates: [],
            note: `Stok tersedia ${match.curStock} ${match.unit}, dibutuhkan ${sr.qtyNeeded}`,
          };
        }
        return {
          ...sr, status: 'exact', matchedPart: match,
          candidates: [],
          note: `Stok cukup: ${match.curStock} ${match.unit}`,
        };
      }
    }

    // Level 2: Name + Maker fuzzy match
    const nameWords = sr.partName.toLowerCase().split(/\s+/);
    const makerLower = (sr.maker || '').toLowerCase();

    const candidates = activeParts.filter(p => {
      const pNameLower = p.partName.toLowerCase();
      const matchesName = nameWords.some(w => w.length > 2 && pNameLower.includes(w));
      const matchesMaker = !makerLower || p.maker.toLowerCase().includes(makerLower);
      return matchesName && matchesMaker;
    }).slice(0, 3);

    if (candidates.length > 0) {
      return {
        ...sr, status: 'possible', matchedPart: null,
        candidates,
        note: `${candidates.length} kemungkinan cocok ditemukan`,
      };
    }

    // Level 3: Not found
    return {
      ...sr, status: 'not_found', matchedPart: null,
      candidates: [],
      note: 'Tidak ditemukan di database',
    };
  });
}

// ─── Status config ───────────────────────────────────────────────────────────

const SEARCH_STATUS = {
  exact:     { label: 'Exact Match',     icon: '✅', cls: 'ps-row--exact',     badgeCls: 'ps-badge--exact',     color: 'var(--chart-2)' },
  possible:  { label: 'Possible Match',  icon: '🟡', cls: 'ps-row--possible',  badgeCls: 'ps-badge--possible',  color: 'var(--chart-3)' },
  not_found: { label: 'Not Found',       icon: '❌', cls: 'ps-row--notfound',  badgeCls: 'ps-badge--notfound',  color: 'var(--chart-4)' },
  shortage:  { label: 'Stock Shortage',  icon: '🔵', cls: 'ps-row--shortage',  badgeCls: 'ps-badge--shortage',  color: 'var(--chart-1)' },
};

// ─── Drop Zone ───────────────────────────────────────────────────────────────

function DropZone({ onFileLoaded }) {
  const [dragOver, setDragOver] = psUs(false);
  const fileRef = psUr(null);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      alert('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv');
      return;
    }
    // Simulate parsing — use mock data
    setTimeout(() => {
      onFileLoaded(file.name, MOCK_SEARCH_ROWS);
    }, 600);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleClick = () => fileRef.current?.click();
  const handleInput = (e) => handleFile(e.target.files?.[0]);

  const UploadIcon = (p) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );

  const FileIcon = (p) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );

  return (
    <div className="ps-empty-state">
      <div
        className={`ps-dropzone${dragOver ? ' ps-dropzone--active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleInput} />
        <div className="ps-dropzone-icon">
          <UploadIcon size={40} />
        </div>
        <div className="ps-dropzone-title">Drop file Excel atau klik untuk browse</div>
        <div className="ps-dropzone-sub">Format: .xlsx / .xls / .csv — Maks 500 baris, 5 MB</div>
      </div>
      <button className="mp-btn mp-btn--outline" style={{ gap: 6 }}>
        <FileIcon size={14} />
        Download Template
      </button>
    </div>
  );
}

// ─── Processing overlay ──────────────────────────────────────────────────────

function ProcessingOverlay() {
  return (
    <div className="ps-processing">
      <div className="ps-processing-spinner" />
      <div style={{ fontWeight: 600, fontSize: 15 }}>Memproses file...</div>
      <div style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Mencocokkan part dengan database</div>
    </div>
  );
}

// ─── Expand detail for a row ─────────────────────────────────────────────────

function RowDetail({ result }) {
  if (result.status === 'exact' || result.status === 'shortage') {
    const p = result.matchedPart;
    return (
      <div className="ps-detail">
        <div className="ps-detail-title">Part Ditemukan</div>
        <div className="ps-detail-grid">
          <div className="ps-detail-row">
            <span className="ps-detail-label">Part Name</span>
            <span className="ps-detail-value">{p.partName}</span>
          </div>
          <div className="ps-detail-row">
            <span className="ps-detail-label">Part Code</span>
            <span className="ps-detail-value mono">{p.partCode}</span>
          </div>
          <div className="ps-detail-row">
            <span className="ps-detail-label">Maker</span>
            <span className="ps-detail-value">{p.maker}</span>
          </div>
          <div className="ps-detail-row">
            <span className="ps-detail-label">Type</span>
            <span className="ps-detail-value"><TypeBadge type={p.type} /></span>
          </div>
          <div className="ps-detail-row">
            <span className="ps-detail-label">Storage</span>
            <span className="ps-detail-value mono">{p.storageAddr}</span>
          </div>
          <div className="ps-detail-row">
            <span className="ps-detail-label">Current Stock</span>
            <span className="ps-detail-value mono" style={{ fontWeight: 600 }}>{p.curStock} {p.unit}</span>
          </div>
          <div className="ps-detail-row">
            <span className="ps-detail-label">Qty Needed</span>
            <span className="ps-detail-value mono" style={{ fontWeight: 600 }}>{result.qtyNeeded}</span>
          </div>
          {result.status === 'shortage' && (
            <div className="ps-detail-row">
              <span className="ps-detail-label">Kekurangan</span>
              <span className="ps-detail-value mono" style={{ fontWeight: 700, color: 'var(--chart-4)' }}>
                {result.qtyNeeded - p.curStock} {p.unit}
              </span>
            </div>
          )}
        </div>
        <div className="ps-detail-status">
          <StatusBadge status={p.stockStatus} />
        </div>
      </div>
    );
  }

  if (result.status === 'possible') {
    return (
      <div className="ps-detail">
        <div className="ps-detail-title">Kemungkinan Cocok ({result.candidates.length})</div>
        <div className="ps-candidates">
          {result.candidates.map((c, i) => (
            <div key={i} className="ps-candidate">
              <div className="ps-candidate-header">
                <span style={{ fontWeight: 600, fontSize: 13 }}>{c.partName}</span>
                <StatusBadge status={c.stockStatus} />
              </div>
              <div className="ps-candidate-meta">
                <span className="mono" style={{ fontSize: 12 }}>{c.partCode}</span>
                <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>·</span>
                <span style={{ fontSize: 12 }}>{c.maker}</span>
                <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>·</span>
                <span className="mono" style={{ fontSize: 12 }}>Stok: {c.curStock} {c.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ps-detail">
      <div className="ps-detail-empty">
        Tidak ada part yang cocok di database. Periksa kembali nama part atau kode.
      </div>
    </div>
  );
}

// ─── Results table ───────────────────────────────────────────────────────────

function ResultsTable({ results, statusFilter, onStatusFilter }) {
  const [expandedRow, setExpandedRow] = psUs(null);

  const displayed = statusFilter === 'all'
    ? results
    : results.filter(r => r.status === statusFilter);

  const toggleRow = (row) => {
    setExpandedRow(prev => prev === row ? null : row);
  };

  return (
    <div className="mp-table-wrap">
      <table className="mp-table ps-table">
        <thead>
          <tr>
            <th style={{ width: 44, textAlign: 'center' }}>No</th>
            <th style={{ width: 38, textAlign: 'center' }}></th>
            <th style={{ width: 120 }}>Part Code</th>
            <th style={{ width: 220 }}>Part Name (Input)</th>
            <th style={{ width: 120 }}>Maker</th>
            <th style={{ width: 70, textAlign: 'right' }}>Qty</th>
            <th style={{ width: 130 }}>Status</th>
            <th style={{ width: 200 }}>Matched Part</th>
            <th style={{ width: 80, textAlign: 'right' }}>Stok</th>
          </tr>
        </thead>
        <tbody>
          {displayed.length === 0 && (
            <tr><td colSpan={9} className="mp-empty">Tidak ada hasil untuk filter ini.</td></tr>
          )}
          {displayed.map((r) => {
            const st = SEARCH_STATUS[r.status];
            const isExpanded = expandedRow === r.row;
            const matchedName = r.matchedPart?.partName || (r.candidates.length > 0 ? r.candidates[0].partName : '—');
            const matchedStock = r.matchedPart ? `${r.matchedPart.curStock} ${r.matchedPart.unit}` : '—';

            return (
              <React.Fragment key={r.row}>
                <tr
                  className={`mp-row ${st.cls}${isExpanded ? ' ps-row--expanded' : ''}`}
                  onClick={() => toggleRow(r.row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ textAlign: 'center' }}>{r.row}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`ps-expand-icon${isExpanded ? ' ps-expand-icon--open' : ''}`}>
                      <Icons.ChevronRight size={14} />
                    </span>
                  </td>
                  <td className="mono">{r.partCode || <span style={{ color: 'var(--muted-foreground)' }}>—</span>}</td>
                  <td style={{ fontWeight: 500 }}>{r.partName}</td>
                  <td>{r.maker || <span style={{ color: 'var(--muted-foreground)' }}>—</span>}</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>{r.qtyNeeded}</td>
                  <td>
                    <span className={`ps-status-badge ${st.badgeCls}`}>{st.icon} {st.label}</span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    {matchedName !== '—'
                      ? <span style={{ fontWeight: 500 }}>{matchedName}</span>
                      : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                    {r.candidates.length > 1 && (
                      <span style={{ color: 'var(--muted-foreground)', fontSize: 11, marginLeft: 4 }}>+{r.candidates.length - 1}</span>
                    )}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    {matchedStock !== '—'
                      ? <span style={{ fontWeight: 500 }}>{matchedStock}</span>
                      : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className={`${st.cls}`}>
                    <td colSpan={9} style={{ padding: '0 12px 12px 52px' }}>
                      <RowDetail result={r} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Part Search Page ────────────────────────────────────────────────────────

function PartSearchPage({ onNavigate }) {
  const [fileName, setFileName] = psUs(null);
  const [results, setResults] = psUs(null);
  const [processing, setProcessing] = psUs(false);
  const [statusFilter, setStatusFilter] = psUs('all');

  const handleFileLoaded = (name, rows) => {
    setFileName(name);
    setProcessing(true);
    setResults(null);
    // Simulate processing delay
    setTimeout(() => {
      const matched = runMatching(rows);
      setResults(matched);
      setProcessing(false);
    }, 1200);
  };

  const handleReplaceFile = () => {
    setFileName(null);
    setResults(null);
    setProcessing(false);
    setStatusFilter('all');
  };

  // Summary counts
  const summary = psUm(() => {
    if (!results) return { exact: 0, possible: 0, not_found: 0, shortage: 0, total: 0 };
    return {
      exact: results.filter(r => r.status === 'exact').length,
      possible: results.filter(r => r.status === 'possible').length,
      not_found: results.filter(r => r.status === 'not_found').length,
      shortage: results.filter(r => r.status === 'shortage').length,
      total: results.length,
    };
  }, [results]);

  const FileTextIcon = (p) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );

  const DownloadIcon = (p) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  const RefreshIcon = (p) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
    </svg>
  );

  // No file loaded — show drop zone
  if (!fileName) {
    return (
      <div className="mp-page">
        <DropZone onFileLoaded={handleFileLoaded} />
      </div>
    );
  }

  // Processing
  if (processing) {
    return (
      <div className="mp-page">
        <ProcessingOverlay />
      </div>
    );
  }

  // Results
  return (
    <div className="mp-page">
      {/* File info bar */}
      <div className="ps-file-bar">
        <div className="ps-file-info">
          <FileTextIcon size={16} />
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{fileName}</span>
          <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
            {summary.total} baris
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="mp-btn mp-btn--outline" style={{ height: 32, fontSize: 12.5 }} onClick={handleReplaceFile}>
            <RefreshIcon size={13} /> Ganti File
          </button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="ps-summary">
        <button
          className={`ps-summary-badge ps-summary-badge--exact${statusFilter === 'all' ? ' ps-summary-badge--active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Total <span className="ps-summary-count">{summary.total}</span>
        </button>
        <button
          className={`ps-summary-badge ps-summary-badge--exact${statusFilter === 'exact' ? ' ps-summary-badge--active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'exact' ? 'all' : 'exact')}
        >
          ✅ Exact Match <span className="ps-summary-count">{summary.exact}</span>
        </button>
        <button
          className={`ps-summary-badge ps-summary-badge--possible${statusFilter === 'possible' ? ' ps-summary-badge--active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'possible' ? 'all' : 'possible')}
        >
          🟡 Possible <span className="ps-summary-count">{summary.possible}</span>
        </button>
        <button
          className={`ps-summary-badge ps-summary-badge--notfound${statusFilter === 'not_found' ? ' ps-summary-badge--active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'not_found' ? 'all' : 'not_found')}
        >
          ❌ Not Found <span className="ps-summary-count">{summary.not_found}</span>
        </button>
        <button
          className={`ps-summary-badge ps-summary-badge--shortage${statusFilter === 'shortage' ? ' ps-summary-badge--active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'shortage' ? 'all' : 'shortage')}
        >
          🔵 Shortage <span className="ps-summary-count">{summary.shortage}</span>
        </button>
      </div>

      {/* Results table */}
      <ResultsTable results={results} statusFilter={statusFilter} onStatusFilter={setStatusFilter} />

      {/* Footer actions */}
      <div className="ps-footer">
        <button className="mp-btn mp-btn--primary" style={{ gap: 6 }}>
          <DownloadIcon size={14} /> Export Hasil (.xlsx)
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { PartSearchPage });
