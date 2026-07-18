// UI glue for track screen
(function () {
  const container = document.querySelector('.screen-track');
  if (!container) return;
  let chooserSelectedListId = null;
  let chooserMenuOpen = false;
  let routeStateApplied = false;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function renderIcons() {
    if (window.feather && typeof window.feather.replace === 'function') {
      try {
        window.feather.replace();
      } catch (err) {
        console.warn('feather.replace failed on track screen', err);
      }
    }
  }

  function setActiveTrackingList(list) {
    sessionStorage.setItem('ot_active_list_id', list.id);
    sessionStorage.setItem('ot_active_list_name', list.name);
    sessionStorage.setItem('ot_list_action', 'start-track');
  }

  function clearActiveTrackingList() {
    sessionStorage.removeItem('ot_active_list_id');
    sessionStorage.removeItem('ot_active_list_name');
    sessionStorage.removeItem('ot_list_action');
    chooserMenuOpen = false;
  }

  function syncTrackRoute(listId) {
    try {
      const params = new URLSearchParams(location.search);
      params.set('page', 'track');
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
      console.warn('Failed to sync track route', err);
    }
  }

  function applyRouteState(lists) {
    if (routeStateApplied) return;
    routeStateApplied = true;

    const route =
      window._obs && typeof window._obs.getRouteParams === 'function'
        ? window._obs.getRouteParams()
        : null;
    if (!route || route.page !== 'track') return;

    const routeListId = String(route.listId || '').trim();
    const routeList = routeListId
      ? lists.find((x) => x.id === routeListId)
      : null;

    if (routeList) {
      chooserSelectedListId = routeList.id;
      setActiveTrackingList(routeList);
      return;
    }

    // No listId in route means chooser/main state.
    clearActiveTrackingList();
  }

  async function dismissChooserMenu() {
    if (!chooserMenuOpen) return;
    chooserMenuOpen = false;
    await renderTrackState();
  }

  function renderActiveState(listName) {
    container.innerHTML = `
      <div class="screen-header">
        <h1 class="detail-breadcrumb">
          <a href="#" class="list-breadcrumb-link track-breadcrumb-root" aria-label="Back to track list picker">Track</a>
          <span class="breadcrumb-sep">&gt;</span>
          <span class="breadcrumb-current">${escapeHtml(listName)}</span>
        </h1>
      </div>
      <div class="lists-container track-active-body" aria-label="Active tracking session"></div>
    `;

    const root = container.querySelector('.track-breadcrumb-root');
    if (root) {
      root.addEventListener('click', async (e) => {
        e.preventDefault();
        clearActiveTrackingList();
        syncTrackRoute(null);
        await renderTrackState();
      });
    }
  }

  function renderChooserState(lists) {
    const safeLists = Array.isArray(lists) ? lists : [];

    const matchedSelected = safeLists.find(
      (x) => x.id === chooserSelectedListId
    );
    const selected = matchedSelected || safeLists[0] || null;
    chooserSelectedListId = selected ? selected.id : null;

    if (!selected) {
      container.innerHTML = `
        <div class="screen-header"><h1>Track</h1></div>
        <div class="lists-container track-picker-card">
          <div class="track-empty">No lists available yet. Create one from the Lists tab.</div>
        </div>
      `;
      return;
    }

    const selectedCount = Array.isArray(selected.items)
      ? selected.items.length
      : 0;
    const selectedCountLabel = `${selectedCount} item${
      selectedCount === 1 ? '' : 's'
    }`;

    const optionsMarkup = safeLists
      .map((list) => {
        const count = Array.isArray(list.items) ? list.items.length : 0;
        const countLabel = `${count} item${count === 1 ? '' : 's'}`;
        return `
          <button class="track-picker-option ${
            list.id === selected.id ? 'active' : ''
          }" type="button" data-id="${escapeAttr(
          list.id
        )}" aria-label="Choose ${escapeAttr(list.name)}">
            <span class="track-picker-option-row">
              <span class="track-picker-option-name">${escapeHtml(
                list.name
              )}</span>
              <span class="track-picker-option-meta">
                <span class="item-count-text">${countLabel}</span>
                ${list.builtIn ? '<span class="badge">Built-in</span>' : ''}
              </span>
            </span>
          </button>
        `;
      })
      .join('');

    container.innerHTML = `
      <div class="screen-header"><h1>Track</h1></div>
      <div class="lists-container track-picker-card">
        <div class="track-picker-label">Select list to start tracking</div>
        <div class="track-picker-wrap">
          <button class="track-picker-toggle" type="button" aria-label="Choose a list to track" aria-expanded="${
            chooserMenuOpen ? 'true' : 'false'
          }">
            <span class="track-picker-option-row">
              <span class="track-picker-option-name">${escapeHtml(
                selected.name
              )}</span>
              <span class="track-picker-selected-right">
                <span class="track-picker-option-meta">
                  <span class="item-count-text">${selectedCountLabel}</span>
                  ${
                    selected.builtIn
                      ? '<span class="badge">Built-in</span>'
                      : ''
                  }
                </span>
                <i data-feather="chevron-down"></i>
              </span>
            </span>
          </button>
          ${
            chooserMenuOpen
              ? `<div class="track-picker-menu" role="listbox">${optionsMarkup}</div>`
              : ''
          }
        </div>
        <div class="track-actions">
          <button class="drawer-action primary track-start-button" type="button" data-id="${escapeAttr(
            selected.id
          )}" aria-label="Start session for ${escapeAttr(selected.name)}" ${
      selectedCount === 0 ? 'disabled' : ''
    }>
            <span>Start Session</span><i data-feather="target"></i>
          </button>
        </div>
      </div>
    `;

    const toggle = container.querySelector('.track-picker-toggle');
    if (toggle) {
      toggle.addEventListener('click', async (e) => {
        e.stopPropagation();
        chooserMenuOpen = !chooserMenuOpen;
        await renderTrackState();
      });
    }

    container.querySelectorAll('.track-picker-option').forEach((option) => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = option.getAttribute('data-id');
        if (!id) return;
        chooserSelectedListId = id;
        chooserMenuOpen = false;
        await renderTrackState();
      });
    });

    if (chooserMenuOpen) {
      setTimeout(() => {
        document.addEventListener('click', dismissChooserMenu, { once: true });
      }, 0);
    }

    container.querySelectorAll('.track-start-button').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        const refreshed = await window.repository.loadLists();
        const list = refreshed.find((x) => x.id === id);
        if (!list) return;
        setActiveTrackingList(list);
        syncTrackRoute(list.id);
        await renderTrackState();
      });
    });
  }

  async function renderTrackState() {
    const lists = await window.repository.loadLists();
    applyRouteState(lists);
    const activeId = sessionStorage.getItem('ot_active_list_id');
    const activeName = sessionStorage.getItem('ot_active_list_name');
    const action = sessionStorage.getItem('ot_list_action');

    if (action === 'start-track' && (activeId || activeName)) {
      const match = activeId ? lists.find((x) => x.id === activeId) : null;
      const name = match?.name || activeName;
      if (name) {
        chooserMenuOpen = false;
        renderActiveState(name);
        renderIcons();
        return;
      }
    }

    renderChooserState(lists);
    renderIcons();
  }

  renderTrackState().catch((err) => {
    console.warn('Failed to render track screen', err);
  });
})();
