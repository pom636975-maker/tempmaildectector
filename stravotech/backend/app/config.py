from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000

    # Comma-separated list of allowed CORS origins, e.g. https://stravotech.in,https://www.stravotech.in
    # Leave empty to disable CORS (only do this if you are sure the frontend is same-origin)
    allowed_origin: str = ""


    # API keys for third-party integrations
    ipapi_api_key: str = ""
    disify_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

