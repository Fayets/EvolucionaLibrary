from fastapi import APIRouter, Depends, HTTPException

from src.dependencies import get_current_user
from src.schemas import (
    ActionResult,
    ProfileResponse,
    ResourceInput,
    ToggleFavoriteResult,
)
from src.services.resources_services import ResourcesServices

router = APIRouter()
service = ResourcesServices()


@router.post("/resources", response_model=ActionResult)
def create_resource(
    data: ResourceInput,
    current_user: ProfileResponse = Depends(get_current_user),
):
    try:
        return service.create_resource(current_user.id, data)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al crear el recurso.",
        )


@router.put("/resources/{resource_id}", response_model=ActionResult)
def update_resource(
    resource_id: str,
    data: ResourceInput,
    current_user: ProfileResponse = Depends(get_current_user),
):
    try:
        return service.update_resource(current_user.id, resource_id, data)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al actualizar el recurso.",
        )


@router.delete("/resources/{resource_id}", response_model=ActionResult)
def delete_resource(
    resource_id: str,
    current_user: ProfileResponse = Depends(get_current_user),
):
    try:
        return service.delete_resource(current_user.id, resource_id)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al borrar el recurso.",
        )


@router.post("/favorites/{resource_id}/toggle", response_model=ToggleFavoriteResult)
def toggle_favorite(
    resource_id: str,
    current_user: ProfileResponse = Depends(get_current_user),
):
    try:
        return service.toggle_favorite(current_user.id, resource_id)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al cambiar el favorito.",
        )


@router.post("/clicks/{resource_id}", status_code=204)
def record_click(
    resource_id: str,
    current_user: ProfileResponse = Depends(get_current_user),
):
    try:
        service.record_click(current_user.id, resource_id)
        return None
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al registrar el click.",
        )
