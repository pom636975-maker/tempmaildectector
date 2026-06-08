import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard',                   label: 'Overview',          end: true, icon: 'dashboard' },
  { to: '/dashboard/risk-events',       label: 'Risk Events',       icon: 'security' },
  { to: '/dashboard/api-keys',          label: 'API Keys',          icon: 'key' },
  { to: '/dashboard/rules',             label: 'Rules',             icon: 'rule' },
  { to: '/dashboard/analytics',         label: 'Analytics',         icon: 'analytics' },
  { to: '/dashboard/integrations',      label: 'Integrations',      icon: 'extension' },
  { to: '/dashboard/blocklist',         label: 'Blocklist',         icon: 'block' },
  { to: '/dashboard/review-queue',      label: 'Review Queue',      icon: 'rate_review' },
  { to: '/dashboard/risk-simulator',    label: 'Risk Simulator',    icon: 'science' },
  { to: '/dashboard/funnel-protection', label: 'Funnel Protection', icon: 'filter_alt' },
  { to: '/dashboard/projects',          label: 'Projects',          icon: 'folder' },
  { to: '/dashboard/reports',           label: 'Reports',           icon: 'summarize' },
  { to: '/dashboard/alerts',            label: 'Alerts',            icon: 'notifications_active' },
];

const BOTTOM_ITEMS = [
  { to: '/dashboard/billing',  label: 'Billing',      icon: 'credit_card' },
  { to: '/dashboard/docs',     label: 'Support',      icon: 'help' },
  { to: '/dashboard/settings', label: 'Settings',     icon: 'settings' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-body-md text-on-surface">

      <style dangerouslySetInnerHTML={{__html: `
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .metric-card-hover:hover { box-shadow: 0px 4px 20px rgba(15,23,42,0.06); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        @keyframes countUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-count { animation: countUp 0.6s ease-out forwards; }
        .nav-active {
          color: #0058be;
          font-weight: 700;
          border-right: 2px solid #0058be;
          background-color: #f4f3f2;
        }
        .nav-inactive {
          color: #45464d;
        }
        .nav-inactive:hover {
          background-color: #f4f3f2;
        }
      `}} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-surface border-r border-border-subtle flex flex-col py-8 px-4 z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="mb-10 px-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[20px]">security</span>
            </div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-primary">STRAVOTECH</h1>
          </div>
          <p className="font-label-caps text-[10px] tracking-widest text-on-surface-variant opacity-60 ml-11">FOUNDER SUITE</p>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 space-y-1 custom-scrollbar overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${isActive ? 'nav-active' : 'nav-inactive'}`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span className="font-label-caps text-label-caps">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Nav */}
        <div className="mt-auto space-y-1">
          {BOTTOM_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span className="font-label-caps text-label-caps">{label}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-label-caps text-label-caps">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Top Header ── */}
      <header className="flex justify-between items-center w-full pl-margin-desktop pr-margin-desktop h-16 md:ml-64 md:max-w-[calc(100%-256px)] bg-surface border-b border-border-subtle fixed top-0 z-40">
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 hover:bg-surface-container transition-all rounded-full mr-4"
          onClick={() => setMobileOpen(o => !o)}
        >
          <span className="material-symbols-outlined text-on-surface-variant">menu</span>
        </button>

        {/* Search */}
        <div className="flex items-center gap-6 flex-1">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px]">search</span>
            <input
              className="pl-10 pr-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg w-72 lg:w-96 text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
              placeholder="Search risky domains, events, or users..."
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-surface-container transition-all rounded-full">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          </button>
          <button className="p-2 hover:bg-surface-container transition-all rounded-full">
            <span className="material-symbols-outlined text-on-surface-variant">help_outline</span>
          </button>
          <div className="h-8 w-[1px] bg-border-subtle mx-2" />
          <button className="flex items-center gap-3 py-1.5 px-3 hover:bg-surface-container transition-all rounded-full group">
            <div className="w-8 h-8 rounded-full bg-secondary/20 border border-border-subtle flex items-center justify-center text-secondary font-bold text-sm">
              {user?.name?.[0] || 'F'}
            </div>
            <span className="font-label-caps text-label-caps hidden lg:block">Profile Settings</span>
          </button>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="md:ml-64 pt-16 min-h-screen">
        <div className="px-margin-desktop py-12 max-w-[1440px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
