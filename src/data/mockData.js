// ─── Dashboard Metrics ──────────────────────────────────────────────
export const dashboardMetrics = {
  totalProtected: '$928',
  fakeSignupsBlocked: 289,
  aiCreditsSaved: '$742',
  junkContactsPrevented: 312,
  marketingWasteProtected: '$186',
  signupQualityScore: 81,
  riskySignupRate: 33.1,
  allowCount: 1240,
  reviewCount: 198,
  blockCount: 289,
  todayBlocked: 47,
  apiCallsToday: 3847,
  avgResponseMs: 38,
};

// ─── Risk Events ────────────────────────────────────────────────────
export const riskEvents = [
  {
    id: 'evt_001',
    email: 'user@tempmail.dev',
    ip: '103.44.21.9',
    country: 'IN',
    riskScore: 89,
    decision: 'BLOCK',
    reasons: ['temporary_email', 'repeat_ip', 'vpn_detected', 'suspicious_velocity'],
    protect: ['ai_credits', 'crm', 'email_list', 'analytics'],
    timestamp: '2026-06-07T10:42:00Z',
    deviceId: 'dev_ax81kq',
    userAgent: 'Mozilla/5.0 (compatible; bot)',
  },
  {
    id: 'evt_002',
    email: 'john.doe@guerrillamail.com',
    ip: '45.129.14.88',
    country: 'RU',
    riskScore: 76,
    decision: 'BLOCK',
    reasons: ['temporary_email', 'vpn_detected', 'high_velocity'],
    protect: ['ai_credits', 'email_list'],
    timestamp: '2026-06-07T10:31:00Z',
    deviceId: 'dev_bz92lr',
    userAgent: 'curl/7.68.0',
  },
  {
    id: 'evt_003',
    email: 'test123@10minutemail.com',
    ip: '198.51.100.44',
    country: 'US',
    riskScore: 91,
    decision: 'BLOCK',
    reasons: ['temporary_email', 'repeat_free_trial', 'suspicious_velocity'],
    protect: ['ai_credits', 'crm', 'email_list'],
    timestamp: '2026-06-07T10:18:00Z',
    deviceId: 'dev_cx03ms',
    userAgent: 'Mozilla/5.0 Headless Chrome',
  },
  {
    id: 'evt_004',
    email: 'alice@protonmail.com',
    ip: '89.34.12.200',
    country: 'DE',
    riskScore: 42,
    decision: 'REVIEW',
    reasons: ['vpn_detected', 'new_domain'],
    protect: ['analytics'],
    timestamp: '2026-06-07T09:55:00Z',
    deviceId: 'dev_dx14nt',
    userAgent: 'Mozilla/5.0 Firefox/121.0',
  },
  {
    id: 'evt_005',
    email: 'startup@gmail.com',
    ip: '74.125.230.11',
    country: 'US',
    riskScore: 12,
    decision: 'ALLOW',
    reasons: [],
    protect: [],
    timestamp: '2026-06-07T09:40:00Z',
    deviceId: 'dev_ex25ou',
    userAgent: 'Mozilla/5.0 Chrome/120.0',
  },
  {
    id: 'evt_006',
    email: 'bob@yopmail.com',
    ip: '5.188.210.33',
    country: 'NL',
    riskScore: 84,
    decision: 'BLOCK',
    reasons: ['temporary_email', 'datacenter_ip', 'repeat_ip'],
    protect: ['ai_credits', 'crm'],
    timestamp: '2026-06-07T09:22:00Z',
    deviceId: 'dev_fx36pv',
    userAgent: 'Python-requests/2.28.0',
  },
  {
    id: 'evt_007',
    email: 'jane@company.io',
    ip: '203.0.113.5',
    country: 'AU',
    riskScore: 21,
    decision: 'ALLOW',
    reasons: [],
    protect: [],
    timestamp: '2026-06-07T09:10:00Z',
    deviceId: 'dev_gx47qw',
    userAgent: 'Mozilla/5.0 Safari/605.1',
  },
  {
    id: 'evt_008',
    email: 'admin@mailnull.com',
    ip: '192.0.2.88',
    country: 'CN',
    riskScore: 97,
    decision: 'BLOCK',
    reasons: ['temporary_email', 'vpn_detected', 'datacenter_ip', 'repeat_free_trial', 'high_velocity'],
    protect: ['ai_credits', 'crm', 'email_list', 'analytics'],
    timestamp: '2026-06-07T08:58:00Z',
    deviceId: 'dev_hx58rx',
    userAgent: 'Go-http-client/1.1',
  },
];

// ─── API Keys ────────────────────────────────────────────────────────
export const apiKeys = [
  {
    id: 'key_001',
    name: 'Production App',
    key: 'sk_stravo_live_a8f3k2m9p1q7r5t6',
    created: '2026-05-01',
    lastUsed: '2026-06-07',
    calls: 38470,
    status: 'active',
    env: 'live',
  },
  {
    id: 'key_002',
    name: 'Staging Environment',
    key: 'sk_stravo_test_b2g4j6l8n0s2u4v6',
    created: '2026-05-15',
    lastUsed: '2026-06-06',
    calls: 1230,
    status: 'active',
    env: 'test',
  },
  {
    id: 'key_003',
    name: 'Old Dev Key',
    key: 'sk_stravo_live_c3h5k7m9p1q3r5t7',
    created: '2026-04-10',
    lastUsed: '2026-05-20',
    calls: 890,
    status: 'revoked',
    env: 'live',
  },
];

// ─── Rules ──────────────────────────────────────────────────────────
export const rules = [
  { id: 'rule_001', name: 'Block Temporary Emails', description: 'Block signups using disposable/temporary email providers', enabled: true, action: 'BLOCK', riskImpact: +40, category: 'email' },
  { id: 'rule_002', name: 'Block VPN / Proxy Users', description: 'Block signups originating from known VPN or proxy IPs', enabled: true, action: 'BLOCK', riskImpact: +25, category: 'network' },
  { id: 'rule_003', name: 'Flag Repeat Free-Trial Abusers', description: 'Detect users re-signing up to abuse free tiers', enabled: true, action: 'REVIEW', riskImpact: +30, category: 'behavior' },
  { id: 'rule_004', name: 'Block Datacenter / Bot IPs', description: 'Block IPs associated with cloud providers or scraping bots', enabled: true, action: 'BLOCK', riskImpact: +35, category: 'network' },
  { id: 'rule_005', name: 'High Velocity Detection', description: 'Flag accounts created in unusually rapid succession from same IP', enabled: true, action: 'REVIEW', riskImpact: +20, category: 'behavior' },
  { id: 'rule_006', name: 'New Domain Risk', description: 'Apply extra scrutiny to domains registered in the last 30 days', enabled: false, action: 'REVIEW', riskImpact: +10, category: 'email' },
  { id: 'rule_007', name: 'Block High-Risk Countries', description: 'Block signups from countries with high fraud rates', enabled: false, action: 'BLOCK', riskImpact: +15, category: 'geo' },
  { id: 'rule_008', name: 'Headless Browser Detection', description: 'Detect and block signups from automated headless browsers', enabled: true, action: 'BLOCK', riskImpact: +45, category: 'device' },
];

// ─── Analytics ───────────────────────────────────────────────────────
export const analyticsData = {
  weekly: [
    { day: 'Mon', blocked: 34, reviewed: 18, allowed: 198 },
    { day: 'Tue', blocked: 48, reviewed: 22, allowed: 210 },
    { day: 'Wed', blocked: 29, reviewed: 15, allowed: 185 },
    { day: 'Thu', blocked: 61, reviewed: 30, allowed: 224 },
    { day: 'Fri', blocked: 52, reviewed: 25, allowed: 201 },
    { day: 'Sat', blocked: 38, reviewed: 14, allowed: 167 },
    { day: 'Sun', blocked: 47, reviewed: 19, allowed: 190 },
  ],
  blockReasons: [
    { reason: 'Temporary Email', count: 142, pct: 49 },
    { reason: 'VPN / Proxy', count: 87, pct: 30 },
    { reason: 'Repeat Trial Abuse', count: 38, pct: 13 },
    { reason: 'Datacenter IP', count: 22, pct: 8 },
  ],
  qualityTrend: [
    { month: 'Jan', score: 62 }, { month: 'Feb', score: 67 },
    { month: 'Mar', score: 71 }, { month: 'Apr', score: 74 },
    { month: 'May', score: 78 }, { month: 'Jun', score: 81 },
  ],
};

// ─── Integrations ─────────────────────────────────────────────────────
export const integrations = [
  { id: 'int_mailchimp', name: 'Mailchimp', category: 'Email Marketing', description: 'Prevent risky signups from entering your campaigns.', connected: true, logo: '📧' },
  { id: 'int_hubspot', name: 'HubSpot', category: 'CRM', description: 'Prevent junk CRM contacts from polluting your pipeline.', connected: false, logo: '🔶' },
  { id: 'int_brevo', name: 'Brevo', category: 'Email Marketing', description: 'Keep your Brevo lists clean and engagement-ready.', connected: false, logo: '💙' },
  { id: 'int_convertkit', name: 'ConvertKit', category: 'Email Marketing', description: 'Protect your audience segments from fake subscribers.', connected: false, logo: '📮' },
  { id: 'int_supabase', name: 'Supabase', category: 'Auth / Backend', description: 'Gate your Supabase auth with real-time risk scoring.', connected: true, logo: '⚡' },
  { id: 'int_firebase', name: 'Firebase', category: 'Auth / Backend', description: 'Block risky users before they enter Firebase Auth.', connected: false, logo: '🔥' },
  { id: 'int_clerk', name: 'Clerk', category: 'Auth / Backend', description: 'Add risk scoring to Clerk webhooks automatically.', connected: false, logo: '🔐' },
  { id: 'int_auth0', name: 'Auth0', category: 'Auth / Backend', description: 'Pre-screen signups in Auth0 Actions pipeline.', connected: false, logo: '🛡️' },
  { id: 'int_slack', name: 'Slack', category: 'Notifications', description: 'Get Slack alerts on high-risk signup spikes.', connected: true, logo: '💬' },
  { id: 'int_webhook', name: 'Webhooks', category: 'Custom', description: 'Send risk decisions to any endpoint in real time.', connected: false, logo: '🔗' },
];

// ─── Billing Plans ────────────────────────────────────────────────────
export const billingPlans = [
  {
    id: 'starter', name: 'Starter', price: 29, period: 'mo',
    features: ['1,000 risk checks/mo', '3 integrations', 'Basic rules', 'Email support', '7-day log retention'],
    current: false,
  },
  {
    id: 'growth', name: 'Growth', price: 79, period: 'mo', recommended: true,
    features: ['10,000 risk checks/mo', 'All integrations', 'Custom rules', 'Priority support', '30-day log retention', 'Risk Simulator', 'Review Queue'],
    current: true,
  },
  {
    id: 'pro', name: 'Pro', price: 199, period: 'mo',
    features: ['Unlimited risk checks', 'All integrations', 'Advanced ML rules', 'Dedicated support', '90-day log retention', 'All dashboard features', 'Custom blocklists', 'SLA guarantee'],
    current: false,
  },
];

export const billingUsage = {
  checksUsed: 3847,
  checksLimit: 10000,
  cycleEnd: '2026-07-01',
  plan: 'Growth',
  nextInvoice: '$79.00',
};

// ─── Reports ─────────────────────────────────────────────────────────
export const reports = [
  { id: 'rpt_001', title: 'June 2026 Protection Summary', period: 'Jun 2026', fakeBlocked: 289, creditsSaved: '$742', contactsFiltered: 312, marketingProtected: '$186', totalValue: '$928', createdAt: '2026-06-01' },
  { id: 'rpt_002', title: 'May 2026 Protection Summary', period: 'May 2026', fakeBlocked: 241, creditsSaved: '$618', contactsFiltered: 278, marketingProtected: '$154', totalValue: '$772', createdAt: '2026-05-01' },
  { id: 'rpt_003', title: 'April 2026 Protection Summary', period: 'Apr 2026', fakeBlocked: 198, creditsSaved: '$504', contactsFiltered: 220, marketingProtected: '$128', totalValue: '$632', createdAt: '2026-04-01' },
];

// ─── Alerts ──────────────────────────────────────────────────────────
export const alerts = [
  { id: 'alr_001', type: 'HIGH_RISK_SPIKE', title: 'High-Risk Signup Spike Detected', message: 'Blocked 47 risky signups in the last 24 hours — 2.3× above your 7-day average. Source: repeat IPs from datacenter ranges.', severity: 'critical', action: 'Block all datacenter IPs by enabling Rule #4', timestamp: '2026-06-07T09:00:00Z', read: false },
  { id: 'alr_002', type: 'INTEGRATION_SUGGESTION', title: 'Connect Mailchimp to Sync Protected List', message: 'You have 312 blocked contacts who may already be in your Mailchimp list. Connect Mailchimp to auto-remove them.', severity: 'warning', action: 'Go to Integrations → Mailchimp', timestamp: '2026-06-06T14:30:00Z', read: false },
  { id: 'alr_003', type: 'RULE_RECOMMENDATION', title: 'Enable VPN Blocking for 14% Risk Reduction', message: 'Enabling strict VPN blocking could reduce your risky signup rate from 33.1% to ~19%.', severity: 'info', action: 'Enable Rule: Block VPN / Proxy Users', timestamp: '2026-06-05T10:00:00Z', read: true },
  { id: 'alr_004', type: 'USAGE_WARNING', title: 'Approaching Plan Limit', message: 'You have used 38.5% of your monthly risk check quota (3,847 / 10,000).', severity: 'info', action: 'Review usage in Billing', timestamp: '2026-06-04T08:00:00Z', read: true },
];

// ─── Blocklist / Allowlist ────────────────────────────────────────────
export const blocklist = [
  { id: 'bl_001', type: 'email_domain', value: 'tempmail.dev', reason: 'Known temporary email provider', addedAt: '2026-05-01', hits: 42 },
  { id: 'bl_002', type: 'email_domain', value: 'yopmail.com', reason: 'Disposable email', addedAt: '2026-05-03', hits: 28 },
  { id: 'bl_003', type: 'ip', value: '103.44.21.9', reason: 'Repeated abuse attempts', addedAt: '2026-06-01', hits: 7 },
  { id: 'bl_004', type: 'ip', value: '5.188.210.33', reason: 'Datacenter / botnet origin', addedAt: '2026-06-02', hits: 3 },
  { id: 'bl_005', type: 'email', value: 'admin@mailnull.com', reason: 'Manual block by admin', addedAt: '2026-06-07', hits: 1 },
];

export const allowlist = [
  { id: 'al_001', type: 'email', value: 'alice@protonmail.com', reason: 'Manually approved — known founder', addedAt: '2026-06-01', hits: 3 },
  { id: 'al_002', type: 'email_domain', value: 'ycombinator.com', reason: 'Trusted investor domain', addedAt: '2026-05-20', hits: 12 },
  { id: 'al_003', type: 'ip', value: '74.125.230.11', reason: 'Internal staging server', addedAt: '2026-05-15', hits: 891 },
];

// ─── Projects / Workspaces ────────────────────────────────────────────
export const projects = [
  { id: 'proj_001', name: 'My AI SaaS App', plan: 'Growth', apiKey: 'sk_stravo_live_a8f3k2m9p1q7r5t6', checksThisMonth: 3847, createdAt: '2026-05-01', status: 'active' },
  { id: 'proj_002', name: 'Staging Environment', plan: 'Growth', apiKey: 'sk_stravo_test_b2g4j6l8n0s2u4v6', checksThisMonth: 1230, createdAt: '2026-05-15', status: 'active' },
];

// ─── Review Queue ─────────────────────────────────────────────────────
export const reviewQueue = [
  { id: 'rev_001', email: 'alice@protonmail.com', ip: '89.34.12.200', riskScore: 42, reasons: ['vpn_detected', 'new_domain'], submittedAt: '2026-06-07T09:55:00Z', status: 'pending' },
  { id: 'rev_002', email: 'user@pm.me', ip: '185.220.101.5', riskScore: 55, reasons: ['vpn_detected', 'repeat_ip'], submittedAt: '2026-06-07T08:30:00Z', status: 'pending' },
  { id: 'rev_003', email: 'dev@tutanota.com', ip: '95.216.10.20', riskScore: 38, reasons: ['new_domain'], submittedAt: '2026-06-06T22:10:00Z', status: 'approved' },
  { id: 'rev_004', email: 'anon@cock.li', ip: '45.33.32.156', riskScore: 67, reasons: ['vpn_detected', 'high_velocity'], submittedAt: '2026-06-06T18:45:00Z', status: 'blocked' },
];
