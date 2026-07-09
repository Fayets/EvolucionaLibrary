from fastapi import APIRouter, Depends, HTTPException

from src.dependencies import get_current_user
from src.schemas import HubDataResponse, ProfileResponse
from src.services.hub_services import HubServices

router = APIRouter()
service = HubServices()


@router.get("/hub", response_model=HubDataResponse)
def get_hub(current_user: ProfileResponse = Depends(get_current_user)):
    try:
        return service.get_hub(current_user.id)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al cargar el hub.",
        )
