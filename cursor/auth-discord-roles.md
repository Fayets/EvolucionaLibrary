# Auth Discord y permisos — EvoLibrary

## Flujo

1. Usuario entra por `GET /auth/discord` (OAuth2).
2. Callback `GET /auth/callback`: intercambia code, lee miembro del guild con bot token.
3. Si no es miembro del servidor Evoluciona o solo tiene rol **Pre-consultoría** → `/unauthorized?reason=not_member`.
4. Si OK → upsert en tabla `profiles` (EvoLibrary, **no** tablas del otro sistema) + cookie de sesión → redirect al frontend.

## Rangos (Discord → app)

| Rol Discord (display) | Entra al hub | Ver recursos | Editar recursos | Ver analytics |
|----------------------|--------------|--------------|-----------------|---------------|
| **Evoluciona**       | Sí           | Sí           | Sí              | Sí            |
| **Equipo**           | Sí           | Sí           | Sí              | Sí            |
| **Consultoría**      | Sí           | Sí           | No              | No            |
| **Pre-consultoría**  | No           | —            | —               | —             |

- `can_edit = true` solo para **Evoluciona** y **Equipo**.
- **Pre-consultoría**: no está en `ROLE_MAP` → tratado como sin acceso (`not_member`).
- Si el usuario tiene varios roles mapeados, gana el de **mayor prioridad** (Evoluciona > Equipo > Consultoría).

## Tablas EvoLibrary (nuevas en Neon)

Separadas del otro sistema (`client`, `ticket`, etc.):

- `profiles` — usuario Discord + `role_name` + `can_edit`
- `resources` — enlaces del hub
- `user_favorites`, `resource_clicks` — favoritos y métricas

`init_db` con `create_tables=False` hasta definir entidades; al crear tablas, usar nombres que no colisionen con las 14 existentes.

## Variables de entorno (backend)

Ver `backend/.env.template`: OAuth (`DISCORD_CLIENT_*`), bot (`DISCORD_GUILD_ID`, `DISCORD_BOT_TOKEN`), IDs de rol (`ROLE_ID_*`).
