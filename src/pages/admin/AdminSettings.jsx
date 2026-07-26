import { useState } from 'react';

export default function AdminSettings() {
  const [protectionMode, setProtectionMode] = useState('standard');
  const [defaultLimit, setDefaultLimit] = useState(1000);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes adminSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>System Controls</h1>
        <p className="text-sm text-gray-400 mt-1">Configure global SaaS security defaults and platform settings</p>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl flex items-center gap-2" style={{ animation: 'adminSlideUp 0.3s ease-out both' }}>
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          System settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Protection Mode */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6" style={{ animation: 'adminSlideUp 0.4s ease-out both' }}>
          <h2 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "'Geist', sans-serif" }}>Global Protection Engine</h2>
          <p className="text-xs text-gray-400 mb-5">Set the baseline risk scoring sensitivity across all tenants</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'relaxed', title: 'Relaxed Mode', desc: 'Lower false positives. Allows low-risk disposable hints.', icon: 'shield_moon' },
              { id: 'standard', title: 'Standard Mode (Recommended)', desc: 'Balanced risk scoring & real-time MX inspection.', icon: 'verified_user' },
              { id: 'strict', title: 'Strict Lockdown', desc: 'Aggressive blocking. Restricts all free mail providers.', icon: 'local_police' },
            ].map((mode) => (
              <div
                key={mode.id}
                onClick={() => setProtectionMode(mode.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  protectionMode === mode.id
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`material-symbols-outlined text-[20px] ${protectionMode === mode.id ? 'text-blue-600' : 'text-gray-400'}`}>{mode.icon}</span>
                  <h3 className="text-sm font-bold text-gray-900">{mode.title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quota & Limits */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6" style={{ animation: 'adminSlideUp 0.4s ease-out 100ms both' }}>
          <h2 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "'Geist', sans-serif" }}>Default Quotas & Limits</h2>
          <p className="text-xs text-gray-400 mb-5">Configure monthly API check limits for free tier accounts</p>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Free Tier Monthly Limit (Checks)</label>
              <div className="relative">
                <input
                  type="number"
                  value={defaultLimit}
                  onChange={(e) => setDefaultLimit(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">checks/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance & Emergency Controls */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6" style={{ animation: 'adminSlideUp 0.4s ease-out 200ms both' }}>
          <h2 className="text-base font-bold text-gray-900 mb-1 text-red-600 flex items-center gap-2" style={{ fontFamily: "'Geist', sans-serif" }}>
            <span className="material-symbols-outlined text-[20px]">warning</span> Maintenance & Announcement Broadcast
          </h2>
          <p className="text-xs text-gray-400 mb-5">Control global platform banners or enable system maintenance mode</p>

          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl">
              <div>
                <p className="text-sm font-bold text-gray-900">Maintenance Mode</p>
                <p className="text-xs text-gray-500">Temporarily pause non-admin logins for server maintenance</p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Global Dashboard Banner Announcement</label>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Broadcast a message to all users on their dashboard..."
                rows={2}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg shadow-gray-900/10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
}
