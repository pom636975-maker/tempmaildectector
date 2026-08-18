from fastapi import APIRouter

router = APIRouter()

@router.get(
    "/health",
    summary="Service health check",
    description="Checks that the API server is active and running."
)
def health_check():
    return {
        "status": "healthy",
        "service": "stravotech-backend"
    }

