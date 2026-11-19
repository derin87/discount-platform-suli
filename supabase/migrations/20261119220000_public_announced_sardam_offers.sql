create function public.dashka_announced_sardam_offers()
returns table (title_ku text, price numeric, currency text, posted_on date, source_url text)
language sql stable security definer set search_path=''
as $$
  select i.title_ku, i.price, i.currency, i.posted_on, i.source_url
  from dashka_private.offer_intake i
  where i.source_key in (
    'sardam-2026-11-11-10-seat',
    'sardam-2026-11-12-9-seat',
    'sardam-2026-11-12-10-seat-lopez',
    'sardam-2026-11-12-10-seat'
  )
  and i.merchant='مۆبیلیاتی سەردەم' and i.currency='USD' and i.price is not null
  and exists (select 1 from public.stores s where s.store_name=i.merchant and s.is_approved is true)
  order by i.price
$$;
revoke all on function public.dashka_announced_sardam_offers() from public;
grant execute on function public.dashka_announced_sardam_offers() to anon,authenticated;