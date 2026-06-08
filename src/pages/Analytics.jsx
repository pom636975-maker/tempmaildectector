import { useEffect, useState } from 'react';
import { getAnalytics, getDashboardMetrics } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState({ weekly: [], blockReasons: [], qualityTrend: [] });
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    getAnalytics().then(setAnalyticsData).catch(() => {});
    getDashboardMetrics().then(setSummary).catch(() => {});
  }, []);
  const metrics = [
    { label: 'Total Checks', value: summary?.total_signup_checks ?? 0, delta: '+18%', deltaColor: 'text-status-protected', barColor: 'bg-secondary', barW: '72%' },
    { label: 'Signups Blocked', value: summary?.fake_signups_blocked ?? 0, delta: '+8%', deltaColor: 'text-status-risk', barColor: 'bg-status-risk', barW: '18%' },
    { label: 'Avg Risk Score', value: summary?.risky_signup_rate ?? 0, delta: '-3.1', deltaColor: 'text-status-protected', barColor: 'bg-status-warning', barW: '42%' },
    { label: 'Quality Score', value: `${summary?.signup_quality_score ?? 0}/100`, delta: '+12%', deltaColor: 'text-status-protected', barColor: 'bg-status-protected', barW: `${summary?.signup_quality_score ?? 0}%` },
    { label: 'Risky Rate', value: `${summary?.risky_signup_rate ?? 0}%`, delta: '-4.2%', deltaColor: 'text-status-protected', barColor: 'bg-status-warning', barW: `${summary?.risky_signup_rate ?? 0}%` },
  ];

  const blockReasonColors = ['bg-status-risk', 'bg-status-warning', 'bg-secondary', 'bg-status-protected', 'bg-outline-variant'];

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Analytics</h1>
          <p className="text-on-surface-variant font-body-md">Understand your signup quality trends and protection performance.</p>
        </div>
        <button className="px-3 py-1.5 border border-border-subtle rounded-lg text-code-sm font-bold flex items-center gap-2 hover:bg-surface-container transition-all bg-white">
          <span className="material-symbols-outlined text-[16px]">download</span>
          Export Report
        </button>
      </div>

      {/* ── Metric Grid (5 cards like dashboard) ── */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-gutter">
        {metrics.map(({ label, value, delta, deltaColor, barColor, barW }) => (
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

      <div className="grid grid-cols-12 gap-gutter mt-gutter">

        {/* ── Weekly Bar Chart ── */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-border-subtle rounded-xl p-8">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-headline-sm text-[18px]">Weekly Risk Distribution</h3>
            <div className="flex gap-4">
              {[
                { color: 'bg-status-risk',      label: 'Blocked' },
                { color: 'bg-status-warning',   label: 'Review' },
                { color: 'bg-status-protected', label: 'Allowed' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-3 h-[2px] ${color} inline-block`} />
                  <span className="text-code-sm text-on-surface-variant">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analyticsData.weekly} barGap={2}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fontFamily: 'Geist, sans-serif', fill: '#45464d' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#45464d' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: 'Geist, sans-serif', fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="blocked"  fill="#EF4444" radius={[3,3,0,0]} name="Blocked" />
              <Bar dataKey="reviewed" fill="#F59E0B" radius={[3,3,0,0]} name="Review" />
              <Bar dataKey="allowed"  fill="#10B981" radius={[3,3,0,0]} name="Allowed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Block Reasons ── */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-border-subtle rounded-xl p-8">
          <h3 className="font-headline-sm text-[18px] mb-10">Block Reasons</h3>
          <div className="flex flex-col gap-6">
            {analyticsData.blockReasons.map(({ reason, count, pct }, i) => (
              <div key={reason} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-code-sm text-on-surface">{reason}</span>
                    <span className="text-code-sm text-on-surface-variant">{count} <span className="opacity-60">({pct}%)</span></span>
                  </div>
                  <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                    <div className={`${blockReasonColors[i]} h-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border-subtle bg-surface-container-lowest">
              <p className="text-[10px] font-label-caps text-on-surface-variant mb-1">TOP RISK</p>
              <p className="text-code-sm">Temp emails account for 43% of all blocks.</p>
            </div>
            <div className="p-4 rounded-lg border border-border-subtle bg-surface-container-lowest">
              <p className="text-[10px] font-label-caps text-on-surface-variant mb-1">TREND</p>
              <p className="text-code-sm">VPN detections up +18% this week.</p>
            </div>
          </div>
        </div>

        {/* ── Quality Score Trend ── */}
        <div className="col-span-12 bg-white border border-border-subtle rounded-xl p-8">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-headline-sm text-[18px]">Signup Quality Score Trend</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-[2px] bg-secondary inline-block" />
                <span className="text-code-sm text-on-surface-variant">Quality Score</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analyticsData.qualityTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'Geist, sans-serif', fill: '#45464d' }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#45464d' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontFamily: 'Geist, sans-serif', fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }}
                formatter={(v) => [`${v}/100`, 'Quality Score']}
              />
              <Line
                type="monotone" dataKey="score"
                stroke="#0058be" strokeWidth={2.5}
                dot={{ fill: '#0058be', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-between text-code-sm text-on-surface-variant opacity-40 font-label-caps">
            {analyticsData.qualityTrend.map(d => <span key={d.month}>{d.month}</span>)}
          </div>
        </div>

      </div>
    </div>
  );
}
