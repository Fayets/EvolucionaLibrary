from decouple import config
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, Response

from src.services.auth_services import AuthServices

router = APIRouter()
service = AuthServices()

FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")


def _redirect_login_error(detail: str) -> RedirectResponse:
    return RedirectResponse(
        url=f"{FRONTEND_URL}/login?error={detail}",
        status_code=302,
    )


@router.get("/status")
def auth_status():
    try:
        return {"discord_configured": service.is_discord_configured()}
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al verificar la configuración de auth.",
        )


@router.get("/discord")
def discord_login():
    try:
        url = service.get_oauth_authorize_url()
        return RedirectResponse(url=url, status_code=302)
    except HTTPException as e:
        if e.status_code == 503:
            return _redirect_login_error(str(e.detail))
        raise e
    except Exception:
        return _redirect_login_error("oauth_error")


@router.get("/callback")
def auth_callback(
    request: Request,
    code: str | None = None,
    error: str | None = None,
):
    try:
        result = service.complete_login(code, error)
        if result.user_id:
            request.session["user_id"] = result.user_id
        return RedirectResponse(url=result.redirect_url, status_code=302)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado en el callback de Discord.",
        )


@router.post("/logout", status_code=204)
def logout(request: Request):
    try:
        request.session.clear()
        return Response(status_code=204)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al cerrar sesión.",
        )
