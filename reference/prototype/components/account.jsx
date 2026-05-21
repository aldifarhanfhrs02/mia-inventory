// components/account.jsx — Account page + Change Password form

const { useState: acUs } = React;

// ─── Password Strength Meter ─────────────────────────────────────────────────

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: 'var(--muted)' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score: 1, label: 'Lemah', color: 'var(--chart-4)' };
  if (score <= 2) return { score: 2, label: 'Sedang', color: 'var(--chart-3)' };
  if (score <= 3) return { score: 3, label: 'Kuat', color: 'var(--chart-2)' };
  return { score: 4, label: 'Sangat Kuat', color: 'var(--chart-2)' };
}

function PasswordStrengthBar({ password }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="ac-strength">
      <div className="ac-strength-track">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="ac-strength-seg" style={{ background: i <= score ? color : 'var(--muted)' }} />
        ))}
      </div>
      <span className="ac-strength-label" style={{ color }}>Kekuatan: {label}</span>
    </div>
  );
}

// ─── Validation helpers ──────────────────────────────────────────────────────

function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 8) errors.push('Minimum 8 karakter');
  if (!/[a-zA-Z]/.test(pwd)) errors.push('Harus mengandung huruf');
  if (!/[0-9]/.test(pwd)) errors.push('Harus mengandung angka');
  return errors;
}

// ─── Eye toggle for password ─────────────────────────────────────────────────

const EyeIcon = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = acUs(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="sm-input"
        style={{ paddingRight: 38 }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="icon-btn"
        style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30 }}
        onClick={() => setShow(s => !s)}
        title={show ? 'Sembunyikan' : 'Tampilkan'}
      >
        {show ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
      </button>
    </div>
  );
}

// ─── Change Password Form ────────────────────────────────────────────────────

function ChangePasswordForm({ onBack }) {
  const [oldPwd, setOldPwd] = acUs('');
  const [newPwd, setNewPwd] = acUs('');
  const [confirmPwd, setConfirmPwd] = acUs('');
  const [submitted, setSubmitted] = acUs(false);
  const [errors, setErrors] = acUs([]);

  const handleSubmit = () => {
    const errs = validatePassword(newPwd);
    if (newPwd !== confirmPwd) errs.push('Password tidak cocok');
    if (!oldPwd) errs.push('Password lama wajib diisi');
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="ac-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Password Berhasil Diubah</div>
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20 }}>
          Password Anda telah diperbarui. Gunakan password baru saat login berikutnya.
        </div>
        <button className="mp-btn mp-btn--primary" onClick={onBack} style={{ margin: '0 auto' }}>
          Kembali ke Akun
        </button>
      </div>
    );
  }

  return (
    <div className="ac-card" style={{ maxWidth: 460 }}>
      <div className="ac-card-title" style={{ marginBottom: 20 }}>
        <button className="icon-btn" onClick={onBack} style={{ marginRight: 8 }}>
          <Icons.ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        Ganti Password
      </div>

      <div className="ac-form">
        <div className="um-field">
          <label className="sm-form-label">Password Lama <span className="sm-required">*</span></label>
          <PasswordInput value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="Masukkan password lama" />
        </div>

        <div className="um-field">
          <label className="sm-form-label">Password Baru <span className="sm-required">*</span></label>
          <PasswordInput value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimum 8 karakter" />
          <PasswordStrengthBar password={newPwd} />
          <div className="ac-pwd-reqs">
            <div className={`ac-pwd-req${newPwd.length >= 8 ? ' ac-pwd-req--ok' : ''}`}>
              {newPwd.length >= 8 ? '✓' : '○'} Min 8 karakter
            </div>
            <div className={`ac-pwd-req${/[a-zA-Z]/.test(newPwd) ? ' ac-pwd-req--ok' : ''}`}>
              {/[a-zA-Z]/.test(newPwd) ? '✓' : '○'} Mengandung huruf
            </div>
            <div className={`ac-pwd-req${/[0-9]/.test(newPwd) ? ' ac-pwd-req--ok' : ''}`}>
              {/[0-9]/.test(newPwd) ? '✓' : '○'} Mengandung angka
            </div>
          </div>
        </div>

        <div className="um-field">
          <label className="sm-form-label">Konfirmasi Password <span className="sm-required">*</span></label>
          <PasswordInput value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Ulangi password baru" />
          {confirmPwd && newPwd !== confirmPwd && (
            <div className="sm-error" style={{ marginTop: 4 }}>Password tidak cocok</div>
          )}
          {confirmPwd && newPwd === confirmPwd && confirmPwd.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--chart-2)', fontWeight: 500 }}>✓ Password cocok</div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="ac-error-box">
            {errors.map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}

        <button className="mp-btn mp-btn--primary" style={{ width: '100%', justifyContent: 'center', height: 42, marginTop: 4 }} onClick={handleSubmit}>
          Simpan Password
        </button>
      </div>
    </div>
  );
}

// ─── Account Page ────────────────────────────────────────────────────────────

function AccountPage() {
  const [view, setView] = acUs('profile'); // 'profile' | 'change-password'

  const KeyIcon = (p) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.3 9.3" /><path d="M21 2v5h-5" />
    </svg>
  );

  if (view === 'change-password') {
    return <ChangePasswordForm onBack={() => setView('profile')} />;
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="ac-card">
        {/* Avatar + Name */}
        <div className="ac-profile-header">
          <div className="ac-avatar">
            <span>A</span>
          </div>
          <div>
            <div className="ac-profile-name">Aldi Nugroho</div>
            <div className="ac-profile-role">
              <span className="um-role-badge um-role--admin">Admin</span>
            </div>
          </div>
        </div>

        <div className="ac-divider" />

        {/* Info grid */}
        <div className="ac-info-grid">
          <div className="ac-info-row">
            <span className="ac-info-label">NIK</span>
            <span className="ac-info-value mono">ADM001</span>
          </div>
          <div className="ac-info-row">
            <span className="ac-info-label">Nama Lengkap</span>
            <span className="ac-info-value">Aldi Nugroho</span>
          </div>
          <div className="ac-info-row">
            <span className="ac-info-label">Role</span>
            <span className="ac-info-value">Admin</span>
          </div>
          <div className="ac-info-row">
            <span className="ac-info-label">Status</span>
            <span className="ac-info-value"><span className="um-status-badge um-status--active">Active</span></span>
          </div>
          <div className="ac-info-row">
            <span className="ac-info-label">Login Terakhir</span>
            <span className="ac-info-value mono">14 Mei 2026, 08:00</span>
          </div>
          <div className="ac-info-row">
            <span className="ac-info-label">Terdaftar Sejak</span>
            <span className="ac-info-value mono">15 Jan 2025</span>
          </div>
        </div>

        <div className="ac-divider" />

        {/* Change password button */}
        <button className="ac-change-pwd-btn" onClick={() => setView('change-password')}>
          <KeyIcon size={16} />
          <span>Ganti Password</span>
          <Icons.ChevronRight size={15} style={{ marginLeft: 'auto', color: 'var(--muted-foreground)' }} />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { AccountPage });
