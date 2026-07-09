from fastapi import APIRouter, Depends, HTTPException

from src.dependencies import get_current_user
from src.schemas import AnalyticsDataResponse, ProfileResponse
from src.services.analytics_services import AnalyticsServices

router = APIRouter()
service = AnalyticsServices()


@router.get("/analytics", response_model=AnalyticsDataResponse)
def get_analytics(current_user: ProfileResponse = Depends(get_current_user)):
    try:
        return service.get_analytics(current_user.id)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al cargar analytics.",
        )
