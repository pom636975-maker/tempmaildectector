import { useState, useEffect } from 'react';
import { getAdminSubscriptions } from '../../services/api';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminSubscriptions()
      .then(setSubscriptions)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const mrr = activeCount * 1200;
  const totalCollected = subscriptions
    .filter(s => s.status === 'active' || s.status === 'completed')
    .reduce((sum, s) => sum + (s.amount || 1200), 0);

  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Loading subscriptions...</p>
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>Subscriptions</h1>
        <p className="text-sm text-gray-400 mt-1">Manage and track all platform subscriptions</p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-lg transition-all" style={{ animation: 'adminSlideUp 0.5s ease-out both' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">autorenew</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Geist', sans-serif" }}>Monthly MRR</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>₹{mrr.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">{activeCount} active plan{activeCount !== 1 ? 's' : ''} × ₹1,200</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-lg transition-all" style={{ animation: 'adminSlideUp 0.5s ease-out 80ms both' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Geist', sans-serif" }}>Total Collected</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>₹{totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">Lifetime subscription revenue</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-lg transition-all" style={{ animation: 'adminSlideUp 0.5s ease-out 160ms both' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Geist', sans-serif" }}>Total Transactions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>{subscriptions.length}</p>
          <p className="text-xs text-gray-400 mt-1">All time payment records</p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden" style={{ animation: 'adminSlideUp 0.5s ease-out 240ms both' }}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Geist', sans-serif" }}>Payment History</h2>
            <p className="text-xs text-gray-400 mt-0.5">All subscription transactions</p>
          </div>
          <span className="material-symbols-outlined text-gray-300">payments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>User</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Plan</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Amount</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Payment ID</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    <span className="material-symbols-outlined text-4xl text-gray-200 mb-2 block">credit_card_off</span>
                    No subscriptions yet
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub, i) => (
                  <tr
                    key={sub.id || i}
                    className="hover:bg-blue-50/30 transition-colors"
                    style={{ animation: `adminSlideUp 0.3s ease-out ${i * 40}ms both` }}
                  >
                    <td className="py-3.5 px-5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sub.user_name || '—'}</p>
                        <p className="text-xs text-gray-400">{sub.user_email || '—'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm text-gray-700 font-medium">{sub.plan_name || 'Monthly'}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm font-bold text-gray-900">₹{(sub.amount || 1200).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[sub.status] || statusColors.pending}`}>
                        {sub.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-xs text-gray-400 font-mono">{sub.payment_id || '—'}</span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-gray-400">
                      {sub.created_at ? new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-gray-400">{subscriptions.length} total transaction{subscriptions.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}
