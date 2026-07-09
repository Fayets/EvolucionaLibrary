import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s | %(message)s",
)

from contextlib import asynccontextmanager

from decouple import config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from src.controllers.auth_controller import router as auth_router
from src.controllers.health_controller import router as health_router
from src.controllers.analytics_controller import router as analytics_router
from src.controllers.hub_controller import router as hub_router
from src.controllers.resources_controller import router as resources_router
from src.db import db

FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")
SESSION_SECRET = config("SESSION_SECRET", default="dev-change-me")


def init_db() -> None:
    import src.models  # noqa: F401 — registra entidades Pony

    db.generate_mapping(create_tables=True)


def _warn_discord_config() -> None:
    from src.services.auth_services import AuthServices

    missing = AuthServices()._missing_oauth_env()
    if missing:
        print(
            "\n⚠️  Discord OAuth incompleto — los alumnos no podrán iniciar sesión."
            f"\n   Variables vacías en backend/.env: {', '.join(missing)}"
            "\n   Guía: cursor/configurar-discord.md\n"
        )


def _verify_discord_guild() -> None:
    from src.services.auth_services import AuthServices

    AuthServices().verify_discord_guild()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    _warn_discord_config()
    _verify_discord_guild()
    yield


app = FastAPI(
    title="Evoluciona Library API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    same_site="lax",
    https_only=False,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router, prefix="/auth")
app.include_router(hub_router, prefix="/api")
app.include_router(resources_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
