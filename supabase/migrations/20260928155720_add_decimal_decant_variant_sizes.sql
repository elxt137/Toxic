-- Las presentaciones de decants incluyen 1,2 ml, por lo que requieren fracciones.
alter table public.product_variants
  alter column size_ml type numeric(4, 1) using size_ml::numeric(4, 1);

alter table public.product_variants
  add constraint product_variants_size_ml_precision_check
  check (size_ml is null or size_ml = round(size_ml, 1));
