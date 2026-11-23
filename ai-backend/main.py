import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import require_hr_admin
from routes.journey import router as journey_router
from routes.simulator import router as simulator_router
from routes.workload import router as workload_router

app = FastAPI(
    title="PeoplePulse 360 AI Backend",
    description="AI workforce analysis and planning endpoints.",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(journey_router, prefix="/api/ai", tags=["AI"], dependencies=[Depends(require_hr_admin)])
app.include_router(workload_router, prefix="/api/ai", tags=["AI"], dependencies=[Depends(require_hr_admin)])
app.include_router(simulator_router, prefix="/api/ai", tags=["AI"], dependencies=[Depends(require_hr_admin)])


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "PeoplePulse 360 AI Backend"}
