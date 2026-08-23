// UI glue for history screen
(function () {
  const nameHelpers = window._obsNameHelpers || {};
  const container = document.querySelector('.screen-history');
  if (!container) return;
  let selectedSessionId = null;
  let listSelectedSessionId = null;
  let editingSessionId = null;
  let routeStateApplied = false;
  let detailChart = null;
  let sortMode = 'recent';
  let sortMenuOpen = false;

  function normalizeRenameValue(rawValue) {
    if (typeof nameHelpers.normalizeRenameValue === 'function') {
      return nameHelpers.normalizeRenameValue(rawValue);
    }
    const value = String(rawValue || '').trim();
    return { ok: !!value, value, message: 'Name cannot be empty.' };
  }

  function normalizeNameKey(value) {
    if (typeof nameHelpers.normalizeNameKey === 'function') {
      return nameHelpers.normalizeNameKey(value);
    }
    return String(value || '')
      .trim()
      .toLocaleLowerCase();
  }

  function hasDuplicateSessionName(sessions, candidateName, excludeId) {
    const targetKey = normalizeNameKey(candidateName);
    return (Array.isArray(sessions) ? sessions : []).some(
      (entry) =>
        String(entry?.id || '') !== String(excludeId || '') &&
        normalizeNameKey(entry?.listName || '') === targetKey
    );
  }

  function ensureChartLibrary() {
    return new Promise((resolve, reject) => {
      if (window.Chart) {
        resolve(window.Chart);
        return;
      }
      const existing = document.querySelector('script[data-chartjs="history"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Chart), {
          once: true,
        });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'vendor/chart.umd.min.js';
      script.async = true;
      script.setAttribute('data-chartjs', 'history');
      script.onload = () => resolve(window.Chart);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  async function renderHistoryChart(items) {
    const chartMount = container.querySelector('.history-chart-canvas');
    if (!chartMount) return;

    if (detailChart) {
      detailChart.destroy();
      detailChart = null;
    }

    try {
      const ChartLib = await ensureChartLibrary();
      if (!ChartLib || !ChartMountContext(chartMount)) return;

      const labels = items.map((item) => item.name);
      const counts = items.map((item) => item.count);
      const rootStyles = getComputedStyle(document.documentElement);
      const accent =
        rootStyles.getPropertyValue('--accent').trim() || '#6f42c1';
      const border =
        rootStyles.getPropertyValue('--border-color').trim() ||
        'rgba(0, 0, 0, 0.15)';
      const muted =
        rootStyles.getPropertyValue('--muted').trim() || 'rgba(0, 0, 0, 0.55)';

      detailChart = new ChartLib(chartMount, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Observations',
              data: counts,
              borderWidth: 1,
              borderColor: accent,
              backgroundColor: counts.map((value) =>
                value === 0 ? 'rgba(0, 0, 0, 0)' : accent
              ),
              borderRadius: 0,
              borderSkipped: false,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
          },
          scales: {
            x: {
              ticks: {
                precision: 0,
                color: muted,
                autoSkip: false,
                maxRotation: 45,
                minRotation: 0,
              },
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: muted,
                precision: 0,
              },
              grid: {
                color: border,
              },
            },
          },
        },
      });
    } catch (err) {
      console.warn('Failed to render history chart', err);
      const fallback = container.querySelector('.history-chart-fallback');
      if (fallback) fallback.hidden = false;
    }
  }

  function ChartMountContext(canvas) {
    return canvas && typeof canvas.getContext === 'function'
      ? canvas.getContext('2d')
      : null;
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
    const sorted = [...(Array.isArray(sessions) ? sessions : [])].sort(
      (a, b) => {
        const aTime = Number(a.savedAt || a.endedAt || 0);
        const bTime = Number(b.savedAt || b.endedAt || 0);
        const aName = normalizeNameKey(a?.listName || '');
        const bName = normalizeNameKey(b?.listName || '');
        if (sortMode === 'alphabetical') {
          if (aName !== bName) return aName.localeCompare(bName);
          return bTime - aTime;
        }
        if (sortMode === 'oldest') return aTime - bTime;
        return bTime - aTime;
      }
    );
    return sorted;
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

  function buildHistogramItems(items) {
    const source = Array.isArray(items) ? items : [];
    const observed = source.filter((item) => Number(item?.count || 0) > 0);
    const unobservedCount = source.length - observed.length;

    if (source.length > 10) {
      if (unobservedCount > 0) {
        return [
          ...observed,
          {
            id: '__unobserved__',
            name: 'Not Observed',
            count: 0,
          },
        ];
      }
      return observed;
    }

    return source;
  }

  function buildProgressSummary(session) {
    const items = Array.isArray(session?.items) ? session.items : [];
    const totalItems = items.length;
    const observedCount = items.filter(
      (item) => Number(item?.count || 0) > 0
    ).length;
    const notObservedCount = Math.max(0, totalItems - observedCount);
    const observedPercent =
      totalItems > 0 ? (observedCount / totalItems) * 100 : 0;
    const observedPercentLabel = `${Math.round(observedPercent)}%`;
    return {
      totalItems,
      observedCount,
      notObservedCount,
      observedPercent,
      observedPercentLabel,
    };
  }

  function renderProgressWidget(summary, ariaLabel) {
    return `
      <div class="track-progress" aria-label="${escapeAttr(
        ariaLabel || 'Observation progress summary'
      )}">
        <div class="track-progress-meta">
          <span class="item-count-text track-summary-line">
            Observed: <span class="track-observed-count">${
              summary.observedCount
            }</span>
            <span class="track-observed-percent">(${
              summary.observedPercentLabel
            })</span>
          </span>
          <span class="item-count-text track-summary-line">
            Not observed: <span class="track-not-yet-count">${
              summary.notObservedCount
            }</span>
          </span>
        </div>
        <div class="track-progress-bar" role="img" aria-label="Observed ${
          summary.observedCount
        } of ${summary.totalItems} items">
          <div class="track-progress-fill" style="width: ${
            summary.observedPercent
          }%"></div>
        </div>
      </div>
    `;
  }

  function buildUniqueListName(existingLists, baseName) {
    const safeBase = String(baseName || '').trim() || 'Restarted Session';
    const taken = new Set(
      (Array.isArray(existingLists) ? existingLists : []).map((list) =>
        normalizeNameKey(list?.name || '')
      )
    );
    if (!taken.has(normalizeNameKey(safeBase))) return safeBase;

    let n = 1;
    while (taken.has(normalizeNameKey(`${safeBase} ${n}`))) {
      n += 1;
    }
    return `${safeBase} ${n}`;
  }

  function normalizeTrackItemKey(item, index) {
    const isObject = item && typeof item === 'object' && !Array.isArray(item);
    const label = isObject
      ? String(item.name || '').trim()
      : String(item || '').trim();
    const id = isObject && item.id ? String(item.id).trim() : '';
    return id || `idx-${index}-${label.toLowerCase()}`;
  }

  function buildSeedCountsForRestart(list, session) {
    const listItems = Array.isArray(list?.items) ? list.items : [];
    const sessionItems = Array.isArray(session?.items) ? session.items : [];

    const byId = new Map();
    const byName = new Map();
    sessionItems.forEach((item) => {
      const count = Number(item?.count || 0);
      const id = String(item?.id || '').trim();
      const nameKey = normalizeNameKey(item?.name || '');
      if (id) byId.set(id, count);
      if (nameKey) byName.set(nameKey, count);
    });

    const counts = {};
    listItems.forEach((item, index) => {
      const key = normalizeTrackItemKey(item, index);
      const itemId =
        item && typeof item === 'object' && item.id
          ? String(item.id).trim()
          : '';
      const itemNameKey = normalizeNameKey(
        item && typeof item === 'object' ? item.name : item
      );
      const nextCount = itemId
        ? Number(byId.get(itemId) || 0)
        : Number(byName.get(itemNameKey) || 0);
      counts[key] = Number.isFinite(nextCount) ? nextCount : 0;
    });

    return counts;
  }

  async function restartTrackingFromSession(session) {
    if (!session) return false;
    if (
      !window.repository ||
      typeof window.repository.loadLists !== 'function'
    ) {
      return false;
    }

    const lists = await window.repository.loadLists();
    const targetId = String(session?.listId || '').trim();
    let list = targetId ? lists.find((x) => x.id === targetId) : null;

    if (!list) {
      if (typeof window.repository.saveList !== 'function') return false;

      const itemSource = Array.isArray(session?.items) ? session.items : [];
      const items = itemSource
        .map((item, index) => ({
          id: String(item?.id || `item-${Date.now()}-${index}`).trim(),
          name: String(item?.name || `Item ${index + 1}`).trim(),
        }))
        .filter((item) => item.name);

      const uniqueName = buildUniqueListName(
        lists,
        `${String(session?.listName || 'Session').trim()} Restart`
      );

      list = {
        id: 'custom-' + Date.now(),
        name: uniqueName,
        builtIn: false,
        items,
      };
      await window.repository.saveList(list);
    }

    const seedCounts = buildSeedCountsForRestart(list, session);

    sessionStorage.setItem('ot_active_list_id', list.id);
    sessionStorage.setItem('ot_active_list_name', list.name);
    sessionStorage.setItem('ot_list_action', 'start-track');
    sessionStorage.setItem(
      'ot_restart_history_session_id',
      String(session?.id || '')
    );
    sessionStorage.setItem(
      'ot_restart_history_session_name',
      String(session?.listName || '').trim()
    );
    sessionStorage.setItem('ot_restart_history_list_id', String(list.id || ''));
    sessionStorage.setItem(
      `ot_track_counts_v1_${list.id}`,
      JSON.stringify(seedCounts)
    );

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

  async function deleteHistorySessionById(sessionId) {
    const id = String(sessionId || '').trim();
    if (!id) return false;

    if (
      window.repository &&
      typeof window.repository.deleteHistorySession === 'function'
    ) {
      const deleted = await window.repository.deleteHistorySession(id);
      if (deleted) return true;
    }

    // Fallback for stale repository object in the current browser session.
    const sessions =
      window.repository && typeof window.repository.loadHistory === 'function'
        ? await window.repository.loadHistory()
        : [];
    const next = (Array.isArray(sessions) ? sessions : []).filter(
      (entry) => String(entry?.id || '') !== id
    );
    if (next.length === sessions.length) return false;

    localStorage.setItem('ot_history_v1', JSON.stringify(next));
    return true;
  }

  function renderListView(sessions) {
    const rows = sessions
      .map((session, index) => {
        const isSelected = listSelectedSessionId === session.id;
        const isEditing = editingSessionId === session.id;
        const title = String(session?.listName || `Session ${index + 1}`);
        const stamp = formatSessionDate(session?.savedAt || session?.endedAt);
        const titleMarkup = isEditing
          ? `<input class="list-title-input history-session-title-input" data-id="${escapeAttr(
              session.id || ''
            )}" type="text" value="${escapeAttr(
              title
            )}" aria-label="Edit session name" maxlength="80" />`
          : `<div class="list-title history-session-title ${
              isSelected ? 'editable' : ''
            }" data-id="${escapeAttr(session.id || '')}">${escapeHtml(
              title
            )}</div>`;
        const deleteButtonMarkup = isSelected
          ? `<button class="row-delete history-session-delete" data-id="${escapeAttr(
              session.id || ''
            )}" aria-label="Delete session"><i data-feather="trash"></i></button>`
          : '';
        const drawerMarkup = isSelected
          ? `
            <div class="list-drawer history-session-drawer" data-id="${escapeAttr(
              session.id || ''
            )}">
              <div class="history-session-inline-row">
                ${renderProgressWidget(
                  buildProgressSummary(session),
                  'Observation progress summary'
                )}
                <div class="history-session-actions-row">
                  <button class="drawer-action history-session-action" type="button" data-action="view" data-id="${escapeAttr(
                    session.id || ''
                  )}" aria-label="Details">
                    <span>Details</span><i data-feather="arrow-right-circle"></i>
                  </button>
                  <button class="drawer-action primary history-session-action" type="button" data-action="restart" data-id="${escapeAttr(
                    session.id || ''
                  )}" aria-label="Restart tracking from this session">
                    <span>Restart</span><i data-feather="play"></i>
                  </button>
                </div>
              </div>
            </div>
          `
          : '';
        return `
          <div class="list-item ${isSelected ? 'expanded' : ''}">
            <div class="list-row history-session-row ${
              isSelected ? 'selected' : ''
            }" data-id="${escapeAttr(
          session.id || ''
        )}" aria-label="Open ${escapeAttr(title)} saved ${escapeAttr(stamp)}">
              ${titleMarkup}
              <div class="list-meta">
                <span class="item-count-text">${escapeHtml(stamp)}</span>
                ${deleteButtonMarkup}
              </div>
            </div>
            ${drawerMarkup}
          </div>
        `;
      })
      .join('');

    container.innerHTML = `
      <div class="screen-header">
        <h1>History</h1>
        <div class="header-controls">
          <div class="sort-menu-wrap">
            <button class="sort-toggle history-sort-toggle" type="button" aria-label="Sort sessions (${
              sortMode === 'oldest'
                ? 'Oldest First'
                : sortMode === 'alphabetical'
                ? 'Alphabetical'
                : 'Recent First'
            })" aria-expanded="${sortMenuOpen ? 'true' : 'false'}">
              <i data-feather="sliders"></i>
            </button>
            ${
              sortMenuOpen
                ? `<div class="sort-menu history-sort-menu">
              <button class="sort-option ${
                sortMode === 'recent' ? 'active' : ''
              }" type="button" data-sort="recent">Recent First</button>
              <button class="sort-option ${
                sortMode === 'oldest' ? 'active' : ''
              }" type="button" data-sort="oldest">Oldest First</button>
              <button class="sort-option ${
                sortMode === 'alphabetical' ? 'active' : ''
              }" type="button" data-sort="alphabetical">Alphabetical</button>
            </div>`
                : ''
            }
          </div>
        </div>
      </div>
      <div class="lists-container" aria-label="Saved sessions history">
        ${rows || '<div class="track-empty">No saved sessions yet.</div>'}
      </div>
    `;

    const sortToggle = container.querySelector('.history-sort-toggle');
    if (sortToggle) {
      sortToggle.addEventListener('click', async (e) => {
        e.stopPropagation();
        sortMenuOpen = !sortMenuOpen;
        await renderHistory();
      });
    }

    container.querySelectorAll('.sort-option').forEach((option) => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation();
        sortMode = option.getAttribute('data-sort') || 'recent';
        sortMenuOpen = false;
        await renderHistory();
      });
    });

    if (sortMenuOpen) {
      setTimeout(() => {
        document.addEventListener('click', dismissSortMenu, { once: true });
      }, 0);
    }

    container.querySelectorAll('.history-session-row').forEach((row) => {
      row.addEventListener('click', async () => {
        const id = row.getAttribute('data-id');
        if (!id) return;
        if (editingSessionId === id) return;

        if (listSelectedSessionId === id) {
          listSelectedSessionId = null;
          editingSessionId = null;
          selectedSessionId = null;
          syncHistoryRoute(null);
          await renderHistory();
          return;
        }

        listSelectedSessionId = id;
        editingSessionId = null;
        selectedSessionId = null;
        syncHistoryRoute(null);
        await renderHistory();
      });
    });

    container
      .querySelectorAll('.history-session-title.editable')
      .forEach((el) => {
        el.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = el.getAttribute('data-id');
          if (!id) return;
          listSelectedSessionId = id;
          editingSessionId = id;
          renderListView(sessions);
        });
      });

    container
      .querySelectorAll('.history-session-title-input')
      .forEach((input) => {
        const id = input.getAttribute('data-id');
        window._obsRename.attachInput(input, {
          validate: async (value) => {
            const normalized = normalizeRenameValue(value);
            if (!normalized.ok) return normalized;
            const sessionsFromRepo = await window.repository.loadHistory();
            if (hasDuplicateSessionName(sessionsFromRepo, normalized.value, id)) {
              return { ok: false, message: 'Session name must be unique.' };
            }
            return normalized;
          },
          save: async (nextName) => {
            const updated = await window.repository.renameHistorySession(
              id,
              nextName
            );
            if (!updated) throw new Error('Session name must be unique.');
          },
          rerender: async () => {
            editingSessionId = null;
            listSelectedSessionId = id || null;
            await renderHistory();
          },
        });
      });

    container.querySelectorAll('.history-session-action').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (!id) return;

        const target = sessions.find((x) => String(x.id || '') === String(id));
        if (!target) return;

        if (action === 'restart') {
          const restarted = await restartTrackingFromSession(target);
          if (!restarted) {
            window.alert('Unable to restart tracking from this session.');
          }
          return;
        }

        if (action === 'view') {
          selectedSessionId = id;
          editingSessionId = null;
          listSelectedSessionId = null;
          syncHistoryRoute(id);
          await renderHistory();
          return;
        }
      });
    });

    container.querySelectorAll('.history-session-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (!id) return;

        const target = sessions.find((x) => String(x.id || '') === String(id));
        if (!target) return;

        const label = String(target?.listName || 'session');
        const confirmed = window.confirm(`Delete "${label}"?`);
        if (!confirmed) return;

        const deleted = await deleteHistorySessionById(id);
        if (!deleted) {
          window.alert('Unable to delete this session right now.');
          return;
        }

        if (listSelectedSessionId === id) listSelectedSessionId = null;
        if (editingSessionId === id) editingSessionId = null;
        if (selectedSessionId === id) selectedSessionId = null;
        syncHistoryRoute(null);
        await renderHistory();
      });
    });

    if (window.feather && typeof window.feather.replace === 'function') {
      try {
        window.feather.replace();
      } catch (err) {
        console.warn('feather.replace failed on history list', err);
      }
    }
  }

  async function dismissSortMenu() {
    if (!sortMenuOpen) return;
    sortMenuOpen = false;
    await renderHistory();
  }

  async function renderDetailView(session) {
    const title = String(session?.listName || 'Session');
    const stamp = formatSessionDate(session?.savedAt || session?.endedAt);
    const observedItems = normalizeObservedItems(session);
    const histogramItems = buildHistogramItems(observedItems);
    const progressSummary = buildProgressSummary(session);

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

    const detailNameMarkup =
      editingSessionId === session.id
        ? `<input class="detail-breadcrumb-input" data-id="${escapeAttr(
            session.id
          )}" type="text" value="${escapeAttr(
            title
          )}" aria-label="Edit session name" maxlength="80" />`
        : `<span class="breadcrumb-current editable history-breadcrumb-current" data-id="${escapeAttr(
            session.id
          )}">${escapeHtml(title)}</span>`;

    container.innerHTML = `
      <div class="screen-header">
        <h1 class="detail-breadcrumb">
          <a href="#" class="list-breadcrumb-link history-breadcrumb-root" aria-label="Back to history">History</a>
          <span class="breadcrumb-sep">&gt;</span>
          ${detailNameMarkup}
        </h1>
        <div class="header-controls">
          <button class="sort-toggle history-detail-delete" type="button" aria-label="Delete this session">
            <i data-feather="trash"></i>
          </button>
          <button class="add-button history-detail-restart" type="button" aria-label="Restart tracking from this session">
            <i data-feather="play"></i>
          </button>
        </div>
      </div>
      <div class="item-count-text">Session ended ${escapeHtml(stamp)}</div>
      ${renderProgressWidget(progressSummary, 'Observation progress summary')}
      <div class="list-detail-card lists-container history-chart-card" aria-label="Sorted observation histogram">
        <div class="history-chart-wrap">
          <canvas class="history-chart-canvas" aria-label="Observation histogram" role="img"></canvas>
          <div class="track-empty history-chart-fallback" hidden>Histogram unavailable right now.</div>
        </div>
      </div>
      <details class="history-full-list">
        <summary class="history-full-list-summary">All Observations</summary>
        <div class="list-detail-card lists-container history-full-list-card" aria-label="Observed items sorted by count">
          ${
            rows ||
            '<div class="list-detail-empty">No observed items recorded for this session.</div>'
          }
        </div>
      </details>
    `;

    const root = container.querySelector('.history-breadcrumb-root');
    if (root) {
      root.addEventListener('click', async (e) => {
        e.preventDefault();
        editingSessionId = null;
        selectedSessionId = null;
        syncHistoryRoute(null);
        if (detailChart) {
          detailChart.destroy();
          detailChart = null;
        }
        await renderHistory();
      });
    }

    const breadcrumbCurrent = container.querySelector(
      '.history-breadcrumb-current.editable'
    );
    if (breadcrumbCurrent) {
      breadcrumbCurrent.addEventListener('click', async (e) => {
        e.stopPropagation();
        editingSessionId = breadcrumbCurrent.getAttribute('data-id');
        renderDetailView(session);
      });
    }

    const breadcrumbInput = container.querySelector('.detail-breadcrumb-input');
    if (breadcrumbInput) {
      window._obsRename.attachInput(breadcrumbInput, {
        validate: async (value) => {
          const normalized = normalizeRenameValue(value);
          if (!normalized.ok) return normalized;
          const sessions = await window.repository.loadHistory();
          if (hasDuplicateSessionName(sessions, normalized.value, session.id)) {
            return { ok: false, message: 'Session name must be unique.' };
          }
          return normalized;
        },
        save: async (nextName) => {
          if (nextName === title) return;
          const updated = await window.repository.renameHistorySession(
            session.id,
            nextName
          );
          if (!updated) throw new Error('Session name must be unique.');
        },
        rerender: async () => {
          editingSessionId = null;
          await renderHistory();
        },
      });
    }

    const restartButton = container.querySelector('.history-detail-restart');
    if (restartButton) {
      restartButton.addEventListener('click', async () => {
        const restarted = await restartTrackingFromSession(session);
        if (!restarted) {
          window.alert('Unable to restart tracking from this session.');
        }
      });
    }

    const deleteButton = container.querySelector('.history-detail-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', async () => {
        const label = String(session?.listName || 'session');
        const confirmed = window.confirm(`Delete "${label}"?`);
        if (!confirmed) return;

        const deleted = await deleteHistorySessionById(session.id);
        if (!deleted) {
          window.alert('Unable to delete this session right now.');
          return;
        }

        selectedSessionId = null;
        editingSessionId = null;
        syncHistoryRoute(null);
        if (detailChart) {
          detailChart.destroy();
          detailChart = null;
        }
        await renderHistory();
      });
    }

    if (window.feather && typeof window.feather.replace === 'function') {
      try {
        window.feather.replace();
      } catch (err) {
        console.warn('feather.replace failed on history detail', err);
      }
    }

    await renderHistoryChart(histogramItems);
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
      await renderDetailView(selected);
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
      <div class="lists-container">
        <div class="track-empty">
          Unable to load history right now: ${escapeHtml(err?.message || err)}
        </div>
      </div>
    `;
  });
})();
