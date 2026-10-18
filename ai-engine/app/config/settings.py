from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic: str = "compose.request"
    kafka_group_id: str = "ourcut-ai-engine"
    core_api_url: str = "http://localhost:8080"
    ai_engine_secret: str = "change-me"


settings = Settings()
