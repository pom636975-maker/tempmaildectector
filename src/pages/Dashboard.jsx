import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardMetrics, getRiskEvents } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('Today');

  useEffect(() => {
    Promise.all([getDashboardMetrics(), getRiskEvents()]).then(([m, e]) => {
      setMetrics(m);
      setEvents(e.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalDecisions = (metrics.allowCount || 756) + (metrics.reviewCount || 203) + (metrics.blockCount || 289);
  const qualityScore = metrics.signupQualityScore || 84;
  // Circumference for r=58 circle
  const circumference = 2 * Math.PI * 58; // 364.4
  const strokeDashoffset = circumference * (1 - qualityScore / 100);

  const mockEvents = [
    { email: 'user@tempmail.dev',       score: 89, reasons: ['temp_email', 'VPN'],   decision: 'BLOCK',   area: 'AI Credits + CRM',  time: '2 min ago' },
    { email: 'trial@maildrop.cc',       score: 76, reasons: ['repeat_ip'],           decision: 'BLOCK',   area: 'Email List',         time: '8 min ago' },
    { email: 'legit.founder@startup.io',score: 12, reasons: [],                      decision: 'ALLOW',   area: 'Full Product Access',time: '14 min ago' },
    { email: 'test123@guerrillamail.com',score: 91, reasons: ['temp_email','velocity'],decision:'BLOCK',  area: 'AI Credits',         time: '21 min ago' },
    { email: 'real.user@company.com',   score: 8,  reasons: [],                      decision: 'ALLOW',   area: 'Full Product Access',time: '35 min ago' },
  ];

  const displayEvents = events.length > 0 ? events.map((e, i) => ({
    email: e.email,
    score: e.riskScore,
    reasons: e.reasons?.slice(0, 2) || [],
    decision: e.decision,
    area: e.protectedArea || 'AI Credits + CRM',
    time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })) : mockEvents;

  return (
    <div className="animate-count">

      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Command Center</h1>
          <p className="text-on-surface-variant font-body-md">Monitor signup quality before fake users enter your product.</p>
        </div>
        <div className="flex p-1 bg-surface-container-low border border-border-subtle rounded-xl">
          {['Today', '7 days', '30 days'].map(p => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-4 py-1.5 text-label-caps font-label-caps rounded-lg transition-colors ${
                activePeriod === p
                  ? 'bg-white shadow-sm border border-border-subtle text-on-surface'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter">

        {/* ── Hero Card ── */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-border-subtle rounded-xl p-8 flex items-center justify-between relative overflow-hidden group hover:border-secondary transition-all">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-status-protected animate-pulse" />
                <span className="font-label-caps text-label-caps text-status-protected">System Active</span>
              </div>
              <h2 className="font-headline-md text-headline-md mb-2">Your signup quality is stable today.</h2>
              <p className="text-on-surface-variant text-body-lg mb-8 max-w-md">
                Our intelligence blocked <strong>{metrics.todayBlocked || 47}</strong> risky signups in the last 24 hours, preventing potential credit exhaustion.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/risk-events')}
              className="w-fit bg-primary text-on-primary px-6 py-3 rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2"
            >
              View Risk Events
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Quality Donut */}
          <div className="flex items-center gap-10">
            <div className="relative flex flex-col items-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle className="text-surface-container" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                <circle
                  className="text-secondary transition-all duration-1000"
                  cx="64" cy="64" fill="transparent" r="58"
                  stroke="currentColor"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="8"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display-lg text-[32px] text-primary">{qualityScore}</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant">QUALITY</span>
              </div>
              <div className="mt-4 flex items-center gap-1 text-status-protected font-label-caps text-[12px] font-bold">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                +12%
              </div>
            </div>
          </div>

          {/* Architectural background detail */}
          <div className="absolute top-0 right-0 h-full w-1/3 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
            <div className="grid grid-cols-4 h-full border-l border-primary">
              <div className="border-r border-primary h-full" />
              <div className="border-r border-primary h-full" />
              <div className="border-r border-primary h-full" />
            </div>
          </div>
        </div>

        {/* ── Cost Protection Card ── */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-border-subtle rounded-xl p-8 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">TOTAL PROTECTED</p>
              <h3 className="font-display-lg text-[40px] text-primary">${metrics.totalProtected || 928}</h3>
            </div>
            <div className="p-2 bg-secondary/10 rounded-lg">
              <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
            </div>
          </div>
          <div className="space-y-4 mb-6">
            {[
              { label: 'Cloud Infrastructure',   value: '$412.00' },
              { label: 'Third-party API Costs',  value: '$388.50' },
              { label: 'Marketing Acquisition',  value: '$127.50' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-code-sm">
                <span className="text-on-surface-variant">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
          {/* Mini bar chart */}
          <div className="mt-auto h-12 w-full bg-surface-container-low rounded-lg overflow-hidden flex items-end px-4 gap-1">
            {[20, 40, 30, 60, 95, 50, 30].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-secondary rounded-t-sm"
                style={{ height: `${h}%`, opacity: h / 100 + 0.1 }}
              />
            ))}
          </div>
        </div>

        {/* ── Metric Grid ── */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Fake signups blocked',    value: metrics.fakeSignupsBlocked || 289,         delta: '+18%',    deltaColor: 'text-status-risk',      barColor: 'bg-status-risk',      barW: '18%' },
            { label: 'AI Credits Saved',         value: `$${metrics.aiCreditsSaved || 742}`,       delta: '+$128',   deltaColor: 'text-secondary',        barColor: 'bg-secondary',        barW: '65%' },
            { label: 'Junk Contacts prevented',  value: metrics.junkContactsPrevented || 312,      delta: '63 today',deltaColor: 'text-status-warning',   barColor: 'bg-status-warning',   barW: '40%' },
            { label: 'Marketing Waste Protected',value: `$${metrics.marketingWasteProtected || 186}`,delta: '+9%',  deltaColor: 'text-status-protected', barColor: 'bg-status-protected', barW: '25%' },
            { label: 'Risky Signup Rate',        value: `${metrics.riskySignupRate || 33.1}%`,    delta: '-4.2%',   deltaColor: 'text-status-warning',   barColor: 'bg-status-warning',   barW: '33%' },
          ].map(({ label, value, delta, deltaColor, barColor, barW }) => (
            <div key={label} className="bg-white border border-border-subtle p-6 rounded-xl metric-card-hover transition-all">
              <p className="font-label-caps text-[10px] text-on-surface-variant mb-4 uppercase tracking-wider">{label}</p>
              <div className="flex items-end justify-between">
                <h4 className="font-headline-sm text-headline-sm text-primary">{value}</h4>
                <span className={`${deltaColor} font-bold text-code-sm flex items-center gap-1`}>{delta}</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className={`${barColor} h-full`} style={{ width: barW }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Risk Trends Chart ── */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-border-subtle rounded-xl p-8">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-headline-sm text-[18px]">Risk Trends</h3>
            <div className="flex gap-4">
              {[
                { color: 'bg-primary',        label: 'Total' },
                { color: 'bg-secondary',      label: 'Risky' },
                { color: 'bg-status-risk',    label: 'Blocked' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-3 h-[2px] ${color} inline-block`} />
                  <span className="text-code-sm text-on-surface-variant">{label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Pseudo bar chart */}
          <div className="h-64 flex items-end gap-1 relative">
            {[40,45,38,55,60,50,42,70,68,85,75,30,35,15,20].map((h, i) => {
              const colors = ['bg-surface-container','bg-surface-container','bg-surface-container','bg-surface-container','bg-surface-container','bg-surface-container','bg-surface-container','bg-surface-container','bg-surface-container','bg-surface-container','bg-surface-container','bg-secondary','bg-secondary','bg-status-risk','bg-status-risk'];
              const opacities = [null,null,null,null,null,null,null,null,null,null,null,'opacity-20','opacity-30','opacity-20','opacity-40'];
              return (
                <div
                  key={i}
                  className={`flex-1 ${colors[i]} ${opacities[i] || ''} hover:bg-surface-container-high transition-colors`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
            <div className="absolute bottom-0 w-full h-[1px] bg-border-subtle" />
          </div>
          <div className="mt-4 flex justify-between text-code-sm text-on-surface-variant opacity-40 font-label-caps">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
          </div>
        </div>

        {/* ── Funnel Protection Flow ── */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-border-subtle rounded-xl p-8">
          <h3 className="font-headline-sm text-[18px] mb-8">Funnel Protection Flow</h3>
          <div className="flex flex-col gap-6">
            {[
              { icon: 'description',   iconBg: 'bg-surface-container-low border border-border-subtle', iconColor: 'text-on-surface-variant', barColor: 'bg-primary',          barW: '100%',   value: '1,248', label: 'Signups',   valueColor: '' },
              { icon: 'verified_user', iconBg: 'bg-secondary/10 border border-secondary/20',            iconColor: 'text-secondary',          barColor: null,                  barW: null,     value: '289',   label: 'Blocked',  valueColor: 'text-status-risk' },
              { icon: 'hub',           iconBg: 'bg-status-protected/10 border border-status-protected/20',iconColor:'text-status-protected',  barColor: 'bg-status-protected', barW: '67%',    value: '959',   label: 'Processed',valueColor: '' },
            ].map(({ icon, iconBg, iconColor, barColor, barW, value, label, valueColor }, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
                </div>
                <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden flex">
                  {i === 1 ? (
                    <>
                      <div className="bg-secondary h-full w-[67%]" />
                      <div className="bg-status-risk h-full w-[33%]" />
                    </>
                  ) : (
                    <div className={`${barColor} h-full`} style={{ width: barW }} />
                  )}
                </div>
                <div className="w-24 text-right">
                  <span className={`text-code-sm font-bold ${valueColor}`}>{value}</span>
                  <p className="text-[10px] text-on-surface-variant font-label-caps">{label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border-subtle bg-surface-container-lowest">
              <p className="text-[10px] font-label-caps text-on-surface-variant mb-1">STRICTER BLOCKING</p>
              <p className="text-code-sm">Block all VPN users by default to reduce risk by 14%.</p>
            </div>
            <div className="p-4 rounded-lg border border-border-subtle bg-surface-container-lowest">
              <p className="text-[10px] font-label-caps text-on-surface-variant mb-1">INTEGRATION ALERT</p>
              <p className="text-code-sm">Connect Mailchimp to sync protected list.</p>
            </div>
          </div>
        </div>

        {/* ── Live Risk Events Table ── */}
        <div className="col-span-12 bg-white border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-border-subtle flex justify-between items-center">
            <h3 className="font-headline-sm text-[18px]">Live Risk Events</h3>
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
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-border-subtle">
                <tr>
                  {['Email Address','Risk Score','Reasons','Decision','Protected Area','Time'].map(h => (
                    <th key={h} className="px-8 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {displayEvents.map((e, i) => (
                  <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-8 py-4 text-code-sm font-bold">{e.email}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className={`h-full ${e.score >= 70 ? 'bg-status-risk' : e.score >= 40 ? 'bg-status-warning' : 'bg-status-protected'}`}
                            style={{ width: `${e.score}%` }}
                          />
                        </div>
                        <span className={`font-bold text-code-sm ${e.score >= 70 ? 'text-status-risk' : e.score >= 40 ? 'text-status-warning' : 'text-status-protected'}`}>
                          {e.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      {e.reasons.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {e.reasons.map(r => (
                            <span key={r} className="px-2 py-0.5 bg-surface-container rounded-md text-[10px] font-bold">{r}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant text-[10px]">Clean profile</span>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 font-bold rounded-lg text-[10px] border ${
                        e.decision === 'BLOCK'
                          ? 'bg-status-risk/10 text-status-risk border-status-risk/20'
                          : e.decision === 'REVIEW'
                          ? 'bg-status-warning/10 text-status-warning border-status-warning/20'
                          : 'bg-status-protected/10 text-status-protected border-status-protected/20'
                      }`}>
                        {e.decision}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-on-surface-variant text-code-sm">{e.area}</td>
                    <td className="px-8 py-4 text-on-surface-variant text-code-sm">{e.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-4 bg-surface-container-low border-t border-border-subtle text-right">
            <Link to="/dashboard/risk-events" className="text-secondary font-bold text-code-sm hover:underline">
              View all 1,248 events
            </Link>
          </div>
        </div>

        {/* ── Bottom Cards ── */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Integration Status */}
          <div className="bg-white border border-border-subtle p-6 rounded-xl">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Integration Status</h4>
            <div className="space-y-3">
              {['API Gateway','Webhooks','HubSpot CRM','Intercom'].map(name => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-code-sm">{name}</span>
                  <span className="w-2 h-2 rounded-full bg-status-protected" />
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-white border border-border-subtle p-6 rounded-xl">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Recommended Actions</h4>
            <div className="space-y-3">
              {[
                { label: 'Review 12 pending risks',    to: '/dashboard/review-queue' },
                { label: 'Stricter blocking policy',   to: '/dashboard/rules' },
                { label: 'Enable Email Verification',  to: '/dashboard/rules' },
              ].map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="w-full text-left text-code-sm p-2 hover:bg-surface-container transition-all rounded flex items-center justify-between group hover:no-underline text-on-surface"
                >
                  {label}
                  <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100">chevron_right</span>
                </Link>
              ))}
            </div>
          </div>

          {/* API Usage */}
          <div className="bg-white border border-border-subtle p-6 rounded-xl">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">API Usage</h4>
            <div className="flex justify-between mb-2">
              <span className="text-code-sm font-bold">8,429 / 10,000</span>
              <span className="text-code-sm text-on-surface-variant">84%</span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-4">
              <div className="bg-primary h-full w-[84%]" />
            </div>
            <div className="flex justify-between items-center text-[10px] font-label-caps text-on-surface-variant">
              <span>ERROR RATE: 0.2%</span>
              <span className="text-status-protected">OPTIMAL</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
