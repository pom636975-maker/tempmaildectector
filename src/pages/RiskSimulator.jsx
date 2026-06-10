import { useState } from 'react';
import { checkSignupRisk } from '../services/api';

export default function RiskSimulator() {
  const [form, setForm] = useState({ email: 'test@tempmail.com', ip: '192.168.1.1', country: 'RU' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const simulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const data = await checkSignupRisk({
        email: form.email,
        ip: form.ip,
        deviceId: 'dashboard-risk-simulator',
        userAgent: navigator.userAgent,
        metadata: { country: form.country, source: 'dashboard_simulator' },
      });
      setResult({ ...data, score: data.riskScore, decision: data.action });
    } catch (error) {
      setResult({ error: error.message || 'Simulation failed.' });
    } finally {
      setLoading(false);
    }
  };

  const decisionStyle = (d) => ({
    BLOCK: 'bg-status-risk/10 text-status-risk border-status-risk/20',
    REVIEW: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    ALLOW: 'bg-status-protected/10 text-status-protected border-status-protected/20',
  }[d] || '');

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Risk Simulator</h1>
          <p className="text-on-surface-variant font-body-md">Test how your current ruleset evaluates different signup payloads.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-border-subtle bg-surface-container-low">
            <h3 className="font-headline-sm text-[18px]">Test Payload</h3>
          </div>
          <form onSubmit={simulate} className="p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Email Address</label>
              <input className="w-full h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">IP Address</label>
              <input className="w-full h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
                value={form.ip} onChange={e => setForm(f => ({ ...f, ip: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Country Code</label>
              <select className="w-full h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                <option value="US">US – United States</option>
                <option value="IN">IN – India</option>
                <option value="RU">RU – Russia</option>
                <option value="CN">CN – China</option>
                <option value="DE">DE – Germany</option>
                <option value="GB">GB – United Kingdom</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors mt-4 flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Simulating...</> : 'Run Simulation'}
            </button>
          </form>
        </div>

        <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-border-subtle bg-surface-container-low">
            <h3 className="font-headline-sm text-[18px]">Simulation Result</h3>
          </div>
          <div className="p-8">
            {!result && !loading && (
              <div className="h-48 flex flex-col items-center justify-center text-on-surface-variant gap-3">
                <span className="material-symbols-outlined text-[40px] opacity-30">science</span>
                <p className="text-code-sm">Run a simulation to see results</p>
              </div>
            )}
            {loading && (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {result?.error && !loading && (
              <div className="rounded-lg border border-status-risk/30 bg-status-risk/5 px-4 py-3 text-status-risk font-medium">{result.error}</div>
            )}
            {result && !result.error && !loading && (
              <div className="animate-count space-y-6">
                <div className="flex items-center gap-6 p-6 bg-surface-container-low rounded-xl border border-border-subtle">
                  <div className="text-center w-28">
                    <p className={`font-headline-sm text-5xl font-bold ${result.score >= 80 ? 'text-status-risk' : result.score >= 40 ? 'text-status-warning' : 'text-status-protected'}`}>{result.score}</p>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mt-2">RISK SCORE</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">DECISION</p>
                    <span className={`px-4 py-2 font-bold rounded-lg text-[12px] border ${decisionStyle(result.decision)}`}>{result.decision}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border-subtle bg-surface-container-low p-4">
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">CONFIDENCE</p>
                    <p className="font-headline-sm text-xl">{result.confidence}%</p>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-surface-container-low p-4">
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">NEXT STEP</p>
                    <p className="text-code-sm font-bold">{result.nextStep?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-4">
                  <p className="font-label-caps text-[10px] text-secondary mb-2">RECOMMENDED ACTION</p>
                  <p className="text-code-sm leading-6">{result.recommendation}</p>
                </div>
                <div>
                  <p className="font-label-caps text-[10px] text-on-surface-variant mb-3 uppercase">Triggered Rules</p>
                  {result.reasons.length === 0
                    ? <p className="text-code-sm text-on-surface-variant">No rules triggered — clean profile</p>
                    : <div className="space-y-2">
                        {(result.signals || result.reasons.map(code => ({ code, detail: code.replace(/_/g, ' ') }))).map(signal => (
                          <div key={signal.code} className="px-4 py-3 bg-white border border-status-risk/20 rounded-lg flex items-start gap-3">
                            <span className="material-symbols-outlined text-status-risk text-[18px]">warning</span>
                            <div>
                              <p className="text-code-sm font-bold">{signal.code.replace(/_/g, ' ')}</p>
                              <p className="text-[11px] text-on-surface-variant mt-1">{signal.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
