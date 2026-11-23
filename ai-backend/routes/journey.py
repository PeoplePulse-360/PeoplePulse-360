from fastapi import APIRouter

from models.journey import JourneyRequest, JourneyResponse
from services.journey import analyse_journey

router = APIRouter()


@router.post("/journey", response_model=JourneyResponse)
def journey_check(payload: JourneyRequest):
    """Analyse employee work records and return attention indicators."""
    return analyse_journey(payload)