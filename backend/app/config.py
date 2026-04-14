from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/appart_upgrade"
    redis_url: str = "redis://localhost:6379/0"
    # AI Provider — "gemini" (free) or "anthropic" (paid)
    ai_provider: str = "gemini"
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    google_maps_api_key: str = ""
    # Email alerts
    resend_api_key: str = ""
    # Alert threshold (score minimum pour envoyer un email)
    alert_score_threshold: int = 70
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    jwt_secret: str = "change-me-in-production-use-openssl-rand-hex-32"
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
