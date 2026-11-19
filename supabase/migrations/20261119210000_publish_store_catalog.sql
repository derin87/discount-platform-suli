create or replace function public.dashka_public_store_catalog()
returns table(store_name text,address text)
language sql stable security definer set search_path=''
as $$
  select s.store_name,s.address from public.stores s
  where s.user_id is null and s.is_approved is true
  order by s.store_name
$$;
revoke all on function public.dashka_public_store_catalog() from public;
grant execute on function public.dashka_public_store_catalog() to anon, authenticated;
update public.stores set is_approved=true where user_id is null and is_approved is false and store_name in ('مۆبیلیاتی سەردەم','Mazzoni Home','Nevaeh Mobilya','Fuga Sulaymaniyah','MARKA Mobilya','Diwan Home','Enza Home Iraq','Bareaz Home','IKEA Home Style','Your Home Mobilya','Salin Furniture','پێشانگای هێمن یاسین','Zumrut Sulaymaniyah','Miral','Decor Home Furniture','Chya Mobilya 60m','Rozh Mobilya','Kastana Mobilya','Baha Home','Shahana Mobilya','مۆبیلیاتی ڕۆنیا','Baiza Mobilya','iZone Sulaymaniyah','M Center Sulaymaniyah','LC Waikiki City Center');