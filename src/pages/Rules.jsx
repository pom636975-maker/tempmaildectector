import { useState, useEffect } from 'react';
import { getRules, updateRule } from '../services/api';

const ACTIONS = ['ALLOW', 'REVIEW', 'BLOCK'];

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRules().then(data => {
      setRules(data);
      setLoading(false);
    });
  }, []);

  const toggle = async (id, currentVal) => {
    // Optimistic update
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !currentVal } : r));
    try {
      await updateRule(id, { enabled: !currentVal });
    } catch (err) {
      console.error(err);
      // rollback
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: currentVal } : r));
    }
  };

  const changeAction = async (id, action) => {
    const oldRule = rules.find(r => r.id === id);
    if (!oldRule) return;
    const oldAction = oldRule.action;

    // Optimistic update
    setRules(prev => prev.map(r => r.id === id ? { ...r, action } : r));
    try {
      await updateRule(id, { action });
    } catch (err) {
      console.error(err);
      // rollback
      setRules(prev => prev.map(r => r.id === id ? { ...r, action: oldAction } : r));
    }
  };

  const counts = {
    BLOCK:  rules.filter(r => r.enabled && r.action === 'BLOCK').length,
    REVIEW: rules.filter(r => r.enabled && r.action === 'REVIEW').length,
    ALLOW:  rules.filter(r => r.enabled && r.action === 'ALLOW').length,
    off:    rules.filter(r => !r.enabled).length,
  };

  const catIconMap = { email: 'mail', network: 'router', behavior: 'speed', geo: 'public', device: 'devices' };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Protection Rules</h1>
          <p className="text-on-surface-variant font-body-md">Configure what signals trigger a Block, Review, or Allow decision.</p>
        </div>
        <button className="w-fit bg-primary text-on-primary px-6 py-3 rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Rule
        </button>
      </div>

      {/* ── Metric Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-8">
        {[
          { label: 'Blocking',  count: counts.BLOCK,  color: 'text-status-risk',       barColor: 'bg-status-risk',       barW: `${(counts.BLOCK  / Math.max(rules.length, 1)) * 100}%`, icon: 'block' },
          { label: 'Reviewing', count: counts.REVIEW, color: 'text-status-warning',    barColor: 'bg-status-warning',    barW: `${(counts.REVIEW / Math.max(rules.length, 1)) * 100}%`, icon: 'rate_review' },
          { label: 'Allowing',  count: counts.ALLOW,  color: 'text-status-protected',  barColor: 'bg-status-protected',  barW: `${(counts.ALLOW  / Math.max(rules.length, 1)) * 100}%`, icon: 'check_circle' },
          { label: 'Disabled',  count: counts.off,    color: 'text-on-surface-variant', barColor: 'bg-outline-variant',  barW: `${(counts.off    / Math.max(rules.length, 1)) * 100}%`, icon: 'toggle_off' },
        ].map(({ label, count, color, barColor, barW, icon }) => (
          <div key={label} className="bg-white border border-border-subtle p-6 rounded-xl metric-card-hover transition-all">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-4 uppercase tracking-wider">{label}</p>
            <div className="flex items-end justify-between">
              <h4 className="font-headline-sm text-headline-sm text-primary">{count}</h4>
              <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
            </div>
            <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
              <div className={`${barColor} h-full`} style={{ width: barW }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Rules Table ── */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border-subtle flex justify-between items-center">
          <h3 className="font-headline-sm text-[18px]">Active Rules</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-border-subtle rounded-lg text-code-sm font-bold flex items-center gap-2 hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              Filter
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`flex items-center gap-6 px-8 py-5 hover:bg-surface-container-lowest transition-colors ${!rule.enabled ? 'opacity-50' : ''}`}
              >
                {/* Toggle */}
                <button
                  onClick={() => toggle(rule.id, rule.enabled)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${rule.enabled ? 'bg-secondary' : 'bg-surface-container-high'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>

                {/* Icon */}
                <div className="w-10 h-10 bg-surface-container-low border border-border-subtle rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{catIconMap[rule.category] || 'rule'}</span>
                </div>

                {/* Name + desc */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-code-sm text-on-surface">{rule.name}</span>
                    <span className="px-2 py-0.5 bg-surface-container rounded-md text-[10px] font-bold text-on-surface-variant">{rule.category}</span>
                  </div>
                  <p className="text-code-sm text-on-surface-variant truncate">{rule.description}</p>
                </div>

                {/* Risk Impact */}
                <div className="text-right flex-shrink-0 w-20">
                  <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">RISK IMPACT</p>
                  <p className={`font-headline-sm text-lg ${rule.riskImpact > 0 ? 'text-status-risk' : 'text-status-protected'}`}>
                    +{rule.riskImpact}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 flex-shrink-0">
                  {ACTIONS.map(a => {
                    const isActive = rule.action === a;
                    const activeStyle = {
                      ALLOW:  'bg-status-protected/10 text-status-protected border-status-protected/30',
                      REVIEW: 'bg-status-warning/10 text-status-warning border-status-warning/30',
                      BLOCK:  'bg-status-risk/10 text-status-risk border-status-risk/30',
                    }[a];
                    return (
                      <button
                        key={a}
                        onClick={() => rule.enabled && changeAction(rule.id, a)}
                        disabled={!rule.enabled}
                        className={`px-3 py-1.5 rounded-lg font-label-caps text-[10px] border transition-colors ${isActive ? activeStyle : 'text-on-surface-variant border-border-subtle hover:bg-surface-container'}`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-8 py-4 bg-surface-container-low border-t border-border-subtle text-right">
          <button className="text-secondary font-bold text-code-sm hover:underline">Manage all rules</button>
        </div>
      </div>
    </div>
  );
}
