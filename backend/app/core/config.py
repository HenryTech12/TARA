from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "TARA Backend"
    app_version: str = "0.1.0"

    postgres_url: str = "postgresql+psycopg://tara:tara@postgres:5432/tara"

    # QoreID sandbox credentials — filled in once track-brief credentials are issued.
    # Stubbed until then; see app/services/qoreid_service.py.
    qoreid_api_key: str = ""
    qoreid_base_url: str = "https://api.qoreid.com/v1"

    # Neo4j, Redis, Groq, and Squad configuration removed — not used in TARA's
    # scope (PRD Section 02, Step 3: no Neo4j provisioning, no Celery/Redis
    # queue, no STR generation, no Squad webhooks).

settings = Settings()