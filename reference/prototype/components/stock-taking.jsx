// components/stock-taking.jsx — Stock Taking (Audit) page

const { useState, useMemo, useRef, useEffect, useCallback } = React;
const {
  FileSpreadsheet, Filter, Search: STSearchIcon, ArrowUp, ArrowDown,
  ChevronsUpDown, Download, X, ChevronDown, CheckCircle2, XCircle
} = Icons;

// ─── Stock Taking Page ───────────────────────────────────────────────────────

function StockTakingPage({ onNavigate }) {
  // Only show active parts with storage assigned
  const activeParts = useMemo(() =>
    PARTS_DATA.filter(p => p.status === 'active' && p.sType),
  []);

  // Actual stock state: { partId: number|null }
  const [actuals, setActuals] = useState({});

  // Search
  const [search, setSearch] = useState('');

  // Storage filter
  const [storageFilter, setStorageFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Sort
  const [sortCol, setSortCol] = useState('storageAddr');
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Get unique storage prefixes (e.g. A-1, B-1, C-1)
  const storageGroups = useMemo(() => {
    const groups = new Set();
    activeParts.forEach(p => {
      if (p.sType && p.sNum != null) groups.add(`${p.sType}-${p.sNum}`);
    });
    return [...groups].sort();
  }, [activeParts]);

  // Get unique storage types (A, B, C)
  const storageTypes = useMemo(() => {
    const types = new Set();
    activeParts.forEach(p => { if (p.sType) types.add(p.sType); });
    return [...types].sort();
  }, [activeParts]);

  // Filter + search + sort
  const filteredParts = useMemo(() => {
    let result = [...activeParts];

    // Storage filter
    if (storageFilter !== 'all') {
      if (storageFilter.length === 1) {
        // Filter by type letter (A, B, C)
        result = result.filter(p => p.sType === storageFilter);
      } else {
        // Filter by group (A-1, B-1, etc.)
        result = result.filter(p => `${p.sType}-${p.sNum}` === storageFilter);
      }
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.partName.toLowerCase().includes(q) ||
        p.partCode.toLowerCase().includes(q) ||
        p.maker.toLowerCase().includes(q) ||
        p.storageAddr.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'partName': va = a.partName.toLowerCase(); vb = b.partName.toLowerCase(); break;
        case 'maker': va = a.maker.toLowerCase(); vb = b.maker.toLowerCase(); break;
        case 'partCode': va = a.partCode; vb = b.partCode; break;
        case 'storageAddr': va = a.storageAddr; vb = b.storageAddr; break;
        case 'type': va = a.type; vb = b.type; break;
        case 'curStock': va = a.curStock; vb = b.curStock; break;
        case 'discrepancy':
          va = actuals[a.id] != null ? (actuals[a.id] - a.curStock) : -99999;
          vb = actuals[b.id] != null ? (actuals[b.id] - b.curStock) : -99999;
          break;
        case 'status':
          va = actuals[a.id] != null ? (actuals[a.id] === a.curStock ? 'OK' : 'NG') : '';
          vb = actuals[b.id] != null ? (actuals[b.id] === b.curStock ? 'OK' : 'NG') : '';
          break;
        default: va = a.storageAddr; vb = b.storageAddr;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [activeParts, storageFilter, search, sortCol, sortDir, actuals]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [storageFilter, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredParts.length / perPage));
  const pagedParts = filteredParts.slice((page - 1) * perPage, page * perPage);

  // Handle actual stock change
  const handleActualChange = useCallback((partId, value) => {
    if (value === '') {
      setActuals(prev => {
        const next = { ...prev };
        delete next[partId];
        return next;
      });
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        setActuals(prev => ({ ...prev, [partId]: num }));
      }
    }
  }, []);

  // Sort handler
  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // Sort icon
  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="sort-icon sort-icon--idle"><ChevronsUpDown size={12} /></span>;
    return sortDir === 'asc'
      ? <span className="sort-icon"><ArrowUp size={12} /></span>
      : <span className="sort-icon"><ArrowDown size={12} /></span>;
  };

  // Summary counts
  const summary = useMemo(() => {
    let filled = 0, ok = 0, ng = 0;
    activeParts.forEach(p => {
      if (actuals[p.id] != null) {
        filled++;
        if (actuals[p.id] === p.curStock) ok++;
        else ng++;
      }
    });
    return { total: activeParts.length, filled, ok, ng, remaining: activeParts.length - filled };
  }, [activeParts, actuals]);

  // Export to CSV (Excel-compatible)
  const handleExport = () => {
    const header = ['No', 'Part Name', 'Maker', 'Part Code', 'Storage Address', 'Type', 'Current Stock', 'Unit', 'Actual Stock', 'Discrepancy', 'Status'];
    const rows = filteredParts.map((p, i) => {
      const actual = actuals[p.id];
      const disc = actual != null ? actual - p.curStock : '';
      const status = actual != null ? (actual === p.curStock ? 'OK' : 'NG') : '';
      return [
        i + 1,
        `"${p.partName}"`,
        `"${p.maker}"`,
        p.partCode,
        p.storageAddr,
        p.type,
        p.curStock,
        p.unit,
        actual != null ? actual : '',
        disc,
        status
      ].join(',');
    });
    const csv = '\uFEFF' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    a.download = `Stock_Taking_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Type badge
  const TypeBadge = ({ type }) => {
    const cls = type === 'electrical' ? 'tp-badge tp-badge--el' : type === 'mechanical' ? 'tp-badge tp-badge--me' : 'tp-badge tp-badge--fa';
    const label = type === 'electrical' ? 'Electrical' : type === 'mechanical' ? 'Mechanical' : 'Fabrication';
    return <span className={cls}>{label}</span>;
  };

  // Filter label
  const filterLabel = storageFilter === 'all' ? 'Semua Lokasi' : storageFilter;
  const isFiltered = storageFilter !== 'all';

  return (
    <div className="mp-page">
      {/* Summary strip */}
      <div className="sm-summary-strip" style={{ flexWrap: 'wrap' }}>
        <div className="sm-summary-item">
          <div className="sm-summary-dot" style={{ background: 'var(--primary)' }}></div>
          <span className="sm-summary-label">Total Part</span>
          <span className="sm-summary-value">{summary.total}</span>
        </div>
        <div className="sm-summary-divider"></div>
        <div className="sm-summary-item">
          <div className="sm-summary-dot" style={{ background: 'var(--chart-2)' }}></div>
          <span className="sm-summary-label">Sudah Diaudit</span>
          <span className="sm-summary-value" style={{ color: 'var(--chart-2)' }}>{summary.filled}</span>
        </div>
        <div className="sm-summary-divider"></div>
        <div className="sm-summary-item">
          <div className="sm-summary-dot" style={{ background: 'var(--chart-2)' }}></div>
          <span className="sm-summary-label">OK</span>
          <span className="sm-summary-value" style={{ color: 'var(--chart-2)' }}>{summary.ok}</span>
        </div>
        <div className="sm-summary-divider"></div>
        <div className="sm-summary-item">
          <div className="sm-summary-dot" style={{ background: 'var(--chart-4)' }}></div>
          <span className="sm-summary-label">NG</span>
          <span className="sm-summary-value" style={{ color: 'var(--chart-4)' }}>{summary.ng}</span>
        </div>
        <div className="sm-summary-divider"></div>
        <div className="sm-summary-item">
          <div className="sm-summary-dot" style={{ background: 'var(--muted-foreground)' }}></div>
          <span className="sm-summary-label">Belum Diaudit</span>
          <span className="sm-summary-value" style={{ color: 'var(--muted-foreground)' }}>{summary.remaining}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mp-toolbar">
        <div className="mp-toolbar-left">
          {/* Search */}
          <div className="mp-search">
            <span className="mp-search-icon"><STSearchIcon size={15} /></span>
            <input
              className="mp-search-input"
              placeholder="Cari part name, code, maker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="mp-search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Storage filter dropdown */}
          <div className="dropdown-wrap" ref={filterRef}>
            <button
              className={`mp-filter-btn${isFiltered ? ' mp-filter-btn--active' : ''}`}
              onClick={() => setFilterOpen(o => !o)}
            >
              <Filter size={14} />
              <span>{filterLabel}</span>
              <ChevronDown size={13} />
            </button>
            {filterOpen && (
              <div className="dropdown-menu" style={{ minWidth: 200, maxHeight: 320, overflowY: 'auto' }}>
                <button
                  className={`dropdown-item${storageFilter === 'all' ? ' dropdown-item--active' : ''}`}
                  onClick={() => { setStorageFilter('all'); setFilterOpen(false); }}
                >
                  Semua Lokasi
                </button>
                <div className="dropdown-divider" />
                {/* By type */}
                <div style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tipe Storage
                </div>
                {storageTypes.map(t => (
                  <button
                    key={t}
                    className={`dropdown-item${storageFilter === t ? ' dropdown-item--active' : ''}`}
                    onClick={() => { setStorageFilter(t); setFilterOpen(false); }}
                  >
                    <span style={{ fontWeight: 600 }}>Rak {t}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
                      {activeParts.filter(p => p.sType === t).length} part
                    </span>
                  </button>
                ))}
                <div className="dropdown-divider" />
                {/* By group */}
                <div style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Storage Address
                </div>
                {storageGroups.map(g => (
                  <button
                    key={g}
                    className={`dropdown-item${storageFilter === g ? ' dropdown-item--active' : ''}`}
                    onClick={() => { setStorageFilter(g); setFilterOpen(false); }}
                  >
                    <span>{g}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
                      {activeParts.filter(p => `${p.sType}-${p.sNum}` === g).length} part
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mp-toolbar-right">
          {/* Export button */}
          <button className="mp-btn mp-btn--outline" onClick={handleExport} title="Export ke Excel (CSV)">
            <FileSpreadsheet size={15} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Active filter chip */}
      {isFiltered && (
        <div className="mp-chips">
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Filter aktif:</span>
          <span className="mp-chip">
            Storage: {storageFilter}
            <button className="mp-chip-x" onClick={() => setStorageFilter('all')}><X size={12} /></button>
          </span>
          <button className="text-btn text-btn--sm" onClick={() => setStorageFilter('all')}>Hapus filter</button>
        </div>
      )}

      {/* Table */}
      <div className="mp-table-wrap">
        <table className="mp-table st-table">
          <thead>
            <tr>
              <th style={{ width: 44, textAlign: 'center' }}>No</th>
              <th className="th-sortable" onClick={() => handleSort('partName')}>
                Part Name <SortIcon col="partName" />
              </th>
              <th className="th-sortable" onClick={() => handleSort('maker')}>
                Maker <SortIcon col="maker" />
              </th>
              <th className="th-sortable" onClick={() => handleSort('partCode')}>
                Part Code <SortIcon col="partCode" />
              </th>
              <th className="th-sortable" onClick={() => handleSort('storageAddr')}>
                Storage Address <SortIcon col="storageAddr" />
              </th>
              <th className="th-sortable" onClick={() => handleSort('type')}>
                Type <SortIcon col="type" />
              </th>
              <th className="th-sortable" style={{ textAlign: 'center' }} onClick={() => handleSort('curStock')}>
                Current Stock <SortIcon col="curStock" />
              </th>
              <th style={{ textAlign: 'center' }}>Unit</th>
              <th style={{ textAlign: 'center', width: 110 }}>Actual Stock</th>
              <th className="th-sortable" style={{ textAlign: 'center' }} onClick={() => handleSort('discrepancy')}>
                Discrepancy <SortIcon col="discrepancy" />
              </th>
              <th className="th-sortable" style={{ textAlign: 'center' }} onClick={() => handleSort('status')}>
                Status <SortIcon col="status" />
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedParts.length === 0 ? (
              <tr>
                <td colSpan={11} className="mp-empty">
                  Tidak ada part ditemukan.
                </td>
              </tr>
            ) : pagedParts.map((p, idx) => {
              const globalIdx = (page - 1) * perPage + idx + 1;
              const actual = actuals[p.id];
              const hasActual = actual != null;
              const discrepancy = hasActual ? actual - p.curStock : null;
              const isOK = hasActual && discrepancy === 0;
              const isNG = hasActual && discrepancy !== 0;

              return (
                <tr key={p.id} className={`mp-row${isNG ? ' st-row--ng' : ''}${isOK ? ' st-row--ok' : ''}`}>
                  <td style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 12 }}>{globalIdx}</td>
                  <td style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.partName}</td>
                  <td className="mp-cell-muted">{p.maker}</td>
                  <td className="mono">{p.partCode}</td>
                  <td>
                    <span className="mono" style={{ fontSize: 12.5 }}>{p.storageAddr}</span>
                  </td>
                  <td><TypeBadge type={p.type} /></td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.curStock}</td>
                  <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)' }}>{p.unit}</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      className="st-actual-input"
                      min="0"
                      placeholder="—"
                      value={hasActual ? actual : ''}
                      onChange={e => handleActualChange(p.id, e.target.value)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {hasActual ? (
                      <span className={`st-disc-badge${discrepancy === 0 ? ' st-disc--zero' : discrepancy > 0 ? ' st-disc--plus' : ' st-disc--minus'}`}>
                        {discrepancy > 0 ? `+${discrepancy}` : discrepancy}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {hasActual ? (
                      isOK ? (
                        <span className="st-status-badge st-status--ok">
                          <CheckCircle2 size={13} /> OK
                        </span>
                      ) : (
                        <span className="st-status-badge st-status--ng">
                          <XCircle size={13} /> NG
                        </span>
                      )
                    ) : (
                      <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Menampilkan {(page-1)*perPage+1}–{Math.min(page*perPage, filteredParts.length)} dari {filteredParts.length} part
          </span>
          <div className="pagination-btns">
            <button className="pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`pg-btn${n === page ? ' pg-btn--active' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button className="pg-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { StockTakingPage });
