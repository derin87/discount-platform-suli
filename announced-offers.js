(() => {
  'use strict';

  const language = document.querySelector('#language');
  const copy = {
    ku: ['ئۆفەرە ڕاگەیەندراوەکانی سەردەم', 'بەردەستبوون و بەرواری کۆتایی ئەم ئۆفەرانە پشتڕاست نەکراونەتەوە.', 'سەرچاوە'],
    ar: ['عروض سردم المعلنة', 'لم يتم التأكد من توفر هذه العروض أو تاريخ انتهائها.', 'المصدر'],
    en: ['Announced Sardam offers', 'Current availability and end dates are unverified.', 'Source']
  };

  const icenterCopy = {
    ku: ['ئۆفەرە ئۆنلاینەکانی iCenter Iraq', 'ستۆکی لقی سلێمانی و بەرواری کۆتایی پشتڕاست نەکراونەتەوە.', 'بینینی بەرهەم'],
    ar: ['عروض iCenter Iraq عبر الإنترنت', 'لم نتأكد من المخزون في فرع السليمانية أو تاريخ انتهاء العرض.', 'عرض المنتج'],
    en: ['iCenter Iraq online offers', 'Sulaymaniyah branch stock and offer end dates are unverified.', 'View product']
  };

  async function load(prefix, rpc, translations, isSardam) {
    const section = document.querySelector('#' + prefix + '-offers');
    const grid = document.querySelector('#' + prefix + '-grid');
    const {data, error} = await db.rpc(rpc);
    if (error || !data?.length) return;

    function render() {
      const [heading, note, source] = translations[language.value] || translations.ku;
      document.querySelector('#' + prefix + '-title').textContent = heading;
      document.querySelector('#' + prefix + '-note').textContent = note;
      const format = new Intl.NumberFormat('en', {style: 'currency', currency: isSardam ? 'USD' : 'IQD', maximumFractionDigits: 0});
      grid.replaceChildren(...data.map(row => {
        const card = document.createElement('article');
        card.className = 'card card-body';
        card.style.padding = '16px';
        const merchant = document.createElement('div');
        merchant.className = 'offer-merchant';
        const logo = document.createElement('img');
        logo.src = 'sardam-logo.jpg';
        logo.alt = '';
        logo.width = 44;
        logo.height = 44;
        logo.addEventListener('error', () => logo.remove(), {once: true});
        const merchantName = document.createElement('strong');
        merchantName.dir = 'auto';
        merchantName.textContent = !isSardam ? 'iCenter Iraq' : language.value === 'en' ? 'Sardam Furniture'
          : language.value === 'ar' ? 'مفروشات سردم' : 'مۆبیلیاتی سەردەم';
        if (isSardam) merchant.append(logo);
        merchant.append(merchantName);
        const title = document.createElement('h3');
        title.setAttribute('dir', 'auto');
        title.textContent = row.title_ku;
        const price = document.createElement('p');
        price.className = 'price';
        price.textContent = format.format(row.price);
        const date = document.createElement('time');
        date.dateTime = row.posted_on;
        date.textContent = row.posted_on;
        const link = document.createElement('a');
        if (row.source_url.startsWith(isSardam ? 'https://www.findglocal.com/' : 'https://www.icenter-iraq.com/products/')) {
          link.href = row.source_url;
          link.textContent = source;
          link.style.marginInlineStart = '12px';
        }
        card.append(merchant, title, price);
        if (row.posted_on) card.append(date);
        card.append(link);
        return card;
      }));
    }

    render();
    language.addEventListener('change', render);
    section.hidden = false;
  }

  void load('announced', 'dashka_announced_sardam_offers', copy, true).catch(() => {});
  void load('icenter', 'dashka_announced_icenter_offers', icenterCopy, false).catch(() => {});
})();
