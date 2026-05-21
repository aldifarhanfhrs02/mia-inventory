// components/layout.jsx — Sidebar + Navbar for MIA Inventory

const { useState, useEffect, useRef } = React;
const {
  LayoutDashboard, Package, ArrowUpDown, Search, ClipboardCheck,
  Users, UserCircle, PanelLeftClose, PanelLeftOpen, RefreshCw,
  Moon, Sun, Monitor, ChevronDown, LogOut, Settings, Bell, Menu
} = Icons;

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
{ id: 'parts', label: 'Master Part', icon: Package },
{ id: 'movements', label: 'Stock Movement', icon: ArrowUpDown },
{ id: 'search', label: 'Part Search', icon: Search },
{ id: 'stock-taking', label: 'Stock Taking', icon: ClipboardCheck }];

const NAV_ADMIN = [
{ id: 'users', label: 'User Management', icon: Users },
{ id: 'account', label: 'Account', icon: UserCircle }];


// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle, currentPage, onNavigate, isAdmin }) {
  const renderItem = (item) => {
    const active = currentPage === item.id;
    const Icon = item.icon;
    return (
      <div
        key={item.id}
        className={`nav-item${active ? ' active' : ''}`}
        onClick={() => onNavigate(item.id)}
        title={collapsed ? item.label : ''}>
        
        <span className="nav-icon"><Icon size={18} /></span>
        {!collapsed && <span className="nav-label" style={{ fontSize: "14.5px" }}>{item.label}</span>}
        {collapsed && <span className="nav-tooltip">{item.label}</span>}
      </div>);

  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Epson Logo — top */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <img src="components/Epson_logo.svg" alt="Epson" className="sidebar-epson-logo" />
        </div>
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(renderItem)}

        {/* Separator */}
        {isAdmin &&
        <>
            <div className="nav-separator" />
            {NAV_ADMIN.map(renderItem)}
          </>
        }
        {!isAdmin && renderItem(NAV_ADMIN[1])}
      </nav>

      {/* Brand text + Collapse toggle */}
      <div className="sidebar-footer">
        {!collapsed &&
          <div className="sidebar-brand-text">
            <span className="logo-title">MIA Inventory</span>
            <span className="logo-sub">PT Indonesia Epson Industry</span>
          </div>
        }
        <button className="sidebar-toggle-btn" onClick={onToggle} title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}>
          {collapsed ?
          <PanelLeftOpen size={16} /> :
          <><PanelLeftClose size={16} /><span style={{ marginLeft: 8, fontSize: "13px" }}>Collapse</span></>}
        </button>
      </div>
    </aside>);

}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle({ theme, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor }];


  const current = options.find((o) => o.value === theme) || options[2];

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} title="Toggle theme" style={{ width: "40px", height: "40px" }}>
        <current.Icon size={16} />
      </button>
      {open &&
      <div className="dropdown-menu dropdown-menu--right">
          {options.map(({ value, label, Icon }) =>
        <button
          key={value}
          className={`dropdown-item${theme === value ? ' dropdown-item--active' : ''}`}
          onClick={() => {onToggle(value);setOpen(false);}}>
          
              <Icon size={14} />
              <span>{label}</span>
            </button>
        )}
        </div>
      }
    </div>);

}

// ─── User Dropdown ────────────────────────────────────────────────────────────

function UserDropdown({ onNavigate, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button className="user-btn" onClick={() => setOpen((o) => !o)}>
        <div className="user-avatar">A</div>
        <div className="user-info">
          <span className="user-name" style={{ fontSize: "16px" }}>Aldi Nugroho</span>
          <span className="user-role" style={{ fontSize: "12px" }}>Admin</span>
        </div>
        <ChevronDown size={14} style={{ color: 'var(--muted-foreground)', marginLeft: 2 }} />
      </button>
      {open &&
      <div className="dropdown-menu dropdown-menu--right" style={{ minWidth: 200 }}>
          <div className="dropdown-header">
            <div style={{ fontWeight: 600, fontSize: 13 }}>Aldi Nugroho</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>ADM001 · Admin</div>
          </div>
          <div className="dropdown-divider" />
          <button className="dropdown-item" onClick={() => {onNavigate('account');setOpen(false);}}>
            <UserCircle size={14} /><span>Akun Saya</span>
          </button>
          <div className="dropdown-divider" />
          <button className="dropdown-item dropdown-item--danger" onClick={() => { onLogout(); setOpen(false); }}>
            <LogOut size={14} /><span>Keluar</span>
          </button>
        </div>
      }
    </div>);

}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'Selamat pagi';
  if (h >= 11 && h < 15) return 'Selamat siang';
  if (h >= 15 && h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function Navbar({ collapsed, onToggleSidebar, theme, onToggleTheme, refreshing, onRefresh, onNavigate, onLogout }) {
  const [refreshCooldown, setRefreshCooldown] = useState(false);

  const handleRefresh = () => {
    if (refreshCooldown) return;
    onRefresh();
    setRefreshCooldown(true);
    setTimeout(() => setRefreshCooldown(false), 5000);
  };

  return (
    <header className="navbar">
      {/* Mobile hamburger */}
      <button className="icon-btn lg-hidden" onClick={onToggleSidebar} style={{ width: "40px", height: "40px" }}>
        <Menu size={18} />
      </button>

      {/* Greeting */}
      <p className="navbar-greeting" style={{ fontSize: "26px" }}>
        {getGreeting()}, <strong>Aldi</strong> 👋
      </p>

      <div className="navbar-actions">
        {/* Refresh */}
        <button
          className={`icon-btn${refreshCooldown ? ' icon-btn--disabled' : ''}`}
          onClick={handleRefresh}
          disabled={refreshCooldown}
          title="Refresh data" style={{ width: "40px", height: "40px" }}>
          
          <RefreshCw size={17} className={refreshing ? 'spin' : ''} />
        </button>

        {/* Bell */}
        <button className="icon-btn" title="Notifikasi" style={{ width: "40px", height: "40px" }}>
          <Bell size={17} />
        </button>

        {/* Theme */}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        {/* User */}
        <UserDropdown onNavigate={onNavigate} onLogout={onLogout} />
      </div>
    </header>);

}

Object.assign(window, { Sidebar, Navbar });