create function public.dashka_announced_icenter_offers()
returns table(title_ku text,price numeric,currency text,posted_on date,source_url text)
language sql stable security definer set search_path='' as $$
select i.title_ku,i.price,i.currency,i.posted_on,i.source_url
from dashka_private.offer_intake i
where i.merchant='iCenter Iraq' and i.currency='IQD' and i.price is not null
and i.source_key in ('icenter-mg2p4af-a-iqd-1500000','icenter-120ea4330001-iqd-10000')
and strpos(i.review_note,'بڕیاری خاوەنی داشکا: پەسەند کرا.')>0
and (i.expires_on is null or i.expires_on >= (now() at time zone 'Asia/Baghdad')::date)
order by i.price $$;
revoke all on function public.dashka_announced_icenter_offers() from public;
grant execute on function public.dashka_announced_icenter_offers() to anon,authenticated;