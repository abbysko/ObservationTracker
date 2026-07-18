// UI glue for lists screen
(function () {
  let selectedListId = null;
  let sortMode = 'default';
  let sortMenuOpen = false;

  async function render(lists) {
    const container = document.querySelector('.screen-lists');
    if (!container) return;
    const sortedLists = sortLists(lists, sortMode);
    // clear any existing HTML (the static screen HTML may include a header/placeholder)
    container.innerHTML = '';
    const ul = document.createElement('div');
    ul.className = 'lists-container';

    sortedLists.forEach((l) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.setAttribute('data-id', l.id);

      const row = document.createElement('div');
      row.className = 'list-row';
      row.setAttribute('data-id', l.id);
      row.innerHTML = `<div class="list-title">${escapeHtml(
        l.name
      )}</div><div class="list-meta">${
        l.builtIn ? '<span class="badge">Built-in</span>' : ''
      }</div>`;
      item.appendChild(row);

      if (selectedListId === l.id) {
        item.classList.add('expanded');
        row.classList.add('selected');
        item.appendChild(createDrawer(l));
      }

      ul.appendChild(item);
    });

    // ensure header stays above the card
    // create a header wrapper so we can align the title and the add button
    const header = document.createElement('div');
    header.className = 'screen-header';
    header.innerHTML = '<h1>Lists</h1>';

    const controls = document.createElement('div');
    controls.className = 'header-controls';

    const sortWrap = document.createElement('div');
    sortWrap.className = 'sort-menu-wrap';

    const sortToggle = document.createElement('button');
    sortToggle.className = 'sort-toggle';
    sortToggle.setAttribute('type', 'button');
    sortToggle.setAttribute(
      'aria-label',
      `Sort lists (${capitalize(sortMode)})`
    );
    sortToggle.setAttribute('aria-expanded', sortMenuOpen ? 'true' : 'false');
    sortToggle.innerHTML = '<i data-feather="sliders"></i>';
    sortWrap.appendChild(sortToggle);

    if (sortMenuOpen) {
      const menu = document.createElement('div');
      menu.className = 'sort-menu';
      menu.innerHTML = `
        <button class="sort-option ${
          sortMode === 'default' ? 'active' : ''
        }" type="button" data-sort="default">Default Order</button>
        <button class="sort-option ${
          sortMode === 'alphabetical' ? 'active' : ''
        }" type="button" data-sort="alphabetical">Alphabetical</button>
        <button class="sort-option ${
          sortMode === 'recent' ? 'active' : ''
        }" type="button" data-sort="recent">Recent First</button>
      `;
      sortWrap.appendChild(menu);
    }

    // create add button and place it inside the header so it aligns vertically with the title
    const add = document.createElement('button');
    add.className = 'add-button';
    add.setAttribute('aria-label', 'Add list');
    add.innerHTML = '<i data-feather="plus"></i>';

    controls.appendChild(sortWrap);
    controls.appendChild(add);
    header.appendChild(controls);

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

    sortToggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      sortMenuOpen = !sortMenuOpen;
      const refreshed = await window.repository.loadLists();
      render(refreshed);
    });

    document.querySelectorAll('.sort-option').forEach((option) => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation();
        sortMode = option.getAttribute('data-sort') || 'default';
        sortMenuOpen = false;
        const refreshed = await window.repository.loadLists();
        render(refreshed);
      });
    });

    if (sortMenuOpen) {
      setTimeout(() => {
        document.addEventListener('click', dismissSortMenu, { once: true });
      }, 0);
    }

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
      selectedListId = newList.id;
      render(refreshed);
    });
  }

  async function dismissSortMenu() {
    if (!sortMenuOpen) return;
    sortMenuOpen = false;
    const refreshed = await window.repository.loadLists();
    render(refreshed);
  }

  function sortLists(lists, mode) {
    const out = [...lists];
    const byName = (a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), undefined, {
        sensitivity: 'base',
      });

    if (mode === 'alphabetical') {
      return out.sort(byName);
    }

    if (mode === 'recent') {
      return out.sort((a, b) => {
        const at = Number(a.updatedAt || 0);
        const bt = Number(b.updatedAt || 0);
        if (at !== bt) return bt - at;
        return byName(a, b);
      });
    }

    // default: built-in first (alpha), then custom (alpha)
    return out.sort((a, b) => {
      if (a.builtIn !== b.builtIn) return a.builtIn ? -1 : 1;
      return byName(a, b);
    });
  }

  function createDrawer(list) {
    const drawer = document.createElement('div');
    drawer.className = 'list-drawer';
    drawer.setAttribute('data-id', list.id);

    const cannotEditBuiltIn = list.builtIn
      ? 'disabled title="Built-in lists cannot be renamed or deleted"'
      : '';

    drawer.innerHTML = `
      <button class="drawer-action primary" data-action="start-track" data-id="${list.id}" aria-label="Start tracking this list">
        <span>Start Tracking</span><i data-feather="target"></i>
      </button>
      <button class="drawer-action" data-action="duplicate" data-id="${list.id}" aria-label="Duplicate list">
        <span>Duplicate</span><i data-feather="copy"></i>
      </button>
      <button class="drawer-action" data-action="rename" data-id="${list.id}" aria-label="Rename list" ${cannotEditBuiltIn}>
        <span>Rename</span><i data-feather="edit-2"></i>
      </button>
      <button class="drawer-action destructive" data-action="delete" data-id="${list.id}" aria-label="Delete list" ${cannotEditBuiltIn}>
        <span>Delete</span><i data-feather="trash-2"></i>
      </button>
    `;

    return drawer;
  }

  function attachHandlers() {
    document.querySelectorAll('.list-row').forEach((row) => {
      row.addEventListener('click', async () => {
        const id = row.getAttribute('data-id');
        selectedListId = selectedListId === id ? null : id;
        const refreshed = await window.repository.loadLists();
        render(refreshed);
      });
    });

    document.querySelectorAll('.drawer-action').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const lists = await window.repository.loadLists();
        const list = lists.find((x) => x.id === id);
        if (!list) return;

        if (action === 'start-track') {
          sessionStorage.setItem('ot_active_list_id', list.id);
          sessionStorage.setItem('ot_active_list_name', list.name);
          if (window._obs && typeof window._obs.setScreen === 'function') {
            window._obs.setScreen('track');
            return;
          }
        }

        if (action === 'duplicate') {
          const copy = await window.repository.duplicateList(list);
          const refreshed = await window.repository.loadLists();
          let n = 1;
          while (refreshed.some((l) => l.name === `${list.name} ${n}`)) {
            n++;
          }
          copy.name = `${list.name} ${n}`;
          await window.repository.saveList(copy);
          selectedListId = copy.id;
        }

        if (action === 'rename' && !list.builtIn) {
          const proposed = window.prompt('Rename list', list.name);
          if (proposed && proposed.trim()) {
            const next = proposed.trim();
            list.name = next;
            await window.repository.saveList(list);
          }
        }

        if (action === 'delete' && !list.builtIn) {
          const confirmed = window.confirm(`Delete "${list.name}"?`);
          if (confirmed) {
            await window.repository.deleteList(list.id);
            if (selectedListId === list.id) {
              selectedListId = null;
            }
          }
        }

        const refreshed = await window.repository.loadLists();
        render(refreshed);
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function capitalize(s) {
    return (
      String(s || '')
        .slice(0, 1)
        .toUpperCase() + String(s || '').slice(1)
    );
  }

  // bootstrap when script loads
  (async () => {
    const lists = await window.repository.loadLists();
    render(lists);
  })();
})();
