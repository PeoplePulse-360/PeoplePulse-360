from fastapi import APIRouter

from models.simulator import SimulatorRequest, SimulatorResponse
from services.simulator import analyse_simulator

router = APIRouter()


@router.post("/simulator", response_model=SimulatorResponse)
def simulator_check(payload: SimulatorRequest) -> SimulatorResponse:
    """Compare current workforce figures with a hypothetical scenario."""
    return analyse_simulator(payload)
