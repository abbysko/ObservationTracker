// UI glue for history screen
(function () {
  const container = document.querySelector('.screen-history');
  if (!container) return;
  let selectedSessionId = null;
  let listSelectedSessionId = null;
  let editingSessionId = null;
  let routeStateApplied = false;
  let detailChart = null;

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
        const drawerMarkup = isSelected
          ? `
            <div class="list-drawer history-session-drawer" data-id="${escapeAttr(
              session.id || ''
            )}">
              <button class="drawer-action primary history-session-action" type="button" data-action="view" data-id="${escapeAttr(
                session.id || ''
              )}" aria-label="View session details">
                <span>View Session Details</span><i data-feather="arrow-right-circle"></i>
              </button>
              <button class="drawer-action history-session-action" type="button" data-action="delete" data-id="${escapeAttr(
                session.id || ''
              )}" aria-label="Delete session">
                <span>Delete Session</span><i data-feather="trash"></i>
              </button>
            </div>
          `
          : '';
        return `
          <div class="list-item ${isSelected ? 'expanded' : ''}">
            <div class="list-row history-session-row ${
              isSelected ? 'selected' : ''
            }" data-id="${escapeAttr(
              session.id || ''
            )}" aria-label="Open ${escapeAttr(title)} saved ${escapeAttr(
          stamp
        )}">
              ${titleMarkup}
              <div class="list-meta">
                <span class="item-count-text">${escapeHtml(stamp)}</span>
              </div>
            </div>
            ${drawerMarkup}
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
        if (editingSessionId === id) return;

        if (listSelectedSessionId === id) {
          selectedSessionId = id;
          editingSessionId = null;
          listSelectedSessionId = null;
          syncHistoryRoute(id);
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

    container.querySelectorAll('.history-session-title.editable').forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-id');
        if (!id) return;
        listSelectedSessionId = id;
        editingSessionId = id;
        await renderHistory();
      });
    });

    container
      .querySelectorAll('.history-session-title-input')
      .forEach((input) => {
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
                  console.warn('Failed to refocus session title input', err);
                }
              }, 0);
              return;
            }

            const nextName = normalized.value;
            if (nextName) {
              const sessionsFromRepo =
                window.repository &&
                typeof window.repository.loadHistory === 'function'
                  ? await window.repository.loadHistory()
                  : [];

              if (hasDuplicateSessionName(sessionsFromRepo, nextName, id)) {
                skipNextBlurSave = true;
                window.alert('Session name must be unique.');
                setTimeout(() => {
                  try {
                    input.focus();
                    input.select();
                  } catch (err) {
                    console.warn('Failed to refocus session title input', err);
                  }
                }, 0);
                return;
              }

              if (
                window.repository &&
                typeof window.repository.renameHistorySession === 'function'
              ) {
                const updated = await window.repository.renameHistorySession(
                  id,
                  nextName
                );
                if (!updated) {
                  skipNextBlurSave = true;
                  window.alert('Session name must be unique.');
                  setTimeout(() => {
                    try {
                      input.focus();
                      input.select();
                    } catch (err) {
                      console.warn(
                        'Failed to refocus session title input',
                        err
                      );
                    }
                  }, 0);
                  return;
                }
              }
            }
          }

          done = true;
          editingSessionId = null;
          listSelectedSessionId = id || null;
          await renderHistory();
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
            console.warn('Failed to focus session title input', err);
          }
        }, 0);
      });

    container.querySelectorAll('.history-session-action').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (!id) return;

        if (action === 'view') {
          selectedSessionId = id;
          editingSessionId = null;
          listSelectedSessionId = null;
          syncHistoryRoute(id);
          await renderHistory();
          return;
        }

        if (action !== 'delete') return;

        const target = sessions.find((x) => String(x.id || '') === String(id));
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

  async function renderDetailView(session) {
    const title = String(session?.listName || 'Session');
    const stamp = formatSessionDate(session?.savedAt || session?.endedAt);
    const observedItems = normalizeObservedItems(session);
    const histogramItems = buildHistogramItems(observedItems);
    const totalItems = observedItems.length;
    const observedCount = observedItems.filter((item) => item.count > 0).length;
    const notObservedCount = Math.max(0, totalItems - observedCount);
    const observedPercent =
      totalItems > 0 ? (observedCount / totalItems) * 100 : 0;
    const observedPercentLabel = `${Math.round(observedPercent)}%`;

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
      </div>
      <div class="item-count-text">Session ended ${escapeHtml(stamp)}</div>
      <div class="track-progress" aria-label="Observation progress summary">
        <div class="track-progress-meta">
          <span class="item-count-text track-summary-line">
            Observed: <span class="track-observed-count">${observedCount}</span>
            <span class="track-observed-percent">(${observedPercentLabel})</span>
          </span>
          <span class="item-count-text track-summary-line">
            Not observed: <span class="track-not-yet-count">${notObservedCount}</span>
          </span>
        </div>
        <div class="track-progress-bar" role="img" aria-label="Observed ${observedCount} of ${totalItems} items">
          <div class="track-progress-fill" style="width: ${observedPercent}%"></div>
        </div>
      </div>
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
        await renderHistory();
      });
    }

    const breadcrumbInput = container.querySelector('.detail-breadcrumb-input');
    if (breadcrumbInput) {
      let done = false;
      let skipNextBlurSave = false;

      const finalizeSessionRename = async (shouldSave) => {
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
                console.warn('Failed to refocus history breadcrumb input', err);
              }
            }, 0);
            return;
          }

          const nextName = normalized.value;
          if (nextName && nextName !== title) {
            if (
              window.repository &&
              typeof window.repository.renameHistorySession === 'function' &&
              typeof window.repository.loadHistory === 'function'
            ) {
              const sessions = await window.repository.loadHistory();
              if (hasDuplicateSessionName(sessions, nextName, session.id)) {
                skipNextBlurSave = true;
                window.alert('Session name must be unique.');
                setTimeout(() => {
                  try {
                    breadcrumbInput.focus();
                    breadcrumbInput.select();
                  } catch (err) {
                    console.warn(
                      'Failed to refocus history breadcrumb input',
                      err
                    );
                  }
                }, 0);
                return;
              }

              const updated = await window.repository.renameHistorySession(
                session.id,
                nextName
              );
              if (!updated) {
                skipNextBlurSave = true;
                window.alert('Session name must be unique.');
                setTimeout(() => {
                  try {
                    breadcrumbInput.focus();
                    breadcrumbInput.select();
                  } catch (err) {
                    console.warn(
                      'Failed to refocus history breadcrumb input',
                      err
                    );
                  }
                }, 0);
                return;
              }
            }
          }
        }

        done = true;

        editingSessionId = null;
        await renderHistory();
      };

      breadcrumbInput.addEventListener('click', (e) => e.stopPropagation());
      breadcrumbInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await finalizeSessionRename(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          await finalizeSessionRename(false);
        }
      });
      breadcrumbInput.addEventListener('blur', async () => {
        if (skipNextBlurSave) {
          skipNextBlurSave = false;
          return;
        }
        await finalizeSessionRename(true);
      });

      setTimeout(() => {
        try {
          breadcrumbInput.focus();
          breadcrumbInput.select();
        } catch (err) {
          console.warn('Failed to focus history breadcrumb input', err);
        }
      }, 0);
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
      <div class="lists-container"><div class="track-empty">Unable to load history right now.</div></div>
    `;
  });
})();
