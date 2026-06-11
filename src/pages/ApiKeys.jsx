import { useState, useEffect } from 'react';
import { getApiKeys, createApiKey, deleteApiKey, getBillingUsage } from '../services/api';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState('');
  const [billing, setBilling] = useState(null);

  const fetchKeys = () => {
    setLoading(true);
    return Promise.all([getApiKeys(), getBillingUsage()]).then(([data, usage]) => {
      setKeys(data);
      setBilling(usage);
      setError('');
      setLoading(false);
    }).catch(err => {
      setError(err.message || 'Could not load API keys.');
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const k = await createApiKey(newName);
      setKeys(prev => [k, ...prev]);
      setNewKey(k.key);
      setNewName('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not create API key.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    setRevokingId(id);
    setError('');
    try {
      await deleteApiKey(id);
      await fetchKeys();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not revoke API key.');
    } finally {
      setRevokingId(null);
    }
  };

  const copyKey = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeKeys  = keys.filter(k => k.status === 'active').length;
  const totalCalls  = keys.reduce((s, k) => s + (k.calls || 0), 0);
  const monthlyUsed = Number(billing?.checks_used ?? totalCalls);
  const monthlyLimit = Number(billing?.monthly_limit ?? 10000);
  const usagePct = monthlyLimit > 0 ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100)) : 0;
  const usageLabel = `${monthlyUsed.toLocaleString()} of ${monthlyLimit.toLocaleString()} calls used`;
  const apiEndpoint = 'https://stravotech.in/api/v1/check-signup';
  const exampleKey = newKey || 'YOUR_STRAVOTECH_API_KEY';
  const curlExample = `curl -X POST ${apiEndpoint} \\
  -H "Authorization: Bearer ${exampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"newuser@example.com","ip":"203.0.113.42","deviceId":"device_123","userAgent":"Mozilla/5.0"}'`;
  const nodeExample = `const response = await fetch("${apiEndpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${exampleKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email: user.email,
    ip: requestIp,
    deviceId: deviceFingerprint,
    userAgent: req.headers["user-agent"]
  })
});

const risk = await response.json();
if (risk.action === "BLOCK") {
  throw new Error("Signup blocked by STRAVOTECH");
}
if (risk.action === "REVIEW") {
  return requireEmailVerification({
    holdFreeCredits: true,
    reason: risk.summary
  });
}

return createAccount();`;

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
            <h2 className="font-headline-md text-headline-md mb-2">{usageLabel}</h2>
            <p className="text-on-surface-variant text-body-lg mb-6 max-w-md">You're at {usagePct}% usage this month. API checks update here after every protected signup call.</p>
            <div className="w-72 h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="bg-secondary h-full transition-all" style={{ width: `${usagePct}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-label-caps text-on-surface-variant w-72">
              <span>0</span><span className="text-secondary font-bold">{usagePct}%</span><span>{monthlyLimit.toLocaleString()}</span>
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
            { label: 'Total API Calls', value: totalCalls.toLocaleString(), delta: 'All keys', deltaColor: 'text-secondary',        barColor: 'bg-secondary',        barW: `${usagePct}%` },
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

      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden mb-6">
        <div className="px-8 py-6 border-b border-border-subtle flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-headline-sm text-[18px]">Use STRAVOTECH in your website</h3>
            <p className="text-on-surface-variant text-code-sm mt-1">Call this API from your backend before creating a user account or giving free credits.</p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-status-protected/10 text-status-protected border border-status-protected/20 font-label-caps text-[10px]">
            Server-side only
          </span>
        </div>
        <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-[120px_1fr] gap-3 text-code-sm">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Endpoint</span>
              <code className="break-all bg-surface-container-low px-3 py-2 rounded-lg border border-border-subtle">{apiEndpoint}</code>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Method</span>
              <code className="bg-surface-container-low px-3 py-2 rounded-lg border border-border-subtle">POST</code>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Header</span>
              <code className="break-all bg-surface-container-low px-3 py-2 rounded-lg border border-border-subtle">Authorization: Bearer YOUR_API_KEY</code>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface-container-low p-5">
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-3">Decision logic</p>
              <div className="space-y-2 text-code-sm">
                <p><span className="font-bold text-status-protected">ALLOW</span> - continue signup normally.</p>
                <p><span className="font-bold text-status-warning">REVIEW</span> - hold credits/access until manual approval.</p>
                <p><span className="font-bold text-status-risk">BLOCK</span> - stop signup and show a safe error.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#111827] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-[#1f2937]">
                <span className="text-[10px] font-mono text-gray-300">Node.js signup gate</span>
                <button
                  onClick={() => copyKey(nodeExample, 'node-example')}
                  className="text-[10px] font-bold text-white/80 hover:text-white"
                  type="button"
                >
                  {copied === 'node-example' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[12px] leading-5 text-gray-200"><code>{nodeExample}</code></pre>
            </div>
            <div className="bg-[#111827] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-[#1f2937]">
                <span className="text-[10px] font-mono text-gray-300">cURL test</span>
                <button
                  onClick={() => copyKey(curlExample, 'curl-example')}
                  className="text-[10px] font-bold text-white/80 hover:text-white"
                  type="button"
                >
                  {copied === 'curl-example' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[12px] leading-5 text-gray-200"><code>{curlExample}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create new key ── */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden mb-6">
        <div className="px-8 py-6 border-b border-border-subtle">
          <h3 className="font-headline-sm text-[18px]">Create New API Key</h3>
        </div>
        <div className="p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-status-risk/30 bg-status-risk/5 px-4 py-3 text-sm font-medium text-status-risk">
              {error}
            </div>
          )}
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
              disabled={creating || Boolean(revokingId) || !newName.trim()}
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
                            disabled={Boolean(revokingId)}
                            className="px-3 py-1.5 rounded-lg font-label-caps text-[10px] border border-status-risk/30 text-status-risk bg-status-risk/5 hover:bg-status-risk/10 transition-colors"
                          >
                            {revokingId === k.id ? 'Revoking...' : 'Revoke'}
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
