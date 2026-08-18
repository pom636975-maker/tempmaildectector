from pydantic import BaseModel, Field

class IPRequest(BaseModel):
    ip_address: str = Field(..., description="The IP address to evaluate")

class IPResponse(BaseModel):
    verification_type: str = Field("ip", description="Verification type")
    ip_address: str = Field(..., description="The IP address evaluated")
    is_vpn: bool = Field(False, description="Flag indicating if the IP is a VPN")
    is_proxy: bool = Field(False, description="Flag indicating if the IP is a proxy")
    is_tor: bool = Field(False, description="Flag indicating if the IP is a Tor node")
    is_datacenter: bool = Field(False, description="Flag indicating if the IP belongs to a datacenter")
    country: str | None = Field(None, description="Country name")
    country_code: str | None = Field(None, description="Two-letter country code")
    state: str | None = Field(None, description="Region/State name")
    city: str | None = Field(None, description="City name")
    asn: int | None = Field(None, description="Autonomous System Number")
    asn_organization: str | None = Field(None, description="ASN Organization/Company name")
    is_abuser: bool = Field(False, description="Flag indicating if the IP has high abuse score")
    raw_details: dict = Field(default_factory=dict, description="Raw details from provider")
