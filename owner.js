'use strict';

const login = document.getElementById('login');
const dashboard = document.getElementById('dashboard');
const storeForm = document.getElementById('store');
const offerForm = document.getElementById('offer');
const signout = document.getElementById('signout');
const cancel = document.getElementById('cancel');
const message = document.getElementById('message');
const approval = document.getElementById('approval');
const offerList = document.getElementById('offer-list');
const offers = document.getElementById('offers');
const discount = document.getElementById('discount');
const offerTitle = document.getElementById('offer-title');
const formats = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'};
const timezone = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Baghdad', dateStyle: 'short', timeStyle: 'short'
});
const bucket = 'dashka-offer-images';
let userId;
let store;
let editing;
let busy = false;

function notify(text, error = false) {
  message.textContent = text;
  message.dataset.error = String(error);
}

function clearOffer() {
  editing = null;
  offerTitle.textContent = 'ئۆفەری نوێ';
  offerForm.reset();
  cancel.hidden = true;
  discount.textContent = '';
}

function fieldValues(form, names) {
  return Object.fromEntries(names.map(name => [name, form.elements[name].value.trim() || null]));
}

function localTime(value) {
  return value ? timezone.format(new Date(value)).replace(' ', 'T') : '';
}

function renderOffer(row) {
  const entry = document.createElement('article');
  entry.className = 'offer-row';
  const title = document.createElement('h3');
  title.textContent = row.title_ku;
  const status = document.createElement('p');
  const now = Date.now();
  const state = Date.parse(row.end_date) < now ? 'بەسەرچووە'
    : !row.is_active ? 'بڵاونەکراوەتەوە'
    : Date.parse(row.start_date) > now ? 'دیاریکراوە بۆ دواتر'
    : 'چالاکە';
  status.textContent = state + ' · ' + row.discount_price.toLocaleString('ckb') + ' د.ع';
  entry.append(title, status);
  if (store.is_approved) {
    const actions = document.createElement('div');
    actions.className = 'offer-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'secondary';
    edit.textContent = 'دەستکاریکردن';
    edit.addEventListener('click', () => {
      if (busy) return;
      clearOffer();
      editing = row;
      offerTitle.textContent = 'دەستکاریکردنی ئۆفەر';
      for (const name of ['title_ku', 'title_ar', 'title_en', 'description', 'original_price', 'discount_price', 'category']) {
        offerForm.elements[name].value = row[name] ?? '';
      }
      offerForm.elements.start_date.value = localTime(row.start_date);
      offerForm.elements.end_date.value = localTime(row.end_date);
      cancel.hidden = false;
      showDiscount();
      offerForm.elements.title_ku.focus();
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger';
    remove.textContent = 'سڕینەوە';
    remove.addEventListener('click', () => {
      if (busy || !confirm('دڵنیایت لە سڕینەوەی ئەم ئۆفەرە؟')) return;
      action(async () => {
        const {data, error} = await db.from('offers').delete().eq('id', row.id)
          .eq('store_id', store.id).select('id').single();
        if (error || !data) throw new Error();
        if (editing?.id === row.id) clearOffer();
        await removeImage(row.image_path);
        await loadOffers();
      }, 'ئۆفەرەکە سڕایەوە.');
    });
    actions.append(edit, remove);
    entry.append(actions);
  }
  offers.append(entry);
}

async function loadOffers() {
  offers.replaceChildren();
  if (!store) return;
  const {data, error} = await db.from('offers')
    .select('id,title_ku,title_ar,title_en,description,category,original_price,discount_price,start_date,end_date,is_active,image_path')
    .eq('store_id', store.id).order('created_at', {ascending: false});
  if (error) throw error;
  data.forEach(renderOffer);
  if (!data.length) offers.textContent = 'هێشتا هیچ ئۆفەرێکت نییە.';
}

async function loadStore() {
  const {data, error} = await db.from('stores').select('id,store_name,phone,address,is_approved')
    .eq('user_id', userId).maybeSingle();
  if (error) throw error;
  store = data;
  for (const name of ['store_name', 'phone', 'address']) storeForm.elements[name].value = store?.[name] ?? '';
  approval.textContent = store?.is_approved ? 'فرۆشگاکەت پەسەند کراوە.'
    : store ? 'فرۆشگاکەت هێشتا پەسەند نەکراوە.' : 'زانیاریی فرۆشگاکەت بنووسە بۆ پەسەندکردن.';
  offerList.hidden = !store;
  offerForm.hidden = !store?.is_approved;
  await loadOffers();
}

async function showSession(user) {
  userId = user?.id;
  login.reset();
  storeForm.reset();
  clearOffer();
  offers.replaceChildren();
  dashboard.hidden = true;
  login.hidden = Boolean(userId);
  signout.hidden = !userId;
  if (userId) {
    await loadStore();
    dashboard.hidden = false;
  }
}

async function action(work, success = '', failure = 'کارەکە تەواو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.') {
  if (busy) return;
  busy = true;
  document.querySelectorAll('button').forEach(button => { button.disabled = true; });
  notify('چاوەڕێ بە…');
  try {
    await work();
    notify(success);
  } catch {
    notify(failure, true);
  } finally {
    busy = false;
    document.querySelectorAll('button').forEach(button => { button.disabled = false; });
  }
}

function iraqiMobile(value) {
  const digits = value.trim().replace(/[٠-٩۰-۹]/g, digit =>
    String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0))
  ).replace(/[\s()-]/g, '');
  const match = /^(?:0|\+964|00964)(7[0-9]{9})$/.exec(digits);
  return match ? '+964' + match[1] : null;
}

login.addEventListener('submit', event => {
  event.preventDefault();
  const phone = iraqiMobile(login.elements.phone.value);
  const password = login.elements.password.value;
  if (!phone) return notify('ژمارەی مۆبایلی عێراقی بە شێوەی 07 یان ‎+964 بنووسە.', true);
  action(async () => {
    const {data, error} = await db.auth.signInWithPassword({phone, password});
    if (error) throw error;
    await showSession(data.user);
  }, '', 'چوونەژوورەوە یان بارکردنی داشبۆرد سەرکەوتوو نەبوو.');
});
signout.addEventListener('click', () => action(async () => {
  const {error} = await db.auth.signOut({scope: 'local'});
  if (error) throw error;
  await showSession(null);
}));
storeForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!userId) return;
  const values = fieldValues(storeForm, ['store_name', 'phone', 'address']);
  if (!values.store_name) return notify('ناوی فرۆشگا بنووسە.', true);
  action(async () => {
    const query = store ? db.from('stores').update(values).eq('id', store.id)
      : db.from('stores').insert({...values, user_id: userId});
    const {error} = await query.select('id').single();
    if (error) throw error;
    await loadStore();
  }, 'زانیاریی فرۆشگاکە پاشەکەوت کرا.');
});

async function removeImage(path) {
  if (path) await db.storage.from(bucket).remove([path]);
}

function showDiscount() {
  const original = offerForm.elements.original_price.valueAsNumber;
  const price = offerForm.elements.discount_price.valueAsNumber;
  discount.textContent = original > 0 && price >= 0 && price < original
    ? Math.round(100 * (original - price) / original) + '٪ داشکاندن' : '';
}
offerForm.addEventListener('input', showDiscount);
cancel.addEventListener('click', clearOffer);

offerForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!store?.is_approved) return;
  const values = fieldValues(offerForm, ['title_ku', 'title_ar', 'title_en', 'description', 'category']);
  values.original_price = offerForm.elements.original_price.valueAsNumber;
  values.discount_price = offerForm.elements.discount_price.valueAsNumber;
  values.start_date = offerForm.elements.start_date.value + ':00+03:00';
  values.end_date = offerForm.elements.end_date.value + ':00+03:00';
  if (!values.title_ku || values.discount_price >= values.original_price ||
      Date.parse(values.end_date) <= Date.parse(values.start_date)) {
    return notify('ناونیشان، نرخ و کاتی دەستپێک و کۆتایی بپشکنە.', true);
  }
  const file = offerForm.elements.image.files[0];
  if (file && (!Object.hasOwn(formats, file.type) || !file.size || file.size > 5242880)) {
    return notify('وێنەی JPG، PNG یان WebP تا ٥ مێگابایت هەڵبژێرە.', true);
  }
  action(async () => {
    const previous = editing;
    if (file) {
      values.image_path = userId + '/' + crypto.randomUUID() + '.' + formats[file.type];
      const {error} = await db.storage.from(bucket).upload(values.image_path, file, {contentType: file.type});
      if (error) throw error;
    }
    const query = previous ? db.from('offers').update(values).eq('id', previous.id).eq('store_id', store.id)
      : db.from('offers').insert({...values, store_id: store.id});
    const {error} = await query.select('id').single();
    if (error) {
      await removeImage(values.image_path);
      throw error;
    }
    clearOffer();
    if (file) await removeImage(previous?.image_path);
    await loadOffers();
  }, 'ئۆفەرەکە پاشەکەوت کرا و چاوەڕێی پەسەندکردنە.');
});

if (typeof db === 'undefined') {
  notify('پەیوەندی بە خزمەتگوزاریی داشکا نەکرا. پەڕەکە نوێ بکەرەوە.', true);
} else {
  db.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT' && !busy) void showSession(null);
  });
  action(async () => {
    const readiness = await db.from('offers').select('image_path').limit(0);
    if (readiness.error) throw readiness.error;
    const {data, error} = await db.auth.getSession();
    if (error) throw error;
    await showSession(data.session?.user ?? null);
  }, '', 'داشبۆرد هێشتا ئامادە نییە. تکایە دواتر هەوڵ بدەرەوە.');
}
