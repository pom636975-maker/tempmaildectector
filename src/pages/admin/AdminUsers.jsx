import { useState, useEffect, useMemo } from 'react';
import { getAdminUsers, updateAdminUser, deleteAdminUser } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Selected user for Deep Control Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [customQuota, setCustomQuota] = useState(10000);
  const [selectedPlan, setSelectedPlan] = useState('Growth');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

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
      result = result.filter(u => (u.account_status || 'active') === statusFilter);
    }
    return result;
  }, [users, search, statusFilter]);

  const handleUpdateStatus = async (user, newStatus) => {
    try {
      await updateAdminUser(user.id, { account_status: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, account_status: newStatus } : u));
      if (selectedUser?.id === user.id) setSelectedUser(prev => ({ ...prev, account_status: newStatus }));
      showToast(`User ${user.email} status set to ${newStatus.toUpperCase()}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleVerification = async (user) => {
    const newStatus = !user.email_verified;
    try {
      await updateAdminUser(user.id, { email_verified: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, email_verified: newStatus } : u));
      if (selectedUser?.id === user.id) setSelectedUser(prev => ({ ...prev, email_verified: newStatus }));
      showToast(`Email verification updated for ${user.email}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveModalSettings = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await updateAdminUser(selectedUser.id, {
        plan_name: selectedPlan,
        monthly_limit: customQuota,
      });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, plan_name: selectedPlan, monthly_limit: customQuota } : u));
      showToast(`Saved custom plan (${selectedPlan}) and ${customQuota.toLocaleString()} quota for ${selectedUser.email}`);
      setSelectedUser(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete user ${user.email}? This action cannot be undone.`)) return;
    try {
      await deleteAdminUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
      showToast(`User ${user.email} deleted permanently.`);
    } catch (err) {
      alert(err.message);
    }
  };

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
          <p className="text-sm text-gray-400">Loading users control panel...</p>
        </div>
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

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-medium shadow-2xl z-50 flex items-center gap-2" style={{ animation: 'adminSlideUp 0.3s ease-out both' }}>
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>User Management & Control</h1>
          <p className="text-sm text-gray-400 mt-1">{users.length} registered user account{users.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {['all', 'active', 'suspended'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
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
          placeholder="Search user by name or email..."
          className="w-full sm:w-96 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden" style={{ animation: 'adminSlideUp 0.5s ease-out 100ms both' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3.5 px-5">User</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3.5 px-5">Email</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3.5 px-5">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3.5 px-5">Verified</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3.5 px-5">Plan</th>
                <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3.5 px-5">Admin Controls</th>
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[user.account_status] || statusColors.active}`}>
                        {user.account_status || 'active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => handleToggleVerification(user)}
                        className="flex items-center gap-1 cursor-pointer"
                        title="Click to toggle email verification"
                      >
                        {user.email_verified ? (
                          <span className="material-symbols-outlined text-emerald-500 text-[20px]">verified</span>
                        ) : (
                          <span className="material-symbols-outlined text-amber-400 text-[20px]">unpublished</span>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {user.plan_name || 'Starter'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Manage / Deep Control Button */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setCustomQuota(user.monthly_limit || 10000);
                            setSelectedPlan(user.plan_name || 'Growth');
                          }}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">tune</span>
                          Manage User
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Showing {filtered.length} of {users.length} users</p>
        </div>
      </div>

      {/* ── Deep User Control Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-6 shadow-2xl space-y-6" style={{ animation: 'adminSlideUp 0.3s ease-out both' }}>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-lg">
                  {selectedUser.full_name?.[0] || selectedUser.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{selectedUser.full_name || 'User Control'}</h3>
                  <p className="text-xs font-mono text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Account Status & Access Control</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedUser, selectedUser.account_status === 'suspended' ? 'active' : 'suspended')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedUser.account_status === 'suspended'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {selectedUser.account_status === 'suspended' ? 'check_circle' : 'block'}
                  </span>
                  {selectedUser.account_status === 'suspended' ? 'Unsuspend Account' : 'Suspend Account'}
                </button>

                <button
                  onClick={() => handleToggleVerification(selectedUser)}
                  className="py-2 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  {selectedUser.email_verified ? 'Unverify Email' : 'Verify Email'}
                </button>
              </div>
            </div>

            {/* Plan Tier & Quota Control */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Assign Subscription Tier</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none"
                >
                  <option value="Starter">Starter Plan (Free)</option>
                  <option value="Growth">Growth Plan (₹1,200/mo)</option>
                  <option value="Enterprise">Enterprise Custom Tier</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Custom Monthly Check Quota</label>
                <div className="relative">
                  <input
                    type="number"
                    value={customQuota}
                    onChange={(e) => setCustomQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">checks/mo</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => handleDeleteUser(selectedUser)}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                Delete User Account
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModalSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
