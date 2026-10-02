# Toxic · v1.0.0

Vidriera pública de productos para el cuidado vehicular con catálogo filtrable, precios, disponibilidad y armado de pedido por WhatsApp. Incluye un panel privado para administrar productos, stock y publicación, autenticado con Google mediante Supabase y autorizado por whitelist.

## Estado

La base funcional está lista. Sin credenciales de Supabase, la portada muestra cinco productos demo de cuidado vehicular para revisar el diseño. Al configurar el proyecto, la vidriera consulta exclusivamente productos publicados y el panel usa datos reales.

## Stack

- Next.js 16 (App Router, Server Components y Server Actions)
- React 19, TypeScript y Tailwind CSS 4
- Supabase Postgres, Auth, RLS y Storage
- Google OAuth con PKCE y sesión en cookies
- Hostinger Node.js Web App (SSR; no es exportación estática)

Requiere Node.js 20.9 o superior. Para Hostinger se recomienda Node.js 22 o 24.

## Puesta en marcha local

1. Ejecutá `npm install`.
2. Creá un proyecto en [Supabase](https://supabase.com/dashboard) y ejecutá en SQL Editor `supabase/migrations/20260911000000_initial_schema.sql`.
3. Agregá el primer administrador (el email debe coincidir con Google y estar en minúsculas):

   ```sql
   insert into public.admin_allowlist (email) values ('tu-email@gmail.com');
   ```

4. Completá `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=549XXXXXXXXXX
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

## Migración pendiente para Notta Decants

Además del esquema inicial, ejecutá `supabase/migrations/20260911000100_add_product_category.sql` en Supabase. Agrega el formato comercial de cada producto, necesario para los filtros de decants y frascos completos.

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
