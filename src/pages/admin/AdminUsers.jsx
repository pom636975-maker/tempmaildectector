import { useState, useEffect, useMemo } from 'react';
import { getAdminUsers } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(u => u.account_status === statusFilter);
    }
    return result;
  }, [users, search, statusFilter]);

  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
    blocked: 'bg-red-50 text-red-700 border-red-200',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Loading users...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>Users</h1>
          <p className="text-sm text-gray-400 mt-1">{users.length} registered user{users.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status filter chips */}
          {['all', 'active', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                statusFilter === status
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative" style={{ animation: 'adminSlideUp 0.4s ease-out both' }}>
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-[20px]">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full sm:w-96 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden" style={{ animation: 'adminSlideUp 0.5s ease-out 100ms both' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>User</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Email</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Verified</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Joined</th>
                <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5" style={{ fontFamily: "'Geist', sans-serif" }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    <span className="material-symbols-outlined text-4xl text-gray-200 mb-2 block">person_search</span>
                    {search ? 'No users match your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                filtered.map((user, i) => (
                  <tr
                    key={user.id || i}
                    className="hover:bg-blue-50/30 transition-colors group"
                    style={{ animation: `adminSlideUp 0.3s ease-out ${i * 40}ms both` }}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 text-sm font-bold border border-blue-200/50 group-hover:shadow-md transition-shadow">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm text-gray-500 font-mono">{user.email}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[user.account_status] || statusColors.pending}`}>
                        {user.account_status || 'active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {user.email_verified ? (
                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-gray-300 text-[18px]">cancel</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const newStatus = user.account_status === 'suspended' ? 'active' : 'suspended';
                            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, account_status: newStatus } : u));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                            user.account_status === 'suspended'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {user.account_status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => alert(`Granted +1,000 API Check Credits to ${user.email}`)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all cursor-pointer"
                        >
                          +1k Credits
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Showing {filtered.length} of {users.length} users</p>
        </div>
      </div>
    </div>
  );
}
