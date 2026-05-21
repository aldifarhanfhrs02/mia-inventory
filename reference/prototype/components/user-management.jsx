// components/user-management.jsx — User Management page (admin only)

const { useState: umUs, useMemo: umUm, useRef: umUr, useEffect: umUe } = React;

// ─── Mock Users Data ─────────────────────────────────────────────────────────

const MOCK_USERS = [
  { id: 'u1', nik: 'ADM001', fullName: 'Aldi Nugroho', role: 'admin', status: 'active', lastLogin: '2026-05-14 08:00', createdAt: '2025-01-15' },
  { id: 'u2', nik: 'ADM002', fullName: 'Budi Santoso', role: 'admin', status: 'active', lastLogin: '2026-05-14 07:45', createdAt: '2025-01-15' },
  { id: 'u3', nik: 'ADM003', fullName: 'Candra Putra', role: 'admin', status: 'active', lastLogin: '2026-05-12 09:30', createdAt: '2025-02-10' },
  { id: 'u4', nik: '24100005', fullName: 'Dimas Pratama', role: 'user', status: 'active', lastLogin: '2026-05-13 10:15', createdAt: '2025-03-20' },
  { id: 'u5', nik: '24100006', fullName: 'Eko Wibowo', role: 'user', status: 'active', lastLogin: '2026-05-13 13:55', createdAt: '2025-03-20' },
  { id: 'u6', nik: '24100007', fullName: 'Fajar Hidayat', role: 'user', status: 'active', lastLogin: '2026-05-10 11:20', createdAt: '2025-04-05' },
  { id: 'u7', nik: '24100008', fullName: 'Gilang Ramadhan', role: 'user', status: 'inactive', lastLogin: '2026-04-01 08:00', createdAt: '2025-04-05' },
  { id: 'u8', nik: '24100009', fullName: 'Hendra Wijaya', role: 'user', status: 'active', lastLogin: '2026-05-11 14:10', createdAt: '2025-05-12' },
  { id: 'u9', nik: '24100010', fullName: 'Irfan Maulana', role: 'user', status: 'active', lastLogin: null, createdAt: '2026-05-14' },
];

// ─── Role Badge ──────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const map = {
    superadmin: { label: 'Super Admin', cls: 'um-role--super' },
    admin: { label: 'Admin', cls: 'um-role--admin' },
    user: { label: 'User', cls: 'um-role--user' },
  };
  const m = map[role] || map.user;
  return <span className={`um-role-badge ${m.cls}`}>{m.label}</span>;
}

function UserStatusBadge({ status }) {
  if (status === 'active') return <span className="um-status-badge um-status--active">Active</span>;
  return <span className="um-status-badge um-status--inactive">Inactive</span>;
}

// ─── Add User Dialog ─────────────────────────────────────────────────────────

function AddUserDialog({ open, onClose }) {
  const [nik, setNik] = umUs('');
  const [fullName, setFullName] = umUs('');
  const [role, setRole] = umUs('user');
  const [submitted, setSubmitted] = umUs(false);
  const [tempPwd, setTempPwd] = umUs(null);

  if (!open) return null;

  const canSubmit = nik.trim().length >= 3 && fullName.trim().length >= 1;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // Generate mock temp password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setTempPwd(`Epson@${rand}`);
    setSubmitted(true);
  };

  const handleClose = () => {
    setNik(''); setFullName(''); setRole('user');
    setSubmitted(false); setTempPwd(null);
    onClose();
  };

  return (
    <>
      <div className="sheet-overlay" onClick={handleClose} />
      <div className="um-dialog">
        {!submitted ? (
          <>
            <div className="um-dialog-header">
              <h3 className="um-dialog-title">Tambah User Baru</h3>
              <button className="icon-btn" onClick={handleClose}><Icons.X size={16} /></button>
            </div>
            <div className="um-dialog-body">
              <div className="um-field">
                <label className="sm-form-label">NIK <span className="sm-required">*</span></label>
                <input type="text" className="sm-input" placeholder="Contoh: 24100011" value={nik} onChange={e => setNik(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
              </div>
              <div className="um-field">
                <label className="sm-form-label">Nama Lengkap <span className="sm-required">*</span></label>
                <input type="text" className="sm-input" placeholder="Nama lengkap user" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="um-field">
                <label className="sm-form-label">Role</label>
                <div className="um-role-select">
                  <button className={`um-role-opt${role === 'user' ? ' um-role-opt--active' : ''}`} onClick={() => setRole('user')}>
                    <Icons.UserCircle size={15} /> User
                  </button>
                  <button className={`um-role-opt${role === 'admin' ? ' um-role-opt--active' : ''}`} onClick={() => setRole('admin')}>
                    <Icons.Users size={15} /> Admin
                  </button>
                </div>
              </div>
            </div>
            <div className="um-dialog-footer">
              <button className="mp-btn mp-btn--outline" onClick={handleClose}>Batal</button>
              <button
                className="mp-btn mp-btn--primary"
                style={{ opacity: canSubmit ? 1 : 0.5, pointerEvents: canSubmit ? 'auto' : 'none' }}
                onClick={handleSubmit}
              >
                Tambah User
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="um-dialog-header">
              <h3 className="um-dialog-title">User Berhasil Ditambahkan</h3>
              <button className="icon-btn" onClick={handleClose}><Icons.X size={16} /></button>
            </div>
            <div className="um-dialog-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{fullName}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginBottom: 16 }}>NIK: {nik} · Role: {role}</div>
              <div className="um-temp-pwd-card">
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temporary Password</div>
                <div className="um-temp-pwd-value">{tempPwd}</div>
                <div style={{ fontSize: 11, color: 'var(--chart-4)', marginTop: 6 }}>
                  ⚠ Password ini hanya ditampilkan sekali. Catat sekarang!
                </div>
              </div>
            </div>
            <div className="um-dialog-footer">
              <button className="mp-btn mp-btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleClose}>Selesai</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="um-dialog" style={{ maxWidth: 380 }}>
        <div className="um-dialog-header">
          <h3 className="um-dialog-title">{title}</h3>
        </div>
        <div className="um-dialog-body">
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="um-dialog-footer">
          <button className="mp-btn mp-btn--outline" onClick={onClose}>Batal</button>
          <button
            className="mp-btn"
            style={{
              background: danger ? 'var(--destructive)' : 'var(--primary)',
              color: 'white',
            }}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Row Action Dropdown ─────────────────────────────────────────────────────

function UserRowActions({ user, onResetPwd, onDeactivate, onChangeRole }) {
  const [open, setOpen] = umUs(false);
  const ref = umUr(null);
  umUe(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button className="row-action-btn" onClick={() => setOpen(o => !o)}>···</button>
      {open && (
        <div className="dropdown-menu dropdown-menu--right" style={{ minWidth: 180 }}>
          <button className="dropdown-item" onClick={() => { onChangeRole(user); setOpen(false); }}>
            <Icons.UserCircle size={14} /><span>Ubah Role</span>
          </button>
          <button className="dropdown-item" onClick={() => { onResetPwd(user); setOpen(false); }}>
            <Icons.RefreshCw size={14} /><span>Reset Password</span>
          </button>
          <div className="dropdown-divider" />
          {user.status === 'active' ? (
            <button className="dropdown-item dropdown-item--danger" onClick={() => { onDeactivate(user); setOpen(false); }}>
              <Icons.X size={14} /><span>Nonaktifkan</span>
            </button>
          ) : (
            <button className="dropdown-item" onClick={() => { setOpen(false); }}>
              <Icons.CheckCircle2 size={14} /><span>Aktifkan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── User Management Page ────────────────────────────────────────────────────

function UserManagementPage() {
  const [search, setSearch] = umUs('');
  const [users] = umUs(MOCK_USERS);
  const [addOpen, setAddOpen] = umUs(false);
  const [confirmState, setConfirmState] = umUs(null);
  const [resetResult, setResetResult] = umUs(null);

  const filtered = umUm(() => {
    if (!search.trim()) return users;
    const s = search.trim().toLowerCase();
    return users.filter(u =>
      u.fullName.toLowerCase().includes(s) ||
      u.nik.toLowerCase().includes(s) ||
      u.role.includes(s)
    );
  }, [search, users]);

  const activeCount = users.filter(u => u.status === 'active').length;
  const adminCount = users.filter(u => u.role === 'admin' && u.status === 'active').length;

  const fmtDate = (d) => {
    if (!d) return '—';
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const parts = d.split(/[\s-]/);
    return `${parseInt(parts[2])} ${months[parseInt(parts[1])-1]} ${parts[0]}${parts[3] ? ', ' + parts[3] : ''}`;
  };

  const handleDeactivate = (user) => {
    if (user.role === 'admin' && adminCount <= 1) {
      setConfirmState({
        title: 'Tidak Dapat Menonaktifkan',
        message: 'User ini adalah admin terakhir yang aktif. Promosikan admin lain terlebih dahulu sebelum menonaktifkan.',
        confirmLabel: 'Mengerti',
        danger: false,
        onConfirm: () => {},
      });
      return;
    }
    setConfirmState({
      title: 'Nonaktifkan User',
      message: `Apakah Anda yakin ingin menonaktifkan ${user.fullName} (${user.nik})? User tidak akan bisa login setelah dinonaktifkan.`,
      confirmLabel: 'Nonaktifkan',
      danger: true,
      onConfirm: () => {},
    });
  };

  const handleResetPwd = (user) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setResetResult({ user, tempPwd: `Epson@${rand}` });
  };

  const handleChangeRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setConfirmState({
      title: 'Ubah Role User',
      message: `Ubah role ${user.fullName} (${user.nik}) dari "${user.role}" menjadi "${newRole}"?`,
      confirmLabel: 'Ubah Role',
      danger: false,
      onConfirm: () => {},
    });
  };

  return (
    <div className="mp-page">
      {/* Toolbar */}
      <div className="mp-toolbar">
        <div className="mp-toolbar-left">
          <div className="mp-search">
            <Icons.Search size={15} className="mp-search-icon" />
            <input
              type="text"
              placeholder="Cari nama atau NIK..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mp-search-input"
            />
            {search && <button className="mp-search-clear" onClick={() => setSearch('')}>×</button>}
          </div>
        </div>
        <div className="mp-toolbar-right">
          <button className="mp-btn mp-btn--primary" onClick={() => setAddOpen(true)}>
            <Icons.Plus size={14} /> Tambah User
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="sm-summary-strip">
        <div className="sm-summary-item">
          <span className="sm-summary-label">Total User</span>
          <span className="sm-summary-value mono">{users.length}</span>
        </div>
        <div className="sm-summary-divider" />
        <div className="sm-summary-item">
          <span className="sm-summary-dot" style={{ background: 'var(--chart-2)' }} />
          <span className="sm-summary-label">Active</span>
          <span className="sm-summary-value mono">{activeCount}</span>
        </div>
        <div className="sm-summary-divider" />
        <div className="sm-summary-item">
          <span className="sm-summary-dot" style={{ background: 'var(--chart-1)' }} />
          <span className="sm-summary-label">Admin</span>
          <span className="sm-summary-value mono">{adminCount}</span>
        </div>
        <div className="sm-summary-divider" />
        <div className="sm-summary-item">
          <span className="sm-summary-dot" style={{ background: 'var(--muted-foreground)' }} />
          <span className="sm-summary-label">Inactive</span>
          <span className="sm-summary-value mono">{users.length - activeCount}</span>
        </div>
      </div>

      {/* Table */}
      <div className="mp-table-wrap">
        <table className="mp-table">
          <thead>
            <tr>
              <th style={{ width: 44, textAlign: 'center' }}>No</th>
              <th style={{ width: 100 }}>NIK</th>
              <th style={{ width: 200 }}>Nama Lengkap</th>
              <th style={{ width: 100 }}>Role</th>
              <th style={{ width: 80 }}>Status</th>
              <th style={{ width: 160 }}>Login Terakhir</th>
              <th style={{ width: 110 }}>Dibuat</th>
              <th style={{ width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="mp-empty">Tidak ada user yang cocok.</td></tr>
            )}
            {filtered.map((u, i) => (
              <tr key={u.id} className={`mp-row${u.status === 'inactive' ? ' mp-row--inactive' : ''}`}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td className="mono" style={{ fontWeight: 500 }}>{u.nik}</td>
                <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                <td><RoleBadge role={u.role} /></td>
                <td><UserStatusBadge status={u.status} /></td>
                <td className="mono sm-date-cell">
                  {u.lastLogin ? fmtDate(u.lastLogin) : <span style={{ color: 'var(--muted-foreground)' }}>Belum login</span>}
                </td>
                <td className="mono sm-date-cell">{fmtDate(u.createdAt)}</td>
                <td>
                  <UserRowActions
                    user={u}
                    onResetPwd={handleResetPwd}
                    onDeactivate={handleDeactivate}
                    onChangeRole={handleChangeRole}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Dialog */}
      <AddUserDialog open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Confirm Dialog */}
      {confirmState && (
        <ConfirmDialog
          open={true}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.danger}
          onConfirm={confirmState.onConfirm}
          onClose={() => setConfirmState(null)}
        />
      )}

      {/* Reset Password Result */}
      {resetResult && (
        <>
          <div className="sheet-overlay" onClick={() => setResetResult(null)} />
          <div className="um-dialog" style={{ maxWidth: 380 }}>
            <div className="um-dialog-header">
              <h3 className="um-dialog-title">Password Berhasil Direset</h3>
              <button className="icon-btn" onClick={() => setResetResult(null)}><Icons.X size={16} /></button>
            </div>
            <div className="um-dialog-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, marginBottom: 12 }}>
                Password untuk <strong>{resetResult.user.fullName}</strong> ({resetResult.user.nik}) telah direset.
              </div>
              <div className="um-temp-pwd-card">
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temporary Password</div>
                <div className="um-temp-pwd-value">{resetResult.tempPwd}</div>
                <div style={{ fontSize: 11, color: 'var(--chart-4)', marginTop: 6 }}>
                  ⚠ Password ini hanya ditampilkan sekali. Catat sekarang!
                </div>
              </div>
            </div>
            <div className="um-dialog-footer">
              <button className="mp-btn mp-btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setResetResult(null)}>Selesai</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { UserManagementPage });
