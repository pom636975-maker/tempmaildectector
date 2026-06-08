export default function FunnelProtection() {
  const steps = [
    { name: 'Signup Form', icon: 'description', status: 'Protected', count: 1248, blocked: 289, barW: '100%', barColor: 'bg-primary' },
    { name: 'Email Verification', icon: 'verified_user', status: 'Protected', count: 959, blocked: 0, barW: '77%', barColor: 'bg-secondary' },
    { name: 'Onboarding Flow', icon: 'hub', status: 'Protected', count: 959, blocked: 0, barW: '77%', barColor: 'bg-status-protected' },
    { name: 'Payment / Upgrade', icon: 'credit_card', status: 'Unprotected', count: null, blocked: null, barW: '0%', barColor: 'bg-surface-container' },
  ];

  const statusStyle = (s) =>
    s === 'Protected' ? 'bg-status-protected text-white' : 'bg-surface-container-high text-on-surface-variant';

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Funnel Protection</h1>
          <p className="text-on-surface-variant font-body-md">Visualize where STRAVOTECH secures each step of your user journey.</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-8">
        {[
          { label: 'Total Signups', value: '1,248', delta: 'this month', color: 'text-primary', bar: 'bg-primary', w: '100%' },
          { label: 'Fake Blocked', value: '289', delta: '+18%', color: 'text-status-risk', bar: 'bg-status-risk', w: '23%' },
          { label: 'Passed Verification', value: '959', delta: '77%', color: 'text-status-protected', bar: 'bg-status-protected', w: '77%' },
          { label: 'Steps Protected', value: '3/4', delta: 'steps', color: 'text-secondary', bar: 'bg-secondary', w: '75%' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Funnel flow — exact from stitch */}
        <div className="bg-white border border-border-subtle rounded-xl p-8">
          <h3 className="font-headline-sm text-[18px] mb-8">Funnel Protection Flow</h3>
          <div className="flex flex-col gap-6">
            {steps.map((step, i) => (
              <div key={step.name} className="flex items-center gap-4">
                <div className={`w-12 h-12 border rounded-lg flex items-center justify-center flex-shrink-0 ${step.status === 'Protected' ? 'bg-secondary/10 border-secondary/20' : 'bg-surface-container-low border-border-subtle'}`}>
                  <span className={`material-symbols-outlined ${step.status === 'Protected' ? 'text-secondary' : 'text-on-surface-variant'}`}>{step.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-code-sm font-bold text-on-surface">{step.name}</span>
                    {step.count !== null && <span className="text-code-sm font-bold">{step.count.toLocaleString()}</span>}
                  </div>
                  <div className="h-3 bg-surface-container rounded-full overflow-hidden flex">
                    <div className={`${step.barColor} h-full transition-all`} style={{ width: step.barW }} />
                    {step.blocked > 0 && <div className="bg-status-risk h-full" style={{ width: `${(step.blocked / 1248) * 100}%` }} />}
                  </div>
                  {step.blocked !== null && step.blocked > 0 && (
                    <div className="flex gap-4 mt-1">
                      <span className="font-label-caps text-[10px] text-secondary">{step.count} Passed</span>
                      <span className="font-label-caps text-[10px] text-status-risk">{step.blocked} Blocked</span>
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

        {/* Insights */}
        <div className="flex flex-col gap-gutter">
          <div className="bg-white border border-border-subtle rounded-xl p-6">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Stricter Blocking</h4>
            <p className="text-code-sm text-on-surface mb-4">Block all VPN users by default to reduce risk by 14%.</p>
            <button className="w-fit px-5 py-2.5 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors">
              Enable Rule
            </button>
          </div>
          <div className="bg-white border border-border-subtle rounded-xl p-6">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Integration Alert</h4>
            <p className="text-code-sm text-on-surface mb-4">Connect Mailchimp to sync your protected contacts list automatically.</p>
            <button className="w-fit px-5 py-2.5 border border-border-subtle rounded-lg font-label-caps text-label-caps hover:bg-surface-container transition-colors">
              Go to Integrations
            </button>
          </div>
          <div className="bg-white border border-border-subtle rounded-xl p-6">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Protect Payment Step</h4>
            <p className="text-code-sm text-on-surface mb-4">Add STRAVOTECH to your payment flow to prevent chargebacks from fake users.</p>
            <button className="w-fit px-5 py-2.5 border border-border-subtle rounded-lg font-label-caps text-label-caps hover:bg-surface-container transition-colors">
              View Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
