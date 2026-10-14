# RC2 · Estética Vehicular · v1.0.0

Vidriera pública de RC2 · Estética Vehicular: ceras, shampoo, cepillos, luces LED, microfibras y accesorios para el cuidado del auto. Cuenta con catálogo filtrable, precios, disponibilidad y armado de pedido por WhatsApp. Incluye un panel privado para administrar productos, stock y publicación, autenticado con Google mediante Supabase y autorizado por whitelist.

## Navegación y verificación

La aplicación de esta portada está en la raíz del repositorio. La carpeta `toxic/` es una copia independiente y no participa del lint ni de la compilación de la aplicación principal.

Los accesos de categorías abren `/productos?categoria=...`; el buscador usa `/productos?q=...`. Se pueden combinar categoría, marca y texto, y limpiar los filtros. Mientras el esquema conserva las categorías de perfumes, los filtros de cuidado vehicular se calculan a partir del nombre del producto en `src/lib/catalog-navigation.ts`. La clasificación explícita en el inventario queda pendiente de una migración nueva. Las categorías vacías muestran un mensaje; no se anuncian ofertas sin datos de descuentos.

El carrito resta y suma unidades hasta el stock disponible, descarta almacenamiento inválido y permite cerrar con Escape. Los videos aparecen únicamente cuando tienen un archivo cargado. Los botones de WhatsApp requieren el número comercial; no se publica un enlace de Instagram hasta contar con el perfil real.

En **Administración → Productos e inventario**, el buscador con lupa filtra por nombre, marca o slug sin distinguir mayúsculas ni tildes. El estado de stock suma las presentaciones activas: verde desde 3 unidades, amarillo con 1 o 2, y rojo con 0. La publicación se muestra por separado del stock.

Para verificar: ejecutá `npm test` y `npm run check`. Para los flujos en navegador, iniciá un catálogo demo sin credenciales de Supabase con `npm run dev -- --port 3100` y ejecutá `npm run test:e2e` en otra terminal. La prueba usa Edge instalado, intercepta el pago sin realizar compras y revisa 320, 390, 768, 1024 y 1440 px. Se puede elegir otro navegador instalado con `RC2_BROWSER_CHANNEL` y otra URL con `RC2_TEST_URL`.

## Estado

La base funcional está lista. Sin credenciales de Supabase, la portada muestra cinco productos demo de cuidado vehicular para revisar el diseño. Al configurar el proyecto, la vidriera consulta exclusivamente productos publicados y el panel usa datos reales.

## Conexión de producción de RC2

- Supabase: **Toxic**, ref `qtoibmsiqsgvnervnzjy`, URL `https://qtoibmsiqsgvnervnzjy.supabase.co`.
- Sitio: `https://www.rc2.com.ar` (también acepta `https://rc2.com.ar`), desplegado desde `main` de `elxt137/Toxic`.
- Antes de cualquier operación de Supabase, comprobar el ref de destino. El proyecto de perfumes no pertenece a RC2 y no debe usarse ni modificarse.
- Las diez migraciones existentes se aplicaron el 11/10/2026 mediante `supabase db push`; sus versiones coinciden entre local y remoto. No se ejecutaron imports del catálogo anterior. Las seis tablas de la app tienen RLS activo, existe el bucket público `product-images` y el catálogo comienza vacío.
- Google está habilitado con el cliente OAuth de RC2. El proveedor usa `https://qtoibmsiqsgvnervnzjy.supabase.co/auth/v1/callback` como URI autorizada en Google Cloud.
- Auth Site URL: `https://www.rc2.com.ar`. Redirect URLs: `https://www.rc2.com.ar/auth/callback`, `https://rc2.com.ar/auth/callback`, la callback del dominio temporal y `http://localhost:3000/auth/callback`. Configuración corregida y verificada el 13/10/2026. `supabase/config.toml` declara sólo estas URLs; no incluye credenciales ni reemplaza otros ajustes de Auth.
- Los cuatro correos autorizados por el propietario están activos en `public.admin_allowlist`; Google verifica identidad y la lista concede permisos.

En Hostinger, usar la URL y la clave **publishable del mismo proyecto Toxic**, junto con `NEXT_PUBLIC_SITE_URL` del sitio y `NEXT_PUBLIC_WHATSAPP_NUMBER=5492984252129`. Guardar `SUPABASE_SERVICE_ROLE_KEY` y `MERCADOPAGO_ACCESS_TOKEN` únicamente en el servidor, sin prefijo `NEXT_PUBLIC_`, si se habilita el checkout. Toda actualización de `NEXT_PUBLIC_*` requiere una compilación nueva. Las claves, tokens y credenciales Google no se guardan en Git ni en esta documentación.

Después de desplegar, verificar el proyecto incrustado en los JS, las respuestas de home y catálogo, el retorno OAuth y el acceso autorizado/rechazado a `/admin`. El inicio de sesión real lo completa el propietario. El esquema aún conserva campos heredados: adaptar las categorías mediante migraciones nuevas.

La revisión inicial reportó dos WARN de seguridad por `public.is_admin()` como función `SECURITY DEFINER` ejecutable por `anon` y `authenticated`; revisar el diseño sin desactivar RLS. Rendimiento reportó sólo INFO: una FK sin índice en `order_items.product_id` e índices aún sin uso en una base vacía.

## Correcciones de seguridad — 14/10/2026

Next.js y `eslint-config-next` se actualizan a 16.3.8. El lockfile utiliza sharp 0.35.5 y source-map-js 1.2.2. El escaneo `npm audit --omit=dev` no reporta vulnerabilidades. El escaneo completo mantiene cinco avisos de una sola cadena de ESLint que depende de braces 3.0.3, cuyo aviso GHSA-vfj7-8cjw-p6xm no declara un parche. No se aplica el downgrade incompatible sugerido por `npm audit fix --force`; esa dependencia se usa en el lint, no recibe entradas de visitantes.

El callback OAuth rechaza destinos externos, barras invertidas y caracteres de control, incluidas sus formas codificadas. La tienda entrega protección contra iframes, MIME sniffing, referencias y acceso a cámara/micrófono/ubicación. La CSP restringe recursos y destinos de formularios, conserva la hidratación de Next y permite Google/Supabase/Analytics; los scripts inline siguen permitidos para compatibilidad con Next. HSTS se activa en producción durante un año, sin `includeSubDomains` ni preload.

Aplicar `20261014033303_security_hardening.sql` en Toxic antes de publicar. `public.is_admin()` pasa a ser `SECURITY INVOKER`; la consulta privilegiada queda en `store_private.is_admin()` y requiere identidad Auth además de whitelist activa. Las políticas RLS siguen habilitadas. La tabla privada del limitador no tiene políticas públicas: sólo el servidor con su rol existente puede utilizarla. La protección de contraseñas filtradas sigue siendo un ajuste opcional de Supabase; el acceso actual utiliza Google.

Mercado Pago requiere **ambas** variables `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET`; no se habilita checkout si falta alguna. La segunda se obtiene en Tus integraciones → Webhooks y no es el access token. Se valida la firma HMAC-SHA256 del manifiesto oficial `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, con comparación constante. Los reintentos firmados se aceptan aunque tengan un timestamp antiguo: el procesamiento es idempotente y se vuelve a consultar el estado actual al proveedor. No se admite IPN sin firma.

Antes de confirmar un pago se comprueban su ID, referencia al pedido, importe exacto, moneda ARS, merchant order, pertenencia del pago a esa merchant order y preferencia almacenada. `confirm_verified_order_payment` repite las invariantes con bloqueo de fila y evita reutilizar el mismo pago entre pedidos; una notificación repetida no descuenta stock dos veces. Las verificaciones fallidas no marcan el pedido como pagado. Los pagos y estados no compatibles no se aplican automáticamente. Las llamadas al proveedor tienen un límite de espera de siete segundos por consulta.

La creación de preferencias limita intentos mediante Postgres, compartidos entre procesos: diez por identificador de cliente y cien globales cada cinco minutos. Guarda sólo hashes del identificador de red; el límite global se conserva incluso si faltan cabeceras del proxy o alguien varía el identificador. Devuelve 429 con `Retry-After`; si no puede consultar el limitador, devuelve 503 antes de crear pedidos. Este control reduce abuso del checkout y no sustituye un WAF o límites de tráfico del hosting.

La prueba SQL `supabase/tests/security_hardening.sql` verifica identidad, whitelist, aislamiento de credenciales, límites, vinculación de pagos e idempotencia con datos ficticios y rollback. Las pruebas previas de panel, galería, WhatsApp y CRM se mantienen. Para probar un build local con `npm start`, conservar el mismo `NEXT_DEPLOYMENT_ID` que figura en `.next/required-server-files.json`; un identificador distinto provoca recargas de Next por protección de versiones y puede descartar fragmentos de navegación.

## Stack de la aplicación

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

## Panel de RC2: productos, fotos y Analytics

En **Productos e inventario**, **Agregar producto** abre `/admin/products/new`. Cada fila tiene **Editar producto**, que abre `/admin/products/[id]`, y una edición rápida al desplegarla. Se administran nombre, marca, descripción, categoría, presentaciones, precios, stock, publicación, destacados, orden y especificación. El editor conserva los datos si falla el guardado. Desmarcar **Publicado** oculta el producto sin borrar el historial de pedidos. Costos y códigos de barras se administran en la misma pantalla, en un formulario independiente.

La galería admite seis fotos JPG, PNG o WebP de hasta 5 MB cada una. Se pueden subir archivos desde el celular o la computadora, agregar URLs, quitar fotos de la galería y elegir la portada. Los archivos se validan por tamaño, tipo y firma y se almacenan con nombres únicos en `product-images`, usando la sesión del administrador y RLS. Al guardar se actualiza la galería pública y la portada. Quitar una foto del producto no borra su archivo del almacenamiento; los archivos subidos antes de cancelar una edición también permanecen allí.

Producto y presentaciones se guardan en una transacción mediante `save_catalog_product`, con `SECURITY INVOKER`. Se rechazan presentaciones de otro producto y se desactivan las retiradas para conservar las referencias de pedidos. Las presentaciones admiten hasta 9.999 ml con un decimal. La migración nueva es `20261014020329_admin_product_gallery_analytics.sql`; aplicarla antes de publicar esta versión. La prueba `supabase/tests/admin_product_gallery_analytics.sql` verifica CRUD, rechazo fuera de whitelist, aislamiento de borradores, galería, integridad de presentaciones, rollback y Analytics con datos ficticios dentro de una transacción que termina en `ROLLBACK`.

En **Google Analytics**, ingresar el ID GA4 `G-XXXXXXXXXX`, marcar **Activar Google Analytics** y guardar. No se admite pegar código JavaScript. Analytics queda apagado inicialmente y sólo carga después de aceptar las cookies de medición. **Sólo necesarias** permite seguir comprando sin Analytics. La medición registra vistas de páginas, excluye panel, login, callback, checkout y endpoints internos, y omite parámetros de búsqueda en los eventos enviados. Los informes se consultan en Google Analytics; no se simulan estadísticas ni se incorporan credenciales privadas de Google al panel. Para verificar el flujo, aceptar cookies en la tienda y revisar el informe en tiempo real con el ID propio configurado.

Publicación: abrir PR de la rama de tarea hacia `develop`, validar e integrar allí, aplicar la migración en el proyecto **Toxic** `qtoibmsiqsgvnervnzjy` y recién entonces promocionar a `main`. Hostinger compila `main` automáticamente. Configurar `NEXT_PUBLIC_SITE_URL=https://www.rc2.com.ar` y reconstruir; el login también conserva el origen `rc2.com.ar` o `www.rc2.com.ar` si el build todavía declara el dominio antiguo. El acceso real con Google debe verificarse desde el mismo dominio en el que se inició el flujo para conservar la cookie PKCE.

## Seguridad del panel

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

## Panel administrativo ampliado (en desarrollo)

El panel incorpora ventas aprobadas por día y mes en horario argentino, alertas de stock, historial de compradores, seguimiento de envíos y estados internos de pedidos. Los costos y códigos de barras se guardan en `product_admin_data`, protegida por RLS y separada del catálogo público. `/admin/labels` permite imprimir etiquetas de productos y cupones de 38 × 21 mm, con códigos Code 128.

Antes de usar este panel, aplicá la migración nueva `supabase/migrations/20261012015501_premium_admin_console.sql` después de las anteriores. No reescribas migraciones desplegadas. Todas las mutaciones administrativas requieren `requireAdmin()` y validan entradas con Zod.

La generación, activación e impresión de cupones está implementada en el panel. Su aplicación en el checkout todavía está pendiente: generar un código no hace que la compra pública lo acepte. La migración incluye la función de reserva de usos para esa integración futura. La migración y los permisos deben verificarse en staging antes de publicar.

## Fotos del inventario y WhatsApp de la tienda

El interruptor **Modo oscuro** en la cabecera cambia la paleta de todas las secciones administrativas. La preferencia se guarda durante un año en una cookie limitada a `/admin` y se restaura al cargar la página. La tienda pública conserva su apariencia y las etiquetas se imprimen con fondo blanco. El interruptor funciona con teclado y respeta la preferencia de movimiento reducido.

La apariencia oscura sigue la referencia visual de documentación: fondo grafito, navegación lateral casi negra con acentos lavanda, estados verdes, tipografía sans serif y separadores finos. En escritorio la cabecera y la navegación acompañan el desplazamiento; en celulares las secciones se recorren en una barra horizontal.

`npm test` incluye verificaciones de contraste y ancho del panel en un navegador local sin acceso a red. Usan Microsoft Edge por defecto; podés seleccionar otro canal de Chromium con `RC2_BROWSER_CHANNEL`. Las capturas de QA quedan en `.npm-cache/admin-theme-qa` y no se suben al repositorio.

El inventario muestra miniaturas de 48 × 48 px y un indicador cuando el producto no tiene foto. En `/admin?section=customization` podés cambiar el número comercial de WhatsApp con formato internacional y la contraseña de personalización. El número guardado se usa en la portada, el catálogo, el pie y los pedidos por WhatsApp; si aún no hay uno, se conserva `NEXT_PUBLIC_WHATSAPP_NUMBER` como respaldo.

Aplicá `supabase/migrations/20261012024218_protected_store_whatsapp.sql`. La contraseña se provisiona por separado como un hash bcrypt en `store_private.whatsapp_credentials`; no debe guardarse en archivos ni exponerse al cliente. La función `update_store_whatsapp` exige administrador autorizado y contraseña correcta. Los permisos de columna impiden saltear esa verificación actualizando el número directamente; editar el anuncio sigue permitido. `supabase/tests/protected_store_whatsapp.sql` verifica el flujo con credenciales ficticias y revierte todos los cambios al terminar.

## Carrito, envío gratis y CRM

En **Personalización → Carrito y envío gratis** podés activar el beneficio, cambiar el mínimo (inicialmente $100.000), elegir sucursal o domicilio y habilitar los pedidos por WhatsApp. La portada, el carrito y el checkout leen la misma configuración. El envío gratis se evalúa sobre el total de productos después de los descuentos; los pedidos guardan la regla y la elegibilidad vigentes al crearse. Los envíos fuera del beneficio se coordinan por separado: esta versión no agrega tarifas de transportista al pago.

**Clientes y audiencia (CRM)** permite crear y editar fichas con nombre, email, teléfono, dirección, fecha de registro y grupo. Los pagos aprobados registran los clientes automáticamente; se importan los compradores de pedidos pagados existentes. El historial muestra productos, cantidades, importes y fechas, con una estimación de reposición cuando existen varias compras pagadas. Los pedidos vinculados conservan el historial aunque se corrija el correo de la ficha.

Se incluyen Minorista y Mayorista/Detailer Profesional con 0% inicial. Podés crear otros grupos, asignar contactos y configurar un descuento porcentual por grupo. El comprador verifica su correo con Google desde el checkout para recibirlo automáticamente. La identidad se valida en el servidor y en Supabase; escribir el email de otro cliente no otorga su descuento. Los precios se calculan por unidad en centavos y se conservan tanto el precio de lista como el cobrado. La alternativa implementada para precios por grupo es el descuento porcentual.

Aplicá `supabase/migrations/20261012042748_commerce_settings_customer_crm.sql`. El CRM y los grupos tienen RLS para administradores; el comprador sólo consulta su propio beneficio mediante una función acotada. `supabase/tests/commerce_settings_customer_crm.sql` prueba registro por pago, historial, configuración, autorización, aislamiento y rechazo de identidades falsas con datos ficticios y rollback. La verificación de Google reutiliza la callback existente y una cookie temporal, sin agregar URLs nuevas de OAuth.

## Adaptación de la vidriera a Toxic

La portada, el catálogo, el pedido y el panel usan textos de cuidado vehicular. Los productos y precios demo son ilustrativos. La interfaz muestra las categorías Limpieza y protección y Accesorios; por compatibilidad conserva los valores históricos Decant y Frasco completo en la base de datos. No se modificaron productos existentes ni se requiere una migración para este cambio de textos.
