from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/appart_upgrade"
    redis_url: str = "redis://localhost:6379/0"
    anthropic_api_key: str = ""
    google_maps_api_key: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    jwt_secret: str = "change-me-in-production-use-openssl-rand-hex-32"
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
