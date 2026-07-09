from pony.orm import db_session, desc

from fastapi import HTTPException

from src.models import Profile, ResourceClick, UserFavorite
from src.schemas import (
    AnalyticsDataResponse,
    ClickProfileNested,
    ClickResourceNested,
    ClickRowResponse,
    FavoriteRowResponse,
)


class AnalyticsServices:
    def get_analytics(self, user_id: str) -> AnalyticsDataResponse:
        with db_session:
            profile = Profile.get(id=user_id)
            if profile is None:
                raise HTTPException(status_code=401, detail="No autorizado")
            if not profile.can_edit:
                raise HTTPException(status_code=403, detail="Sin permiso para analytics")

            clicks_raw = list(
                ResourceClick.select().order_by(desc(ResourceClick.clicked_at))
            )

            clicks = []
            for click in clicks_raw:
                resource = click.resource
                user = click.user
                clicks.append(
                    ClickRowResponse(
                        id=click.id,
                        clicked_at=click.clicked_at.isoformat(),
                        resource_id=resource.id,
                        user_id=user.id,
                        resources=ClickResourceNested(
                            id=resource.id,
                            name=resource.name,
                            category=resource.category,
                            resource_type=resource.resource_type,
                        ),
                        profiles=ClickProfileNested(username=user.username),
                    )
                )

            favorites = []
            for fav in list(UserFavorite.select()):
                resource = fav.resource
                favorites.append(
                    FavoriteRowResponse(
                        user_id=fav.user.id,
                        resource_id=resource.id,
                        resources=ClickResourceNested(
                            id=resource.id,
                            name=resource.name,
                            category=resource.category,
                            resource_type=resource.resource_type,
                        ),
                    )
                )

            return AnalyticsDataResponse(clicks=clicks, favorites=favorites)
