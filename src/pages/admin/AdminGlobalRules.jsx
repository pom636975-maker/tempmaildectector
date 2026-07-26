import { useState, useEffect } from 'react';
import { getBlocklist, addBlocklistEntry, removeBlocklistEntry } from '../../services/api';

export default function AdminGlobalRules() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState('');
  const [type, setType] = useState('domain');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getBlocklist()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newValue) return;
    setAdding(true);
    try {
      const added = await addBlocklistEntry({ type, value: newValue, reason });
      setList(prev => [added, ...prev]);
      setNewValue('');
      setReason('');
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeBlocklistEntry(id);
      setList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes adminSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>Global Blocklist & Rules</h1>
        <p className="text-sm text-gray-400 mt-1">Enforce global domain and IP restrictions across all tenant API requests</p>
      </div>

      {/* Form */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-8" style={{ animation: 'adminSlideUp 0.4s ease-out both' }}>
        <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "'Geist', sans-serif" }}>Add Global Restriction</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="domain">Domain Name</option>
              <option value="ip">IP Address</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{type === 'domain' ? 'Domain' : 'IP Address'}</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={type === 'domain' ? 'e.g. temp-mail.io' : 'e.g. 192.168.1.1'}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Reason (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Confirmed Botnet IP"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={adding}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">block</span>
              {adding ? 'Adding...' : 'Add Block'}
            </button>
          </div>
        </form>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden" style={{ animation: 'adminSlideUp 0.5s ease-out 100ms both' }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Geist', sans-serif" }}>Active Global Rules ({list.length})</h2>
          <span className="material-symbols-outlined text-gray-300">gavel</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading rules...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            <span className="material-symbols-outlined text-3xl text-gray-200 mb-2 block">security</span>
            No global restrictions set.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5">Type</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5">Target</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5">Reason</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 py-3 px-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                        {item.ip_address ? 'IP' : 'Domain'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-sm font-mono font-bold text-gray-900">
                      {item.domain || item.ip_address || item.value}
                    </td>
                    <td className="py-3 px-5 text-xs text-gray-500">
                      {item.reason || '—'}
                    </td>
                    <td className="py-3 px-5">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
