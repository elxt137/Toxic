-- Los formatos de 5 ml y 10 ml se venden como decants, no como frascos completos.
update public.products
set
  category = 'Decant',
  name = case
    when name like 'Decant %' then name
    else 'Decant ' || name
  end
where category = 'Frasco completo'
  and size_ml in (5, 10);
