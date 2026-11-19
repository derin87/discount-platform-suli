'use strict';

const search = document.querySelector('#store-search');
const statusMessage = document.querySelector('#store-status');
const list = document.querySelector('#store-list');

async function loadStores() {
  try {
    const { data, error } = await db.rpc('dashka_public_store_catalog');
    if (error) throw error;

    function render() {
      const term = search.value.trim().toLocaleLowerCase();
      const rows = data.filter(store =>
        [store.store_name, store.address].some(value => value?.toLocaleLowerCase().includes(term))
      );
      const entries = rows.map(store => {
        const item = document.createElement('li');
        const name = document.createElement('strong');
        name.textContent = store.store_name;
        item.append(name);
        if (store.address) {
          const address = document.createElement('p');
          address.textContent = store.address;
          item.append(address);
        }
        return item;
      });
      list.replaceChildren(...entries);
      list.hidden = entries.length === 0;
      statusMessage.textContent = entries.length ? '' : 'هیچ فرۆشگایەک نەدۆزرایەوە.';
    }

    search.disabled = false;
    search.addEventListener('input', render);
    render();
  } catch {
    statusMessage.textContent = 'لیستی فرۆشگاکان بار نەبوو. تکایە دواتر هەوڵ بدەرەوە.';
  }
}

void loadStores();
