from fastapi import HTTPException, Request

from src.schemas import ProfileResponse
from src.services.auth_services import AuthServices

_auth_service = AuthServices()


def get_current_user(request: Request) -> ProfileResponse:
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="No autorizado")
    return _auth_service.get_profile_by_id(user_id)
