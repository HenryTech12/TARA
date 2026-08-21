from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "TARA Backend"
    app_version: str = "0.1.0"

    postgres_url: str = "postgresql+psycopg://tara:tara@postgres:5432/tara"

    @field_validator("postgres_url")
    @classmethod
    def _normalize_postgres_scheme(cls, value: str) -> str:
        """Managed Postgres providers (Aiven, Heroku/Render, Railway, ...)
        hand out connection strings as postgres:// or plain postgresql://,
        neither of which SQLAlchemy accepts — it needs the +psycopg driver
        suffix or it raises NoSuchModuleError on the bare "postgres" scheme.
        Rewrite either into postgresql+psycopg:// so a provider's stock
        connection string just works without hand-editing it first."""
        if value.startswith("postgres://"):
            return "postgresql+psycopg://" + value[len("postgres://") :]
        if value.startswith("postgresql://"):
            return "postgresql+psycopg://" + value[len("postgresql://") :]
        return value

    # QoreID credentials — leave blank to use the deterministic stub; see
    # app/services/qoreid_service.py. QOREID_API_KEY holds the client secret
    # (the "secret" field QoreID's /token endpoint expects), not a bearer
    # token itself.
    qoreid_client_id: str = ""
    qoreid_api_key: str = ""
    qoreid_base_url: str = "https://api.qoreid.com/v1"

    # Neo4j, Redis, Groq, and Squad configuration removed — not used in TARA's
    # scope (PRD Section 02, Step 3: no Neo4j provisioning, no Celery/Redis
    # queue, no STR generation, no Squad webhooks).

settings = Settings()