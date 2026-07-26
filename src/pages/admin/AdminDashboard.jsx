import { useState, useEffect } from 'react';
import { getAdminMetrics } from '../../services/api';

function MetricCard({ icon, label, value, sub, color, delay }) {
  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
      style={{ animationDelay: `${delay}ms`, animation: `adminSlideUp 0.5s ease-out ${delay}ms both` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <span className="material-symbols-outlined text-gray-300 text-[18px] group-hover:text-gray-400 transition-colors">trending_up</span>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: "'Geist', sans-serif" }}>{label}</p>
      <p className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function RecentSignupRow({ signup, index }) {
  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    blocked: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <tr
      className="hover:bg-gray-50/50 transition-colors"
      style={{ animation: `adminSlideUp 0.3s ease-out ${index * 60}ms both` }}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 text-xs font-bold border border-blue-200/50">
            {signup.full_name?.[0] || signup.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{signup.full_name || 'Unknown'}</p>
            <p className="text-xs text-gray-400">{signup.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[signup.account_status] || statusColors.pending}`}>
          {signup.account_status || 'pending'}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-gray-400">
        {signup.created_at ? new Date(signup.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminMetrics()
      .then(setMetrics)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Loading admin metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <span className="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
        <p className="text-sm text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  const cards = [
    { icon: 'group', label: 'Total Users', value: metrics?.totalUsers ?? 0, sub: 'Registered accounts', color: 'bg-blue-50 text-blue-600', delay: 0 },
    { icon: 'verified', label: 'Active Subscriptions', value: metrics?.activeSubscriptions ?? 0, sub: 'Paid monthly plans', color: 'bg-emerald-50 text-emerald-600', delay: 80 },
    { icon: 'currency_rupee', label: 'Total Revenue', value: `₹${(metrics?.totalRevenue ?? 0).toLocaleString('en-IN')}`, sub: 'Lifetime revenue', color: 'bg-purple-50 text-purple-600', delay: 160 },
    { icon: 'shield', label: 'Risks Blocked', value: metrics?.riskEventsBlocked ?? 0, sub: 'Signups prevented', color: 'bg-red-50 text-red-600', delay: 240 },
  ];

  return (
    <div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes adminSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {/* Recent Signups Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden" style={{ animation: 'adminSlideUp 0.5s ease-out 320ms both' }}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Geist', sans-serif" }}>Recent Signups</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest user registrations across the platform</p>
          </div>
          <span className="material-symbols-outlined text-gray-300">history</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-4" style={{ fontFamily: "'Geist', sans-serif" }}>User</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-4" style={{ fontFamily: "'Geist', sans-serif" }}>Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-4" style={{ fontFamily: "'Geist', sans-serif" }}>Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(metrics?.recentSignups || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-sm text-gray-400">
                    <span className="material-symbols-outlined text-3xl text-gray-200 mb-2 block">person_off</span>
                    No recent signups
                  </td>
                </tr>
              ) : (
                metrics.recentSignups.map((signup, i) => (
                  <RecentSignupRow key={signup.id || i} signup={signup} index={i} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
