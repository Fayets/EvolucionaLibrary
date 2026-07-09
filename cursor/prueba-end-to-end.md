# Prueba end-to-end — EvoLibrary

Checklist para probar frontend + backend en local.

## 1. Variables de entorno

### `backend/.env` (copiar desde `.env.template`)

| Variable | ¿Listo? | Dónde obtenerla |
|----------|---------|-----------------|
| `DB_PROVIDER` | `postgres` | Fijo |
| `DB_USER` | Neon → Connection details | |
| `DB_PASS` | Neon → Connection details | |
| `DB_HOST` | Neon → host del pooler | |
| `DB_NAME` | Neon → nombre de la BD | |
| `FRONTEND_URL` | `http://localhost:3000` | Fijo en local |
| `DISCORD_CLIENT_ID` | [Discord Developer Portal](https://discord.com/developers/applications) → tu app → OAuth2 | |
| `DISCORD_CLIENT_SECRET` | Misma app → OAuth2 → Client Secret | |
| `DISCORD_REDIRECT_URI` | `http://localhost:8000/auth/callback` | Debe coincidir **exacto** en Discord OAuth2 → Redirects |
| `DISCORD_GUILD_ID` | Discord → servidor Evoluciona → clic derecho → Copiar ID del servidor | |
| `DISCORD_BOT_TOKEN` | Developer Portal → Bot → Reset Token / copiar token | |
| `ROLE_ID_EVOLUCIONA` | Discord → Ajustes → Avanzado → Modo desarrollador ON → clic derecho al rol → Copiar ID | |
| `ROLE_ID_EQUIPO` | Igual | |
| `ROLE_ID_CONSULTORIA` | Igual | |
| `SESSION_SECRET` | Cadena aleatoria larga (ej. `openssl rand -hex 32`) | Obligatorio para cookies |

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 2. Discord Developer Portal (una sola vez)

1. **OAuth2 → Redirects:** agregar `http://localhost:8000/auth/callback`
2. **OAuth2 → URL Generator** (opcional): scopes `identify`
3. **Bot:** invitar el bot al servidor Evoluciona con permiso **Ver canales** y leer miembros (o Administrator en dev)
4. El bot debe poder ver el guild y los roles de los miembros

## 3. Arrancar servicios

Si el puerto 8000 está ocupado por otro proceso:

```bash
lsof -i :8000
# matar el PID viejo o usar otro puerto y actualizar frontend/.env.local
```

Terminal 1 — backend:

```bash
cd backend
pip install -r requirements.txt
python3 check_setup.py    # ver qué falta en .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 — frontend:

```bash
cd frontend
cp .env.example .env.local   # si no existe
npm install
npm run dev
```

## 4. Smoke test rápido (terminal)

```bash
curl -s http://localhost:8000/health
# → {"status":"ok","service":"evolibrary-api"}

curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/hub
# → 401 (sin sesión, esperado)
```

## 5. Flujo manual en el navegador

1. Abrí http://localhost:3000 → debería redirigir a login si no hay sesión
2. **Ingresar con Discord** → OAuth → vuelta al hub `/`
3. Si tenés rol **Pre-consultoría** → `/unauthorized?reason=not_member`
4. Si tenés **Consultoría** → ves recursos, sin botón agregar ni Analytics
5. Si tenés **Evoluciona** o **Equipo** → podés agregar/editar/borrar recursos y ver **Analytics**
6. Clic en un recurso → registra click (silencioso)
7. Estrella → toggle favorito
8. Cerrar sesión → vuelve a login

## 6. Errores frecuentes

| Síntoma | Causa probable |
|---------|----------------|
| Login vuelve con error | `DISCORD_REDIRECT_URI` no coincide con Discord Portal |
| `not_member` | No estás en el guild o solo tenés Pre-consultoría |
| `discord_api_error` | `DISCORD_GUILD_ID` / `DISCORD_BOT_TOKEN` incorrectos o bot sin acceso |
| Hub “Error al cargar” | Backend no corre en :8000 o CORS / `FRONTEND_URL` mal |
| Cookie no persiste | Falta `SESSION_SECRET` o frontend no usa `credentials: 'include'` (ya está en `api.ts`) |
| 500 al arrancar API | BD Neon: revisar `DB_*` o firewall |

## 7. Tablas EvoLibrary en Neon

Al primer arranque del backend se crean si no existen: `profiles`, `resources`, `user_favorites`, `resource_clicks`. No modifican tablas del otro sistema (`client`, `ticket`, etc.).
