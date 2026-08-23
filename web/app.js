// Small single-file app shell: state router and bottom navigation
console.log('Loglist starting');
const app = document.getElementById('app');

const nameHelpers = {
  normalizeNameKey(value) {
    return String(value || '')
      .trim()
      .toLocaleLowerCase();
  },
  normalizeRenameValue(rawValue) {
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
  },
};
window._obsNameHelpers = nameHelpers;

function attachRenameInput(input, options = {}) {
  if (!input) return;

  let done = false;
  let skipNextBlurSave = false;

  const focusAndSelect = () => {
    try {
      input.focus();
      input.select();
    } catch (err) {
      console.warn('Failed to focus rename input', err);
    }
  };

  const finalize = async (shouldSave) => {
    if (done) return;

    if (shouldSave && typeof options.validate === 'function') {
      const result = await options.validate(input.value);
      if (!result || !result.ok) {
        skipNextBlurSave = true;
        window.alert(result?.message || 'Name cannot be empty.');
        setTimeout(focusAndSelect, 0);
        return;
      }

      if (typeof options.save === 'function') {
        await options.save(result.value);
      }
    }

    done = true;
    if (!shouldSave && typeof options.onCancel === 'function') {
      options.onCancel();
    }
    if (typeof options.rerender === 'function') {
      await options.rerender();
    }
  };

  input.addEventListener('click', (event) => event.stopPropagation());
  input.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await finalize(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
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

  focusAndSelect();
  setTimeout(focusAndSelect, 0);
}

window._obsRename = {
  attachInput: attachRenameInput,
};

let breadcrumbFitRaf = null;

function fitDetailBreadcrumb(el) {
  if (!el || !(el instanceof HTMLElement)) return;
  if (el.querySelector('input, textarea, select')) {
    el.style.removeProperty('font-size');
    return;
  }

  const computed = getComputedStyle(el);
  const baseFontSize = Number.parseFloat(
    el.dataset.baseBreadcrumbFontSize || computed.fontSize || '0'
  );
  const minFontSize = 12;
  if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) return;

  if (!el.dataset.baseBreadcrumbFontSize) {
    el.dataset.baseBreadcrumbFontSize = String(baseFontSize);
  }

  el.style.fontSize = `${baseFontSize}px`;

  if (el.clientWidth <= 0) return;
  if (el.scrollWidth <= el.clientWidth + 0.5) return;

  let size = baseFontSize;
  while (size > minFontSize && el.scrollWidth > el.clientWidth + 0.5) {
    size = Math.max(minFontSize, size - 0.5);
    el.style.fontSize = `${size}px`;
    if (size === minFontSize) break;
  }
}

function fitAllDetailBreadcrumbs(root = document) {
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll('.detail-breadcrumb').forEach((el) => {
    fitDetailBreadcrumb(el);
  });
}

function scheduleDetailBreadcrumbFit(root = document) {
  if (breadcrumbFitRaf) cancelAnimationFrame(breadcrumbFitRaf);
  breadcrumbFitRaf = requestAnimationFrame(() => {
    breadcrumbFitRaf = null;
    fitAllDetailBreadcrumbs(root);
  });
}

function initDetailBreadcrumbAutoFit() {
  if (!app) return;

  const observer = new MutationObserver(() => {
    scheduleDetailBreadcrumbFit(app);
  });

  observer.observe(app, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  window.addEventListener('resize', () => {
    scheduleDetailBreadcrumbFit(app);
  });

  scheduleDetailBreadcrumbFit(app);
}

// Load repository implementation (exposes window.repository)
function loadRepository() {
  return new Promise((resolve, reject) => {
    if (window.repository) return resolve();
    const s = document.createElement('script');
    s.src = 'repository/index.js';
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

// Theme initialization: allow forcing theme via ?theme=dark|light or persist in localStorage
(function initTheme() {
  try {
    const params = new URLSearchParams(location.search);
    const themeParam = params.get('theme');
    const saved = localStorage.getItem('theme');
    const followsSystem = location.protocol === 'loglist:';
    const applySystemTheme = () => {
      const prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute(
        'data-theme',
        prefersDark ? 'dark' : 'light'
      );
    };

    if (themeParam === 'dark' || themeParam === 'light') {
      // explicit override via URL -> persist
      document.documentElement.setAttribute('data-theme', themeParam);
      localStorage.setItem('theme', themeParam);
    } else if (!followsSystem && (saved === 'dark' || saved === 'light')) {
      // previously saved preference
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      applySystemTheme();
      // Do not persist this value; it is just an initial, system-matching default.
    }

    if (followsSystem && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => applySystemTheme();
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handleSystemThemeChange);
      }
    }
  } catch (e) {
    console.warn('Theme init failed', e);
  }
})();

const screens = {
  lists: 'screens/lists.html',
  track: 'screens/track.html',
  history: 'screens/history.html',
};

function normalizeScreenName(name) {
  const normalized = String(name || '')
    .trim()
    .toLowerCase();
  if (screens[normalized]) return normalized;
  return null;
}

function getRouteParams() {
  const params = new URLSearchParams(location.search);
  return {
    page: normalizeScreenName(params.get('page')),
    view: String(params.get('view') || '')
      .trim()
      .toLowerCase(),
    mode: String(params.get('mode') || '')
      .trim()
      .toLowerCase(),
    listId: String(params.get('listId') || params.get('list') || '').trim(),
    theme: String(params.get('theme') || '')
      .trim()
      .toLowerCase(),
  };
}

function syncUrlForScreen(screenName, routeParams = {}) {
  try {
    const params = new URLSearchParams(location.search);
    params.set('page', screenName);
    params.delete('view');
    params.delete('mode');
    params.delete('listId');
    params.delete('list');
    Object.entries(routeParams || {}).forEach(([k, v]) => {
      const key = String(k || '').trim();
      if (!key) return;
      const value = String(v ?? '').trim();
      if (!value) return;
      params.set(key, value);
    });
    const next = `${location.pathname}?${params.toString()}`;
    history.replaceState(null, '', next);
  } catch (e) {
    console.warn('URL sync failed', e);
  }
}

let state = {
  current: getRouteParams().page || 'lists',
};

function getActiveTrackingState() {
  const action = sessionStorage.getItem('ot_list_action');
  const activeId = sessionStorage.getItem('ot_active_list_id');
  const activeName = sessionStorage.getItem('ot_active_list_name');
  const isActive = action === 'start-track' && !!(activeId || activeName);
  return {
    isActive,
    activeId,
    activeName,
  };
}

function setScreen(name, options = {}) {
  let target = normalizeScreenName(name);
  if (!target) return;

  const trackingState = getActiveTrackingState();
  const lockNavigation = trackingState.isActive && target !== 'track';
  if (lockNavigation) {
    return;
  }

  state.current = target;
  if (!options.skipUrlSync && !lockNavigation) {
    const requestedRouteParams = options.routeParams || undefined;
    const trackRouteParams =
      target === 'track' &&
      trackingState.isActive &&
      !requestedRouteParams?.listId &&
      trackingState.activeId
        ? { listId: trackingState.activeId }
        : requestedRouteParams;
    syncUrlForScreen(target, trackRouteParams);
  }
  loadScreen(screens[target]);
  updateNav();
}

// Load feather icons dynamically (lightweight CDN) and replace placeholders
function loadFeather() {
  return new Promise((resolve, reject) => {
    if (window.feather) return resolve(window.feather);
    const s = document.createElement('script');
    s.src = 'vendor/feather.min.js';
    s.onload = () => resolve(window.feather);
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}
function ensureIcons() {
  return loadFeather()
    .then((feather) => {
      try {
        feather.replace();
      } catch (e) {
        console.warn('feather.replace failed', e);
      }
    })
    .catch((err) => console.warn('Failed to load icons', err));
}

function renderBottomNav() {
  return `\n<nav class="bottom-nav">\n  <button data-screen="lists" class="nav-button"><i data-feather="list"></i><span class="nav-label">Lists</span></button>\n  <button data-screen="track" class="nav-button"><i data-feather="target"></i><span class="nav-label">Track</span></button>\n  <button data-screen="history" class="nav-button"><i data-feather="clock"></i><span class="nav-label">History</span></button>\n  <button class="nav-button nav-save-button" data-action="save-session" aria-label="Stop and save session"><i data-feather="save"></i><span class="nav-label">Save Session</span></button>\n</nav>`;
}

// helper to ensure nav is appended as a sibling of #app (so fixed behaves correctly)
function ensureBottomNav() {
  // remove any existing nav
  const existing = document.querySelector('.bottom-nav');
  if (existing) existing.remove();
  // append new nav to body so position:fixed anchors to viewport
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderBottomNav();
  document.body.appendChild(wrapper.firstElementChild);
}

async function loadScreen(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load ' + url);
    let html = await res.text();

    // insert screen markup inside #app only
    app.innerHTML = html;
    // ensure bottom nav exists outside of #app
    ensureBottomNav();
    attachNavHandlers();
    // ensure icons rendered
    ensureIcons();
    scheduleDetailBreadcrumbFit(app);
    // Also load corresponding screen JS if it exists
    const jsPath = url.replace(/\.html$/, '') + '.js';
    const scr = document.createElement('script');
    scr.src = jsPath;
    scr.async = true;
    document.body.appendChild(scr);
  } catch (err) {
    app.innerHTML = '<div class="screen error">Error loading screen</div>';
    ensureBottomNav();
    attachNavHandlers();
    console.error(err);
  }
}

function attachNavHandlers() {
  const buttons = document.querySelectorAll(
    '.bottom-nav .nav-button[data-screen]'
  );
  buttons.forEach((b) => {
    b.addEventListener('click', () => setScreen(b.getAttribute('data-screen')));
  });

  const saveButton = document.querySelector('.bottom-nav .nav-save-button');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const trackingState = getActiveTrackingState();
      if (!trackingState.isActive) return;
      window.dispatchEvent(new CustomEvent('ot-active-session-save-request'));
    });
  }

  updateNav();
}

function updateNav() {
  const trackingState = getActiveTrackingState();
  const trackingNavActive = trackingState.isActive && state.current === 'track';
  const nav = document.querySelector('.bottom-nav');
  if (nav) nav.classList.toggle('tracking-active', trackingNavActive);

  const buttons = document.querySelectorAll(
    '.bottom-nav .nav-button[data-screen]'
  );
  buttons.forEach((b) => {
    if (b.getAttribute('data-screen') === state.current)
      b.classList.add('active');
    else b.classList.remove('active');
  });

  const saveButton = document.querySelector('.bottom-nav .nav-save-button');
  if (saveButton) {
    if (trackingNavActive) saveButton.classList.add('active');
    else saveButton.classList.remove('active');
  }
}

// initialize after repository is ready
initDetailBreadcrumbAutoFit();

loadRepository()
  .then(() => {
    setScreen(state.current, { skipUrlSync: true, silentLock: true });
  })
  .catch((err) => {
    console.error('Failed to load repository', err);
    // still try to load UI
    setScreen(state.current, { skipUrlSync: true, silentLock: true });
  });

// expose for debugging
window._obs = {
  setScreen,
  state,
  getRouteParams,
  fitDetailBreadcrumbs: () => scheduleDetailBreadcrumbFit(app),
};

window.addEventListener('ot-tracking-state-changed', () => {
  updateNav();
});
