import re
from fastapi import APIRouter, Depends, HTTPException, Path
from app.services.email_service import EmailService
from app.config import settings
from app.schemas.email import EmailResponse

router = APIRouter(prefix="/email", tags=["Email Intelligence"])

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def get_email_service() -> EmailService:
    return EmailService(api_key=settings.disify_api_key)

@router.get(
    "/{email_address}",
    response_model=EmailResponse,
    summary="Verify email address safety and format",
    description="Validates syntax format, resolves MX/DNS records, and checks disposable or free domain flags using the DISIFY service.",
    responses={
        400: {"description": "Invalid email syntax format"},
        503: {"description": "DISIFY service connection failure"}
    }
)
async def get_email_info(
    email_address: str = Path(..., description="The email address to verify", examples=["test@gmail.com"]),
    service: EmailService = Depends(get_email_service)
):

    if not EMAIL_REGEX.match(email_address):
        raise HTTPException(status_code=400, detail="Invalid email format.")

    raw = await service.lookup_email(email_address)

    return EmailResponse(
        verification_type="email",
        email_address=email_address,
        format_valid=raw.get("format", False),
        domain=raw.get("domain"),
        is_disposable=raw.get("disposable"),
        dns_valid=raw.get("dns"),
        mx_records=raw.get("mx_info"),
        is_free=raw.get("free"),
        is_role=raw.get("role"),
        raw_details=raw
    )


