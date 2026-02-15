from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_path: str = "./models/phi-4-mini-onnx"
    max_feedback_items: int = 500
    cache_maxsize: int = 128
    cache_ttl_seconds: int = 3600
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
