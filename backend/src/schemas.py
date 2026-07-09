from pydantic import BaseModel, Field, field_validator


class HealthResponse(BaseModel):
    status: str
    service: str


class ProfileResponse(BaseModel):
    id: str
    username: str
    avatar_url: str | None
    role_name: str
    can_edit: bool


class AuthCallbackResult(BaseModel):
    redirect_url: str
    user_id: str | None = None


class ResourceInput(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    url: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=40)
    tags: list[str] = Field(default_factory=list)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        value = value.strip()
        if not value.startswith(("http://", "https://")):
            raise ValueError("Tiene que ser una URL válida (ej: https://...)")
        return value

    @field_validator("name", "category")
    @classmethod
    def strip_strings(cls, value: str) -> str:
        return value.strip()

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, tags: list[str]) -> list[str]:
        if len(tags) > 10:
            raise ValueError("Máximo 10 tags por recurso")
        cleaned = []
        for tag in tags:
            t = tag.strip()
            if not t:
                continue
            if len(t) > 30:
                raise ValueError("Cada tag puede tener hasta 30 caracteres")
            cleaned.append(t)
        return cleaned


class ResourceResponse(BaseModel):
    id: str
    name: str
    url: str
    category: str
    tags: list[str]
    resource_type: str
    icon_url: str | None
    created_at: str
    is_favorite: bool = False


class HubDataResponse(BaseModel):
    profile: ProfileResponse
    resources: list[ResourceResponse]
    can_edit: bool


class ActionResult(BaseModel):
    success: bool
    error: str | None = None


class ToggleFavoriteResult(BaseModel):
    success: bool
    isFavorite: bool | None = None
    error: str | None = None


class ClickResourceNested(BaseModel):
    id: str
    name: str
    category: str
    resource_type: str


class ClickProfileNested(BaseModel):
    username: str


class ClickRowResponse(BaseModel):
    id: str
    clicked_at: str
    resource_id: str
    user_id: str
    resources: ClickResourceNested | None
    profiles: ClickProfileNested | None


class FavoriteRowResponse(BaseModel):
    user_id: str
    resource_id: str
    resources: ClickResourceNested | None = None


class AnalyticsDataResponse(BaseModel):
    clicks: list[ClickRowResponse]
    favorites: list[FavoriteRowResponse]
