# Configurar login con Discord (obligatorio para alumnos)

Sin estos pasos, el botón **Ingresar con Discord** no funciona.

## 1. Crear o reutilizar la aplicación en Discord

1. Entrá a https://discord.com/developers/applications
2. **New Application** (o abrí la app que ya usaban con Supabase/Next)
3. En **OAuth2 → General**:
   - Copiá **Client ID** → `DISCORD_CLIENT_ID` en `backend/.env`
   - Copiá **Client Secret** → `DISCORD_CLIENT_SECRET`
4. En **OAuth2 → Redirects**, agregá **exactamente**:
   - Local: `http://localhost:8000/auth/callback`
   - Producción (cuando desplieguen): `https://TU-API/auth/callback`

## 2. Bot en el servidor de Evoluciona

1. En la app → **Bot** → **Reset Token** → copiá a `DISCORD_BOT_TOKEN`
2. Activá **Server Members Intent** (Privileged Gateway Intents) si aparece
3. **OAuth2 → URL Generator** → scopes: `bot` + `identify` (o invitá el bot manualmente)
4. El bot debe estar en el servidor **Evoluciona** con permiso para ver miembros

## 3. IDs del servidor y roles

En Discord (Modo desarrollador activado en Ajustes → Avanzado):

| Variable | Cómo obtenerla |
|----------|----------------|
| `DISCORD_GUILD_ID` | Clic derecho al servidor Evoluciona → Copiar ID del servidor |
| `ROLE_ID_EVOLUCIONA` | Clic derecho al rol → Copiar ID |
| `ROLE_ID_EQUIPO` | Igual |
| `ROLE_ID_CONSULTORIA` | Igual |

## 4. Completar `backend/.env`

```env
DISCORD_CLIENT_ID=1234567890123456789
DISCORD_CLIENT_SECRET=tu_secret_aqui
DISCORD_REDIRECT_URI=http://localhost:8000/auth/callback
DISCORD_GUILD_ID=9876543210987654321
DISCORD_BOT_TOKEN=tu_bot_token_aqui
ROLE_ID_EVOLUCIONA=...
ROLE_ID_EQUIPO=...
ROLE_ID_CONSULTORIA=...
SESSION_SECRET=una_clave_larga_aleatoria
```

## 5. Reiniciar el backend

```bash
cd backend
python3 check_setup.py    # debe decir ✅
uvicorn main:app --reload
```

## 6. Probar

1. http://localhost:3000/login
2. El botón debe estar habilitado (si falta config, muestra aviso en la página)
3. **Ingresar con Discord** → pantalla de Discord → vuelta al hub

## Producción (alumnos en internet)

- Misma app de Discord, pero agregar redirect de producción en el portal
- `FRONTEND_URL` y `DISCORD_REDIRECT_URI` apuntando a las URLs reales del deploy
- Variables en el hosting del backend (no commitear `.env`)
