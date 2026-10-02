<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Proyecto [Nombre de tu Marca]

## Objetivo y convenciones

- Mantener la vidriera de [Nombre de tu Marca] (e-commerce de productos para el cuidado vehicular: shampoo, ceras, cepillos, luces LED, microfibras, etc.) y su panel administrativo. Versión actual: 1.0.0.
- Código y nombres técnicos en inglés; interfaz y documentación comercial en español rioplatense.
- App Router y Server Components por defecto; Client Components sólo para interacción real.
- Datos en `src/lib`, UI reusable en `src/components`, mutaciones cerca de la ruta en `actions.ts`.
- Validar entradas de Server Actions con Zod y no exponer borradores en el catálogo público.

## Flujo de ramas

- `main` es la rama de producción desplegada en Hostinger. No desarrollar ni abrir PRs directamente contra ella.
- Todo trabajo comienza desde `develop` en una rama nueva y acotada a la tarea (por ejemplo, `feat/catalog-filters` o `fix/login-redirect`).
- Abrir cada Pull Request desde la rama de tarea hacia `develop`. Sólo después de validar e integrar allí se promocionan cambios a `main` para producción.

## Seguridad

- Google OAuth establece identidad; `admin_allowlist` concede permisos.
- `requireAdmin()` es obligatorio en toda mutación administrativa.
- RLS nunca debe desactivarse para resolver un error.
- No registrar tokens, cookies, secretos ni `.env.local`; no introducir service role sin aprobación explícita.

## Desarrollo guiado por pruebas (TDD)

- Todo cambio de comportamiento debe seguir TDD: primero escribir o actualizar una prueba que describa el flujo esperado y verificar que falla; recién después implementar el cambio mínimo para que pase.
- No se aceptan cambios de funcionalidad sin pruebas automatizadas asociadas. Las correcciones de errores deben incluir una prueba de regresión que falle antes del arreglo.
- Todo comportamiento con lógica propia debe contar con unit tests: cubrir casos normales, bordes, errores y validaciones sin depender de red, base de datos ni servicios externos. Complementarlos con pruebas de integración o de flujo cuando el cambio atraviese capas.
- Probar los flujos completos que se incorporen, incluyendo casos exitosos, validaciones y rechazos de autorización cuando correspondan; no limitarse a probar detalles internos.
- Mantener las pruebas deterministas, aisladas y con nombres que expresen el comportamiento de negocio. No usar datos reales, secretos ni dependencias externas no controladas.
- Durante el trabajo, ejecutar las pruebas relevantes en cada ciclo rojo-verde-refactor. Antes de entregar, ejecutar la suite disponible y `npm run check`; informar explícitamente cualquier prueba que no pueda ejecutarse y el motivo.

## Datos y verificación

- Agregar migraciones SQL nuevas; no reescribir una ya desplegada. Mantener sincronizados SQL, tipos TypeScript y README.
- Antes de entregar, ejecutar `npm run check`. Con staging, probar rechazo fuera de whitelist y CRUD autorizado.
