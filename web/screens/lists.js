// UI glue for lists screen
(function () {
  let selectedListId = null;
  let editingListId = null;
  let detailListId = null;
  let selectedDetailItemIndex = null;
  let editingDetailItemIndex = null;
  let detailSortable = null;
  let sortableLoadPromise = null;
  let suppressDetailItemClick = false;
  let viewMode = 'lists';
  let sortMode = 'default';
  let sortMenuOpen = false;

  function normalizeRenameValue(rawValue) {
    const value = String(rawValue || '').trim();
    const nonWhitespaceLength = value.replace(/\s/g, '').length;

    if (nonWhitespaceLength <= 1) {
      return {
        ok: false,
        message: 'Name must be at least 2 non-whitespace characters.',
      };
    }

    if (value.length >= 30) {
      return {
        ok: false,
        message: 'Name must be fewer than 30 characters.',
      };
    }

    return {
      ok: true,
      value,
    };
  }

  function normalizeNameKey(value) {
    return String(value || '')
      .trim()
      .toLocaleLowerCase();
  }

  function hasDuplicateListName(lists, candidateName, excludeId) {
    const targetKey = normalizeNameKey(candidateName);
    return (Array.isArray(lists) ? lists : []).some(
      (list) =>
        String(list?.id || '') !== String(excludeId || '') &&
        normalizeNameKey(list?.name || '') === targetKey
    );
  }

  function hasDuplicateItemName(items, candidateName, excludeIndex) {
    const targetKey = normalizeNameKey(candidateName);
    return (Array.isArray(items) ? items : []).some((item, idx) => {
      if (idx === excludeIndex) return false;
      const name = typeof item === 'string' ? item : item?.name || '';
      return normalizeNameKey(name) === targetKey;
    });
  }

  function syncListsRoute(listId) {
    try {
      const params = new URLSearchParams(location.search);
      params.set('page', 'lists');
      params.delete('view');
      params.delete('mode');
      params.delete('list');
      if (listId) params.set('listId', listId);
      else params.delete('listId');
      history.replaceState(
        null,
        '',
        `${location.pathname}?${params.toString()}`
      );
    } catch (err) {
      console.warn('Failed to sync lists route', err);
    }
  }

  async function rerenderFromRepository() {
    const lists = await window.repository.loadLists();
    await render(lists);
  }

  function startSessionForList(list) {
    if (!list) return false;
    sessionStorage.setItem('ot_active_list_id', list.id);
    sessionStorage.setItem('ot_active_list_name', list.name);
    sessionStorage.setItem('ot_list_action', 'start-track');
    if (window._obs && typeof window._obs.setScreen === 'function') {
      window._obs.setScreen('track', {
        routeParams: {
          listId: list.id,
        },
      });
      return true;
    }
    return false;
  }

  async function render(lists) {
    const container = document.querySelector('.screen-lists');
    if (!container) return;

    if (detailSortable) {
      detailSortable.destroy();
      detailSortable = null;
    }

    if (viewMode === 'detail') {
      const detailList = lists.find((x) => x.id === detailListId);
      if (detailList) {
        renderDetailView(container, detailList);
        return;
      }
      // Fall back to list view if selected detail list no longer exists.
      viewMode = 'lists';
      detailListId = null;
      selectedDetailItemIndex = null;
      editingDetailItemIndex = null;
      syncListsRoute(null);
    }

    container.classList.remove('list-detail-mode');
    const sortedLists = sortLists(lists, sortMode);
    // clear any existing HTML (the static screen HTML may include a header/placeholder)
    container.innerHTML = '';
    const ul = document.createElement('div');
    ul.className = 'lists-container';

    sortedLists.forEach((l) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.setAttribute('data-id', l.id);
      const count = Array.isArray(l.items) ? l.items.length : 0;
      const countLabel = `${count} item${count === 1 ? '' : 's'}`;

      const row = document.createElement('div');
      row.className = 'list-row';
      row.setAttribute('data-id', l.id);
      const titleMarkup =
        editingListId === l.id && !l.builtIn
          ? `<input class="list-title-input" data-id="${
              l.id
            }" type="text" value="${escapeAttr(
              l.name
            )}" aria-label="Edit list name" maxlength="80" />`
          : `<div class="list-title ${
              selectedListId === l.id && !l.builtIn ? 'editable' : ''
            }" data-id="${l.id}">${escapeHtml(l.name)}</div>`;
      const showDeleteButton = selectedListId === l.id && !l.builtIn;
      const deleteButtonMarkup = showDeleteButton
        ? `<button class="row-delete" data-id="${l.id}" aria-label="Delete list"><i data-feather="trash"></i></button>`
        : '';
      row.innerHTML = `${titleMarkup}<div class="list-meta">${
        l.builtIn
          ? `<span class="item-count-text list-row-count">${countLabel}</span><span class="badge">Built-in</span>`
          : `<span class="item-count-text list-row-count">${countLabel}</span>`
      }${deleteButtonMarkup}</div>`;
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
      await rerenderFromRepository();
    });

    document.querySelectorAll('.sort-option').forEach((option) => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation();
        sortMode = option.getAttribute('data-sort') || 'default';
        sortMenuOpen = false;
        await rerenderFromRepository();
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
      selectedListId = newList.id;
      editingListId = newList.id;
      await rerenderFromRepository();
    });
  }

  function renderDetailView(container, list) {
    container.classList.add('list-detail-mode');
    container.innerHTML = '';
    const canEditItems = !list.builtIn;

    const header = document.createElement('div');
    header.className = 'screen-header';
    const detailNameMarkup =
      editingListId === list.id && !list.builtIn
        ? `<input class="detail-breadcrumb-input" data-id="${
            list.id
          }" type="text" value="${escapeAttr(
            list.name
          )}" aria-label="Edit list name" maxlength="80" />`
        : `<span class="breadcrumb-current ${
            !list.builtIn ? 'editable' : ''
          }" data-id="${list.id}">${escapeHtml(list.name)}</span>`;
    header.innerHTML = `
      <h1 class="detail-breadcrumb">
        <a href="#" class="list-breadcrumb-link" aria-label="Back to all lists">Lists</a>
        <span class="breadcrumb-sep">&gt;</span>
        ${detailNameMarkup}
        ${list.builtIn ? '<span class="badge">Built-in</span>' : ''}
      </h1>
    `;

    if (canEditItems) {
      const add = document.createElement('button');
      add.className = 'add-button';
      add.setAttribute('aria-label', 'Add list item');
      add.innerHTML = '<i data-feather="plus"></i>';
      header.appendChild(add);
    }

    const card = document.createElement('div');
    card.className = 'list-detail-card lists-container';

    const count = Array.isArray(list.items) ? list.items.length : 0;

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'list-detail-items';
    const items = Array.isArray(list.items) ? list.items : [];

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'list-detail-empty';
      empty.innerHTML = `<div class="list-detail-empty-copy">No items in this list yet.</div>${
        canEditItems
          ? '<input class="list-detail-empty-input" type="text" aria-label="Paste comma separated list items" placeholder="Paste comma separated list items or use the + button" />'
          : ''
      }`;
      itemsContainer.appendChild(empty);
    } else {
      items.forEach((item, index) => {
        const selected = selectedDetailItemIndex === index;
        const editing = editingDetailItemIndex === index && canEditItems;
        const label = typeof item === 'string' ? item : item.name || '';

        const row = document.createElement('div');
        row.className = `list-detail-item${selected ? ' selected' : ''}`;
        row.setAttribute('data-item-index', String(index));
        row.setAttribute('draggable', 'false');
        row.innerHTML = `
          ${
            canEditItems
              ? `<button class="detail-item-grip" type="button" data-item-index="${index}" aria-label="Reorder handle"><i data-feather="menu"></i></button>`
              : ''
          }
          <div class="detail-item-main">
            ${
              editing
                ? `<input class="detail-item-input" data-item-index="${index}" type="text" value="${escapeAttr(
                    label
                  )}" aria-label="Edit list item" maxlength="80" />`
                : `<span class="detail-item-label ${
                    canEditItems && selected ? 'editable' : ''
                  }" data-item-index="${index}">${escapeHtml(label)}</span>`
            }
          </div>
          ${
            canEditItems && selected
              ? `<button class="detail-item-delete" data-item-index="${index}" aria-label="Delete item"><i data-feather="trash"></i></button>`
              : ''
          }
        `;
        itemsContainer.appendChild(row);
      });
    }

    card.appendChild(itemsContainer);

    const footer = document.createElement('div');
    footer.className = 'list-detail-footer';
    footer.innerHTML = `
      <div class="list-detail-count">${count} item${
      count === 1 ? '' : 's'
    }</div>
      <button class="drawer-action primary detail-start-session" type="button" aria-label="Start session for this list" ${
        count === 0 ? 'disabled' : ''
      }>
        <span>Start Session</span><i data-feather="target"></i>
      </button>
    `;

    container.appendChild(header);
    container.appendChild(card);
    container.appendChild(footer);

    if (window.feather && typeof window.feather.replace === 'function') {
      try {
        window.feather.replace();
      } catch (e) {
        console.warn('feather.replace failed on detail view', e);
      }
    }

    const breadcrumbLink = container.querySelector('.list-breadcrumb-link');
    if (breadcrumbLink) {
      breadcrumbLink.addEventListener('click', async (e) => {
        e.preventDefault();
        viewMode = 'lists';
        detailListId = null;
        selectedDetailItemIndex = null;
        editingDetailItemIndex = null;
        syncListsRoute(null);
        const refreshed = await window.repository.loadLists();
        render(refreshed);
      });
    }

    const breadcrumbCurrent = container.querySelector(
      '.breadcrumb-current.editable'
    );
    if (breadcrumbCurrent) {
      breadcrumbCurrent.addEventListener('click', async (e) => {
        e.stopPropagation();
        editingListId = breadcrumbCurrent.getAttribute('data-id');
        const refreshed = await window.repository.loadLists();
        render(refreshed);
      });
    }

    const breadcrumbInput = container.querySelector('.detail-breadcrumb-input');
    if (breadcrumbInput) {
      let done = false;
      let skipNextBlurSave = false;

      const finalizeBreadcrumbRename = async (shouldSave) => {
        if (done) return;

        if (shouldSave) {
          const normalized = normalizeRenameValue(breadcrumbInput.value);
          if (!normalized.ok) {
            skipNextBlurSave = true;
            window.alert(normalized.message);
            setTimeout(() => {
              try {
                breadcrumbInput.focus();
                breadcrumbInput.select();
              } catch (err) {
                console.warn('Failed to refocus breadcrumb input', err);
              }
            }, 0);
            return;
          }

          const nextName = normalized.value;
          if (nextName) {
            const refreshed = await window.repository.loadLists();
            if (hasDuplicateListName(refreshed, nextName, detailListId)) {
              skipNextBlurSave = true;
              window.alert('List name must be unique.');
              setTimeout(() => {
                try {
                  breadcrumbInput.focus();
                  breadcrumbInput.select();
                } catch (err) {
                  console.warn('Failed to refocus breadcrumb input', err);
                }
              }, 0);
              return;
            }
            const nextList = refreshed.find((x) => x.id === detailListId);
            if (nextList && !nextList.builtIn) {
              nextList.name = nextName;
              await window.repository.saveList(nextList);
            }
          }
        }

        done = true;

        editingListId = null;
        const refreshed2 = await window.repository.loadLists();
        render(refreshed2);
      };

      breadcrumbInput.addEventListener('click', (e) => e.stopPropagation());
      breadcrumbInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await finalizeBreadcrumbRename(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          await finalizeBreadcrumbRename(false);
        }
      });
      breadcrumbInput.addEventListener('blur', async () => {
        if (skipNextBlurSave) {
          skipNextBlurSave = false;
          return;
        }
        await finalizeBreadcrumbRename(true);
      });

      setTimeout(() => {
        try {
          breadcrumbInput.focus();
          breadcrumbInput.select();
        } catch (err) {
          console.warn('Failed to focus breadcrumb input', err);
        }
      }, 0);
    }

    const detailAdd = container.querySelector('.screen-header .add-button');
    if (detailAdd) {
      detailAdd.addEventListener('click', async () => {
        const refreshed = await window.repository.loadLists();
        const nextList = refreshed.find((x) => x.id === detailListId);
        if (!nextList || nextList.builtIn) return;

        const existingItems = Array.isArray(nextList.items)
          ? nextList.items
          : [];
        const existingNames = existingItems.map((item) =>
          typeof item === 'string' ? item : item?.name || ''
        );
        let base = 'New Item';
        let name = base;
        let n = 1;
        while (existingNames.includes(name)) {
          name = `${base} ${n}`;
          n++;
        }

        const newItem = {
          id: 'item-' + Date.now(),
          name,
        };

        nextList.items = existingItems.concat(newItem);
        await window.repository.saveList(nextList);
        selectedDetailItemIndex = nextList.items.length - 1;
        editingDetailItemIndex = nextList.items.length - 1;
        const refreshed2 = await window.repository.loadLists();
        render(refreshed2);
      });
    }

    const detailStart = container.querySelector('.detail-start-session');
    if (detailStart) {
      detailStart.addEventListener('click', () => {
        startSessionForList(list);
      });
    }

    const emptyInput = container.querySelector('.list-detail-empty-input');
    if (emptyInput) {
      let done = false;

      const finalizePaste = async () => {
        if (done) return;
        const raw = emptyInput.value.trim();
        if (!raw) return;
        done = true;

        const refreshed = await window.repository.loadLists();
        const nextList = refreshed.find((x) => x.id === detailListId);
        if (!nextList || nextList.builtIn) return;

        const names = raw
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean);
        if (!names.length) return;

        nextList.items = names.map((name, index) => ({
          id: 'item-' + Date.now() + '-' + index,
          name,
        }));
        await window.repository.saveList(nextList);
        selectedDetailItemIndex = null;
        editingDetailItemIndex = null;
        const refreshed2 = await window.repository.loadLists();
        render(refreshed2);
      };

      emptyInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await finalizePaste();
        }
      });

      emptyInput.addEventListener('blur', async () => {
        await finalizePaste();
      });
    }

    attachDetailHandlers(container, list, canEditItems);
    initializeDetailSorting(container, list, canEditItems);
  }

  function loadSortable() {
    if (window.Sortable) return Promise.resolve(window.Sortable);
    if (sortableLoadPromise) return sortableLoadPromise;

    sortableLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'vendor/Sortable.min.js';
      script.onload = () => resolve(window.Sortable);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });

    return sortableLoadPromise;
  }

  function clearDetailSortPreview(container) {
    container
      .querySelectorAll('.list-detail-item.detail-drop-target')
      .forEach((item) => {
        item.classList.remove('detail-drop-target');
        item.removeAttribute('data-drop-position');
      });
  }

  function setDetailSortPreview(target, insertAfter) {
    if (!target) return;
    const container = target.closest('.list-detail-items');
    if (!container) return;
    clearDetailSortPreview(container);
    target.classList.add('detail-drop-target');
    target.setAttribute('data-drop-position', insertAfter ? 'after' : 'before');
  }

  async function persistDetailItemOrder(oldIndex, newIndex) {
    if (oldIndex === newIndex) return false;
    const lists = await window.repository.loadLists();
    const nextList = lists.find((x) => x.id === detailListId);
    if (!nextList || nextList.builtIn || !Array.isArray(nextList.items)) {
      return false;
    }
    if (
      oldIndex < 0 ||
      newIndex < 0 ||
      oldIndex >= nextList.items.length ||
      newIndex >= nextList.items.length
    ) {
      return false;
    }

    const nextItems = [...nextList.items];
    const moved = nextItems.splice(oldIndex, 1)[0];
    nextItems.splice(newIndex, 0, moved);
    nextList.items = nextItems;
    await window.repository.saveList(nextList);
    selectedDetailItemIndex = newIndex;
    editingDetailItemIndex = null;
    return true;
  }

  function initializeDetailSorting(container, list, canEditItems) {
    if (!canEditItems) return;
    if (!Array.isArray(list.items) || list.items.length < 2) return;

    const itemsContainer = container.querySelector('.list-detail-items');
    if (!itemsContainer) return;

    loadSortable()
      .then((Sortable) => {
        if (!itemsContainer.isConnected) return;
        if (detailSortable) {
          detailSortable.destroy();
          detailSortable = null;
        }

        detailSortable = Sortable.create(itemsContainer, {
          animation: 160,
          handle: '.detail-item-grip',
          draggable: '.list-detail-item',
          forceFallback: true,
          fallbackOnBody: true,
          fallbackTolerance: 3,
          ghostClass: 'detail-item-ghost',
          chosenClass: 'detail-item-chosen',
          dragClass: 'detail-item-drag',
          onStart() {
            clearDetailSortPreview(itemsContainer);
          },
          onMove(evt) {
            if (evt.related) {
              setDetailSortPreview(evt.related, !!evt.willInsertAfter);
            }
          },
          async onEnd(evt) {
            clearDetailSortPreview(itemsContainer);
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            if (oldIndex == null || newIndex == null) {
              const refreshed = await window.repository.loadLists();
              render(refreshed);
              return;
            }

            const moved = await persistDetailItemOrder(oldIndex, newIndex);
            const refreshed = await window.repository.loadLists();
            if (!moved) {
              render(refreshed);
              return;
            }
            suppressDetailItemClick = true;
            render(refreshed);
          },
        });
      })
      .catch((err) => {
        console.warn('Failed to load local SortableJS bundle', err);
      });
  }

  function attachDetailHandlers(container, list, canEditItems) {
    if (!canEditItems) return;

    const reload = async () => {
      const refreshed = await window.repository.loadLists();
      render(refreshed);
    };

    container.querySelectorAll('.list-detail-item').forEach((row) => {
      row.addEventListener('click', async () => {
        if (suppressDetailItemClick) {
          suppressDetailItemClick = false;
          return;
        }
        const index = Number(row.getAttribute('data-item-index'));
        if (Number.isNaN(index)) return;
        editingDetailItemIndex = null;
        selectedDetailItemIndex =
          selectedDetailItemIndex === index ? null : index;
        await reload();
      });
    });

    container.querySelectorAll('.detail-item-grip').forEach((grip) => {
      grip.addEventListener('click', (e) => e.stopPropagation());
    });

    container
      .querySelectorAll('.detail-item-label.editable')
      .forEach((label) => {
        label.addEventListener('click', async (e) => {
          e.stopPropagation();
          const index = Number(label.getAttribute('data-item-index'));
          if (Number.isNaN(index)) return;
          editingDetailItemIndex = index;
          await reload();
        });
      });

    container.querySelectorAll('.detail-item-input').forEach((input) => {
      const index = Number(input.getAttribute('data-item-index'));
      let done = false;
      let skipNextBlurSave = false;

      const finalize = async (shouldSave) => {
        if (done) return;

        if (shouldSave && !Number.isNaN(index)) {
          const normalized = normalizeRenameValue(input.value);
          if (!normalized.ok) {
            skipNextBlurSave = true;
            window.alert(normalized.message);
            setTimeout(() => {
              try {
                input.focus();
                input.select();
              } catch (err) {
                console.warn('Failed to refocus detail item input', err);
              }
            }, 0);
            return;
          }

          const nextName = normalized.value;
          if (nextName) {
            const lists = await window.repository.loadLists();
            const nextList = lists.find((x) => x.id === detailListId);
            if (
              nextList &&
              !nextList.builtIn &&
              Array.isArray(nextList.items)
            ) {
              const nextItems = [...nextList.items];
              if (hasDuplicateItemName(nextItems, nextName, index)) {
                skipNextBlurSave = true;
                window.alert('Item name must be unique within this list.');
                setTimeout(() => {
                  try {
                    input.focus();
                    input.select();
                  } catch (err) {
                    console.warn('Failed to refocus detail item input', err);
                  }
                }, 0);
                return;
              }
              const existing = nextItems[index];
              if (typeof existing === 'string') nextItems[index] = nextName;
              else if (existing && typeof existing === 'object') {
                nextItems[index] = {
                  ...existing,
                  name: nextName,
                };
              }
              nextList.items = nextItems;
              await window.repository.saveList(nextList);
            }
          }
        }

        done = true;

        editingDetailItemIndex = null;
        await reload();
      };

      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await finalize(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          await finalize(false);
        }
      });
      input.addEventListener('blur', async () => {
        if (skipNextBlurSave) {
          skipNextBlurSave = false;
          return;
        }
        await finalize(true);
      });

      setTimeout(() => {
        try {
          input.focus();
          input.select();
        } catch (err) {
          console.warn('Failed to focus detail item input', err);
        }
      }, 0);
    });

    container.querySelectorAll('.detail-item-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const index = Number(btn.getAttribute('data-item-index'));
        if (Number.isNaN(index)) return;

        const lists = await window.repository.loadLists();
        const nextList = lists.find((x) => x.id === detailListId);
        if (!nextList || nextList.builtIn || !Array.isArray(nextList.items))
          return;

        const current = nextList.items[index];
        const name =
          typeof current === 'string' ? current : current?.name || 'item';
        const confirmed = window.confirm(`Delete "${name}"?`);
        if (!confirmed) return;

        const nextItems = [...nextList.items];
        nextItems.splice(index, 1);
        nextList.items = nextItems;
        await window.repository.saveList(nextList);
        selectedDetailItemIndex = null;
        editingDetailItemIndex = null;
        await reload();
      });
    });
  }

  async function dismissSortMenu() {
    if (!sortMenuOpen) return;
    sortMenuOpen = false;
    await rerenderFromRepository();
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
    const itemCount = Array.isArray(list.items) ? list.items.length : 0;

    drawer.innerHTML = `
      <button class="drawer-action primary" data-action="start-track" data-id="${
        list.id
      }" aria-label="Start tracking this list" ${
      itemCount === 0 ? 'disabled' : ''
    }>
        <span>Start Session</span><i data-feather="target"></i>
      </button>
      <button class="drawer-action" data-action="view-edit" data-id="${
        list.id
      }" aria-label="${
      list.builtIn ? 'View items in this list' : 'View and edit this list'
    }">
        <span>${
          list.builtIn ? 'View Items' : 'Edit Items'
        }</span><i data-feather="edit-3"></i>
      </button>
      <button class="drawer-action" data-action="duplicate" data-id="${
        list.id
      }" aria-label="Duplicate list" ${itemCount === 0 ? 'disabled' : ''}>
        <span>Duplicate</span><i data-feather="copy"></i>
      </button>
    `;

    return drawer;
  }

  function attachHandlers() {
    document.querySelectorAll('.list-row').forEach((row) => {
      row.addEventListener('click', async () => {
        const id = row.getAttribute('data-id');
        editingListId = null;
        selectedListId = selectedListId === id ? null : id;
        const refreshed = await window.repository.loadLists();
        render(refreshed);
      });
    });

    document.querySelectorAll('.list-title.editable').forEach((title) => {
      title.addEventListener('click', async (e) => {
        e.stopPropagation();
        editingListId = title.getAttribute('data-id');
        const refreshed = await window.repository.loadLists();
        render(refreshed);
      });
    });

    document.querySelectorAll('.list-title-input').forEach((input) => {
      const id = input.getAttribute('data-id');
      let done = false;
      let skipNextBlurSave = false;

      const finalize = async (shouldSave) => {
        if (done) return;

        if (shouldSave) {
          const normalized = normalizeRenameValue(input.value);
          if (!normalized.ok) {
            skipNextBlurSave = true;
            window.alert(normalized.message);
            setTimeout(() => {
              try {
                input.focus();
                input.select();
              } catch (err) {
                console.warn('Failed to refocus inline title input', err);
              }
            }, 0);
            return;
          }

          const nextName = normalized.value;
          if (nextName) {
            const lists = await window.repository.loadLists();
            if (hasDuplicateListName(lists, nextName, id)) {
              skipNextBlurSave = true;
              window.alert('List name must be unique.');
              setTimeout(() => {
                try {
                  input.focus();
                  input.select();
                } catch (err) {
                  console.warn('Failed to refocus inline title input', err);
                }
              }, 0);
              return;
            }
            const list = lists.find((x) => x.id === id);
            if (list && !list.builtIn) {
              list.name = nextName;
              await window.repository.saveList(list);
            }
          }
        }

        done = true;

        editingListId = null;
        const refreshed = await window.repository.loadLists();
        render(refreshed);
      };

      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await finalize(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          await finalize(false);
        }
      });
      input.addEventListener('blur', async () => {
        if (skipNextBlurSave) {
          skipNextBlurSave = false;
          return;
        }
        await finalize(true);
      });

      setTimeout(() => {
        try {
          input.focus();
          input.select();
        } catch (err) {
          console.warn('Failed to focus inline title input', err);
        }
      }, 0);
    });

    document.querySelectorAll('.row-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const lists = await window.repository.loadLists();
        const list = lists.find((x) => x.id === id);
        if (!list || list.builtIn) return;

        const confirmed = window.confirm(`Delete "${list.name}"?`);
        if (confirmed) {
          await window.repository.deleteList(list.id);
          if (selectedListId === list.id) selectedListId = null;
        }

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
          if (startSessionForList(list)) {
            return;
          }
        }

        if (action === 'view-edit') {
          detailListId = list.id;
          viewMode = 'detail';
          sortMenuOpen = false;
          editingListId = null;
          selectedDetailItemIndex = null;
          editingDetailItemIndex = null;
          syncListsRoute(list.id);
          const refreshed = await window.repository.loadLists();
          render(refreshed);
          return;
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

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function capitalize(s) {
    return (
      String(s || '')
        .slice(0, 1)
        .toUpperCase() + String(s || '').slice(1)
    );
  }

  function applyRouteState(lists) {
    const route =
      window._obs && typeof window._obs.getRouteParams === 'function'
        ? window._obs.getRouteParams()
        : null;
    if (!route || route.page !== 'lists') return;

    const routeListId = String(route.listId || '').trim();
    if (!routeListId) return;

    const target = lists.find((x) => x.id === routeListId);
    if (!target) return;

    selectedListId = target.id;
    viewMode = 'detail';
    detailListId = target.id;
    sortMenuOpen = false;
    editingListId = null;
    selectedDetailItemIndex = null;
    editingDetailItemIndex = null;
  }

  // bootstrap when script loads
  (async () => {
    const lists = await window.repository.loadLists();
    applyRouteState(lists);
    render(lists);
  })();
})();
