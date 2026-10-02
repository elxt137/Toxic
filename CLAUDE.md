# CLAUDE.md

Leé y aplicá primero `AGENTS.md`; este archivo agrega contexto específico para Claude Code.

## Producto

Notta Decants v1.0.0 es una vidriera argentina de perfumes, decants y frascos completos. El público ve marca, formato, descripción, contenido, precio ARS y disponibilidad, y puede armar un pedido por WhatsApp. Un administrador autenticado con Google controla catálogo, stock, destacado y publicación.

## Restricciones

- No reemplazar Supabase Auth por autenticación propia.
- Google autentica; `public.admin_allowlist` autoriza.
- Comprobar autorización en cada Server Action/Route Handler, nunca sólo en UI o proxy.
- Mantener RLS. No agregar `SUPABASE_SERVICE_ROLE_KEY` al frontend.
- Crear el cliente SSR por request y usar cookies; no mantener clientes autenticados globales.
- La app se despliega como Node SSR en Hostinger, no con `output: "export"`.

## Flujo Git

- `main` es producción y es la rama desplegada por Hostinger.
- Para cada tarea, partir de `develop` y crear una rama nueva con un nombre descriptivo.
- La rama de tarea siempre se integra mediante Pull Request con destino `develop`; no hacer PRs ni commits de trabajo directamente sobre `main`.
- La promoción de `develop` a `main` es el paso controlado de publicación a producción.

## Entrega

Ejecutar `npm run check`. Si cambia el esquema, agregar una migración, actualizar `src/types/database.ts` y documentar cualquier paso manual en README.
