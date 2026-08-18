import ipaddress
from fastapi import APIRouter, Depends, HTTPException, Path
from app.services.ipapi_service import IPAPIService
from app.config import settings
from app.schemas.ip import IPResponse


router = APIRouter(prefix="/ip", tags=["IP Intelligence"])

def get_ipapi_service() -> IPAPIService:
    return IPAPIService(api_key=settings.ipapi_api_key)

@router.get(
    "/{ip_address}",
    response_model=IPResponse,
    summary="Evaluate IP address safety and location",
    description="Performs risk evaluation (VPN, Proxy, Tor, Datacenter, Abuse) and geolocates the given IPv4 or IPv6 address using the IPAPI service.",
    responses={
        400: {"description": "Invalid IP address format"},
        503: {"description": "IPAPI service connection failure"}
    }
)
async def get_ip_info(
    ip_address: str = Path(..., description="The IPv4 or IPv6 address to verify", examples=["37.209.178.170"]),
    service: IPAPIService = Depends(get_ipapi_service)
):
    try:
        ipaddress.ip_address(ip_address)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid IP address format.")

    raw = await service.lookup_ip(ip_address)


    location = raw.get("location") or {}
    asn_data = raw.get("asn") or {}
    
    return IPResponse(
        verification_type="ip",
        ip_address=ip_address,
        is_vpn=raw.get("is_vpn", False),
        is_proxy=raw.get("is_proxy", False),
        is_tor=raw.get("is_tor", False),
        is_datacenter=raw.get("is_datacenter", False),
        country=location.get("country"),
        country_code=location.get("country_code"),
        state=location.get("state"),
        city=location.get("city"),
        asn=asn_data.get("asn"),
        asn_organization=asn_data.get("org"),
        is_abuser=raw.get("is_abuser", False),
        raw_details=raw
    )


