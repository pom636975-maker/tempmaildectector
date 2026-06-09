import { useEffect, useState } from 'react';
import { getRiskEvents } from '../services/api';

export default function RiskEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ decision: 'ALL', search: '' });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getRiskEvents()
      .then(e => {
        setEvents(e);
        setError('');
      })
      .catch(err => {
        setError(err.message || 'Could not load risk events.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    if (filter.decision !== 'ALL' && e.decision !== filter.decision) return false;
    if (filter.search && !e.email.toLowerCase().includes(filter.search.toLowerCase()) && !e.ip.includes(filter.search)) return false;
    return true;
  });

  const decisionStyle = (d) => ({
    BLOCK:  'bg-status-risk/10 text-status-risk border-status-risk/20',
    REVIEW: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    ALLOW:  'bg-status-protected/10 text-status-protected border-status-protected/20',
  }[d] || '');

  const scoreColor = (s) => s >= 70 ? 'text-status-risk' : s >= 40 ? 'text-status-warning' : 'text-status-protected';
  const scoreBar   = (s) => s >= 70 ? 'bg-status-risk'  : s >= 40 ? 'bg-status-warning'   : 'bg-status-protected';

  const todayBlocked = events.filter(e => e.decision === 'BLOCK').length;
  const todayReview  = events.filter(e => e.decision === 'REVIEW').length;
  const todayAllow   = events.filter(e => e.decision === 'ALLOW').length;
  const avgScore     = events.length ? Math.round(events.reduce((s, e) => s + e.riskScore, 0) / events.length) : 0;

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Risk Events</h1>
          <p className="text-on-surface-variant font-body-md">Every signup evaluated by STRAVOTECH, in real time.</p>
        </div>
        <button className="px-3 py-1.5 border border-border-subtle rounded-lg text-code-sm font-bold flex items-center gap-2 hover:bg-surface-container transition-all bg-white">
          <span className="material-symbols-outlined text-[16px]">download</span>
          Export CSV
        </button>
      </div>

      {/* ── Metric Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Blocked Today',  value: todayBlocked, delta: 'High risk',   deltaColor: 'text-status-risk',      barColor: 'bg-status-risk',      barW: `${Math.min((todayBlocked / Math.max(events.length,1)) * 100, 100)}%` },
          { label: 'Under Review',   value: todayReview,  delta: 'Manual check',deltaColor: 'text-status-warning',   barColor: 'bg-status-warning',   barW: `${Math.min((todayReview  / Math.max(events.length,1)) * 100, 100)}%` },
          { label: 'Allowed',        value: todayAllow,   delta: 'Clean',       deltaColor: 'text-status-protected', barColor: 'bg-status-protected', barW: `${Math.min((todayAllow   / Math.max(events.length,1)) * 100, 100)}%` },
          { label: 'Avg Risk Score', value: avgScore,     delta: '/100',        deltaColor: 'text-on-surface-variant',barColor: 'bg-secondary',       barW: `${avgScore}%` },
        ].map(({ label, value, delta, deltaColor, barColor, barW }) => (
          <div key={label} className="bg-white border border-border-subtle p-6 rounded-xl metric-card-hover transition-all">
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

      {/* ── Filters + Table ── */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        {/* Filter header */}
        <div className="px-8 py-6 border-b border-border-subtle flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-headline-sm text-[18px]">Live Risk Events</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">search</span>
              <input
                className="pl-9 pr-4 py-2 bg-surface-container-low border border-border-subtle rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary transition-all w-56"
                placeholder="Search email or IP…"
                value={filter.search}
                onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              />
            </div>
            {['ALL', 'ALLOW', 'REVIEW', 'BLOCK'].map(d => (
              <button
                key={d}
                onClick={() => setFilter(f => ({ ...f, decision: d }))}
                className={`px-3 py-1.5 rounded-lg font-label-caps text-label-caps border transition-colors ${
                  filter.decision === d
                    ? d === 'BLOCK'  ? 'bg-status-risk/10 text-status-risk border-status-risk/30'
                    : d === 'REVIEW' ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                    : d === 'ALLOW'  ? 'bg-status-protected/10 text-status-protected border-status-protected/30'
                    : 'bg-primary text-on-primary border-primary'
                    : 'text-on-surface-variant border-border-subtle hover:bg-surface-container'
                }`}
              >
                {d}
              </button>
            ))}
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

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="px-8 py-10 text-status-risk font-medium">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-4 opacity-30">shield</span>
            <p className="font-label-caps text-label-caps">No risk events match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low border-b border-border-subtle">
                  <tr>
                    {['Email Address', 'Risk Score', 'Reasons', 'Decision', 'Protected Area', 'Time'].map(h => (
                      <th key={h} className="px-8 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filtered.map(e => (
                    <tr
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className="hover:bg-surface-container-lowest transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-4 text-code-sm font-bold">{e.email}</td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className={`${scoreBar(e.riskScore)} h-full`} style={{ width: `${e.riskScore}%` }} />
                          </div>
                          <span className={`font-bold text-code-sm ${scoreColor(e.riskScore)}`}>{e.riskScore}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {e.reasons.slice(0, 2).map(r => (
                            <span key={r} className="px-2 py-0.5 bg-surface-container rounded-md text-[10px] font-bold">{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 font-bold rounded-lg text-[10px] border ${decisionStyle(e.decision)}`}>{e.decision}</span>
                      </td>
                      <td className="px-8 py-4 text-on-surface-variant text-code-sm">{e.protect?.join(', ') || 'AI Credits + CRM'}</td>
                      <td className="px-8 py-4 text-on-surface-variant text-code-sm">
                        {new Date(e.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-4 bg-surface-container-low border-t border-border-subtle text-right">
              <button className="text-secondary font-bold text-code-sm hover:underline">
                View all {events.length} events
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline-sm text-[18px]">Risk Event Detail</h3>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Score + decision */}
            <div className="flex items-center gap-4 mb-8 p-5 bg-surface-container-low rounded-xl border border-border-subtle">
              <div className="text-center w-20">
                <p className={`font-headline-sm text-4xl font-bold ${scoreColor(selected.riskScore)}`}>{selected.riskScore}</p>
                <p className="font-label-caps text-[10px] text-on-surface-variant mt-1">RISK SCORE</p>
              </div>
              <div className="flex-1">
                <span className={`px-3 py-1.5 font-bold rounded-lg text-[11px] border ${decisionStyle(selected.decision)}`}>
                  DECISION: {selected.decision}
                </span>
                <p className="text-code-sm text-on-surface mt-2 font-bold break-all">{selected.email}</p>
              </div>
            </div>
            <div className="space-y-5">
              {[['IP Address', selected.ip], ['Country', selected.country], ['Device ID', selected.deviceId], ['User Agent', selected.userAgent]].map(([k, v]) => (
                <div key={k}>
                  <p className="font-label-caps text-[10px] text-on-surface-variant mb-2 uppercase tracking-wider">{k}</p>
                  <p className="text-code-sm bg-surface-container-low px-3 py-2.5 rounded-lg border border-border-subtle break-all">{v}</p>
                </div>
              ))}
              <div>
                <p className="font-label-caps text-[10px] text-on-surface-variant mb-2 uppercase tracking-wider">Risk Reasons</p>
                <div className="flex flex-wrap gap-2">
                  {selected.reasons.map(r => (
                    <span key={r} className="px-2.5 py-1 bg-status-risk/10 text-status-risk border border-status-risk/20 rounded-md text-[11px] font-bold">{r}</span>
                  ))}
                </div>
              </div>
              {selected.protect && (
                <div>
                  <p className="font-label-caps text-[10px] text-on-surface-variant mb-2 uppercase tracking-wider">Protected Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.protect.map(p => (
                      <span key={p} className="px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-md text-[11px] font-bold">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
