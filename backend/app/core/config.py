from urllib.parse import urlsplit, urlunsplit

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

    @field_validator("qoreid_base_url")
    @classmethod
    def _normalize_qoreid_base_url(cls, value: str) -> str:
        """A blank QOREID_BASE_URL, or one pasted without the http(s)
        scheme (e.g. "api.qoreid.com/v1"), makes httpx raise "Request URL
        is missing an 'http://' or 'https://' protocol" the moment a live
        call is attempted — falls back to the stub, but only after
        breaking every live verification. Fall back to the real default
        when blank, and add the scheme when it's just missing."""
        value = value.strip()
        if not value:
            return cls.model_fields["qoreid_base_url"].default
        if not value.startswith(("http://", "https://")):
            value = f"https://{value}"

        # QoreID's own credential/dashboard materials list "www.qoreid.com"
        # as the product's URL, right next to the API keys — easy to paste
        # in by mistake for the API host. www.qoreid.com and bare
        # qoreid.com serve the marketing site, not the API, and 301
        # redirect to each other rather than to anything that returns a
        # token. The real API host is api.qoreid.com.
        parts = urlsplit(value)
        if parts.netloc in ("www.qoreid.com", "qoreid.com"):
            value = urlunsplit(parts._replace(netloc="api.qoreid.com"))

        return value

    # Neo4j, Redis, Groq, and Squad configuration removed — not used in TARA's
    # scope (PRD Section 02, Step 3: no Neo4j provisioning, no Celery/Redis
    # queue, no STR generation, no Squad webhooks).

settings = Settings()