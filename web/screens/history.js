// UI glue for history screen
(function () {
  const container = document.querySelector('.screen-history');
  if (!container) return;
  let selectedSessionId = null;
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

  function formatSessionDate(value) {
    const ts = Number(value || 0);
    if (!Number.isFinite(ts) || ts <= 0) return 'Unknown date';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(ts));
    } catch (err) {
      console.warn('Failed to format session date', err);
      return new Date(ts).toLocaleString();
    }
  }

  function syncHistoryRoute(sessionId) {
    try {
      const params = new URLSearchParams(location.search);
      params.set('page', 'history');
      params.delete('view');
      params.delete('mode');
      params.delete('list');
      if (sessionId) params.set('listId', sessionId);
      else params.delete('listId');
      history.replaceState(
        null,
        '',
        `${location.pathname}?${params.toString()}`
      );
    } catch (err) {
      console.warn('Failed to sync history route', err);
    }
  }

  function applyRouteState(sessions) {
    if (routeStateApplied) return;
    routeStateApplied = true;

    const route =
      window._obs && typeof window._obs.getRouteParams === 'function'
        ? window._obs.getRouteParams()
        : null;
    if (!route || route.page !== 'history') return;

    const routeSessionId = String(route.listId || '').trim();
    if (!routeSessionId) return;

    const match = sessions.find((x) => x.id === routeSessionId);
    if (match) selectedSessionId = match.id;
  }

  function sortSessions(sessions) {
    return [...(Array.isArray(sessions) ? sessions : [])].sort(
      (a, b) =>
        Number(b.savedAt || b.endedAt || 0) -
        Number(a.savedAt || a.endedAt || 0)
    );
  }

  function normalizeObservedItems(session) {
    const source = Array.isArray(session?.items) ? session.items : [];
    return source
      .map((item, index) => {
        const count = Number(item?.count || 0);
        const name = String(item?.name || `Item ${index + 1}`).trim();
        return {
          id: String(item?.id || `item-${index}`),
          name: name || `Item ${index + 1}`,
          count,
        };
      })
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }

  function renderListView(sessions) {
    const rows = sessions
      .map((session, index) => {
        const title = String(session?.listName || `Session ${index + 1}`);
        const stamp = formatSessionDate(session?.savedAt || session?.endedAt);
        return `
          <div class="list-item">
            <button class="list-row history-session-row" type="button" data-id="${escapeAttr(
              session.id || ''
            )}" aria-label="Open ${escapeAttr(title)} saved ${escapeAttr(
          stamp
        )}">
              <div class="list-title">${escapeHtml(title)}</div>
              <div class="list-meta">
                <span class="item-count-text">${escapeHtml(stamp)}</span>
              </div>
            </button>
          </div>
        `;
      })
      .join('');

    container.innerHTML = `
      <div class="screen-header"><h1>History</h1></div>
      <div class="lists-container" aria-label="Saved sessions history">
        ${rows || '<div class="track-empty">No saved sessions yet.</div>'}
      </div>
    `;

    container.querySelectorAll('.history-session-row').forEach((row) => {
      row.addEventListener('click', async () => {
        const id = row.getAttribute('data-id');
        if (!id) return;
        selectedSessionId = id;
        syncHistoryRoute(id);
        await renderHistory();
      });
    });
  }

  function renderDetailView(session) {
    const title = String(session?.listName || 'Session');
    const stamp = formatSessionDate(session?.savedAt || session?.endedAt);
    const observedItems = normalizeObservedItems(session);

    const rows = observedItems
      .map(
        (item) => `
          <div class="list-detail-item">
            <div class="detail-item-main">
              <span class="detail-item-label">${escapeHtml(item.name)}</span>
            </div>
            <span class="track-grid-count${
              item.count === 0 ? ' track-grid-count-zero' : ''
            }">${item.count}</span>
          </div>
        `
      )
      .join('');

    container.innerHTML = `
      <div class="screen-header">
        <h1 class="detail-breadcrumb">
          <a href="#" class="list-breadcrumb-link history-breadcrumb-root" aria-label="Back to history">History</a>
          <span class="breadcrumb-sep">&gt;</span>
          <span class="breadcrumb-current">${escapeHtml(title)}</span>
        </h1>
      </div>
      <div class="item-count-text">${escapeHtml(stamp)}</div>
      <div class="list-detail-card lists-container" aria-label="Observed items sorted by count">
        ${
          rows ||
          '<div class="list-detail-empty">No observed items recorded for this session.</div>'
        }
      </div>
    `;

    const root = container.querySelector('.history-breadcrumb-root');
    if (root) {
      root.addEventListener('click', async (e) => {
        e.preventDefault();
        selectedSessionId = null;
        syncHistoryRoute(null);
        await renderHistory();
      });
    }
  }

  async function renderHistory() {
    const sessions =
      window.repository && typeof window.repository.loadHistory === 'function'
        ? await window.repository.loadHistory()
        : [];

    const sorted = sortSessions(sessions);
    applyRouteState(sorted);

    const selected = selectedSessionId
      ? sorted.find((x) => x.id === selectedSessionId)
      : null;

    if (selected) {
      renderDetailView(selected);
      return;
    }

    if (selectedSessionId) {
      selectedSessionId = null;
      syncHistoryRoute(null);
    }

    renderListView(sorted);
  }

  renderHistory().catch((err) => {
    console.warn('Failed to render history screen', err);
    container.innerHTML = `
      <div class="screen-header"><h1>History</h1></div>
      <div class="lists-container"><div class="track-empty">Unable to load history right now.</div></div>
    `;
  });
})();
