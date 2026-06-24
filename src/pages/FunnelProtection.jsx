import { useEffect, useMemo, useState } from 'react';
import { getDashboardMetrics } from '../services/api';

const formatNumber = (value) => Number(value || 0).toLocaleString();
const percent = (value, total) => (total > 0 ? `${Math.min(100, Math.round((value / total) * 100))}%` : '0%');

export default function FunnelProtection() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getDashboardMetrics()
      .then((data) => {
        if (!mounted) return;
        setMetrics(data);
        setError('');
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Could not load funnel metrics.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const total = Number(metrics?.total_signup_checks || 0);
  const blocked = Number(metrics?.fake_signups_blocked || 0);
  const reviewed = Number(metrics?.risky_signups_reviewed || 0);
  const allowed = Number(metrics?.allowed_signups || 0);
  const passed = allowed + reviewed;
  const protectedSteps = total > 0 ? 3 : 1;

  const cards = useMemo(() => ([
    { label: 'Total Signups', value: formatNumber(total), delta: 'real checks', color: 'text-primary', bar: 'bg-primary', w: total > 0 ? '100%' : '0%' },
    { label: 'Fake Blocked', value: formatNumber(blocked), delta: `${metrics?.risky_signup_rate ?? 0}% risky`, color: 'text-status-risk', bar: 'bg-status-risk', w: percent(blocked, total) },
    { label: 'Passed Verification', value: formatNumber(passed), delta: percent(passed, total), color: 'text-status-protected', bar: 'bg-status-protected', w: percent(passed, total) },
    { label: 'Steps Protected', value: `${protectedSteps}/4`, delta: 'steps', color: 'text-secondary', bar: 'bg-secondary', w: `${(protectedSteps / 4) * 100}%` },
  ]), [allowed, blocked, metrics?.risky_signup_rate, passed, protectedSteps, total]);

  const steps = [
    { name: 'Signup Form', icon: 'description', status: 'Protected', count: total, blocked, passed, barW: total > 0 ? '100%' : '0%', barColor: 'bg-primary' },
    { name: 'Email Verification', icon: 'verified_user', status: 'Protected', count: passed, blocked: 0, passed, barW: percent(passed, total), barColor: 'bg-secondary' },
    { name: 'Onboarding Flow', icon: 'hub', status: 'Protected', count: allowed, blocked: 0, passed: allowed, barW: percent(allowed, total), barColor: 'bg-status-protected' },
    { name: 'Payment / Upgrade', icon: 'credit_card', status: 'Unprotected', count: null, blocked: null, passed: null, barW: '0%', barColor: 'bg-surface-container' },
  ];

  const statusStyle = (status) =>
    status === 'Protected' ? 'bg-status-protected text-white' : 'bg-surface-container-high text-on-surface-variant';

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Funnel Protection</h1>
          <p className="text-on-surface-variant font-body-md">Visualize where STRAVOTECH secures each step of your user journey.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-status-risk/30 bg-status-risk/5 px-4 py-3 text-sm font-medium text-status-risk">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-border-subtle rounded-xl">
          <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-8">
            {cards.map((metric) => (
              <div key={metric.label} className="bg-white border border-border-subtle p-6 rounded-xl metric-card-hover transition-all">
                <p className="font-label-caps text-[10px] text-on-surface-variant mb-4 uppercase tracking-wider">{metric.label}</p>
                <div className="flex items-end justify-between">
                  <h4 className="font-headline-sm text-headline-sm text-primary">{metric.value}</h4>
                  <span className={`${metric.color} font-bold text-code-sm`}>{metric.delta}</span>
                </div>
                <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className={`${metric.bar} h-full`} style={{ width: metric.w }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            <div className="bg-white border border-border-subtle rounded-xl p-8">
              <h3 className="font-headline-sm text-[18px] mb-8">Funnel Protection Flow</h3>
              {total === 0 && (
                <div className="mb-6 rounded-lg border border-border-subtle bg-surface-container-low p-4 text-code-sm text-on-surface-variant">
                  No signup checks yet. Once your API is called, this funnel will show real counts.
                </div>
              )}
              <div className="flex flex-col gap-6">
                {steps.map((step) => (
                  <div key={step.name} className="flex items-center gap-4">
                    <div className={`w-12 h-12 border rounded-lg flex items-center justify-center flex-shrink-0 ${step.status === 'Protected' ? 'bg-secondary/10 border-secondary/20' : 'bg-surface-container-low border-border-subtle'}`}>
                      <span className={`material-symbols-outlined ${step.status === 'Protected' ? 'text-secondary' : 'text-on-surface-variant'}`}>{step.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-code-sm font-bold text-on-surface">{step.name}</span>
                        {step.count !== null && <span className="text-code-sm font-bold">{formatNumber(step.count)}</span>}
                      </div>
                      <div className="h-3 bg-surface-container rounded-full overflow-hidden flex">
                        <div className={`${step.barColor} h-full transition-all`} style={{ width: step.barW }} />
                        {step.blocked > 0 && <div className="bg-status-risk h-full" style={{ width: percent(step.blocked, total) }} />}
                      </div>
                      {step.blocked !== null && (
                        <div className="flex gap-4 mt-1">
                          <span className="font-label-caps text-[10px] text-secondary">{formatNumber(step.passed || 0)} Passed</span>
                          {step.blocked > 0 && <span className="font-label-caps text-[10px] text-status-risk">{formatNumber(step.blocked)} Blocked</span>}
                        </div>
                      )}
                    </div>
                    <div className="w-20 text-right flex-shrink-0">
                      <span className={`font-label-caps text-[10px] px-2 py-1 rounded-full ${statusStyle(step.status)}`}>{step.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-gutter">
              <div className="bg-white border border-border-subtle rounded-xl p-6">
                <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Real Data</h4>
                <p className="text-code-sm text-on-surface mb-4">These numbers now come from your live signup checks, not demo data.</p>
              </div>
              <div className="bg-white border border-border-subtle rounded-xl p-6">
                <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Integration Alert</h4>
                <p className="text-code-sm text-on-surface mb-4">Connect your signup API to start filling this funnel with production events.</p>
                <button className="w-fit px-5 py-2.5 border border-border-subtle rounded-lg font-label-caps text-label-caps hover:bg-surface-container transition-colors">
                  Go to API Keys
                </button>
              </div>
              <div className="bg-white border border-border-subtle rounded-xl p-6">
                <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Protect Payment Step</h4>
                <p className="text-code-sm text-on-surface mb-4">Add STRAVOTECH checks before trials, credits, and upgrades to reduce abuse after signup.</p>
                <button className="w-fit px-5 py-2.5 border border-border-subtle rounded-lg font-label-caps text-label-caps hover:bg-surface-container transition-colors">
                  View Docs
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
