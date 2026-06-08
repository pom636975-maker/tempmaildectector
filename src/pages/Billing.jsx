import { useEffect, useState } from 'react';
import { getBillingPlans, getBillingUsage } from '../services/api';

export default function Billing() {
  const [billingPlans, setBillingPlans] = useState([]);
  const [billingUsage, setBillingUsage] = useState({
    plan: 'Growth',
    checksUsed: 0,
    checksLimit: 1,
    nextInvoice: 'Jun 30, 2026',
    cycleEnd: '2026-06-30',
  });

  useEffect(() => {
    getBillingUsage().then((usage) => setBillingUsage({
      ...usage,
      plan: usage.current_plan || usage.plan_name,
      checksUsed: usage.checks_used,
      checksLimit: usage.monthly_limit,
      cycleEnd: usage.billing_period_end,
      nextInvoice: usage.billing_period_end,
    })).catch(() => {});
    getBillingPlans().then((plans) => setBillingPlans(plans.map((plan, index) => ({
      id: plan.name,
      name: plan.name,
      price: [29, 79, 199][index] || 79,
      period: 'mo',
      current: plan.name === 'Growth',
      recommended: plan.name === 'Growth',
      features: [`${plan.monthly_limit.toLocaleString()} checks/month`, 'Risk scoring API', 'Dashboard analytics'],
    })))).catch(() => {});
  }, []);

  const usagePct = Math.round((billingUsage.checksUsed / billingUsage.checksLimit) * 100);

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Billing & Usage</h1>
          <p className="text-on-surface-variant font-body-md">Manage your subscription, monitor API usage, and review invoices.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter mb-8">
        {/* Cost Protection hero — exact from stitch dashboard */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-border-subtle rounded-xl p-8 flex items-center justify-between relative overflow-hidden group hover:border-secondary transition-all">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-status-protected animate-pulse" />
                <span className="font-label-caps text-label-caps text-status-protected">Plan Active</span>
              </div>
              <h2 className="font-headline-md text-headline-md mb-2">You're on the {billingUsage.plan} plan.</h2>
              <p className="text-on-surface-variant text-body-lg mb-8 max-w-md">
                {billingUsage.checksUsed.toLocaleString()} of {billingUsage.checksLimit.toLocaleString()} risk checks used this cycle. Next invoice: {billingUsage.nextInvoice}.
              </p>
            </div>
            <button className="w-fit bg-primary text-on-primary px-6 py-3 rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2">
              Upgrade Plan
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
          <div className="flex items-center gap-10">
            <div className="relative flex flex-col items-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle className="text-surface-container" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                <circle className="text-secondary transition-all duration-1000" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor"
                  strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * usagePct / 100)} strokeWidth="8" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display-lg text-[32px] text-primary">{usagePct}%</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant">USED</span>
              </div>
            </div>
          </div>
          {/* Architectural detail */}
          <div className="absolute top-0 right-0 h-full w-1/3 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
            <div className="grid grid-cols-4 h-full border-l border-primary">
              <div className="border-r border-primary h-full" /><div className="border-r border-primary h-full" /><div className="border-r border-primary h-full" />
            </div>
          </div>
        </div>

        {/* API Usage sidebar — exact from stitch footer card */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-border-subtle rounded-xl p-8 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">API USAGE</p>
              <h3 className="font-display-lg text-[28px] text-primary">{billingUsage.checksUsed.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-secondary/10 rounded-lg">
              <span className="material-symbols-outlined text-secondary">speed</span>
            </div>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-code-sm font-bold">{billingUsage.checksUsed.toLocaleString()} / {billingUsage.checksLimit.toLocaleString()}</span>
            <span className="text-code-sm text-on-surface-variant">{usagePct}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-4">
            <div className="bg-primary h-full transition-all" style={{ width: `${usagePct}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] font-label-caps text-on-surface-variant mb-6">
            <span>RESETS: {new Date(billingUsage.cycleEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span className="text-status-protected">OPTIMAL</span>
          </div>
          <div className="mt-auto h-12 w-full bg-surface-container-low rounded-lg overflow-hidden flex items-end px-4 gap-1">
            <div className="flex-1 bg-secondary opacity-20 h-[40%] rounded-t-sm" />
            <div className="flex-1 bg-secondary opacity-40 h-[60%] rounded-t-sm" />
            <div className="flex-1 bg-secondary opacity-30 h-[45%] rounded-t-sm" />
            <div className="flex-1 bg-secondary opacity-60 h-[80%] rounded-t-sm" />
            <div className="flex-1 bg-secondary h-[95%] rounded-t-sm" />
            <div className="flex-1 bg-secondary opacity-50 h-[70%] rounded-t-sm" />
            <div className="flex-1 bg-secondary opacity-30 h-[40%] rounded-t-sm" />
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
        {billingPlans.map(plan => (
          <div key={plan.id}
            className={`bg-white border rounded-xl p-8 flex flex-col transition-all relative overflow-hidden ${plan.current ? 'border-secondary shadow-sm' : 'border-border-subtle hover:border-secondary'}`}>
            {plan.recommended && (
              <div className="absolute top-0 right-0">
                <span className="bg-secondary text-white text-[10px] font-bold font-label-caps px-3 py-1 rounded-bl-lg">RECOMMENDED</span>
              </div>
            )}
            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-2">{plan.name}</p>
            <h3 className="font-headline-md text-[36px] text-primary mb-1">
              ${plan.price}<span className="text-[16px] text-on-surface-variant font-normal">/{plan.period}</span>
            </h3>
            <ul className="space-y-3 my-8 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-3 text-code-sm text-on-surface">
                  <span className="material-symbols-outlined text-status-protected text-[18px] mt-0.5">check_circle</span>
                  {f}
                </li>
              ))}
            </ul>
            <button className={`w-full py-3 rounded-lg font-label-caps text-label-caps font-bold transition-colors ${
              plan.current
                ? 'bg-surface-container-low border border-border-subtle text-on-surface-variant cursor-default'
                : 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant'
            }`}>
              {plan.current ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Invoices table */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
          <h3 className="font-headline-sm text-[18px]">Recent Invoices</h3>
          <button className="px-3 py-1.5 border border-border-subtle rounded-lg text-code-sm font-bold flex items-center gap-2 hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-[16px]">download</span>Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low border-b border-border-subtle">
              <tr>
                {['Invoice', 'Date', 'Amount', 'Status', 'Download'].map(h => (
                  <th key={h} className="px-8 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {[
                { id: 'INV-2026-06', date: 'Jun 1, 2026', amount: '$79.00', status: 'Paid' },
                { id: 'INV-2026-05', date: 'May 1, 2026', amount: '$79.00', status: 'Paid' },
                { id: 'INV-2026-04', date: 'Apr 1, 2026', amount: '$79.00', status: 'Paid' },
              ].map(inv => (
                <tr key={inv.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-8 py-4 text-code-sm font-bold">{inv.id}</td>
                  <td className="px-8 py-4 text-code-sm text-on-surface-variant">{inv.date}</td>
                  <td className="px-8 py-4 text-code-sm font-bold">{inv.amount}</td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-status-protected/10 text-status-protected border border-status-protected/20 rounded-lg text-[10px] font-bold">{inv.status}</span>
                  </td>
                  <td className="px-8 py-4">
                    <button className="text-secondary hover:underline text-code-sm font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">download</span> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
