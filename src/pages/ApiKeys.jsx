import { useState, useEffect } from 'react';
import { getApiKeys, createApiKey, deleteApiKey } from '../services/api';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(null);

  const fetchKeys = () => {
    setLoading(true);
    getApiKeys().then(data => {
      setKeys(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const k = await createApiKey(newName);
      setKeys(prev => [k, ...prev]);
      setNewKey(k.key);
      setNewName('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    // Optimistic revoke
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
    try {
      await deleteApiKey(id);
    } catch (err) {
      console.error(err);
      fetchKeys();
    }
  };

  const copyKey = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeKeys  = keys.filter(k => k.status === 'active').length;
  const totalCalls  = keys.reduce((s, k) => s + (k.calls || 0), 0);

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">API Keys</h1>
          <p className="text-on-surface-variant font-body-md">Manage your secret keys for integrating STRAVOTECH into your app.</p>
        </div>
      </div>

      {/* ── Hero usage card + metric cards ── */}
      <div className="grid grid-cols-12 gap-gutter mb-8">
        {/* API Usage — hero card */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-border-subtle rounded-xl p-8 flex items-center justify-between relative overflow-hidden group hover:border-secondary transition-all">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block w-2 h-2 rounded-full bg-status-protected animate-pulse" />
              <span className="font-label-caps text-label-caps text-status-protected">API Optimal</span>
            </div>
            <h2 className="font-headline-md text-headline-md mb-2">8,429 of 10,000 calls used</h2>
            <p className="text-on-surface-variant text-body-lg mb-6 max-w-md">You're at 84% usage this month. Error rate is 0.2% — well within healthy range.</p>
            <div className="w-72 h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="bg-secondary h-full w-[84%]" />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-label-caps text-on-surface-variant w-72">
              <span>0</span><span className="text-secondary font-bold">84%</span><span>10,000</span>
            </div>
          </div>
          <div className="p-4 bg-secondary/10 rounded-xl">
            <span className="material-symbols-outlined text-secondary text-[48px]">api</span>
          </div>
          {/* Architectural background */}
          <div className="absolute top-0 right-0 h-full w-1/3 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
            <div className="grid grid-cols-4 h-full border-l border-primary">
              <div className="border-r border-primary h-full" /><div className="border-r border-primary h-full" /><div className="border-r border-primary h-full" />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {[
            { label: 'Active Keys',     value: activeKeys,              delta: 'Live',        deltaColor: 'text-status-protected', barColor: 'bg-status-protected', barW: `${(activeKeys / Math.max(keys.length,1))*100}%` },
            { label: 'Total API Calls', value: totalCalls.toLocaleString(), delta: 'This month', deltaColor: 'text-secondary',        barColor: 'bg-secondary',        barW: '84%' },
          ].map(({ label, value, delta, deltaColor, barColor, barW }) => (
            <div key={label} className="flex-1 bg-white border border-border-subtle p-6 rounded-xl metric-card-hover transition-all">
              <p className="font-label-caps text-[10px] text-on-surface-variant mb-4 uppercase tracking-wider">{label}</p>
              <div className="flex items-end justify-between">
                <h4 className="font-headline-sm text-headline-sm text-primary">{value}</h4>
                <span className={`${deltaColor} font-bold text-code-sm`}>{delta}</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className={`${barColor} h-full`} style={{ width: barW }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create new key ── */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden mb-6">
        <div className="px-8 py-6 border-b border-border-subtle">
          <h3 className="font-headline-sm text-[18px]">Create New API Key</h3>
        </div>
        <div className="p-8">
          <div className="flex gap-3">
            <input
              className="flex-1 h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
              placeholder="Key name (e.g. Production App)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="w-fit bg-primary text-on-primary px-6 py-3 rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {creating
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
                : <><span className="material-symbols-outlined text-[18px]">add</span> Create Key</>
              }
            </button>
          </div>
          {newKey && (
            <div className="mt-5 p-5 bg-surface-container-low border border-border-subtle rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-status-warning text-[18px]">warning</span>
                <p className="font-label-caps text-label-caps text-status-warning">Copy this key now — it won't be shown again</p>
              </div>
              <div className="flex gap-3 items-center">
                <code className="flex-1 text-code-sm bg-primary text-green-300 px-4 py-3 rounded-lg break-all">{newKey}</code>
                <button
                  onClick={() => copyKey(newKey, 'new')}
                  className={`px-4 py-3 rounded-lg font-label-caps text-label-caps border transition-colors whitespace-nowrap ${copied === 'new' ? 'bg-status-protected/10 text-status-protected border-status-protected/30' : 'border-border-subtle hover:bg-surface-container'}`}
                >
                  {copied === 'new' ? '✓ Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Keys Table ── */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border-subtle flex justify-between items-center">
          <h3 className="font-headline-sm text-[18px]">Your API Keys</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-border-subtle rounded-lg text-code-sm font-bold flex items-center gap-2 hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              Filter
            </button>
            <button className="px-3 py-1.5 border border-border-subtle rounded-lg text-code-sm font-bold flex items-center gap-2 hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-border-subtle">
                <tr>
                  {['Name', 'Key', 'Environment', 'Calls', 'Last Used', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-8 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {keys.map(k => (
                  <tr key={k.id} className={`hover:bg-surface-container-lowest transition-colors ${k.status === 'revoked' ? 'opacity-50' : ''}`}>
                    <td className="px-8 py-4 text-code-sm font-bold">{k.name}</td>
                    <td className="px-8 py-4">
                      <code className="text-code-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
                        {k.status === 'revoked' ? <s>{k.key?.slice(0, 22)}…</s> : `${k.key?.slice(0, 22)}…`}
                      </code>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 font-bold rounded-lg text-[10px] border ${k.env === 'live' ? 'bg-status-risk/10 text-status-risk border-status-risk/20' : 'bg-secondary/10 text-secondary border-secondary/20'}`}>
                        {k.env}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-code-sm font-bold">{(k.calls || 0).toLocaleString()}</td>
                    <td className="px-8 py-4 text-on-surface-variant text-code-sm">{k.lastUsed}</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 font-bold rounded-lg text-[10px] border ${k.status === 'active' ? 'bg-status-protected/10 text-status-protected border-status-protected/20' : 'bg-surface-container text-on-surface-variant border-border-subtle'}`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      {k.status === 'active' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyKey(k.key, k.id)}
                            className={`px-3 py-1.5 rounded-lg font-label-caps text-[10px] border transition-colors ${copied === k.id ? 'bg-status-protected/10 text-status-protected border-status-protected/30' : 'border-border-subtle hover:bg-surface-container'}`}
                          >
                            {copied === k.id ? '✓ Copied' : 'Copy'}
                          </button>
                          <button
                            onClick={() => handleRevoke(k.id)}
                            className="px-3 py-1.5 rounded-lg font-label-caps text-[10px] border border-status-risk/30 text-status-risk bg-status-risk/5 hover:bg-status-risk/10 transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      )}
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
