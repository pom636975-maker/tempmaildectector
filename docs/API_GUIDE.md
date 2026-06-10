# STRAVOTECH API Guide

Use the STRAVOTECH API to score signups before you create accounts, grant credits, add CRM contacts, or start email marketing workflows.

## Base URL

Local development:

```text
http://localhost:8787
```

Production:

```text
https://your-stravotech-api.example.com
```

## Authentication

Create an API key from the STRAVOTECH dashboard:

```text
Dashboard -> API Keys -> Create API Key
```

Keep the key server-side only. Do not expose it in browser JavaScript, mobile apps, public GitHub repos, or frontend environment variables.

Send the key as a bearer token:

```http
Authorization: Bearer sk_stravo_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The key must include this scope:

```text
signup:check
```

## Check Signup Risk

```http
POST /api/v1/check-signup
Content-Type: application/json
Authorization: Bearer YOUR_STRAVOTECH_API_KEY
```

Request body:

```json
{
  "email": "founder@company.com",
  "ip": "203.0.113.10",
  "deviceId": "dev_abc123",
  "userAgent": "Mozilla/5.0 ...",
  "event": "signup",
  "metadata": {
    "plan": "free_trial",
    "source": "landing_page"
  }
}
```

Required:

```text
email
```

Recommended:

```text
ip
deviceId
userAgent
```

Response:

```json
{
  "riskScore": 12,
  "action": "ALLOW",
  "confidence": 78,
  "reasons": ["clean_domain"],
  "signals": [
    {
      "code": "clean_domain",
      "category": "email",
      "severity": "trusted",
      "scoreImpact": 0,
      "detail": "No meaningful abuse indicators were detected."
    }
  ],
  "summary": "Low-risk signup with no strong abuse indicators.",
  "recommendation": "Continue signup normally. Keep monitoring post-signup velocity and credit usage.",
  "nextStep": "create_account",
  "protect": [],
  "eventId": "evt_123"
}
```

Actions:

```text
ALLOW  - create the account normally
REVIEW - require verification/CAPTCHA and hold free credits until the challenge succeeds
BLOCK  - reject the signup before account creation and do not grant product access
```

## Node.js Example

```js
async function checkSignupRisk({ email, ip, deviceId, userAgent }) {
  const response = await fetch('http://localhost:8787/api/v1/check-signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.STRAVOTECH_API_KEY}`,
    },
    body: JSON.stringify({
      email,
      ip,
      deviceId,
      userAgent,
      event: 'signup',
    }),
  });

  if (!response.ok) {
    throw new Error(`STRAVOTECH API error: ${response.status}`);
  }

  return response.json();
}

const risk = await checkSignupRisk({
  email: 'user@example.com',
  ip: '203.0.113.10',
  deviceId: 'dev_abc123',
  userAgent: 'Mozilla/5.0',
});

if (risk.action === 'BLOCK') {
  throw new Error('Signup blocked by risk policy');
}

if (risk.action === 'REVIEW') {
  // Create a pending user, but do not grant credits or CRM access yet.
}

// ALLOW: continue normal signup.
```

## Express Middleware Example

```js
app.post('/signup', async (req, res) => {
  const risk = await fetch('http://localhost:8787/api/v1/check-signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.STRAVOTECH_API_KEY}`,
    },
    body: JSON.stringify({
      email: req.body.email,
      ip: req.ip,
      deviceId: req.body.deviceId,
      userAgent: req.get('user-agent'),
      event: 'signup',
    }),
  }).then((r) => r.json());

  if (risk.action === 'BLOCK') {
    return res.status(403).json({ message: 'Please use a real email address.' });
  }

  if (risk.action === 'REVIEW') {
    return res.status(202).json({ message: 'Signup pending review.' });
  }

  // Create account here.
  return res.status(201).json({ ok: true });
});
```

## Browser Device ID

Create the device fingerprint in the browser, then send it to your server. Your server should call STRAVOTECH.

```js
function deviceId() {
  const raw = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }

  return `dev_${Math.abs(hash).toString(36)}`;
}
```

## Rate Limits

Current MVP limits:

```text
POST /api/v1/check-signup  120 requests/minute per API key or IP
General API                300 requests/minute
Request body size          64 KB
```

If you hit a limit, the API returns:

```http
429 Too Many Requests
Retry-After: 42
```

## Error Codes

```text
400 Invalid request payload
401 Missing, malformed, or revoked API key
402 Billing usage limit reached
403 API key missing required scope
429 Rate limit exceeded
500 Server error
```

## Security Checklist

```text
Store API keys only on your backend.
Use HTTPS in production.
Set ALLOWED_ORIGIN to your production app origin.
Rotate API keys if leaked.
Use separate live and test keys.
Do not grant credits, CRM sync, or email marketing access before ALLOW.
Treat REVIEW as pending, not approved.
```
