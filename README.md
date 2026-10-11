# RC2 · Estética Vehicular · v1.0.0

Vidriera pública de RC2 · Estética Vehicular: ceras, shampoo, cepillos, luces LED, microfibras y accesorios para el cuidado del auto. Cuenta con catálogo filtrable, precios, disponibilidad y armado de pedido por WhatsApp. Incluye un panel privado para administrar productos, stock y publicación, autenticado con Google mediante Supabase y autorizado por whitelist.

## Navegación y verificación

La aplicación de esta portada está en la raíz del repositorio. La carpeta `toxic/` es una copia independiente y no participa del lint ni de la compilación de la aplicación principal.

Los accesos de categorías abren `/productos?categoria=...`; el buscador usa `/productos?q=...`. Se pueden combinar categoría, marca y texto, y limpiar los filtros. Mientras el esquema conserva las categorías de perfumes, los filtros de cuidado vehicular se calculan a partir del nombre del producto en `src/lib/catalog-navigation.ts`. La clasificación explícita en el inventario queda pendiente de una migración nueva. Las categorías vacías muestran un mensaje; no se anuncian ofertas sin datos de descuentos.

El carrito resta y suma unidades hasta el stock disponible, descarta almacenamiento inválido y permite cerrar con Escape. Los videos aparecen únicamente cuando tienen un archivo cargado. Los botones de WhatsApp requieren el número comercial; no se publica un enlace de Instagram hasta contar con el perfil real.

Para verificar: ejecutá `npm test` y `npm run check`. Para los flujos en navegador, iniciá un catálogo demo sin credenciales de Supabase con `npm run dev -- --port 3100` y ejecutá `npm run test:e2e` en otra terminal. La prueba usa Edge instalado, intercepta el pago sin realizar compras y revisa 320, 390, 768, 1024 y 1440 px. Se puede elegir otro navegador instalado con `RC2_BROWSER_CHANNEL` y otra URL con `RC2_TEST_URL`.

## Estado

La base funcional está lista. Sin credenciales de Supabase, la portada muestra cinco productos demo de cuidado vehicular para revisar el diseño. Al configurar el proyecto, la vidriera consulta exclusivamente productos publicados y el panel usa datos reales.

## Conexión de producción de RC2

- Supabase: **Toxic**, ref `qtoibmsiqsgvnervnzjy`, URL `https://qtoibmsiqsgvnervnzjy.supabase.co`.
- Sitio: `https://goldenrod-cassowary-586867.hostingersite.com`, desplegado desde `main` de `elxt137/Toxic`.
- Antes de cualquier operación de Supabase, comprobar el ref de destino. El proyecto de perfumes no pertenece a RC2 y no debe usarse ni modificarse.
- Las diez migraciones existentes se aplicaron el 11/10/2026 mediante `supabase db push`; sus versiones coinciden entre local y remoto. No se ejecutaron imports del catálogo anterior. Las seis tablas de la app tienen RLS activo, existe el bucket público `product-images` y el catálogo comienza vacío.
- Google está habilitado con el cliente OAuth de RC2. El proveedor usa `https://qtoibmsiqsgvnervnzjy.supabase.co/auth/v1/callback` como URI autorizada en Google Cloud.
- Auth Site URL: `https://goldenrod-cassowary-586867.hostingersite.com`. Redirect URLs: `https://goldenrod-cassowary-586867.hostingersite.com/auth/callback` y `http://localhost:3000/auth/callback`.
- Los cuatro correos autorizados por el propietario están activos en `public.admin_allowlist`; Google verifica identidad y la lista concede permisos.

En Hostinger, usar la URL y la clave **publishable del mismo proyecto Toxic**, junto con `NEXT_PUBLIC_SITE_URL` del sitio y `NEXT_PUBLIC_WHATSAPP_NUMBER=5492984252129`. Guardar `SUPABASE_SERVICE_ROLE_KEY` y `MERCADOPAGO_ACCESS_TOKEN` únicamente en el servidor, sin prefijo `NEXT_PUBLIC_`, si se habilita el checkout. Toda actualización de `NEXT_PUBLIC_*` requiere una compilación nueva. Las claves, tokens y credenciales Google no se guardan en Git ni en esta documentación.

Después de desplegar, verificar el proyecto incrustado en los JS, las respuestas de home y catálogo, el retorno OAuth y el acceso autorizado/rechazado a `/admin`. El inicio de sesión real lo completa el propietario. El esquema aún conserva campos heredados: adaptar las categorías mediante migraciones nuevas.

La revisión inicial reportó dos WARN de seguridad por `public.is_admin()` como función `SECURITY DEFINER` ejecutable por `anon` y `authenticated`; revisar el diseño sin desactivar RLS. Rendimiento reportó sólo INFO: una FK sin índice en `order_items.product_id` e índices aún sin uso en una base vacía.

## Stack

- Next.js 16 (App Router, Server Components y Server Actions)
- React 19, TypeScript y Tailwind CSS 4
- Supabase Postgres, Auth, RLS y Storage
- Google OAuth con PKCE y sesión en cookies
- Hostinger Node.js Web App (SSR; no es exportación estática)

Este repositorio requiere Node.js 24, también configurado en Hostinger.

## Puesta en marcha local

1. Ejecutá `npm install`.
2. Usá el proyecto **Toxic** de RC2. Para una base nueva, aplicá las migraciones con la CLI, conservando su historial:

   ```bash
   npx supabase link --project-ref qtoibmsiqsgvnervnzjy
   npx supabase migration list --project-ref qtoibmsiqsgvnervnzjy
   npx supabase db push --project-ref qtoibmsiqsgvnervnzjy --skip-vault
   ```

   No importar `supabase/import-legacy-catalog.sql` ni ejecutar `scripts/import-legacy-catalog.mjs`: corresponden al catálogo de perfumes.
3. Agregá el primer administrador (el email debe coincidir con Google y estar en minúsculas):

   ```sql
   insert into public.admin_allowlist (email) values ('tu-email@gmail.com');
   ```

4. Completá `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://qtoibmsiqsgvnervnzjy.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=5492984252129
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   ```

      La publishable key puede estar en el cliente porque RLS protege los datos. `MERCADOPAGO_ACCESS_TOKEN` y `SUPABASE_SERVICE_ROLE_KEY` son secretos: sólo se usan en el servidor y nunca deben llevar el prefijo `NEXT_PUBLIC_`. `NEXT_PUBLIC_WHATSAPP_NUMBER` debe contener el número comercial con código de país, sólo dígitos (por ejemplo, `549...`); se usa exclusivamente para abrir el mensaje de pedido.

5. Configurá Google SSO:

   - En Google Cloud creá credenciales OAuth 2.0 tipo Web Application.
   - En **Authorized JavaScript origins** agregá `http://localhost:3000` y luego el dominio productivo.
   - En **Authorized redirect URIs** agregá la callback que muestra **Supabase → Authentication → Providers → Google**; normalmente `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
   - Copiá Client ID y Client Secret en el proveedor Google de Supabase.
   - En **Supabase → Authentication → URL Configuration**, usá `http://localhost:3000` como Site URL durante desarrollo y agregá `http://localhost:3000/auth/callback` a Redirect URLs.
   - En producción, cambiá Site URL por `https://tu-dominio.com` y agregá `https://tu-dominio.com/auth/callback`.

6. Ejecutá las migraciones nuevas de pedidos con `npx supabase db push` y configurá Mercado Pago con credenciales de prueba desde **Tus integraciones → Credenciales de prueba**. El webhook usa `/api/payments/webhook`; en producción `NEXT_PUBLIC_SITE_URL` debe ser una URL HTTPS pública.
7. Ejecutá `npm run dev`. La vidriera queda en `/`, el catálogo completo en `/productos`, el login en `/login` y el panel en `/admin`.

## Seguridad

Google verifica identidad; no concede permisos. `requireAdmin()` consulta `admin_allowlist` antes de mostrar el panel o mutar datos, y las políticas RLS vuelven a validar la whitelist en Postgres. Ocultar una ruta o un botón no se considera autorización.

Para revocar acceso sin borrar historial:

```sql
update public.admin_allowlist set is_active = false where email = 'admin@dominio.com';
```

## Arquitectura

```text
src/
├── app/
│   ├── page.tsx                 # Vidriera pública
│   ├── login/                   # Inicio de Google OAuth
│   ├── auth/callback/           # Intercambio PKCE
│   ├── auth/signout/            # Cierre de sesión POST
│   └── admin/                   # Panel y Server Actions protegidas
├── components/                  # Tarjeta y formulario de producto
├── lib/
│   ├── auth.ts                  # DAL de autorización
│   ├── products.ts              # Lectura pública + demo
│   └── supabase/                # Clientes SSR/browser y sesión
├── proxy.ts                     # Renovación de sesión
└── types/database.ts            # Tipos del esquema
supabase/migrations/             # Esquema, funciones, RLS y bucket
```

`products` guarda precio, stock, formato (`Decant` o `Frasco completo`), texto, imagen, concentración, contenido, orden, publicación y destacado. El catálogo no devuelve borradores; el administrador sí puede verlos. El panel también permite editar el mensaje promocional animado de la barra superior.

El checkout solicita los datos obligatorios de contacto y envío antes de crear la preferencia de Mercado Pago. Cada pedido conserva esos datos, sus ítems, su identificador y el identificador del pago, visibles desde el panel administrativo.

## Historial de migraciones de Toxic

Versiones aplicadas y verificadas con `supabase migration list`:

```text
20260911000000  20260911000100  20260920000200  20260922194323
20260922202311  20260926000000  20260926214145  20260926222610
20260928155720  20260928181538
```

No modificar las migraciones existentes. SQL y tipos TypeScript están sincronizados con ese esquema; los cambios futuros requieren migraciones nuevas.

## Comandos

```bash
npm run dev        # desarrollo
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # build de producción
npm run check      # lint + tipos + build
npm start          # servidor de producción
```

## Flujo de desarrollo y despliegue

- `main` es la rama de producción y es la que Hostinger despliega.
- `develop` concentra la integración del trabajo en curso.
- Para cada tarea, creá una rama nueva desde `develop` (por ejemplo, `feat/catalog-filters` o `fix/login-redirect`).
- Abrí un Pull Request desde esa rama hacia `develop`. No se trabaja ni se abren PRs directamente contra `main`.
- Cuando los cambios integrados en `develop` estén validados, se promocionan a `main` mediante el proceso de publicación acordado.

## Hostinger

Usá un plan con **Node.js Web Apps** (Business, Cloud o VPS), porque OAuth SSR, Route Handlers y Server Actions requieren Node. En hPanel:

1. Creá una Node.js Web App y conectá GitHub.
2. Elegí Node.js 22 o 24 y npm.
3. Build command: `npm run build`; Start command: `npm start`.
4. Cargá las cuatro variables productivas en hPanel. No subas `.env.local`.
5. Actualizá `NEXT_PUBLIC_SITE_URL`, Google Authorized Origins y Supabase Site/Redirect URLs al dominio HTTPS final.
   Si `NEXT_PUBLIC_SITE_URL` falta en el build, el login, el callback y las URLs de vuelta de Mercado Pago usan el dominio del request (`x-forwarded-host`/`host`); igual conviene cargarla. En Supabase, `https://<dominio>/auth/callback` debe estar en Redirect URLs.
6. Verificá `/`, `/login`, el retorno a `/auth/callback` y una edición desde `/admin`.

Hostinger documenta soporte de SSR, ISR y rutas API en su [hosting de Next.js](https://www.hostinger.com/web-apps-hosting/nextjs-hosting).

## Próximos incrementos

- Carga directa de imágenes al bucket `product-images` (v1 acepta URL pública).
- Filtros por marca, concentración y precio.
- Historial de movimientos de stock.
- Canal de consulta/compra, una vez definido el flujo comercial.
- Pruebas end-to-end con un Supabase de staging.

## Adaptación de la vidriera a Toxic

La portada, el catálogo, el pedido y el panel usan textos de cuidado vehicular. Los productos y precios demo son ilustrativos. La interfaz muestra las categorías Limpieza y protección y Accesorios; por compatibilidad conserva los valores históricos Decant y Frasco completo en la base de datos. No se modificaron productos existentes ni se requiere una migración para este cambio de textos.
