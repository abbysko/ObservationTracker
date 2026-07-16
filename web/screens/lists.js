// UI glue for lists screen
(function () {
  async function render(lists) {
    const container = document.querySelector('.screen-lists');
    if (!container) return;
    // clear any existing HTML (the static screen HTML may include a header/placeholder)
    container.innerHTML = '';
    const ul = document.createElement('div');
    ul.className = 'lists-container';
    lists.forEach((l) => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.innerHTML = `<div class="list-title">${escapeHtml(
        l.name
      )}</div><div class="list-meta">${
        l.builtIn ? '<span class="badge">Built-in</span>' : ''
      }<button class="dup" data-id="${l.id}">Duplicate</button></div>`;
      ul.appendChild(row);
    });

    // ensure header stays above the card
    // create a header wrapper so we can align the title and the add button
    const header = document.createElement('div');
    header.className = 'screen-header';
    header.innerHTML = '<h1>Lists</h1>';
    // create add button and place it inside the header so it aligns vertically with the title
    const add = document.createElement('button');
    add.className = 'add-button';
    add.setAttribute('aria-label', 'Add list');
    add.innerHTML = '<i data-feather="plus"></i>';
    header.appendChild(add);

    container.appendChild(header);
    container.appendChild(ul);

    // ensure feather renders the icon if loaded
    if (window.feather && typeof window.feather.replace === 'function') {
      try {
        window.feather.replace();
      } catch (e) {
        console.warn('feather.replace failed on add button', e);
      }
    }

    // attach handlers for the rows and the add button
    attachHandlers();

    add.addEventListener('click', async () => {
      // simple create flow: create a named list and save it
      const existing = await window.repository.loadLists();
      let base = 'New List';
      let name = base;
      let n = 1;
      while (existing.some((x) => x.name === name)) {
        name = `${base} ${n}`;
        n++;
      }
      const newList = {
        id: 'custom-' + Date.now(),
        name,
        builtIn: false,
        items: [],
      };
      await window.repository.saveList(newList);
      const refreshed = await window.repository.loadLists();
      render(refreshed);
    });
  }

  function attachHandlers() {
    document.querySelectorAll('.list-row .dup').forEach((b) => {
      b.addEventListener('click', async (e) => {
        const id = b.getAttribute('data-id');
        const lists = await window.repository.loadLists();
        const list = lists.find((x) => x.id === id);
        if (list) {
          const copy = await window.repository.duplicateList(list);
          // assign a unique copy name: "Original Name #"
          const refreshed = await window.repository.loadLists();
          let n = 1;
          while (refreshed.some((l) => l.name === `${list.name} ${n}`)) {
            n++;
          }
          copy.name = `${list.name} ${n}`;
          await window.repository.saveList(copy);
          // re-render with updated lists
          const refreshed2 = await window.repository.loadLists();
          render(refreshed2);
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // bootstrap when script loads
  (async () => {
    const lists = await window.repository.loadLists();
    render(lists);
  })();
})();
