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

    frontend_url: str = "http://127.0.0.1:5173"

    # Se não configurado, a assinatura roda em modo demo (sem chamadas reais
    # ao Stripe): assinar/cancelar altera o status localmente na hora.
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_price_id: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
