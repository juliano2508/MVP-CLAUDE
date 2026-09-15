from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./agendafacil.db"
    secret_key: str = "dev-secret-key-change-me"
    access_token_expire_minutes: int = 60
    trial_days: int = 14

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "no-reply@agendafacil.com"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
