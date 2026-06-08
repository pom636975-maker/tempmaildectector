import { useEffect, useState } from 'react';
import { getIntegrations, updateIntegration } from '../services/api';

const CAT_ICONS = {
  'Email Marketing': 'outgoing_mail',
  'CRM':             'contacts',
  'Authentication':  'verified_user',
  'Notifications':   'notifications',
  'Analytics':       'analytics',
};

export default function Integrations() {
  const [intgs, setIntgs] = useState([]);
  useEffect(() => {
    getIntegrations().then((items) => setIntgs(items.map(normalizeIntegration))).catch(() => {});
  }, []);
  const toggle = (id) => {
    setIntgs(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
    const current = intgs.find((i) => i.id === id);
    updateIntegration(id, { status: current?.connected ? 'disconnected' : 'connected' }).catch(() => {});
  };
  const categories = [...new Set(intgs.map(i => i.category))];

  return (
    <div className="max-w-[1440px]">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Integrations</h1>
          <p className="text-on-surface-variant font-body-md">Connect STRAVOTECH to your email, CRM, auth, and notification tools.</p>
        </div>
      </div>

      {/* Integration Status Sidebar Cards (from stitch HTML footer) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-12">
        <div className="bg-white border border-border-subtle p-6 rounded-xl">
          <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Integration Status</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-code-sm">API Gateway</span>
              <span className="w-2 h-2 rounded-full bg-status-protected"></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-code-sm">Webhooks</span>
              <span className="w-2 h-2 rounded-full bg-status-protected"></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-code-sm">HubSpot CRM</span>
              <span className="w-2 h-2 rounded-full bg-status-protected"></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-code-sm">Intercom</span>
              <span className="w-2 h-2 rounded-full bg-status-protected"></span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border-subtle p-6 rounded-xl">
          <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Recommended Actions</h4>
          <div className="space-y-3">
            <button className="w-full text-left text-code-sm p-2 hover:bg-surface-container transition-all rounded flex items-center justify-between group">
              Review 12 pending risks
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100">chevron_right</span>
            </button>
            <button className="w-full text-left text-code-sm p-2 hover:bg-surface-container transition-all rounded flex items-center justify-between group">
              Stricter blocking policy
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100">chevron_right</span>
            </button>
            <button className="w-full text-left text-code-sm p-2 hover:bg-surface-container transition-all rounded flex items-center justify-between group">
              Enable Email Verification
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-border-subtle p-6 rounded-xl">
          <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Sync Volume</h4>
          <div className="flex justify-between mb-2">
            <span className="text-code-sm font-bold">12.4k synced</span>
            <span className="text-code-sm text-on-surface-variant">Active</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-4">
            <div className="bg-secondary h-full w-[100%] animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-label-caps text-on-surface-variant">
            <span>LAST SYNC: 2 MINS AGO</span>
            <span className="text-status-protected">OPTIMAL</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle pt-8 mb-8">
        <h2 className="font-headline-sm text-2xl mb-2">Available Apps</h2>
        <p className="text-on-surface-variant text-code-sm">One-click connect with your favorite tools.</p>
      </div>

      {categories.map(cat => (
        <div key={cat} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{CAT_ICONS[cat] || 'extension'}</span>
            <h3 className="font-headline-sm text-[16px] text-on-surface">{cat}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {intgs.filter(i => i.category === cat).map(intg => (
              <div
                key={intg.id}
                className="bg-white border border-border-subtle rounded-xl p-6 flex flex-col transition-all hover:border-secondary group relative overflow-hidden"
              >
                {/* Abstract architectural detail background for connected ones */}
                {intg.connected && (
                  <div className="absolute top-0 right-0 h-full w-1/3 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                    <div className="grid grid-cols-4 h-full border-l border-status-protected">
                      <div className="border-r border-status-protected h-full"></div>
                      <div className="border-r border-status-protected h-full"></div>
                      <div className="border-r border-status-protected h-full"></div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-low border border-border-subtle rounded-lg flex items-center justify-center text-2xl group-hover:bg-surface-container transition-colors">
                      {intg.logo}
                    </div>
                    <div>
                      <p className="font-headline-sm text-[16px] text-on-surface">{intg.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${intg.connected ? 'bg-status-protected animate-pulse' : 'bg-surface-container-high'}`} />
                        <span className={`font-label-caps text-[10px] ${intg.connected ? 'text-status-protected' : 'text-on-surface-variant'}`}>
                          {intg.connected ? 'System Active' : 'Not Connected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-code-sm text-on-surface-variant mb-6 relative z-10">{intg.description}</p>
                
                <div className="mt-auto relative z-10">
                  <button
                    onClick={() => toggle(intg.id)}
                    className={`w-fit px-6 py-2.5 rounded-lg font-label-caps text-[12px] transition-colors border font-bold flex items-center gap-2 ${
                      intg.connected
                        ? 'border-status-risk/20 text-status-risk bg-status-risk/5 hover:bg-status-risk/10'
                        : 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant'
                    }`}
                  >
                    {intg.connected ? 'Disconnect' : 'Connect'}
                    {!intg.connected && <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function normalizeIntegration(integration) {
  const name = integration.name || integration.provider?.replace(/\b\w/g, c => c.toUpperCase());
  const category = integration.category || (
    ['mailchimp', 'brevo', 'convertkit'].includes(integration.provider) ? 'Email Marketing' :
    ['hubspot'].includes(integration.provider) ? 'CRM' :
    ['clerk', 'auth0', 'firebase', 'supabase'].includes(integration.provider) ? 'Authentication' :
    ['slack', 'webhook', 'webhooks'].includes(integration.provider) ? 'Notifications' : 'Analytics'
  );
  return {
    ...integration,
    name,
    category,
    logo: integration.logo || name?.[0] || 'S',
    connected: integration.connected ?? integration.status === 'connected',
    description: integration.description || (
      integration.provider === 'mailchimp' ? 'Prevent risky signups from entering email campaigns.' :
      integration.provider === 'hubspot' ? 'Stop junk contacts before they pollute your CRM.' :
      'Sync STRAVOTECH risk decisions with this provider.'
    ),
  };
}
