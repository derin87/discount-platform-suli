(() => {
  'use strict';

  const section = document.querySelector('#announced-offers');
  const grid = document.querySelector('#announced-grid');
  const language = document.querySelector('#language');
  const copy = {
    ku: ['ئۆفەرە ڕاگەیەندراوەکانی سەردەم', 'بەردەستبوون و بەرواری کۆتایی ئەم ئۆفەرانە پشتڕاست نەکراونەتەوە.', 'سەرچاوە'],
    ar: ['عروض سردم المعلنة', 'لم يتم التأكد من توفر هذه العروض أو تاريخ انتهائها.', 'المصدر'],
    en: ['Announced Sardam offers', 'Current availability and end dates are unverified.', 'Source']
  };

  async function load() {
    const {data, error} = await db.rpc('dashka_announced_sardam_offers');
    if (error || !data?.length) return;

    function render() {
      const [heading, note, source] = copy[language.value] || copy.ku;
      document.querySelector('#announced-title').textContent = heading;
      document.querySelector('#announced-note').textContent = note;
      const format = new Intl.NumberFormat('en', {style: 'currency', currency: 'USD', maximumFractionDigits: 0});
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
        merchantName.textContent = language.value === 'en' ? 'Sardam Furniture'
          : language.value === 'ar' ? 'مفروشات سردم' : 'مۆبیلیاتی سەردەم';
        merchant.append(logo, merchantName);
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
        if (row.source_url.startsWith('https://www.findglocal.com/')) {
          link.href = row.source_url;
          link.textContent = source;
          link.style.marginInlineStart = '12px';
        }
        card.append(merchant, title, price, date, link);
        return card;
      }));
    }

    render();
    language.addEventListener('change', render);
    section.hidden = false;
  }

  void load().catch(() => {});
})();
