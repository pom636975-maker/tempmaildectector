import httpx
from fastapi import HTTPException

class IPAPIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.ipapi.is"

    async def lookup_ip(self, ip_address: str):
        if not self.api_key or self.api_key == "your_ipapi_api_key_here":
            raise ValueError("IPAPI API key is not configured.")


        payload = {
            "ip": ip_address,
            "key": self.api_key
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"IPAPI service error: {e.response.text}"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"IPAPI connection failed: {str(e)}"
                )

