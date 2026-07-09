from pony.orm import db_session, desc

from fastapi import HTTPException

from src.models import Profile, Resource, UserFavorite
from src.schemas import HubDataResponse, ProfileResponse, ResourceResponse


class HubServices:
    def get_hub(self, user_id: str) -> HubDataResponse:
        with db_session:
            profile = Profile.get(id=user_id)
            if profile is None:
                raise HTTPException(status_code=401, detail="No autorizado")
            if not profile.is_member:
                raise HTTPException(status_code=403, detail="Sin acceso al hub")

            favorite_ids = {
                fav.resource.id
                for fav in list(
                    UserFavorite.select(lambda f: f.user.id == user_id)
                )
            }

            resources = list(Resource.select().order_by(desc(Resource.created_at)))

            return HubDataResponse(
                profile=self._profile_to_schema(profile),
                resources=[
                    self._resource_to_schema(r, r.id in favorite_ids)
                    for r in resources
                ],
                can_edit=profile.can_edit,
            )

    def _profile_to_schema(self, profile: Profile) -> ProfileResponse:
        return ProfileResponse(
            id=profile.id,
            username=profile.username,
            avatar_url=profile.avatar_url,
            role_name=profile.role_name,
            can_edit=profile.can_edit,
        )

    def _resource_to_schema(
        self, resource: Resource, is_favorite: bool
    ) -> ResourceResponse:
        tags = resource.tags if resource.tags else []
        if not isinstance(tags, list):
            tags = list(tags)
        return ResourceResponse(
            id=resource.id,
            name=resource.name,
            url=resource.url,
            category=resource.category,
            tags=tags,
            resource_type=resource.resource_type,
            icon_url=resource.icon_url,
            created_at=resource.created_at.isoformat(),
            is_favorite=is_favorite,
        )
