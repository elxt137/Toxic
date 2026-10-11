# Estado de RC2 · Estética Vehicular

## Listo

- [x] Vidriera, filtros por categoría y búsqueda, carrito y diseño responsive.
- [x] Repositorio `elxt137/Toxic`: tarea → PR a `develop` → promoción a `main`.
- [x] Proyecto Supabase correcto: **Toxic**, `qtoibmsiqsgvnervnzjy`.
- [x] Diez migraciones aplicadas y registradas con la CLI el 11/10/2026.
- [x] Seis tablas verificadas con RLS activo; bucket público `product-images`.
- [x] Cuatro administradores autorizados cargados en `admin_allowlist`.
- [x] Google OAuth habilitado en Toxic con el cliente de RC2.
- [x] Site URL y callbacks de producción y localhost configurados.
- [x] Variables públicas de Hostinger conectadas a Toxic; WhatsApp `5492984252129`.

## Pendiente

- [ ] Confirmar acceso real con Google, CRUD autorizado y rechazo fuera de la allowlist.
- [ ] Cargar productos, fotos y contenido comercial de RC2: el catálogo de Toxic está vacío.
- [ ] Adaptar categorías y campos heredados mediante migraciones nuevas.
- [ ] Cargar la clave de servidor de Toxic en Hostinger con autorización explícita; nunca en el frontend ni en Git.
- [ ] Configurar y probar Mercado Pago: no hay un access token cargado en Hostinger.
- [ ] Revisar dos WARN de seguridad de `public.is_admin()` y el INFO de la FK `order_items.product_id` sin índice, sin desactivar RLS.
- [ ] Definir Instagram y completar la validación comercial de envío y retiro.

No ejecutar imports del catálogo de perfumes ni conectar RC2 al proyecto de esa tienda. La documentación contiene identificadores públicos, nunca claves o tokens.