# StravoTech Backend

FastAPI backend application for StravoTech fraud/risk detection.

## Setup Instructions

1. Navigate to the backend directory:
   ```bash
   cd stravotech/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```powershell
     .\.venv\Scripts\activate
     ```
   - On Unix/macOS:
     ```bash
     source .venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

6. Run the application (development):
   ```bash
   uvicorn app.main:app --reload
   ```

## Production Start Command

```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

## Environment Variables

| Variable | Required | Description |
|:---|:---|:---|
| `IPAPI_API_KEY` | Yes | API key for IP intelligence (ipapi.is) |
| `DISIFY_API_KEY` | Yes | API key for email verification (disify.com) |
| `ALLOWED_ORIGIN` | No | Comma-separated CORS origins. Leave blank to disable CORS. Example: `https://stravotech.in,https://www.stravotech.in` |

| `APP_ENV` | No | Application environment (`development` or `production`) |
| `PORT` | No | Port to listen on (default: `8000`) |
| `HOST` | No | Host to bind (default: `0.0.0.0`) |

## Endpoints

| Endpoint | Method | Description |
|:---|:---|:---|
| `/health` | GET | Health check |
| `/ip/{ip_address}` | GET | IP intelligence lookup |
| `/email/{email_address}` | GET | Email verification |
| `/docs` | GET | Swagger UI (auto-generated) |
| `/openapi.json` | GET | OpenAPI schema |

