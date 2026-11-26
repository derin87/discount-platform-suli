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

  const originalPrices = {
    'esr-classic-hybrid-case-halolock-iphone-16-pro-max-clear': 20000,
    'jinya-magsafe-clear-protecting-case-for-iphone-14-pro': 10000,
    'jcpal-iclara-classic-glass-screen-protector-for-ipad-pro11m4-2024': 25000,
    'esr-ascend-hybrid-case-for-ipad-10th-gen-grey': 25000
  };
  const productPhotos = {
    'esr-classic-hybrid-case-halolock-iphone-16-pro-max-clear': 'Artboard_116.png?v=1794670685',
    'jinya-magsafe-clear-protecting-case-for-iphone-14-pro': 'Artboard_33.png?v=1794666747',
    'jcpal-iclara-classic-glass-screen-protector-for-ipad-pro11m4-2024': 'Artboard_46.png?v=1794667306',
    'esr-ascend-hybrid-case-for-ipad-10th-gen-grey': 'Artboard_14.png?v=1794665868'
  };

  const availability = {
    ku: 'ئۆنلاین · تا بەردەستە',
    ar: 'عبر الإنترنت · حسب التوفر',
    en: 'Online · While available'
  };

  async function load(prefix, rpc, translations, isSardam, entries) {
    const section = document.querySelector('#' + prefix + '-offers');
    const grid = document.querySelector('#' + prefix + '-grid');
    const {data, error} = entries ? { data: entries } : await db.rpc(rpc);
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
        merchantName.textContent = !isSardam ? (row.merchant || 'iCenter Iraq') : language.value === 'en' ? 'Sardam Furniture'
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
        if (row.source_url.startsWith(isSardam ? 'https://www.findglocal.com/' : entries ? 'https://dima.center/en/product/' : 'https://www.icenter-iraq.com/products/')) {
          link.href = row.source_url;
          link.textContent = source;
          link.style.marginInlineStart = '12px';
        }
        if (!isSardam && link.href) {
          const product = new URL(link.href).pathname.split('/').pop();
          const photo = productPhotos[product];
          if (row.photo || photo) {
            const image = document.createElement('img');
            image.src = row.photo || 'https://www.icenter-iraq.com/cdn/shop/files/' + photo + '&width=940';
            image.alt = row.title_ku;
            image.loading = 'lazy';
            image.decoding = 'async';
            Object.assign(image.style, {
              display: 'block',
              width: '100%',
              height: 'auto',
              aspectRatio: '4 / 3',
              objectFit: 'contain',
              backgroundColor: '#fff',
              borderRadius: '10px',
              marginBlockEnd: '12px'
            });
            image.addEventListener('error', () => image.remove(), {once: true});
            card.append(image);
          }
          const original = row.original || originalPrices[product];
          if (original > Number(row.price)) {
            const previous = document.createElement('del');
            previous.className = 'old';
            previous.textContent = format.format(original);
            const badge = document.createElement('span');
            badge.className = 'discount';
            badge.textContent = '−' + Math.round((1 - row.price / original) * 100) + '%';
            price.append(' ', previous, ' ', badge);
          }
          const status = document.createElement('div');
          status.textContent = availability[language.value] || availability.ku;
          merchant.append(status);
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

  const dimaOffers = [
    ['Lexar NQ780 SSD 1TB', 270300, 289000, '6a44fbf47bd19ff6267da9e0', '/catalog/6a44fbf47bd19ff6267da9e0-747d5977c0.webp'],
    ['MSI MAG 255F X24', 221000, 246500, '6aec4178f95fceb4eaa94b41', '/api/media/276a42ec-071c-41a8-a3e9-034602379cb2.webp'],
    ['MSI PRO MP246 E18', 178500, 204000, '6aec431cf95fceb4eaa94d65', '/api/media/f7019428-bd58-40cf-aaa5-fbd051c95cc8.webp']
  ].map(([title_ku, price, original, product, photo]) => ({
    merchant: 'Dima Center', title_ku, price, original,
    source_url: 'https://dima.center/en/product/' + product,
    photo: 'https://dima.center' + photo
  }));

  function showDimaOffers() {
    const template = document.querySelector('#icenter-offers');
    if (!template || Date.now() >= Date.parse('2026-11-27T15:00:00+03:00')) return;
    const section = template.cloneNode(true);
    section.hidden = true;
    section.id = 'dima-offers';
    for (const item of section.querySelectorAll('[id^="icenter-"]')) {
      item.id = item.id.replace('icenter-', 'dima-');
    }
    if (section.hasAttribute('aria-labelledby')) section.setAttribute('aria-labelledby', 'dima-title');
    template.after(section);
    void load('dima', null, {
      ku: ['ئۆفەرەکانی Dima Center', 'نرخ و بەردەستبوون لە پەڕەی فرۆشگا بپشکنە.', 'بینینی کاڵا'],
      ar: ['عروض Dima Center', 'تحقق من السعر والتوفر على موقع المتجر.', 'عرض المنتج'],
      en: ['Dima Center offers', 'Check current prices and availability on the store website.', 'View product']
    }, false, dimaOffers);
  }

  showDimaOffers();

  void load('announced', 'dashka_announced_sardam_offers', copy, true).catch(() => {});
  void load('icenter', 'dashka_announced_icenter_offers', icenterCopy, false).catch(() => {});
})();
