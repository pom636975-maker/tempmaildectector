from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, ip, email
from app.config import settings

app = FastAPI(
    title="StravoTech API",
    description="Fraud and Risk Detection API",
    version="0.1.0"
)

# CORS: only enabled when ALLOWED_ORIGIN is explicitly set in the environment.
# Accepts a comma-separated list of origins, e.g.:
#   ALLOWED_ORIGIN=https://stravotech.in,https://www.stravotech.in
if settings.allowed_origin.strip():
    origins = [o.strip() for o in settings.allowed_origin.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET"],
        allow_headers=["*"],
    )


# Include routers
app.include_router(health.router)
app.include_router(ip.router)
app.include_router(email.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the StravoTech Fraud & Risk Detection API. Use /health for service status."
    }

