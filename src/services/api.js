const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8787' : '');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(path, options = {}, attempt = 0) {
  const token = localStorage.getItem('stravo_access_token');
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (attempt === 0) {
      await wait(500);
      return request(path, options, 1);
    }
    throw new Error('Could not reach STRAVOTECH. Check your connection and try again.', { cause: error });
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('stravo_access_token');
      localStorage.removeItem('stravo_user');
      window.dispatchEvent(new CustomEvent('stravo:auth-expired'));
    }
    const requestSuffix = body.requestId ? ` (Request ${body.requestId})` : '';
    const error = new Error(`${body.message || body.error || 'Request failed'}${requestSuffix}`);
    error.status = res.status;
    throw error;
  }
  return body;
}

export const authApi = {
  signup: (payload) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmail: (payload) => request('/api/auth/verify-email', { method: 'POST', body: JSON.stringify(payload) }),
  resendVerification: (email) => request('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  resetPassword: (email) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) }),
};

export const checkSignupRisk = (payload) =>
  request('/api/risk-simulator', { method: 'POST', body: JSON.stringify(payload) });

export const getDashboardMetrics = () => request('/api/dashboard/metrics');
export const getRiskEvents = () => request('/api/risk-events');
export const getRiskEvent = (id) => request(`/api/risk-events/${id}`);
export const getApiKeys = () => request('/api/api-keys');
export const createApiKey = (name, environment = 'live', scopes = ['signup:check']) =>
  request('/api/api-keys', { method: 'POST', body: JSON.stringify({ name, environment, scopes }) });
export const deleteApiKey = (id) => request(`/api/api-keys/${id}`, { method: 'DELETE' });
export const revokeApiKey = deleteApiKey;
export const getRules = () => request('/api/rules');
export const updateRule = (id, updates) =>
  request(`/api/rules/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
export const getAnalytics = () => request('/api/analytics');
export const getIntegrations = () => request('/api/integrations');
export const updateIntegration = (id, updates) =>
  request(`/api/integrations/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
export const getReports = () => request('/api/reports');
export const getMonthlyReport = () => request('/api/reports/monthly');
export const getAlerts = () => request('/api/alerts');
export const updateAlert = (id, updates) =>
  request(`/api/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
export const getBillingUsage = () => request('/api/billing');
export const getBillingPlans = () => request('/api/billing/plans');
export const getProjects = () => request('/api/projects');
export const createProject = (name, plan = 'Growth') =>
  request('/api/projects', { method: 'POST', body: JSON.stringify({ name, plan }) });
export const getReviewQueue = () => request('/api/review-queue');
export const updateReviewStatus = (id, status, email) =>
  request(`/api/review-queue/${id}/${status === 'approved' ? 'approve' : 'block'}`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const getBlocklist = () => request('/api/blocklist');
export const addBlocklistEntry = (payload) =>
  request('/api/blocklist', { method: 'POST', body: JSON.stringify(payload) });
export const removeBlocklistEntry = (id) => request(`/api/blocklist/${id}`, { method: 'DELETE' });

export const getAllowlist = () => request('/api/allowlist');
export const addAllowlistEntry = (payload) =>
  request('/api/allowlist', { method: 'POST', body: JSON.stringify(payload) });
export const removeAllowlistEntry = (id) => request(`/api/allowlist/${id}`, { method: 'DELETE' });
