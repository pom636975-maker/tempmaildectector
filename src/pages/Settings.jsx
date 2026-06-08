import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', company: 'Stravotech Inc.' });
  const [webhook, setWebhook] = useState('https://api.yoursaas.com/webhooks/stravotech');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState({
    highRiskEmail: true,
    weeklyDigest: true,
    apiAlerts: false,
    reviewQueue: true,
  });

  const save = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const copySecret = () => {
    navigator.clipboard.writeText('whsec_stravo_webhook_secret_key_928104');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-headline-md text-headline-md text-primary mb-1">Settings</h1>
        <p className="text-on-surface-variant font-body-md">Manage your account, company profile, and system configurations.</p>
      </div>

      <div className="flex flex-col gap-6">

        {/* Profile Card */}
        <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
              <h3 className="font-headline-sm text-[16px]">Profile Information</h3>
            </div>
          </div>
          <form onSubmit={save} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider block">Full Name</label>
                <input
                  className="w-full h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider block">Email Address</label>
                <input
                  className="w-full h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm text-on-surface-variant cursor-not-allowed"
                  value={profile.email}
                  disabled
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider block">Company Name</label>
              <input
                className="w-full h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
                value={profile.company}
                onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-lg font-label-caps text-label-caps transition-colors ${saved ? 'bg-status-protected/10 text-status-protected border border-status-protected/30' : 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant'}`}
              >
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">notifications</span>
              <h3 className="font-headline-sm text-[16px]">Notification Preferences</h3>
            </div>
          </div>
          <div className="divide-y divide-border-subtle">
            {[
              { key: 'highRiskEmail', label: 'High-Risk Signup Alerts', desc: 'Get notified when a score ≥ 80 is detected.' },
              { key: 'weeklyDigest',  label: 'Weekly Protection Digest', desc: 'Summary of blocked signups, credits saved, and trends.' },
              { key: 'apiAlerts',    label: 'API Usage Alerts', desc: 'Notify when you reach 90% of your monthly API quota.' },
              { key: 'reviewQueue',  label: 'Review Queue Updates', desc: 'Alert when new signups enter the manual review queue.' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="px-6 py-5 flex items-center justify-between gap-6">
                <div>
                  <p className="font-semibold text-[14px] text-on-surface">{label}</p>
                  <p className="text-code-sm text-on-surface-variant mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${notifications[key] ? 'bg-secondary' : 'bg-surface-container-high'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Webhook Card */}
        <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">webhook</span>
              <h3 className="font-headline-sm text-[16px]">System Webhook</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-code-sm text-on-surface-variant">Receive real-time risk alerts and transaction notifications at this endpoint.</p>
            <div className="flex gap-3">
              <input
                className="flex-1 h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm font-code-sm focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
                value={webhook}
                onChange={e => setWebhook(e.target.value)}
              />
              <button
                onClick={() => alert('Webhook endpoint updated!')}
                className="px-5 py-2.5 rounded-lg font-label-caps text-label-caps border border-border-subtle hover:bg-surface-container transition-colors"
              >
                Update
              </button>
            </div>
            <button
              onClick={copySecret}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold border transition-colors ${copied ? 'bg-status-protected/10 text-status-protected border-status-protected/30' : 'border-border-subtle text-on-surface-variant hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              {copied ? '✓ Copied webhook signing secret' : 'Copy Signing Secret'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-status-risk/20 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-status-risk/20 bg-status-risk/5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-risk text-[20px]">warning</span>
              <h3 className="font-headline-sm text-[16px] text-status-risk">Danger Zone</h3>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between gap-6">
            <div>
              <p className="font-semibold text-[14px] text-on-surface">Delete Account</p>
              <p className="text-code-sm text-on-surface-variant mt-0.5">Permanently delete your account and all associated data. This cannot be undone.</p>
            </div>
            <button className="px-4 py-2.5 rounded-lg font-label-caps text-label-caps border border-status-risk/30 text-status-risk bg-status-risk/5 hover:bg-status-risk/10 transition-colors whitespace-nowrap flex-shrink-0">
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
