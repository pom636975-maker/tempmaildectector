import { useMemo, useState } from 'react';

const endpoint = 'https://stravotech.in/api/v1/check-signup';

const scenarios = {
  temp: {
    label: 'Temp email',
    body: { email: 'abuse@mailinator.com', ip: '203.0.113.10', deviceId: 'demo_temp', userAgent: 'STRAVOTECH Playground' },
  },
  gmail: {
    label: 'Clean Gmail',
    body: { email: 'founder.audit@gmail.com', ip: '203.0.113.11', deviceId: 'demo_gmail', userAgent: 'STRAVOTECH Playground' },
  },
  business: {
    label: 'Business email',
    body: { email: 'founder@stravotech.in', ip: '203.0.113.12', deviceId: 'demo_business', userAgent: 'STRAVOTECH Playground' },
  },
  invalidEmail: {
    label: 'Invalid email',
    body: { email: 'not-an-email', ip: '203.0.113.13', deviceId: 'demo_invalid', userAgent: 'STRAVOTECH Playground' },
  },
  missingEmail: {
    label: 'Missing email',
    body: { ip: '203.0.113.14', deviceId: 'demo_missing', userAgent: 'STRAVOTECH Playground' },
  },
  invalidKey: {
    label: 'Invalid API key',
    body: { email: 'founder.audit@gmail.com', ip: '203.0.113.15', deviceId: 'demo_bad_key', userAgent: 'STRAVOTECH Playground' },
  },
};

function CodeBlock({ title, children }) {
  return (
    <div className="bg-[#111827] rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-[#1f2937] text-[10px] font-mono text-gray-300">{title}</div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-5 text-gray-200"><code>{children}</code></pre>
    </div>
  );
}

export default function Docs() {
  const [apiKey, setApiKey] = useState('');
  const [scenario, setScenario] = useState('temp');
  const [playground, setPlayground] = useState(null);
  const [running, setRunning] = useState(false);

  const selected = scenarios[scenario];
  const headersUsed = useMemo(() => ({
    'Content-Type': 'application/json',
    'X-API-Key': scenario === 'invalidKey' ? 'invalid_key' : (apiKey || 'YOUR_API_KEY'),
  }), [apiKey, scenario]);

  const runPlayground = async () => {
    setRunning(true);
    const started = performance.now();
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': scenario === 'invalidKey' ? 'invalid_key' : apiKey,
      };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(selected.body),
      });
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { nonJsonResponse: text };
      }
      setPlayground({
        status: response.status,
        latency: Math.round(performance.now() - started),
        requestId: json.requestId || response.headers.get('x-request-id') || '',
        headers,
        body: json,
      });
    } catch (error) {
      setPlayground({
        status: 'NETWORK_ERROR',
        latency: Math.round(performance.now() - started),
        requestId: '',
        headers: headersUsed,
        body: { success: false, error: { code: 'NETWORK_ERROR', message: error.message } },
      });
    } finally {
      setRunning(false);
    }
  };

  const curlBearer = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","ip":"203.0.113.42","deviceId":"device_123","userAgent":"Mozilla/5.0"}'`;

  const curlHeader = `curl -X POST ${endpoint} \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com"}'`;

  const browserFetch = `const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "sk_stravo_test_xxx"
  },
  body: JSON.stringify({ email: "user@example.com" })
});

const result = await response.json();`;

  const nodeExample = `const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.STRAVOTECH_API_KEY}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email: user.email,
    ip: req.ip,
    deviceId: req.body.deviceId,
    userAgent: req.get("user-agent")
  })
});

const risk = await response.json();
if (!risk.success) throw new Error(risk.error.message);
if (risk.action === "BLOCK") return res.status(403).json({ message: "Signup blocked" });`;

  const nextRoute = `// app/api/signup/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const riskRes = await fetch("${endpoint}", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${process.env.STRAVOTECH_API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: body.email })
  });

  const risk = await riskRes.json();
  if (risk.action === "BLOCK") {
    return Response.json({ message: "Use a real email address." }, { status: 403 });
  }

  return Response.json({ ok: true });
}`;

  const errorExample = `{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Valid STRAVOTECH API key is required.",
    "details": {}
  },
  "requestId": "req_xxx"
}`;

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">API Docs & Playground</h1>
          <p className="text-on-surface-variant font-body-md">Integrate STRAVOTECH safely from your backend and test responses without leaving the dashboard.</p>
        </div>
      </div>

      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-border-subtle bg-surface-container-low">
          <h3 className="font-headline-sm text-[18px]">Production Endpoint</h3>
          <p className="text-code-sm text-on-surface-variant mt-1">Never expose a live API key in frontend code. Use live keys on your server only.</p>
        </div>
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            ['Endpoint', endpoint],
            ['Method', 'POST'],
            ['Auth', 'Authorization: Bearer ... or X-API-Key: ...'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border-subtle bg-surface-container-low p-5">
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-2">{label}</p>
              <code className="text-code-sm break-all">{value}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-border-subtle bg-surface-container-low">
          <h3 className="font-headline-sm text-[18px]">API Playground</h3>
        </div>
        <div className="p-8 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
            <input
              className="h-11 bg-surface-container-low border border-border-subtle px-4 rounded-lg text-code-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              placeholder="Paste a test API key. Live keys are accepted, but test keys are safer here."
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <button
              onClick={runPlayground}
              disabled={running || (!apiKey && scenario !== 'invalidKey')}
              className="h-11 bg-primary text-on-primary px-5 rounded-lg font-label-caps text-label-caps font-bold disabled:opacity-50"
            >
              {running ? 'Running...' : 'Run Test'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(scenarios).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={`px-3 py-2 rounded-lg border text-code-sm font-bold ${scenario === key ? 'bg-secondary text-white border-secondary' : 'border-border-subtle hover:bg-surface-container'}`}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CodeBlock title="Request body">{JSON.stringify(selected.body, null, 2)}</CodeBlock>
            <CodeBlock title="Headers used">{JSON.stringify(headersUsed, null, 2)}</CodeBlock>
          </div>

          {playground && (
            <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
              <div className="rounded-xl border border-border-subtle bg-surface-container-low p-5 space-y-3">
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Result</p>
                <p className="text-code-sm"><span className="font-bold">Status:</span> {playground.status}</p>
                <p className="text-code-sm"><span className="font-bold">Latency:</span> {playground.latency}ms</p>
                <p className="text-code-sm break-all"><span className="font-bold">Request ID:</span> {playground.requestId || 'n/a'}</p>
              </div>
              <CodeBlock title="Response body">{JSON.stringify(playground.body, null, 2)}</CodeBlock>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter mb-8">
        <CodeBlock title="Bearer token cURL">{curlBearer}</CodeBlock>
        <CodeBlock title="X-API-Key cURL">{curlHeader}</CodeBlock>
        <CodeBlock title="JavaScript fetch test mode">{browserFetch}</CodeBlock>
        <CodeBlock title="Node backend example">{nodeExample}</CodeBlock>
        <CodeBlock title="Next.js route example">{nextRoute}</CodeBlock>
        <CodeBlock title="Error response format">{errorExample}</CodeBlock>
      </div>

      <div className="bg-white border border-border-subtle rounded-xl p-8">
        <h3 className="font-headline-sm text-[18px] mb-4">CORS Notes</h3>
        <p className="text-code-sm text-on-surface-variant">
          STRAVOTECH returns JSON for success and errors. Browser calls from approved origins receive matching CORS headers.
          Production integrations should call STRAVOTECH from your backend, because live API keys must never be exposed in frontend JavaScript.
        </p>
      </div>
    </div>
  );
}
