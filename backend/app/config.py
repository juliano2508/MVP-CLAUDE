from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./agendafacil.db"
    secret_key: str = "dev-secret-key-change-me"
    access_token_expire_minutes: int = 60
    trial_days: int = 14

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
