from fastapi import FastAPI

from routes.journey import router as journey_router
from routes.simulator import router as simulator_router
from routes.workload import router as workload_router

app = FastAPI(
    title="PeoplePulse 360 AI Backend",
    description="Employee Journey Prediction, Workload Friction Detection, and HR What-If Simulator.",
    version="0.1.0",
)

app.include_router(journey_router, prefix="/api/ai", tags=["AI"])
app.include_router(workload_router, prefix="/api/ai", tags=["AI"])
app.include_router(simulator_router, prefix="/api/ai", tags=["AI"])


@app.get("/")
def health_check():
    """Confirms the server is running."""
    return {
        "status": "ok",
        "service": "PeoplePulse 360 AI Backend",
    }
