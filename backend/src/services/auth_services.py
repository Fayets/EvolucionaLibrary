import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal
from urllib.parse import urlencode

import httpx
from decouple import config
from fastapi import HTTPException
from pony.orm import db_session

from src.models import Profile
from src.schemas import AuthCallbackResult, ProfileResponse

logger = logging.getLogger(__name__)

DISCORD_API = "https://discord.com/api/v10"
DISCORD_OAUTH_AUTHORIZE = "https://discord.com/api/oauth2/authorize"
DISCORD_OAUTH_TOKEN = "https://discord.com/api/oauth2/token"

FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")
DISCORD_CLIENT_ID = config("DISCORD_CLIENT_ID", default="")
DISCORD_CLIENT_SECRET = config("DISCORD_CLIENT_SECRET", default="")
DISCORD_REDIRECT_URI = config(
    "DISCORD_REDIRECT_URI", default="http://localhost:8000/auth/callback"
)
DISCORD_GUILD_ID = config("DISCORD_GUILD_ID", default="")
DISCORD_BOT_TOKEN = config("DISCORD_BOT_TOKEN", default="")

ROLE_MAP: dict[str, str] = {
    config("ROLE_ID_EVOLUCIONA", default=""): "Evoluciona",
    config("ROLE_ID_EQUIPO", default=""): "Equipo",
    config("ROLE_ID_CONSULTORIA", default=""): "Consultoria",
}
ROLE_MAP = {k: v for k, v in ROLE_MAP.items() if k}

ROLE_PRIORITY: dict[str, int] = {
    "Evoluciona": 4,
    "Equipo": 3,
    "Consultoria": 1,
}

EDITOR_ROLES = frozenset({"Evoluciona", "Equipo"})

OAUTH_ENV_KEYS = (
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_GUILD_ID",
    "DISCORD_BOT_TOKEN",
    "ROLE_ID_EVOLUCIONA",
    "ROLE_ID_EQUIPO",
    "ROLE_ID_CONSULTORIA",
)

MemberFailureReason = Literal["guild_misconfigured", "not_member", "no_role"]

DISCORD_UNKNOWN_GUILD = 10004
DISCORD_UNKNOWN_MEMBER = 10007


@dataclass(frozen=True)
class DiscordMemberFetchResult:
    member_info: dict | None = None
    failure_reason: MemberFailureReason | None = None

    @property
    def ok(self) -> bool:
        return self.member_info is not None

    @classmethod
    def success(cls, member_info: dict) -> "DiscordMemberFetchResult":
        return cls(member_info=member_info)

    @classmethod
    def failure(cls, reason: MemberFailureReason) -> "DiscordMemberFetchResult":
        return cls(failure_reason=reason)


def _log_role_map_config() -> None:
    role_map_keys = list(ROLE_MAP.keys())
    logger.info(
        "ROLE_MAP loaded: entry_count=%d keys=%s",
        len(ROLE_MAP),
        role_map_keys,
    )
    if len(ROLE_MAP) < 3:
        logger.warning(
            "ROLE_MAP has fewer than 3 entries (count=%d) — check ROLE_ID_* in .env",
            len(ROLE_MAP),
        )


_log_role_map_config()


def _discord_error_code(res: httpx.Response) -> int | None:
    try:
        code = res.json().get("code")
        return int(code) if code is not None else None
    except (ValueError, TypeError, AttributeError, httpx.DecodingError):
        return None


class AuthServices:
    def is_discord_configured(self) -> bool:
        return len(self._missing_oauth_env()) == 0

    def _missing_oauth_env(self) -> list[str]:
        values = {
            "DISCORD_CLIENT_ID": DISCORD_CLIENT_ID,
            "DISCORD_CLIENT_SECRET": DISCORD_CLIENT_SECRET,
            "DISCORD_GUILD_ID": DISCORD_GUILD_ID,
            "DISCORD_BOT_TOKEN": DISCORD_BOT_TOKEN,
            "ROLE_ID_EVOLUCIONA": config("ROLE_ID_EVOLUCIONA", default=""),
            "ROLE_ID_EQUIPO": config("ROLE_ID_EQUIPO", default=""),
            "ROLE_ID_CONSULTORIA": config("ROLE_ID_CONSULTORIA", default=""),
        }
        return [key for key in OAUTH_ENV_KEYS if not str(values.get(key, "")).strip()]

    def _ensure_oauth_configured(self) -> None:
        if self._missing_oauth_env():
            raise HTTPException(status_code=503, detail="oauth_not_configured")

    def verify_discord_guild(self) -> None:
        """Verifica que el bot pueda acceder al guild configurado. Solo loguea, no bloquea."""
        missing = self._missing_oauth_env()
        if missing:
            logger.warning(
                "Discord guild verification skipped — missing env: %s",
                ", ".join(missing),
            )
            return

        try:
            with httpx.Client() as client:
                res = client.get(
                    f"{DISCORD_API}/guilds/{DISCORD_GUILD_ID}",
                    headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
                )
        except httpx.HTTPError as exc:
            logger.warning("Discord guild verification request failed: %s", exc)
            return

        if res.is_success:
            logger.info(
                "Discord guild verification OK: guild_id=%s status_code=%s",
                DISCORD_GUILD_ID,
                res.status_code,
            )
            return

        logger.warning(
            "Discord guild verification failed: guild_id=%s status_code=%s body=%s",
            DISCORD_GUILD_ID,
            res.status_code,
            res.text,
        )

    def get_oauth_authorize_url(self) -> str:
        self._ensure_oauth_configured()
        params = urlencode(
            {
                "client_id": DISCORD_CLIENT_ID,
                "redirect_uri": DISCORD_REDIRECT_URI,
                "response_type": "code",
                "scope": "identify",
            }
        )
        return f"{DISCORD_OAUTH_AUTHORIZE}?{params}"

    def complete_login(
        self, code: str | None, oauth_error: str | None
    ) -> AuthCallbackResult:
        if oauth_error:
            return AuthCallbackResult(
                redirect_url=f"{FRONTEND_URL}/login?error={oauth_error}"
            )
        if not code:
            return AuthCallbackResult(
                redirect_url=f"{FRONTEND_URL}/login?error=missing_code"
            )

        discord_user = self._exchange_code_and_fetch_user(code)
        discord_id = discord_user["id"]

        try:
            member_result = self._fetch_discord_member(discord_id)
        except httpx.HTTPError:
            return AuthCallbackResult(
                redirect_url=f"{FRONTEND_URL}/unauthorized?reason=discord_api_error"
            )

        if not member_result.ok:
            reason = member_result.failure_reason or "not_member"
            return AuthCallbackResult(
                redirect_url=f"{FRONTEND_URL}/unauthorized?reason={reason}"
            )

        try:
            profile = self._upsert_profile(discord_id, member_result.member_info)
        except Exception:
            return AuthCallbackResult(
                redirect_url=f"{FRONTEND_URL}/unauthorized?reason=profile_error"
            )

        return AuthCallbackResult(
            redirect_url=f"{FRONTEND_URL}/",
            user_id=profile.id,
        )

    def get_profile_by_id(self, user_id: str) -> ProfileResponse:
        with db_session:
            profile = Profile.get(id=user_id)
            if profile is None:
                raise HTTPException(status_code=401, detail="No autorizado")
            return self._profile_to_schema(profile)

    def _exchange_code_and_fetch_user(self, code: str) -> dict:
        self._ensure_oauth_configured()
        with httpx.Client() as client:
            token_res = client.post(
                DISCORD_OAUTH_TOKEN,
                data={
                    "client_id": DISCORD_CLIENT_ID,
                    "client_secret": DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": DISCORD_REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if not token_res.is_success:
                raise HTTPException(
                    status_code=400,
                    detail="No se pudo intercambiar el código de Discord.",
                )
            access_token = token_res.json().get("access_token")
            if not access_token:
                raise HTTPException(
                    status_code=400,
                    detail="Discord no devolvió access_token.",
                )

            user_res = client.get(
                f"{DISCORD_API}/users/@me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if not user_res.is_success:
                raise HTTPException(
                    status_code=400,
                    detail="No se pudo obtener el usuario de Discord.",
                )
            return user_res.json()

    def _fetch_discord_member(self, discord_user_id: str) -> DiscordMemberFetchResult:
        self._ensure_oauth_configured()

        with httpx.Client() as client:
            res = client.get(
                f"{DISCORD_API}/guilds/{DISCORD_GUILD_ID}/members/{discord_user_id}",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
            )

        if res.is_success:
            logger.info(
                "Discord member fetch: user_id=%s status_code=%s",
                discord_user_id,
                res.status_code,
            )
        else:
            logger.info(
                "Discord member fetch: user_id=%s status_code=%s body=%s",
                discord_user_id,
                res.status_code,
                res.text,
            )

        if res.status_code == 404:
            error_code = _discord_error_code(res)
            if error_code == DISCORD_UNKNOWN_GUILD:
                logger.warning(
                    "Discord Unknown Guild (10004): guild_id=%s — check DISCORD_GUILD_ID "
                    "and that the bot is in the server",
                    DISCORD_GUILD_ID,
                )
                return DiscordMemberFetchResult.failure("guild_misconfigured")
            if error_code == DISCORD_UNKNOWN_MEMBER:
                logger.info(
                    "Discord Unknown Member (10007): user_id=%s guild_id=%s",
                    discord_user_id,
                    DISCORD_GUILD_ID,
                )
                return DiscordMemberFetchResult.failure("not_member")
            logger.warning(
                "Discord member fetch 404 without known code: user_id=%s error_code=%s body=%s",
                discord_user_id,
                error_code,
                res.text,
            )
            return DiscordMemberFetchResult.failure("not_member")

        if not res.is_success:
            raise httpx.HTTPStatusError(
                f"Discord API {res.status_code}: {res.text}",
                request=res.request,
                response=res,
            )

        member = res.json()
        discord_role_ids = member.get("roles", [])
        mapped_roles = [
            ROLE_MAP[role_id]
            for role_id in discord_role_ids
            if role_id in ROLE_MAP
        ]
        if not mapped_roles:
            logger.warning(
                "No matching roles for user_id=%s: discord_role_ids=%s role_map_keys=%s",
                discord_user_id,
                discord_role_ids,
                list(ROLE_MAP.keys()),
            )
            return DiscordMemberFetchResult.failure("no_role")

        role_name = max(
            mapped_roles, key=lambda name: ROLE_PRIORITY.get(name, 0)
        )
        user = member.get("user", {})
        avatar_hash = user.get("avatar")
        avatar_url = (
            f"https://cdn.discordapp.com/avatars/{discord_user_id}/{avatar_hash}.png"
            if avatar_hash
            else None
        )

        return DiscordMemberFetchResult.success(
            {
                "username": user.get("username") or member.get("nick") or "unknown",
                "avatar_url": avatar_url,
                "role_name": role_name,
                "can_edit": role_name in EDITOR_ROLES,
            }
        )

    @db_session
    def _upsert_profile(self, discord_id: str, member_info: dict) -> ProfileResponse:
        now = datetime.now(timezone.utc)
        profile = Profile.get(id=discord_id)
        if profile is None:
            profile = Profile(
                id=discord_id,
                discord_id=discord_id,
                username=member_info["username"],
                avatar_url=member_info.get("avatar_url"),
                role_name=member_info["role_name"],
                can_edit=member_info["can_edit"],
                is_member=True,
                last_verified_at=now,
            )
        else:
            profile.username = member_info["username"]
            profile.avatar_url = member_info.get("avatar_url")
            profile.role_name = member_info["role_name"]
            profile.can_edit = member_info["can_edit"]
            profile.is_member = True
            profile.last_verified_at = now

        return self._profile_to_schema(profile)

    def _profile_to_schema(self, profile: Profile) -> ProfileResponse:
        return ProfileResponse(
            id=profile.id,
            username=profile.username,
            avatar_url=profile.avatar_url,
            role_name=profile.role_name,
            can_edit=profile.can_edit,
        )
