from datetime import datetime, timezone

from fastapi import HTTPException
from pony.orm import db_session, select

from src.lib.resource_type import detect_resource_type
from src.models import Profile, Resource, ResourceClick, UserFavorite
from src.schemas import ActionResult, ResourceInput, ToggleFavoriteResult


class ResourcesServices:
    def create_resource(self, user_id: str, data: ResourceInput) -> ActionResult:
        with db_session:
            profile = Profile.get(id=user_id)
            if profile is None:
                raise HTTPException(status_code=401, detail="No autorizado")
            if not profile.can_edit:
                return ActionResult(
                    success=False,
                    error="No tenés permiso para agregar recursos",
                )

            existing = Resource.get(url=data.url)
            if existing is not None:
                return ActionResult(
                    success=False,
                    error="Ya existe un recurso con esa URL",
                )

            resource_type, icon_url = detect_resource_type(data.url)
            Resource(
                name=data.name,
                url=data.url,
                category=data.category,
                tags=list(data.tags),
                resource_type=resource_type,
                icon_url=icon_url,
                created_at=datetime.now(timezone.utc),
                created_by=profile,
            )
            return ActionResult(success=True)

    def update_resource(
        self, user_id: str, resource_id: str, data: ResourceInput
    ) -> ActionResult:
        with db_session:
            profile = Profile.get(id=user_id)
            if profile is None:
                raise HTTPException(status_code=401, detail="No autorizado")
            if not profile.can_edit:
                return ActionResult(
                    success=False,
                    error="No tenés permiso para editar recursos",
                )
            if not resource_id:
                return ActionResult(success=False, error="Falta el ID del recurso")

            resource = Resource.get(id=resource_id)
            if resource is None:
                return ActionResult(success=False, error="Recurso no encontrado")

            duplicate = Resource.get(url=data.url)
            if duplicate is not None and duplicate.id != resource_id:
                return ActionResult(
                    success=False,
                    error="Ya existe otro recurso con esa URL",
                )

            resource_type, icon_url = detect_resource_type(data.url)
            resource.name = data.name
            resource.url = data.url
            resource.category = data.category
            resource.tags = list(data.tags)
            resource.resource_type = resource_type
            resource.icon_url = icon_url
            return ActionResult(success=True)

    def delete_resource(self, user_id: str, resource_id: str) -> ActionResult:
        with db_session:
            profile = Profile.get(id=user_id)
            if profile is None:
                raise HTTPException(status_code=401, detail="No autorizado")
            if not profile.can_edit:
                return ActionResult(
                    success=False,
                    error="No tenés permiso para borrar recursos",
                )
            if not resource_id:
                return ActionResult(success=False, error="Falta el ID del recurso")

            resource = Resource.get(id=resource_id)
            if resource is None:
                return ActionResult(success=False, error="Recurso no encontrado")

            resource.delete()
            return ActionResult(success=True)

    def toggle_favorite(
        self, user_id: str, resource_id: str
    ) -> ToggleFavoriteResult:
        with db_session:
            profile = Profile.get(id=user_id)
            if profile is None:
                raise HTTPException(status_code=401, detail="No autorizado")
            if not resource_id:
                return ToggleFavoriteResult(
                    success=False, error="Falta el ID del recurso"
                )

            resource = Resource.get(id=resource_id)
            if resource is None:
                return ToggleFavoriteResult(
                    success=False, error="Recurso no encontrado"
                )

            existing = UserFavorite.get(user=profile, resource=resource)
            if existing is not None:
                existing.delete()
                return ToggleFavoriteResult(success=True, isFavorite=False)

            UserFavorite(user=profile, resource=resource)
            return ToggleFavoriteResult(success=True, isFavorite=True)

    def record_click(self, user_id: str, resource_id: str) -> None:
        if not resource_id:
            return
        with db_session:
            profile = Profile.get(id=user_id)
            if profile is None:
                return
            resource = Resource.get(id=resource_id)
            if resource is None:
                return
            ResourceClick(
                clicked_at=datetime.now(timezone.utc),
                resource=resource,
                user=profile,
            )
