import { useEffect, useState } from 'react';
import { getAlerts, updateAlert } from '../services/api';

const SEV_STYLE = {
  critical: 'bg-status-risk/10 text-status-risk border-status-risk/20',
  warning:  'bg-status-warning/10 text-status-warning border-status-warning/20',
  info:     'bg-secondary/10 text-secondary border-secondary/20',
};
const SEV_ICON = { critical: 'error', warning: 'warning', info: 'info' };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    getAlerts().then(setAlerts).catch(() => setAlerts([]));
  }, []);

  const markRead = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'read' } : a));
    updateAlert(id, { status: 'read' }).catch(() => {});
  };
  const unread = alerts.filter(a => a.status !== 'read' && !a.read).length;

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Alerts</h1>
          <p className="text-on-surface-variant font-body-md">Real-time security alerts and recommended actions for your account.</p>
        </div>
        {unread > 0 && (
          <button onClick={() => setAlerts(prev => prev.map(a => ({ ...a, status: 'read', read: true })))}
            className="w-fit border border-border-subtle px-6 py-3 rounded-lg font-label-caps text-label-caps hover:bg-surface-container transition-colors">
            Mark all read ({unread})
          </button>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
        {[
          { label: 'Unread Alerts', value: unread, color: 'text-status-risk', bar: 'bg-status-risk', w: `${(unread / alerts.length) * 100}%` },
          { label: 'Critical', value: alerts.filter(a => a.severity === 'critical').length, color: 'text-status-risk', bar: 'bg-status-risk', w: '25%' },
          { label: 'Total This Month', value: alerts.length, color: 'text-secondary', bar: 'bg-secondary', w: '100%' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-border-subtle p-6 rounded-xl metric-card-hover transition-all">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-4 uppercase tracking-wider">{m.label}</p>
            <div className="flex items-end justify-between">
              <h4 className="font-headline-sm text-headline-sm text-primary">{m.value}</h4>
              <span className={`${m.color} font-bold text-code-sm`}>alerts</span>
            </div>
            <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
              <div className={`${m.bar} h-full`} style={{ width: m.w || '5%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Alerts list */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
          <h3 className="font-headline-sm text-[18px]">All Alerts</h3>
          <span className="font-label-caps text-[10px] text-on-surface-variant">{alerts.length} total</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {alerts.map(a => (
            <div key={a.id} className={`px-8 py-6 hover:bg-surface-container-lowest transition-colors ${a.status !== 'read' && !a.read ? 'border-l-2 border-l-secondary' : ''}`}>
              <div className="flex gap-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${SEV_STYLE[a.severity]}`}>
                  <span className="material-symbols-outlined text-[20px]">{SEV_ICON[a.severity]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <h4 className={`text-code-sm font-bold ${a.status === 'read' || a.read ? 'text-on-surface' : 'text-primary'}`}>{a.title}</h4>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border capitalize ${SEV_STYLE[a.severity]}`}>{a.severity}</span>
                      {a.status !== 'read' && !a.read && (
                        <button onClick={() => markRead(a.id)}
                          className="text-[10px] font-label-caps text-on-surface-variant hover:text-secondary transition-colors">
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-code-sm text-on-surface-variant mb-3">{a.message}</p>
                  <div className="flex items-center justify-between">
                    <button className="text-secondary font-bold text-[12px] hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      {a.action || 'Review'}
                    </button>
                    <span className="text-[10px] text-on-surface-variant font-label-caps">
                      {new Date(a.timestamp || a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
