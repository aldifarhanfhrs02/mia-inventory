// components/icons.jsx — Lucide-style SVG icon components for MIA Inventory

const Ic = ({ size = 16, className = '', style = {}, sw = 2, children }) =>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size} height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth={sw}
  strokeLinecap="round"
  strokeLinejoin="round"
  className={className}
  style={{ flexShrink: 0, ...style, width: "21px", height: "21px" }}>
  {children}</svg>;


const LayoutDashboard = (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></Ic>;
const Package = (p) => <Ic {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></Ic>;
const ArrowUpDown = (p) => <Ic {...p}><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" /></Ic>;
const SearchIcon = (p) => <Ic {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></Ic>;
const ClipboardCheck = (p) => <Ic {...p}><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M9 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3" /><path d="m9 14 2 2 4-4" /></Ic>;
const Users = (p) => <Ic {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Ic>;
const UserCircle = (p) => <Ic {...p}><path d="M18 20a6 6 0 0 0-12 0" /><circle cx="12" cy="10" r="4" /><circle cx="12" cy="12" r="10" /></Ic>;
const PanelLeftClose = (p) => <Ic {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="m16 15-3-3 3-3" /></Ic>;
const PanelLeftOpen = (p) => <Ic {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="m14 9 3 3-3 3" /></Ic>;
const RefreshCw = (p) => <Ic {...p}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></Ic>;
const Moon = (p) => <Ic {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Ic>;
const Sun = (p) => <Ic {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Ic>;
const Monitor = (p) => <Ic {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></Ic>;
const ChevronRight = (p) => <Ic {...p}><path d="m9 18 6-6-6-6" /></Ic>;
const ChevronDown = (p) => <Ic {...p}><path d="m6 9 6 6 6-6" /></Ic>;
const LogOut = (p) => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Ic>;
const Wallet = (p) => <Ic {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></Ic>;
const CheckCircle2 = (p) => <Ic {...p}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></Ic>;
const AlertTriangle = (p) => <Ic {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Ic>;
const XCircle = (p) => <Ic {...p}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></Ic>;
const HelpCircle = (p) => <Ic {...p}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></Ic>;
const Zap = (p) => <Ic {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></Ic>;
const Cog = (p) => <Ic {...p}><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" /><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M12 2v2M12 20v2m-7.07-2.93 1.41-1.41M17.66 6.34l1.41-1.41M2 12h2M20 12h2M4.93 17.07l1.41-1.41M17.66 17.66l1.41 1.41" /></Ic>;
const Hammer = (p) => <Ic {...p}><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" /><path d="M17.64 15 22 10.64" /><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" /></Ic>;
const CircleDashed = (p) => <Ic {...p}><path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0" /><path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7" /><path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8" /><path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69" /><path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0" /><path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7" /><path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8" /><path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" /></Ic>;
const ArrowUp = (p) => <Ic {...p}><path d="m5 12 7-7 7 7M12 19V5" /></Ic>;
const ArrowDown = (p) => <Ic {...p}><path d="m19 12-7 7-7-7M12 5v14" /></Ic>;
const Edit3 = (p) => <Ic {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></Ic>;
const Plus = (p) => <Ic {...p}><path d="M12 5v14M5 12h14" /></Ic>;
const Settings = (p) => <Ic {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Ic>;
const Bell = (p) => <Ic {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Ic>;
const Menu = (p) => <Ic {...p}><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="18" x2="20" y2="18" /></Ic>;
const X = (p) => <Ic {...p}><path d="M18 6 6 18M6 6l12 12" /></Ic>;
const TrendingUp = (p) => <Ic {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></Ic>;
const Activity = (p) => <Ic {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Ic>;

const FileSpreadsheet = (p) => <Ic {...p}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" /></Ic>;
const Filter = (p) => <Ic {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></Ic>;
const ChevronsUpDown = (p) => <Ic {...p}><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></Ic>;
const Download = (p) => <Ic {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Ic>;

const Icons = {
  LayoutDashboard, Package, ArrowUpDown, Search: SearchIcon, ClipboardCheck,
  Users, UserCircle, PanelLeftClose, PanelLeftOpen, RefreshCw,
  Moon, Sun, Monitor, ChevronRight, ChevronDown, LogOut, Wallet,
  CheckCircle2, AlertTriangle, XCircle, HelpCircle, Zap, Cog,
  Hammer, CircleDashed, ArrowUp, ArrowDown, Edit3, Plus, Settings,
  Bell, Menu, X, TrendingUp, Activity,
  FileSpreadsheet, Filter, ChevronsUpDown, Download
};

Object.assign(window, { Icons });