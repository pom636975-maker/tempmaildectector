import { useEffect, useState } from 'react';
import { getReports } from '../services/api';

export default function Reports() {
  const [data, setData] = useState([]);
  useEffect(() => {
    getReports().then((report) => setData([{
      id: 'monthly',
      title: report.headline || 'Monthly Protection Summary',
      period: `${report.period_start} - ${report.period_end}`,
      fakeBlocked: report.blocked_signups,
      creditsSaved: `$${Number(report.ai_credits_saved || 0).toFixed(0)}`,
      contactsFiltered: report.junk_crm_contacts_prevented,
      totalValue: `$${Number(report.estimated_total_protected || 0).toFixed(0)}`,
    }])).catch(() => {});
  }, []);
  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Reports</h1>
          <p className="text-on-surface-variant font-body-md">Download detailed protection summaries and compliance audits.</p>
        </div>
        <button className="w-fit bg-primary text-on-primary px-6 py-3 rounded-lg font-label-caps text-label-caps font-bold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Generate Report
        </button>
      </div>

      {/* Summary metric cards from latest report */}
      {data[0] && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-8">
          {[
            { label: 'Fake Blocked', value: data[0].fakeBlocked, delta: 'this month', color: 'text-status-risk', bar: 'bg-status-risk', w: '50%' },
            { label: 'Credits Saved', value: data[0].creditsSaved, delta: '+$128', color: 'text-secondary', bar: 'bg-secondary', w: '65%' },
            { label: 'Contacts Filtered', value: data[0].contactsFiltered, delta: '63 today', color: 'text-status-warning', bar: 'bg-status-warning', w: '40%' },
            { label: 'Total Value Protected', value: data[0].totalValue, delta: '+9%', color: 'text-status-protected', bar: 'bg-status-protected', w: '75%' },
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
      )}

      {/* Reports table */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border-subtle flex justify-between items-center bg-surface-container-low">
          <h3 className="font-headline-sm text-[18px]">Protection Summaries</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-border-subtle rounded-lg text-code-sm font-bold flex items-center gap-2 hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>Filter
            </button>
            <button className="px-3 py-1.5 border border-border-subtle rounded-lg text-code-sm font-bold flex items-center gap-2 hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-[16px]">download</span>Export All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low border-b border-border-subtle">
              <tr>
                {['Report', 'Period', 'Fake Blocked', 'Credits Saved', 'Total Value', 'Download'].map(h => (
                  <th key={h} className="px-8 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.map(r => (
                <tr key={r.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">description</span>
                      <span className="text-code-sm font-bold text-on-surface">{r.title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-code-sm text-on-surface-variant">{r.period}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="bg-status-risk h-full" style={{ width: `${(r.fakeBlocked / 300) * 100}%` }} />
                      </div>
                      <span className="text-status-risk font-bold text-code-sm">{r.fakeBlocked}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-code-sm font-bold text-on-surface">{r.creditsSaved}</td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-status-protected/10 text-status-protected border border-status-protected/20 rounded-lg text-[10px] font-bold">{r.totalValue}</span>
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
