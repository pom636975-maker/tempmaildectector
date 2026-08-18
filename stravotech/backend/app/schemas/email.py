from pydantic import BaseModel, Field

class EmailRequest(BaseModel):
    email_address: str = Field(..., description="The email address to evaluate")

class EmailResponse(BaseModel):
    verification_type: str = Field("email", description="Verification type")
    email_address: str = Field(..., description="The email address evaluated")
    format_valid: bool = Field(..., description="Flag indicating if the email syntax/format is valid")
    domain: str | None = Field(None, description="The domain of the email address")
    is_disposable: bool | None = Field(None, description="Flag indicating if the email domain is disposable")
    dns_valid: bool | None = Field(None, description="Flag indicating if the email domain has valid DNS MX records")
    mx_records: list[str] | None = Field(None, description="MX records of the domain")
    is_free: bool | None = Field(None, description="Flag indicating if the domain is a free email service")
    is_role: bool | None = Field(None, description="Flag indicating if the email address is a role account")
    raw_details: dict = Field(default_factory=dict, description="Raw details from provider")
