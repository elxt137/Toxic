# Estado del proyecto

## Listo

- [x] Base Next.js v1.0.0 y diseño responsive
- [x] Catálogo público y panel de inventario
- [x] Google SSO, whitelist administrativa y políticas RLS
- [x] Migración inicial y guía de despliegue en Hostinger
- [x] Plan de Hostinger disponible
- [x] Proyecto de Supabase creado y operativo
- [x] URL y publishable key configuradas en `.env.local`
- [x] Repositorio privado creado en GitHub
- [x] Ramas `develop` y `main` publicadas
- [x] Migración SQL inicial aplicada en Supabase
- [x] Variables de producción cargadas en Hostinger y URLs de Supabase configuradas
- [x] Nombre comercial definido: Notta Decants
- [x] Primera versión de la vidriera Notta: catálogo filtrable, destacados y pedido por WhatsApp
- [x] Flujo de ramas documentado: tarea → PR a `develop` → promoción a `main`

## Pendiente

- [ ] Configurar Google OAuth en Google Cloud y Supabase
- [ ] Agregar los dos emails administradores a `admin_allowlist`
- [ ] Ejecutar en Supabase la migración `20260911000100_add_product_category.sql`
- [ ] Cargar el número comercial en `NEXT_PUBLIC_WHATSAPP_NUMBER` de Hostinger
- [ ] Completar contenido comercial definitivo, fotos de productos y redes sociales
- [ ] Probar login, permisos y edición con Supabase real
- [ ] Mergear el PR de Notta Decants a `develop` y promover la versión validada a `main`

**Estado general:** Notta Decants ya cuenta con su primera vidriera funcional. Faltan la migración de formato, WhatsApp comercial, OAuth, administradores y la promoción controlada a producción.
