# Evoluciona Library

Hub de recursos con login Discord, roles y analytics.

## Estructura

```
EvoLibrary/
├── frontend/     # Next.js — UI
├── backend/      # FastAPI + Pony ORM
└── cursor/       # Plantillas y guías del proyecto
```

## Probar todo en local (recomendado)

Guía paso a paso: **`cursor/prueba-end-to-end.md`**

### Resumen rápido

**1. Backend** — completar `backend/.env` (ver `.env.template`):

```bash
cd backend
pip install -r requirements.txt
python3 check_setup.py          # lista variables vacías
uvicorn main:app --reload --port 8000
```

**2. Frontend:**

```bash
cd frontend
# .env.local con NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

**3. Discord (obligatorio para alumnos):** guía completa en **`cursor/configurar-discord.md`** — Client ID, Secret, bot, guild y roles en `backend/.env`.

**4. Navegador:** http://localhost:3000 → Ingresar con Discord.

### Smoke test

```bash
curl -s http://localhost:8000/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/hub   # debe ser 401
```

## Auth y permisos

| Rol | Entrar | Editar | Analytics |
|-----|--------|--------|-----------|
| Evoluciona / Equipo | Sí | Sí | Sí |
| Consultoría | Sí | No | No |
| Pre-consultoría | No | — | — |

Detalle: `cursor/auth-discord-roles.md`

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del API |
| GET | `/auth/discord` | Inicia OAuth |
| GET | `/auth/callback` | Callback OAuth |
| POST | `/auth/logout` | Cierra sesión |
| GET | `/api/hub` | Perfil + recursos + favoritos |
| GET | `/api/analytics` | Métricas (solo editores) |
| POST | `/api/resources` | Crear recurso |
| PUT | `/api/resources/{id}` | Actualizar |
| DELETE | `/api/resources/{id}` | Borrar |
| POST | `/api/favorites/{id}/toggle` | Favorito |
| POST | `/api/clicks/{id}` | Registrar click |

Convenciones backend: `cursor/convenciones-backend-pony.md`
