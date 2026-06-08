import { useState, useEffect } from 'react';
import { getReviewQueue, updateReviewStatus } from '../services/api';

export default function ReviewQueue() {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = () => {
    setLoading(true);
    getReviewQueue().then(data => {
      setQueue(data);
      // Auto-select first pending item if none selected or if previously selected item is no longer pending
      const pendingItems = data.filter(q => q.status === 'pending');
      if (pendingItems.length > 0) {
        setSelected(pendingItems[0]);
      } else if (data.length > 0) {
        setSelected(data[0]);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const decide = async (id, decision, email) => {
    // Optimistic status update
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: decision } : q));
    
    if (selected && selected.id === id) {
      setSelected(prev => ({ ...prev, status: decision }));
    }

    try {
      await updateReviewStatus(id, decision, email);
      
      // Auto-select next pending item
      const latestQueue = queue.map(q => q.id === id ? { ...q, status: decision } : q);
      const nextPending = latestQueue.find(q => q.status === 'pending');
      if (nextPending) {
        setSelected(nextPending);
      }
    } catch (err) {
      console.error(err);
      fetchQueue();
    }
  };

  const pending = queue.filter(q => q.status === 'pending');
  const approved = queue.filter(q => q.status === 'approved');
  const blocked = queue.filter(q => q.status === 'blocked');

  const scoreColor = (s) => s >= 80 ? 'text-status-risk' : s >= 40 ? 'text-status-warning' : 'text-status-protected';
  const scoreBar = (s) => s >= 80 ? 'bg-status-risk' : s >= 40 ? 'bg-status-warning' : 'bg-status-protected';

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Review Queue</h1>
          <p className="text-on-surface-variant font-body-md">Manually review signups flagged in the gray area (Score 40–79).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
        {[
          { label: 'Pending Review', value: pending.length, color: 'text-status-warning', bar: 'bg-status-warning' },
          { label: 'Approved', value: approved.length, color: 'text-status-protected', bar: 'bg-status-protected' },
          { label: 'Blocked', value: blocked.length, color: 'text-status-risk', bar: 'bg-status-risk' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-border-subtle p-6 rounded-xl metric-card-hover transition-all">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-4 uppercase tracking-wider">{m.label}</p>
            <div className="flex items-end justify-between">
              <h4 className="font-headline-sm text-headline-sm text-primary">{m.value}</h4>
              <span className={`${m.color} font-bold text-code-sm`}>signups</span>
            </div>
            <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
              <div className={`${m.bar} h-full`} style={{ width: `${Math.max((m.value / Math.max(queue.length, 1)) * 100, 5)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-border-subtle rounded-xl">
          <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-border-subtle bg-surface-container-low">
              <h3 className="font-headline-sm text-[16px]">Pending ({pending.length})</h3>
            </div>
            <div className="divide-y divide-border-subtle max-h-[500px] overflow-y-auto">
              {pending.length === 0 && <div className="px-6 py-10 text-center text-on-surface-variant text-code-sm">All reviews cleared ✓</div>}
              {pending.map(item => (
                <div key={item.id} onClick={() => setSelected(item)}
                  className={`p-5 cursor-pointer hover:bg-surface-container-lowest transition-colors ${selected?.id === item.id ? 'bg-surface-container-low border-l-2 border-l-secondary' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-code-sm font-bold text-on-surface truncate max-w-[160px]">{item.email}</span>
                    <span className={`font-bold text-code-sm ${scoreColor(item.riskScore)}`}>{item.riskScore}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    {item.reasons.map(r => (
                      <span key={r} className="text-[10px] bg-surface-container px-2 py-0.5 rounded font-bold text-on-surface-variant">{r.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-border-subtle rounded-xl overflow-hidden">
            {!selected ? (
              <div className="p-16 text-center text-on-surface-variant text-code-sm">Select a signup to review</div>
            ) : (
              <>
                <div className="px-8 py-6 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">Currently Reviewing</p>
                    <h2 className="font-headline-sm text-[20px] text-on-surface">{selected.email}</h2>
                  </div>
                  <div className="text-center">
                    <p className={`font-headline-sm text-4xl font-bold ${scoreColor(selected.riskScore)}`}>{selected.riskScore}</p>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mt-1">RISK SCORE</p>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <div className="flex justify-between mb-2 text-[10px] font-label-caps text-on-surface-variant">
                      <span>RISK SCORE</span><span>{selected.riskScore}/100</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className={`${scoreBar(selected.riskScore)} h-full`} style={{ width: `${selected.riskScore}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">IP Address</p>
                      <p className="text-code-sm bg-surface-container-low px-4 py-3 rounded-lg border border-border-subtle font-mono">{selected.ip}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Submitted</p>
                      <p className="text-code-sm bg-surface-container-low px-4 py-3 rounded-lg border border-border-subtle">
                        {new Date(selected.submittedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-3 uppercase">Risk Signals</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.reasons.map(r => (
                        <span key={r} className="px-3 py-1.5 bg-status-warning/10 text-status-warning border border-status-warning/20 rounded-lg text-[11px] font-bold capitalize">{r.replace(/_/g, ' ')}</span>
                      ))}
                      {selected.reasons.length === 0 && <span className="text-code-sm text-on-surface-variant">No signals — clean profile</span>}
                    </div>
                  </div>
                  {selected.status === 'pending' ? (
                    <div className="flex gap-3 pt-4 border-t border-border-subtle">
                      <button onClick={() => decide(selected.id, 'approved', selected.email)} className="flex-1 bg-status-protected text-white py-3 rounded-lg font-label-caps text-label-caps font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span> Allow Signup
                      </button>
                      <button onClick={() => decide(selected.id, 'blocked', selected.email)} className="flex-1 bg-status-risk text-white py-3 rounded-lg font-label-caps text-label-caps font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">block</span> Block Signup
                      </button>
                    </div>
                  ) : (
                    <div className={`px-4 py-3 rounded-lg border font-label-caps text-label-caps font-bold text-center ${selected.status === 'approved' ? 'bg-status-protected/10 text-status-protected border-status-protected/20' : 'bg-status-risk/10 text-status-risk border-status-risk/20'}`}>
                      {selected.status === 'approved' ? '✓ Approved — Signup Allowed' : '✗ Blocked — Signup Denied'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
