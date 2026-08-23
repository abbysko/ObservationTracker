// UI glue for track screen
(function () {
  const nameHelpers = window._obsNameHelpers || {};
  const container = document.querySelector('.screen-track');
  if (!container) return;
  const TRACK_COUNT_PREFIX = 'ot_track_counts_v1_';
  const ACTIVE_SESSION_NAME_KEY = 'ot_active_session_name';
  let chooserSelectedListId = null;
  let chooserMenuOpen = false;
  let routeStateApplied = false;
  let handleSaveRequest = null;
  let editingActiveSessionName = false;

  function emitTrackingStateChanged() {
    window.dispatchEvent(new CustomEvent('ot-tracking-state-changed'));
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

  function renderIcons() {
    if (window.feather && typeof window.feather.replace === 'function') {
      try {
        window.feather.replace();
      } catch (err) {
        console.warn('feather.replace failed on track screen', err);
      }
    }
  }

  function getCountStorageKey(listId) {
    return `${TRACK_COUNT_PREFIX}${String(listId || '')}`;
  }

  function readTrackCounts(listId) {
    if (!listId) return {};
    try {
      const raw = sessionStorage.getItem(getCountStorageKey(listId));
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      console.warn('Failed to parse track counts', err);
      return {};
    }
  }

  function writeTrackCounts(listId, counts) {
    if (!listId) return;
    try {
      sessionStorage.setItem(
        getCountStorageKey(listId),
        JSON.stringify(counts)
      );
    } catch (err) {
      console.warn('Failed to save track counts', err);
    }
  }

  function clearTrackCounts(listId) {
    if (!listId) return;
    sessionStorage.removeItem(getCountStorageKey(listId));
  }

  function normalizeTrackItems(list) {
    const source = Array.isArray(list?.items) ? list.items : [];
    return source
      .map((item, index) => {
        const isObject =
          item && typeof item === 'object' && !Array.isArray(item);
        const label = isObject
          ? String(item.name || '').trim()
          : String(item || '').trim();
        if (!label) return null;
        const id = isObject && item.id ? String(item.id).trim() : '';
        return {
          key: id || `idx-${index}-${label.toLowerCase()}`,
          label,
        };
      })
      .filter(Boolean);
  }

  function getSuggestedCopyName(lists, baseName) {
    let n = 1;
    let candidate = `${baseName} ${n}`;
    while (lists.some((x) => x.name === candidate)) {
      n += 1;
      candidate = `${baseName} ${n}`;
    }
    return candidate;
  }

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

  function setActiveSessionName(name) {
    const nextName = String(name || '').trim();
    sessionStorage.setItem(ACTIVE_SESSION_NAME_KEY, nextName);
  }

  function getActiveSessionName(fallbackName) {
    const stored = String(
      sessionStorage.getItem(ACTIVE_SESSION_NAME_KEY) || ''
    ).trim();
    if (stored) return stored;

    const fallback = String(fallbackName || '').trim();
    if (fallback) {
      setActiveSessionName(fallback);
    }
    return fallback;
  }

  function setActiveTrackingList(list, options = {}) {
    const listId = String(list?.id || '');
    const previousListId = String(
      sessionStorage.getItem('ot_active_list_id') || ''
    );
    const previousSessionName = String(
      sessionStorage.getItem(ACTIVE_SESSION_NAME_KEY) || ''
    ).trim();

    sessionStorage.setItem('ot_active_list_id', list.id);
    sessionStorage.setItem('ot_active_list_name', list.name);
    sessionStorage.setItem('ot_list_action', 'start-track');

    const restartSessionName = String(
      sessionStorage.getItem('ot_restart_history_session_name') || ''
    ).trim();
    const restartListId = String(
      sessionStorage.getItem('ot_restart_history_list_id') || ''
    ).trim();

    const nextSessionName = String(
      options.sessionName ??
        (restartSessionName && restartListId === listId
          ? restartSessionName
          : list?.name) ??
        ''
    ).trim();
    const shouldSetSessionName =
      !!options.resetCounts ||
      !previousSessionName ||
      previousListId !== listId;
    if (shouldSetSessionName) {
      setActiveSessionName(nextSessionName);
    }

    if (options.resetCounts) clearTrackCounts(list.id);
    emitTrackingStateChanged();
  }

  function clearActiveTrackingList() {
    sessionStorage.removeItem('ot_active_list_id');
    sessionStorage.removeItem('ot_active_list_name');
    sessionStorage.removeItem('ot_list_action');
    sessionStorage.removeItem(ACTIVE_SESSION_NAME_KEY);
    sessionStorage.removeItem('ot_restart_history_session_id');
    sessionStorage.removeItem('ot_restart_history_session_name');
    sessionStorage.removeItem('ot_restart_history_list_id');
    editingActiveSessionName = false;
    chooserMenuOpen = false;
    emitTrackingStateChanged();
  }

  function buildSessionEntry(list, normalized, counts) {
    const restartSessionId = String(
      sessionStorage.getItem('ot_restart_history_session_id') || ''
    ).trim();
    const restartSessionName = String(
      sessionStorage.getItem('ot_restart_history_session_name') || ''
    ).trim();
    const restartListId = String(
      sessionStorage.getItem('ot_restart_history_list_id') || ''
    ).trim();
    const activeSessionName = String(
      sessionStorage.getItem(ACTIVE_SESSION_NAME_KEY) || ''
    ).trim();
    const isRestartSave =
      !!restartSessionId && restartListId === String(list.id);

    const items = normalized.map((item) => ({
      id: item.key,
      name: item.label,
      count: Number(counts[item.key] || 0),
    }));
    const observedItems = items.filter((item) => item.count > 0);
    const defaultSessionName =
      isRestartSave && restartSessionName ? restartSessionName : list.name;
    const effectiveSessionName = activeSessionName || defaultSessionName;
    const isAutoGeneratedName =
      normalizeNameKey(effectiveSessionName) ===
      normalizeNameKey(defaultSessionName);
    return {
      id: isRestartSave ? restartSessionId : 'session-' + Date.now(),
      listId: list.id,
      listName: effectiveSessionName,
      autoGeneratedName: isRestartSave ? false : isAutoGeneratedName,
      endedAt: Date.now(),
      itemCount: items.length,
      observedItemCount: observedItems.length,
      totalObservations: observedItems.reduce(
        (sum, item) => sum + item.count,
        0
      ),
      items,
    };
  }

  async function completeActiveSession(list, normalized, counts, shouldSave) {
    let savedSession = null;
    if (
      shouldSave &&
      typeof window.repository.saveHistorySession === 'function'
    ) {
      const sessionEntry = buildSessionEntry(list, normalized, counts);
      savedSession = await window.repository.saveHistorySession(sessionEntry);
    }
    clearTrackCounts(list.id);
    clearActiveTrackingList();
    return savedSession;
  }

  async function saveActiveSessionAndShowHistoryDetail(
    list,
    normalized,
    counts
  ) {
    const savedSession = await completeActiveSession(
      list,
      normalized,
      counts,
      true
    );

    if (window._obs && typeof window._obs.setScreen === 'function') {
      window._obs.setScreen('history', {
        routeParams: {
          listId: savedSession?.id || '',
        },
      });
      return;
    }

    syncTrackRoute(null);
    await renderTrackState();
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

    // If route has no listId, keep current session state (if any).
  }

  async function dismissChooserMenu() {
    if (!chooserMenuOpen) return;
    chooserMenuOpen = false;
    await renderTrackState();
  }

  function renderActiveState(list) {
    const restartSessionName = String(
      sessionStorage.getItem('ot_restart_history_session_name') || ''
    ).trim();
    const restartListId = String(
      sessionStorage.getItem('ot_restart_history_list_id') || ''
    ).trim();
    const fallbackSessionName =
      restartSessionName && restartListId === String(list?.id || '')
        ? restartSessionName
        : list?.name || '';
    const activeSessionName = getActiveSessionName(fallbackSessionName);

    const normalized = normalizeTrackItems(list);
    const counts = readTrackCounts(list?.id);
    const totalItems = normalized.length;
    const undoStack = [];
    let observedCount = normalized.reduce(
      (sum, item) => sum + (Number(counts[item.key] || 0) > 0 ? 1 : 0),
      0
    );
    let notYetObservedCount = Math.max(0, totalItems - observedCount);
    handleSaveRequest = async () => {
      await saveActiveSessionAndShowHistoryDetail(list, normalized, counts);
    };
    const observedPercent =
      totalItems > 0 ? (observedCount / totalItems) * 100 : 0;
    const observedPercentLabel = `${Math.round(observedPercent)}%`;

    const gridMarkup = normalized
      .map((item) => {
        const count = Number(counts[item.key] || 0);
        const countMarkup =
          count > 0 ? `<span class="track-grid-count">${count}</span>` : '';
        return `
          <button
            class="track-grid-button"
            type="button"
            data-item-key="${escapeAttr(item.key)}"
            data-count="${count}"
            aria-label="Increment ${escapeAttr(item.label)} count"
          >
            <span class="track-grid-label">${escapeHtml(item.label)}</span>
            ${countMarkup}
          </button>
        `;
      })
      .join('');

    const breadcrumbSessionNameMarkup = editingActiveSessionName
      ? `<input class="detail-breadcrumb-input track-session-name-input" type="text" value="${escapeAttr(
          activeSessionName
        )}" aria-label="Edit session name" maxlength="80" />`
      : `<span class="breadcrumb-current editable track-session-name-current">${escapeHtml(
          activeSessionName
        )}</span>`;

    container.innerHTML = `
      <div class="screen-header">
        <h1 class="detail-breadcrumb">
          <span class="breadcrumb-current track-breadcrumb-root">Track</span>
          <span class="breadcrumb-sep">&gt;</span>
          ${breadcrumbSessionNameMarkup}
        </h1>
        <div class="header-controls">
          <button class="sort-toggle track-add-item-button" type="button" aria-label="Add item to this list">
            <i data-feather="plus"></i>
          </button>
          <button class="sort-toggle track-undo-button" type="button" aria-label="Undo last observation" disabled>
            <i data-feather="rotate-ccw"></i>
          </button>
          <button class="add-button track-end-session-button" type="button" aria-label="End active tracking session">
            <i data-feather="save"></i>
          </button>
        </div>
      </div>
      <div class="track-progress" aria-label="Observation progress">
        <div class="track-progress-meta">
          <span class="item-count-text track-summary-line">
            Observed: <span class="track-observed-count">${observedCount}</span>
            <span class="track-observed-percent">(${observedPercentLabel})</span>
          </span>
          <span class="item-count-text track-summary-line">
            Not observed: <span class="track-not-yet-count">${notYetObservedCount}</span>
          </span>
        </div>
        <div class="track-progress-bar" role="img" aria-label="Observed ${observedCount} of ${totalItems} items">
          <div class="track-progress-fill" style="width: ${observedPercent}%"></div>
        </div>
      </div>
      <div class="lists-container track-active-body" aria-label="Active tracking session">
        ${
          normalized.length
            ? `<div class="track-grid">${gridMarkup}</div>`
            : '<div class="track-empty">This list has no items to track.</div>'
        }
      </div>
    `;

    const sessionNameCurrent = container.querySelector(
      '.track-session-name-current'
    );
    if (sessionNameCurrent) {
      sessionNameCurrent.addEventListener('click', async (e) => {
        e.stopPropagation();
        editingActiveSessionName = true;
        renderActiveState(list);
        renderIcons();
      });
    }

    const sessionNameInput = container.querySelector(
      '.track-session-name-input'
    );
    if (sessionNameInput) {
      let done = false;
      let skipNextBlurSave = false;

      const finalizeSessionName = async (shouldSave) => {
        if (done) return;

        if (shouldSave) {
          const normalizedName = normalizeRenameValue(sessionNameInput.value);
          if (!normalizedName.ok) {
            skipNextBlurSave = true;
            window.alert(normalizedName.message);
            setTimeout(() => {
              try {
                sessionNameInput.focus();
                sessionNameInput.select();
              } catch (err) {
                console.warn('Failed to refocus track session name input', err);
              }
            }, 0);
            return;
          }

          const nextName = normalizedName.value;
          if (nextName) {
            const restartSessionId = String(
              sessionStorage.getItem('ot_restart_history_session_id') || ''
            ).trim();
            const existingSessions =
              window.repository &&
              typeof window.repository.loadHistory === 'function'
                ? await window.repository.loadHistory()
                : [];

            if (
              hasDuplicateSessionName(
                existingSessions,
                nextName,
                restartSessionId
              )
            ) {
              skipNextBlurSave = true;
              window.alert('Session name must be unique.');
              setTimeout(() => {
                try {
                  sessionNameInput.focus();
                  sessionNameInput.select();
                } catch (err) {
                  console.warn(
                    'Failed to refocus track session name input',
                    err
                  );
                }
              }, 0);
              return;
            }

            setActiveSessionName(nextName);
          }
        }

        done = true;
        editingActiveSessionName = false;
        renderActiveState(list);
        renderIcons();
      };

      sessionNameInput.addEventListener('click', (e) => e.stopPropagation());
      sessionNameInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await finalizeSessionName(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          await finalizeSessionName(false);
        }
      });
      sessionNameInput.addEventListener('blur', async () => {
        if (skipNextBlurSave) {
          skipNextBlurSave = false;
          return;
        }
        await finalizeSessionName(true);
      });

      setTimeout(() => {
        try {
          sessionNameInput.focus();
          sessionNameInput.select();
        } catch (err) {
          console.warn('Failed to focus track session name input', err);
        }
      }, 0);
    }

    const endSessionButton = container.querySelector(
      '.track-end-session-button'
    );
    const undoButton = container.querySelector('.track-undo-button');

    const setUndoEnabled = (enabled) => {
      if (!undoButton) return;
      undoButton.disabled = !enabled;
    };

    const syncObservedSummary = () => {
      if (observedSummary) observedSummary.textContent = String(observedCount);
      if (notYetSummary)
        notYetSummary.textContent = String(notYetObservedCount);
      updateProgress();
    };

    const applyUndoAction = () => {
      const lastUndoAction = undoStack.pop();
      if (!lastUndoAction) return;

      const { itemKey, previousCount, nextCount } = lastUndoAction;
      const button = container.querySelector(
        `.track-grid-button[data-item-key="${CSS.escape(itemKey)}"]`
      );
      counts[itemKey] = previousCount;

      if (button) {
        button.setAttribute('data-count', String(previousCount));
        const countEl = button.querySelector('.track-grid-count');
        if (previousCount > 0) {
          if (countEl) countEl.textContent = String(previousCount);
          else {
            const nextEl = document.createElement('span');
            nextEl.className = 'track-grid-count';
            nextEl.textContent = String(previousCount);
            button.appendChild(nextEl);
          }
        } else if (countEl) {
          countEl.remove();
        }
      }

      if (previousCount === 0 && nextCount === 1) {
        observedCount = Math.max(0, observedCount - 1);
        notYetObservedCount = Math.max(0, totalItems - observedCount);
        syncObservedSummary();
      }

      writeTrackCounts(list?.id, counts);
      setUndoEnabled(undoStack.length > 0);
    };

    if (endSessionButton) {
      endSessionButton.addEventListener('click', async () => {
        await saveActiveSessionAndShowHistoryDetail(list, normalized, counts);
      });
    }

    if (undoButton) {
      undoButton.addEventListener('click', () => {
        applyUndoAction();
      });
    }

    const addItemButton = container.querySelector('.track-add-item-button');
    if (addItemButton) {
      addItemButton.addEventListener('click', async () => {
        const nextItemRaw = window.prompt('New item name', '');
        if (nextItemRaw === null) return;
        const nextItemName = String(nextItemRaw).trim();
        if (!nextItemName) {
          window.alert('Item name cannot be empty.');
          return;
        }

        const refreshedLists = await window.repository.loadLists();
        const current = refreshedLists.find((x) => x.id === list.id) || list;
        const priorCounts = readTrackCounts(current.id);

        let targetList = current;
        if (current.builtIn) {
          const suggestedName = getSuggestedCopyName(
            refreshedLists,
            current.name
          );
          const nextListNameRaw = window.prompt(
            'Built-in list detected. Name for the new editable list',
            suggestedName
          );
          if (nextListNameRaw === null) return;
          const nextListName = String(nextListNameRaw).trim();
          if (!nextListName) {
            window.alert('List name cannot be empty.');
            return;
          }

          targetList = await window.repository.duplicateList(current);
          targetList.name = nextListName;
          targetList.builtIn = false;

          if (Object.keys(priorCounts).length > 0) {
            writeTrackCounts(targetList.id, priorCounts);
          }
        }

        const existingItems = Array.isArray(targetList.items)
          ? targetList.items
          : [];
        targetList.items = existingItems.concat({
          id: 'item-' + Date.now(),
          name: nextItemName,
        });

        await window.repository.saveList(targetList);
        chooserSelectedListId = targetList.id;
        setActiveTrackingList(targetList);
        syncTrackRoute(targetList.id);
        await renderTrackState();
      });
    }

    const observedSummary = container.querySelector('.track-observed-count');
    const observedPercentSummary = container.querySelector(
      '.track-observed-percent'
    );
    const notYetSummary = container.querySelector('.track-not-yet-count');
    const progressFill = container.querySelector('.track-progress-fill');

    const updateProgress = () => {
      const nextObservedPercent =
        totalItems > 0 ? (observedCount / totalItems) * 100 : 0;
      if (progressFill) {
        progressFill.style.width = `${nextObservedPercent}%`;
      }
      if (observedPercentSummary) {
        observedPercentSummary.textContent = `(${Math.round(
          nextObservedPercent
        )}%)`;
      }
    };

    container.querySelectorAll('.track-grid-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const itemKey = btn.getAttribute('data-item-key');
        if (!itemKey) return;

        const previousCount = Number(btn.getAttribute('data-count') || 0);
        const nextCount = Number(btn.getAttribute('data-count') || 0) + 1;
        btn.setAttribute('data-count', String(nextCount));
        counts[itemKey] = nextCount;

        let countEl = btn.querySelector('.track-grid-count');
        if (!countEl) {
          countEl = document.createElement('span');
          countEl.className = 'track-grid-count';
          btn.appendChild(countEl);
        }
        countEl.textContent = String(nextCount);

        if (previousCount === 0 && nextCount === 1) {
          observedCount += 1;
          notYetObservedCount = Math.max(0, totalItems - observedCount);
          syncObservedSummary();
        }

        undoStack.push({
          itemKey,
          previousCount,
          nextCount,
        });
        if (undoStack.length > 10) {
          undoStack.shift();
        }
        setUndoEnabled(undoStack.length > 0);

        writeTrackCounts(list?.id, counts);
      });
    });
  }

  function renderChooserState(lists) {
    handleSaveRequest = null;
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
            <span>Start Session</span><i data-feather="play"></i>
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
        setActiveTrackingList(list, { resetCounts: true });
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
      const activeList =
        match ||
        (activeName
          ? {
              id: activeId || '',
              name: activeName,
              items: [],
            }
          : null);

      if (activeList) {
        chooserMenuOpen = false;
        renderActiveState(activeList);
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

  window.addEventListener('ot-active-session-save-request', async () => {
    if (!handleSaveRequest) return;
    await handleSaveRequest();
  });
})();
