export default function Docs() {
  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Support & Docs</h1>
          <p className="text-on-surface-variant font-body-md">Simple setup steps for protecting your signup flow.</p>
        </div>
      </div>

      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-border-subtle bg-surface-container-low flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary">code</span>
          <h3 className="font-headline-sm text-[18px]">Simple Setup Guide</h3>
        </div>
        <div className="p-8">
          <p className="text-code-sm text-on-surface-variant mb-6">STRAVOTECH should run on your server at the moment someone clicks signup. The API gives one clear decision: allow, review, or block.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { title: 'Where to put it', desc: 'On your backend/server only. Never put the secret key in browser code.', icon: 'dns' },
              { title: 'When to call it', desc: 'Before creating the account, granting credits, or adding the user to your CRM.', icon: 'bolt' },
              { title: 'What to do next', desc: 'ALLOW creates the account. REVIEW verifies first. BLOCK stops the signup.', icon: 'rule' },
            ].map(item => (
              <div key={item.title} className="rounded-xl border border-border-subtle bg-surface-container-low p-5">
                <span className="material-symbols-outlined text-secondary mb-3">{item.icon}</span>
                <h4 className="font-bold text-primary mb-2">{item.title}</h4>
                <p className="text-code-sm text-on-surface-variant">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-[#1a1c1c] rounded-xl overflow-hidden mb-6">
            <div className="flex px-4 py-2 bg-[#2f3130] border-b border-border-subtle">
              <span className="text-[10px] font-mono text-gray-400">cURL</span>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="text-[12px] font-mono text-gray-300">
                <span className="text-pink-400">curl</span> -X POST https://stravotech.in/api/v1/check-signup \<br/>
                {'  '}-H <span className="text-green-300">"Authorization: Bearer YOUR_API_KEY"</span> \<br/>
                {'  '}-H <span className="text-green-300">"Content-Type: application/json"</span> \<br/>
                {'  '}-d <span className="text-yellow-300">'{'{'}"email": "user@example.com", "ip": "192.168.1.1", "deviceId": "device_123"{'}'}'</span>
              </code>
            </pre>
          </div>

          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-3">Response format</p>
          <div className="bg-[#1a1c1c] rounded-xl overflow-hidden">
            <pre className="p-4 overflow-x-auto">
              <code className="text-[12px] font-mono text-gray-300">
                {'{'}<br/>
                {'  '}"riskScore": <span className="text-blue-400">12</span>,<br/>
                {'  '}"action": <span className="text-green-300">"ALLOW"</span>,<br/>
                {'  '}"confidence": <span className="text-blue-400">78</span>,<br/>
                {'  '}"reasons": ["clean_domain"],<br/>
                {'  '}"signals": [&#123; "code": "clean_domain", "severity": "trusted" &#125;],<br/>
                {'  '}"nextStep": <span className="text-green-300">"create_account"</span>,<br/>
                {'  '}"recommendation": "Continue signup normally."<br/>
                {'}'}
              </code>
            </pre>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {[
          { title: 'API Reference', desc: 'Full documentation of endpoints, payloads, and error codes.', icon: 'api' },
          { title: 'Webhooks', desc: 'Listen to real-time events and risk score changes.', icon: 'webhook' },
          { title: 'SDKs', desc: 'Libraries for Node.js, Python, Ruby, and Go.', icon: 'integration_instructions' },
          { title: 'Help Center', desc: 'FAQs, best practices, and billing support.', icon: 'support_agent' },
        ].map(card => (
          <div key={card.title} className="bg-white border border-border-subtle p-8 rounded-xl hover:border-secondary transition-all cursor-pointer group relative overflow-hidden">
            {/* Architectural detail */}
            <div className="absolute top-0 right-0 h-full w-1/3 opacity-[0.01] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
              <div className="grid grid-cols-4 h-full border-l border-primary">
                <div className="border-r border-primary h-full" /><div className="border-r border-primary h-full" /><div className="border-r border-primary h-full" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 bg-surface-container-low border border-border-subtle rounded-xl flex items-center justify-center group-hover:bg-secondary/10 group-hover:border-secondary/20 transition-all">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors">{card.icon}</span>
              </div>
              <h3 className="font-headline-sm text-[18px] text-on-surface">{card.title}</h3>
            </div>
            <p className="text-code-sm text-on-surface-variant relative z-10">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
