create table public.storefront_settings (
  id boolean primary key default true check (id),
  announcement_text text not null default 'Envíos a todo el país · 3 cuotas sin interés · Consultanos por WhatsApp',
  updated_at timestamptz not null default now(),
  check (char_length(trim(announcement_text)) between 1 and 240)
);

insert into public.storefront_settings (id)
values (true)
on conflict (id) do nothing;

create trigger storefront_settings_set_updated_at
before update on public.storefront_settings
for each row execute function public.set_updated_at();

alter table public.storefront_settings enable row level security;

grant select on table public.storefront_settings to anon, authenticated;
grant update on table public.storefront_settings to authenticated;

create policy "anuncio de tienda visible para todos"
on public.storefront_settings for select
to anon, authenticated
using (true);

create policy "admins actualizan anuncio de tienda"
on public.storefront_settings for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
