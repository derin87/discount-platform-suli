-- Existing approved-store offers keep their current visibility.
alter table public.offers add column image_path text;
alter table public.offers alter column is_active set default false;
revoke insert, update, delete, truncate, references, trigger
  on public.stores, public.offers from public, anon, authenticated;
grant insert (user_id, store_name, phone, address),
      update (store_name, phone, address) on public.stores to authenticated;
grant insert (store_id, title_ku, title_ar, title_en, description, original_price,
              discount_price, category, start_date, end_date, image_path),
      update (title_ku, title_ar, title_en, description, original_price,
              discount_price, category, start_date, end_date, image_path)
  on public.offers to authenticated;
grant delete on public.offers to authenticated;

create schema if not exists dashka_private;
revoke all on schema dashka_private from public;
grant usage on schema dashka_private to anon, authenticated;

create function dashka_private.approved_store(bigint) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.stores where id = $1 and is_approved is true)
$$;
revoke all on function dashka_private.approved_store(bigint) from public;
grant execute on function dashka_private.approved_store(bigint) to anon, authenticated;

alter policy "Anyone can view active offers" on public.offers
using (is_active is true and start_date <= now() and end_date >= now()
       and dashka_private.approved_store(store_id));

create function dashka_private.prepare_owner_offer() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;
  if new.title_ku is null or length(btrim(new.title_ku)) not between 1 and 150
     or length(new.description) > 2000
     or new.original_price is null or new.original_price <= 0
     or new.discount_price < 0 or new.discount_price >= new.original_price
     or new.original_price > 1000000000
     or new.start_date is null or new.end_date <= new.start_date
     or new.category is null or new.category not in ('clothes', 'electronics', 'food', 'home')
  then
    raise exception 'Invalid offer' using errcode = '23514';
  end if;
  if new.image_path is not null and
     (split_part(new.image_path, '/', 1) <> (select auth.uid())::text or
      new.image_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$')
  then
    raise exception 'Invalid image path' using errcode = '23514';
  end if;
  select s.store_name into new.store_name from public.stores s where s.id = new.store_id;
  new.discount_percent := round(100 * (new.original_price - new.discount_price) / new.original_price);
  new.is_active := false;
  return new;
end;
$$;

create trigger dashka_owner_offer before insert or update on public.offers
for each row execute function dashka_private.prepare_owner_offer();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dashka-offer-images', 'dashka-offer-images', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp']);

create policy dashka_image_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'dashka-offer-images'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  and exists (select 1 from public.stores where user_id = (select auth.uid()) and is_approved)
);

create policy dashka_image_read on storage.objects for select to anon, authenticated
using (
  bucket_id = 'dashka-offer-images' and (
    split_part(name, '/', 1) = (select auth.uid())::text
    or exists (select 1 from public.offers o where o.image_path = name
       and o.is_active and o.start_date <= now() and o.end_date >= now()
       and dashka_private.approved_store(o.store_id))
  )
);

create policy dashka_image_cleanup on storage.objects for delete to authenticated
using (
  bucket_id = 'dashka-offer-images'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and not exists (select 1 from public.offers o where o.image_path = name)
);

create index dashka_offers_image_path_idx on public.offers (image_path)
where image_path is not null;
