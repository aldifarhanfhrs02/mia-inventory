// components/login.jsx — Login page with warehouse animation (standalone, not bg)

const { useState: lgUs, useEffect: lgUe, useRef: lgUr } = React;

// ─── Warehouse Animation (standalone illustration) ───────────────────────────

function WarehouseIllustration() {
  return (
    <div className="lg-wh-wrap">
      <svg viewBox="0 0 560 380" className="lg-wh-svg" xmlns="http://www.w3.org/2000/svg">
        {/* Floor */}
        <rect x="0" y="300" width="560" height="80" fill="oklch(0.94 0.01 250)" className="lg-wh-floor" />
        <line x1="0" y1="300" x2="560" y2="300" stroke="oklch(0.85 0.02 250)" strokeWidth="1.5" />
        {[80,160,240,320,400,480].map(x => <line key={x} x1={x} y1="300" x2={x} y2="380" stroke="oklch(0.90 0.01 250)" strokeWidth="0.5" />)}

        {/* Back wall */}
        <rect x="30" y="50" width="500" height="250" rx="4" fill="oklch(0.96 0.005 250)" stroke="oklch(0.88 0.015 250)" strokeWidth="1.2" className="lg-wh-wall" />

        {/* Shelf 1 */}
        <g className="lg-wh-shelf">
          <rect x="55" y="85" width="140" height="215" rx="2" fill="none" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />
          <line x1="55" y1="140" x2="195" y2="140" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />
          <line x1="55" y1="195" x2="195" y2="195" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />
          <line x1="55" y1="248" x2="195" y2="248" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />
          {/* Boxes */}
          <rect x="64" y="97" width="28" height="38" rx="3" className="lg-box lg-box--blue" />
          <rect x="100" y="105" width="24" height="30" rx="3" className="lg-box lg-box--green" />
          <rect x="132" y="100" width="26" height="35" rx="3" className="lg-box lg-box--blue" />
          <rect x="166" y="108" width="20" height="26" rx="3" className="lg-box lg-box--yellow" />

          <rect x="66" y="150" width="34" height="38" rx="3" className="lg-box lg-box--green" />
          <rect x="108" y="156" width="24" height="30" rx="3" className="lg-box lg-box--yellow" />
          <rect x="140" y="152" width="28" height="36" rx="3" className="lg-box lg-box--blue" />

          <rect x="62" y="206" width="28" height="36" rx="3" className="lg-box lg-box--yellow" />
          <rect x="98" y="210" width="32" height="30" rx="3" className="lg-box lg-box--blue" />
          <rect x="140" y="204" width="26" height="34" rx="3" className="lg-box lg-box--green" />

          <rect x="68" y="256" width="36" height="40" rx="3" className="lg-box lg-box--blue" />
          <rect x="112" y="262" width="28" height="34" rx="3" className="lg-box lg-box--green" />
          <rect x="148" y="258" width="30" height="38" rx="3" className="lg-box lg-box--yellow" />
        </g>

        {/* Shelf 2 */}
        <g className="lg-wh-shelf">
          <rect x="220" y="85" width="140" height="215" rx="2" fill="none" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />
          <line x1="220" y1="140" x2="360" y2="140" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />
          <line x1="220" y1="195" x2="360" y2="195" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />
          <line x1="220" y1="248" x2="360" y2="248" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />

          <rect x="230" y="96" width="30" height="38" rx="3" className="lg-box lg-box--green" />
          <rect x="268" y="104" width="24" height="30" rx="3" className="lg-box lg-box--blue" />
          <rect x="300" y="98" width="28" height="36" rx="3" className="lg-box lg-box--yellow" />
          <rect x="336" y="106" width="18" height="28" rx="3" className="lg-box lg-box--blue" />

          <rect x="228" y="148" width="34" height="38" rx="3" className="lg-box lg-box--yellow" />
          <rect x="270" y="155" width="28" height="32" rx="3" className="lg-box lg-box--green" />
          <rect x="306" y="150" width="24" height="36" rx="3" className="lg-box lg-box--blue" />

          <rect x="232" y="204" width="30" height="34" rx="3" className="lg-box lg-box--blue" />
          <rect x="270" y="208" width="34" height="30" rx="3" className="lg-box lg-box--yellow" />
          <rect x="312" y="202" width="28" height="36" rx="3" className="lg-box lg-box--green" />

          <rect x="228" y="254" width="34" height="42" rx="3" className="lg-box lg-box--green" />
          <rect x="272" y="260" width="26" height="34" rx="3" className="lg-box lg-box--blue" />
          <rect x="306" y="256" width="30" height="38" rx="3" className="lg-box lg-box--yellow" />
        </g>

        {/* Shelf 3 */}
        <g className="lg-wh-shelf">
          <rect x="390" y="135" width="120" height="165" rx="2" fill="none" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />
          <line x1="390" y1="195" x2="510" y2="195" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />
          <line x1="390" y1="248" x2="510" y2="248" stroke="oklch(0.75 0.02 250)" strokeWidth="1.3" />

          <rect x="398" y="147" width="28" height="42" rx="3" className="lg-box lg-box--blue" />
          <rect x="434" y="153" width="24" height="36" rx="3" className="lg-box lg-box--green" />
          <rect x="466" y="149" width="26" height="38" rx="3" className="lg-box lg-box--yellow" />

          <rect x="400" y="203" width="32" height="38" rx="3" className="lg-box lg-box--yellow" />
          <rect x="440" y="209" width="26" height="30" rx="3" className="lg-box lg-box--blue" />
          <rect x="474" y="205" width="24" height="34" rx="3" className="lg-box lg-box--green" />

          <rect x="398" y="254" width="28" height="42" rx="3" className="lg-box lg-box--green" />
          <rect x="434" y="260" width="30" height="34" rx="3" className="lg-box lg-box--yellow" />
          <rect x="472" y="256" width="26" height="38" rx="3" className="lg-box lg-box--blue" />
        </g>

        {/* Forklift */}
        <g className="lg-wh-forklift">
          <rect x="0" y="268" width="56" height="32" rx="4" fill="oklch(0.55 0.19 258)" />
          <rect x="7" y="260" width="18" height="12" rx="3" fill="oklch(0.65 0.15 258)" />
          <rect x="52" y="288" width="38" height="4" rx="1.5" fill="oklch(0.50 0.02 250)" />
          <rect x="52" y="296" width="38" height="4" rx="1.5" fill="oklch(0.50 0.02 250)" />
          <rect x="52" y="278" width="3.5" height="24" rx="1.5" fill="oklch(0.50 0.02 250)" />
          <circle cx="16" cy="304" r="7" fill="oklch(0.35 0.01 250)" />
          <circle cx="44" cy="304" r="7" fill="oklch(0.35 0.01 250)" />
          <circle cx="16" cy="304" r="3" fill="oklch(0.55 0.01 250)" />
          <circle cx="44" cy="304" r="3" fill="oklch(0.55 0.01 250)" />
          <rect x="57" y="272" width="26" height="20" rx="3" fill="oklch(0.62 0.15 258)" opacity="0.85" />
        </g>

        {/* Particles */}
        <circle cx="90" cy="65" r="2" fill="oklch(0.55 0.15 258)" opacity="0.3" className="lg-wh-p lg-wh-p1" />
        <circle cx="280" cy="55" r="1.5" fill="oklch(0.55 0.15 258)" opacity="0.25" className="lg-wh-p lg-wh-p2" />
        <circle cx="450" cy="70" r="2" fill="oklch(0.55 0.15 258)" opacity="0.3" className="lg-wh-p lg-wh-p3" />
        <circle cx="180" cy="330" r="1.5" fill="oklch(0.55 0.15 258)" opacity="0.2" className="lg-wh-p lg-wh-p4" />
        <circle cx="420" cy="325" r="2" fill="oklch(0.55 0.15 258)" opacity="0.25" className="lg-wh-p lg-wh-p5" />

        {/* Scan line */}
        <line x1="400" y1="80" x2="500" y2="80" stroke="oklch(0.65 0.18 148)" strokeWidth="2" className="lg-wh-scan" />
      </svg>
    </div>
  );
}

// ─── Login Page ──────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [nik, setNik] = lgUs('');
  const [password, setPassword] = lgUs('');
  const [showPwd, setShowPwd] = lgUs(false);
  const [error, setError] = lgUs('');
  const [loading, setLoading] = lgUs(false);
  const [remember, setRemember] = lgUs(false);
  const nikRef = lgUr(null);

  lgUe(() => { if (nikRef.current) nikRef.current.focus(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!nik.trim() || !password.trim()) { setError('NIK and password are required'); return; }
    setLoading(true);
    setTimeout(() => {
      if (nik === 'ADM001' && password === 'admin123') { onLogin(); }
      else { setError('Invalid NIK or password'); setLoading(false); }
    }, 1000);
  };

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
  const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );

  return (
    <div className="lg-page">
      <div className="lg-split">
        {/* Left — warehouse illustration */}
        <div className="lg-left2">
          <WarehouseIllustration />
        </div>

        {/* Right — login form */}
        <div className="lg-right2">
          <div className="lg-form-wrap2">
            <h2 className="lg-form-title2">USER LOGIN</h2>
            <form className="lg-form" onSubmit={handleSubmit}>
              <div className="lg-field">
                <span className="lg-field-icon"><UserIcon /></span>
                <input ref={nikRef} type="text" className="lg-input" placeholder="NIK" value={nik} onChange={e => setNik(e.target.value)} autoComplete="username" />
              </div>
              <div className="lg-field">
                <span className="lg-field-icon"><LockIcon /></span>
                <input type={showPwd ? 'text' : 'password'} className="lg-input" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" className="lg-eye-btn" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {error && (
                <div className="lg-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
                  {error}
                </div>
              )}
              <div className="lg-options">
                <label className="lg-remember">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <span>Remember me</span>
                </label>
              </div>
              <button type="submit" className="lg-submit2" disabled={loading}>
                {loading ? <span className="login-spinner" /> : 'LOGIN'}
              </button>
            </form>
            <div className="lg-demo-hint2">
              Demo: <code className="mono">ADM001</code> / <code className="mono">admin123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginPage });
