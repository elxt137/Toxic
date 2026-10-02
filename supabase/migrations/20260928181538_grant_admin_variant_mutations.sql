-- Las políticas existentes restringen estas mutaciones a usuarios habilitados
-- en admin_allowlist. Este GRANT permite que PostgreSQL evalúe dichas políticas.
grant insert, update, delete on table public.product_variants to authenticated;
