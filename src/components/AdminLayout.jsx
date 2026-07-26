import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const ADMIN_NAV = [
  { to: '/admin',              label: 'Dashboard',      end: true, icon: 'space_dashboard' },
  { to: '/admin/users',        label: 'Users',          icon: 'group' },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: 'payments' },
];

const ADMIN_BOTTOM = [
  { to: '/dashboard', label: 'Back to App', icon: 'arrow_back' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-body-md text-on-surface">

      <style dangerouslySetInnerHTML={{__html: `
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .admin-nav-active {
          color: #0058be;
          font-weight: 700;
          border-right: 2px solid #0058be;
          background: linear-gradient(90deg, rgba(0,88,190,0.04) 0%, rgba(0,88,190,0.08) 100%);
        }
        .admin-nav-inactive { color: #45464d; }
        .admin-nav-inactive:hover { background-color: #f4f3f2; }
        .admin-sidebar-glow {
          background: linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
        }
        .admin-badge {
          background: linear-gradient(135deg, #0058be, #2170e4);
          color: white;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-fade-in { animation: adminFadeIn 0.4s ease-out forwards; }
      `}} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* ── Admin Sidebar ── */}
      <aside className={`fixed left-0 top-0 h-full w-64 admin-sidebar-glow text-white flex flex-col py-8 px-4 z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="mb-10 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">admin_panel_settings</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">STRAVOTECH</h1>
          </div>
          <div className="ml-11 flex items-center gap-2">
            <span className="admin-badge">ADMIN</span>
            <span className="text-[10px] tracking-widest text-white/40 uppercase">Control Panel</span>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 space-y-1">
          {ADMIN_NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${isActive ? 'bg-white/10 text-white font-bold border-l-2 border-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span className="text-xs font-semibold tracking-wide uppercase">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Nav */}
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          {ADMIN_BOTTOM.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span className="text-xs font-semibold tracking-wide uppercase">{label}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-red-400 hover:bg-white/5 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-xs font-semibold tracking-wide uppercase">Sign Out</span>
          </button>
        </div>

        {/* Admin user info */}
        <div className="mt-4 px-2 py-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.full_name?.[0] || user?.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.name || 'Admin'}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Top Header ── */}
      <header className="flex justify-between items-center w-full pl-8 pr-8 h-16 md:ml-64 md:max-w-[calc(100%-256px)] bg-white border-b border-[#E2E8F0] fixed top-0 z-40">
        <button
          className="md:hidden p-2 hover:bg-gray-100 transition-all rounded-full mr-4"
          onClick={() => setMobileOpen(o => !o)}
        >
          <span className="material-symbols-outlined text-gray-600">menu</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#0058be] text-[20px]">shield</span>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Admin Control Panel</h2>
          <span className="hidden sm:inline-block px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200 uppercase tracking-wider">Superadmin</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 transition-all rounded-full relative">
            <span className="material-symbols-outlined text-gray-500">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="h-8 w-[1px] bg-gray-200 mx-1" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.full_name?.[0] || user?.name?.[0] || 'A'}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="md:ml-64 pt-16 min-h-screen">
        <div className="px-8 py-8 max-w-[1440px] admin-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
