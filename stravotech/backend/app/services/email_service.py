import httpx
from fastapi import HTTPException

class EmailService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://disify.com/api"

    async def lookup_email(self, email_address: str):
        if not self.api_key or self.api_key == "your_disify_api_key_here":
            raise ValueError("DISIFY API key is not configured.")


        url = f"{self.base_url}/email/{email_address}"
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers=headers,
                    timeout=10.0
                )
                response.raise_for_status()
                try:
                    return response.json()
                except ValueError:
                    raise HTTPException(
                        status_code=502,
                        detail="DISIFY service returned an invalid JSON response."
                    )
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"DISIFY service error: {e.response.text}"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"DISIFY connection failed: {str(e)}"
                )

