import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.init_db import init_db

sys.path.append(str(Path(__file__).resolve().parents[1] / "scripts"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    # Seed the in-memory identity graph with the demo dataset so the ring
    # is visible immediately on boot — the graph is per-process, so this
    # must run in-process rather than as a separate script invocation.
    from seed_demo_data import load_demo_dataset

    load_demo_dataset()

    yield


app = FastAPI(title="TARA Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
