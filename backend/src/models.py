from datetime import datetime
from uuid import uuid4

from pony.orm import Json, Optional, PrimaryKey, Required, Set, composite_key

from src.db import db


class Profile(db.Entity):
    _table_ = "profiles"

    id = PrimaryKey(str)
    discord_id = Required(str, unique=True)
    username = Required(str)
    avatar_url = Optional(str, nullable=True)
    role_name = Required(str)
    can_edit = Required(bool, default=False)
    is_member = Required(bool, default=True)
    last_verified_at = Required(datetime)
    favorites = Set("UserFavorite")
    resources_created = Set("Resource")
    clicks = Set("ResourceClick")


class Resource(db.Entity):
    _table_ = "resources"

    id = PrimaryKey(str, default=lambda: str(uuid4()))
    name = Required(str)
    url = Required(str, unique=True)
    category = Required(str)
    tags = Required(Json)
    resource_type = Required(str)
    icon_url = Optional(str, nullable=True)
    created_at = Required(datetime)
    created_by = Required("Profile")
    favorites = Set("UserFavorite")
    clicks = Set("ResourceClick")


class UserFavorite(db.Entity):
    _table_ = "user_favorites"

    user = Required(Profile)
    resource = Required(Resource)
    composite_key(user, resource)


class ResourceClick(db.Entity):
    _table_ = "resource_clicks"

    id = PrimaryKey(str, default=lambda: str(uuid4()))
    clicked_at = Required(datetime)
    resource = Required(Resource)
    user = Required(Profile)
