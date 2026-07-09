#!/usr/bin/env python3
"""Verifica variables de .env antes de probar. Ejecutar desde backend/: python3 check_setup.py"""

from pathlib import Path

from decouple import Config, RepositoryEnv

ENV_PATH = Path(__file__).parent / ".env"
config = Config(RepositoryEnv(ENV_PATH)) if ENV_PATH.exists() else Config()

REQUIRED = [
    ("DB_PROVIDER", "Base de datos"),
    ("DB_USER", "Base de datos"),
    ("DB_PASS", "Base de datos"),
    ("DB_HOST", "Base de datos"),
    ("DB_NAME", "Base de datos"),
    ("FRONTEND_URL", "CORS y redirects"),
    ("DISCORD_CLIENT_ID", "Login Discord"),
    ("DISCORD_CLIENT_SECRET", "Login Discord"),
    ("DISCORD_REDIRECT_URI", "Login Discord"),
    ("DISCORD_GUILD_ID", "Roles Discord"),
    ("DISCORD_BOT_TOKEN", "Roles Discord"),
    ("ROLE_ID_EVOLUCIONA", "Roles Discord"),
    ("ROLE_ID_EQUIPO", "Roles Discord"),
    ("ROLE_ID_CONSULTORIA", "Roles Discord"),
    ("SESSION_SECRET", "Sesión (cookies)"),
]

def main() -> None:
    if not ENV_PATH.exists():
        print("❌ No existe backend/.env — copiá: cp .env.template .env")
        return

    missing = [name for name, _ in REQUIRED if not config(name, default="").strip()]
    if not missing:
        print("✅ Todas las variables requeridas tienen valor.")
        print("   Siguiente: uvicorn main:app --reload --port 8000")
        return

    print("⚠️  Faltan o están vacías:\n")
    labels = dict(REQUIRED)
    for name in missing:
        print(f"   - {name} ({labels[name]})")
    print("\n   Completá backend/.env y volvé a ejecutar este script.")


if __name__ == "__main__":
    main()
