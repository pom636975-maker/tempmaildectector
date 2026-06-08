import { useState, useEffect } from 'react';
import { getBlocklist, getAllowlist, addBlocklistEntry, addAllowlistEntry, removeBlocklistEntry, removeAllowlistEntry } from '../services/api';

const TYPE_BADGE = { email_domain: 'Email Domain', email: 'Email', ip: 'IP Address' };

export default function Blocklist() {
  const [entries, setEntries] = useState([]);
  const [allowed, setAllowed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('block');
  const [form, setForm] = useState({ type: 'email_domain', value: '', reason: '' });
  const [adding, setAdding] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([getBlocklist(), getAllowlist()]).then(([blockListData, allowListData]) => {
      setEntries(blockListData);
      setAllowed(allowListData);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const remove = async (id) => {
    if (tab === 'block') {
      setEntries(prev => prev.filter(e => e.id !== id));
      try {
        await removeBlocklistEntry(id);
      } catch (err) {
        console.error(err);
        fetchData();
      }
    } else {
      setAllowed(prev => prev.filter(e => e.id !== id));
      try {
        await removeAllowlistEntry(id);
      } catch (err) {
        console.error(err);
        fetchData();
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(false);
    
    // Optimistic UI insert placeholder
    const tempId = `temp_${Date.now()}`;
    const newEntry = { id: tempId, ...form, addedAt: 'Just now', hits: 0 };
    if (tab === 'block') {
      setEntries(prev => [newEntry, ...prev]);
      try {
        const added = await addBlocklistEntry(form);
        setEntries(prev => prev.map(item => item.id === tempId ? added : item));
      } catch (err) {
        console.error(err);
        fetchData();
      }
    } else {
      setAllowed(prev => [newEntry, ...prev]);
      try {
        const added = await addAllowlistEntry(form);
        setAllowed(prev => prev.map(item => item.id === tempId ? added : item));
      } catch (err) {
        console.error(err);
        fetchData();
      }
    }
    setForm({ type: 'email_domain', value: '', reason: '' });
  };

  const list = tab === 'block' ? entries : allowed;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Blocklist & Allowlist</h1>
          <p className="text-on-surface-variant font-body-md">Manually block or allow IPs, emails, or domains from accessing your app.</p>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="w-fit bg-primary text-on-primary px-6 py-3 rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Entry
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
        {[
          { label: 'Total Blocked', value: entries.length, delta: 'active rules', color: 'text-status-risk', bar: 'bg-status-risk', w: '70%' },
          { label: 'Allowlist Entries', value: allowed.length, delta: 'trusted bypasses', color: 'text-status-protected', bar: 'bg-status-protected', w: '30%' },
          { label: 'Hits This Month', value: entries.reduce((a, e) => a + (e.hits || 0), 0), delta: 'blocked attempts', color: 'text-secondary', bar: 'bg-secondary', w: '81%' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-border-subtle p-6 rounded-xl metric-card-hover transition-all">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-4 uppercase tracking-wider">{m.label}</p>
            <div className="flex items-end justify-between">
              <h4 className="font-headline-sm text-headline-sm text-primary">{m.value}</h4>
              <span className={`${m.color} font-bold text-code-sm`}>{m.delta}</span>
            </div>
            <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
              <div className={`${m.bar} h-full`} style={{ width: m.w }} />
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-white border border-border-subtle rounded-xl p-8 mb-8">
          <h3 className="font-headline-sm text-[18px] mb-6">Add New {tab === 'block' ? 'Blocklist' : 'Allowlist'} Entry</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase">Type</label>
              <select
                className="w-full h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                <option value="email_domain">Email Domain</option>
                <option value="email">Email Address</option>
                <option value="ip">IP Address</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase">Value</label>
              <input required className="w-full h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                placeholder={form.type === 'ip' ? 'e.g. 192.168.1.1' : form.type === 'email' ? 'e.g. spammer@mail.com' : 'e.g. tempmail.com'} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase">Reason</label>
              <input required className="w-full h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                placeholder="e.g. Disposable email domain" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            <div className="md:col-span-3 flex gap-3 pt-2">
              <button type="submit" className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors">
                Add to {tab === 'block' ? 'Blocklist' : 'Allowlist'}
              </button>
              <button type="button" onClick={() => setAdding(false)} className="px-6 py-2.5 border border-border-subtle rounded-lg font-label-caps text-label-caps hover:bg-surface-container transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs + Table */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-surface-container-low">
          <div className="flex p-1 bg-surface-container border border-border-subtle rounded-xl gap-1">
            {[['block', 'Blocked'], ['allow', 'Allowlist']].map(([val, lbl]) => (
              <button key={val} onClick={() => setTab(val)}
                className={`px-4 py-1.5 font-label-caps text-label-caps rounded-lg transition-colors ${tab === val ? 'bg-white shadow-sm border border-border-subtle text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <span className="font-label-caps text-[10px] text-on-surface-variant">{list.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-30">shield</span>
              <p className="text-code-sm">No entries found in this list.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-border-subtle">
                <tr>
                  {['Type', 'Value', 'Reason', 'Added', 'Hits', 'Action'].map(h => (
                    <th key={h} className="px-8 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {list.map(e => (
                  <tr key={e.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 bg-surface-container rounded-md text-[10px] font-bold text-on-surface-variant">{TYPE_BADGE[e.type] || e.type}</span>
                    </td>
                    <td className="px-8 py-4 text-code-sm font-bold text-on-surface font-mono">{e.value}</td>
                    <td className="px-8 py-4 text-code-sm text-on-surface-variant">{e.reason}</td>
                    <td className="px-8 py-4 text-code-sm text-on-surface-variant">
                      {new Date(e.addedAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-8 py-4 text-code-sm font-bold">{e.hits}</td>
                    <td className="px-8 py-4">
                      <button onClick={() => remove(e.id)}
                        className="px-3 py-1.5 rounded-lg font-label-caps text-[10px] font-bold border border-status-risk/20 text-status-risk bg-status-risk/5 hover:bg-status-risk/10 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
