from sqlalchemy import text

from app.core.database import Base, engine
from app.models import tables  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        # Remove duplicate alerts — keep the oldest row per fingerprint
        connection.execute(
            text(
                """
                DELETE FROM alerts
                WHERE id IN (
                    SELECT id FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY subgraph_json->>'fingerprint'
                                   ORDER BY created_at ASC
                               ) AS rn
                        FROM alerts
                        WHERE subgraph_json->>'fingerprint' IS NOT NULL
                    ) ranked
                    WHERE rn > 1
                );
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS alerts_fingerprint_unique
                ON alerts ((subgraph_json->>'fingerprint'))
                WHERE subgraph_json->>'fingerprint' IS NOT NULL;
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE OR REPLACE FUNCTION enforce_audit_log_immutable()
                RETURNS trigger AS $$
                BEGIN
                    RAISE EXCEPTION 'audit_log is immutable and cannot be updated or deleted';
                END;
                $$ LANGUAGE plpgsql;
                """
            )
        )
        connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_trigger WHERE tgname = 'audit_log_immutable_trigger'
                    ) THEN
                        CREATE TRIGGER audit_log_immutable_trigger
                        BEFORE UPDATE OR DELETE ON audit_log
                        FOR EACH ROW EXECUTE FUNCTION enforce_audit_log_immutable();
                    END IF;
                END;
                $$;
                """
            )
        )


if __name__ == "__main__":
    init_db()
    print("Database schema initialized")
