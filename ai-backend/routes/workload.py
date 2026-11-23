from fastapi import APIRouter

from models.workload import WorkloadRequest, WorkloadResponse
from services.workload import analyse_workload

router = APIRouter()


@router.post("/workload", response_model=WorkloadResponse)
def workload_check(payload: WorkloadRequest):
    """Analyse workload records and return employee and department indicators."""
    return analyse_workload(payload)