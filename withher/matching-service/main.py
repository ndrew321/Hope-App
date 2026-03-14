from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import HealthResponse
from routers.match import router as match_router
from ml.embeddings import get_model
from services.db import MatchingRepository

load_dotenv()

MODEL_READY = False
POSTGRES_READY = False
STARTUP_ERROR = ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    global MODEL_READY, POSTGRES_READY, STARTUP_ERROR
    try:
        get_model()
        MODEL_READY = True
    except Exception as exc:  # pragma: no cover
        STARTUP_ERROR = f"embedding model failed: {exc}"

    try:
        repo = MatchingRepository()
        row = repo.get_user_feature_row("00000000-0000-0000-0000-000000000000")
        _ = row
        POSTGRES_READY = True
    except Exception as exc:  # pragma: no cover
        STARTUP_ERROR = (STARTUP_ERROR + " | " if STARTUP_ERROR else "") + f"database failed: {exc}"

    yield


app = FastAPI(
    title="with/her Matching Service",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(match_router)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    status = "ok" if MODEL_READY and POSTGRES_READY else "degraded"
    detail = STARTUP_ERROR if status == "degraded" else None
    return HealthResponse(
        status=status,
        model_ready=MODEL_READY,
        postgres_connected=POSTGRES_READY,
        detail=detail,
    )
