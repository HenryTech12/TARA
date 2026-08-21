from collections.abc import Generator

from sqlalchemy.orm import Session, sessionmaker

from app.core.database import SessionLocal


def get_session_factory() -> sessionmaker:
    return SessionLocal


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
