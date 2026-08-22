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
    if (themeParam === 'dark' || themeParam === 'light') {
      // explicit override via URL -> persist
      document.documentElement.setAttribute('data-theme', themeParam);
      localStorage.setItem('theme', themeParam);
    } else if (saved === 'dark' || saved === 'light') {
      // previously saved preference
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // No explicit user preference: mirror system preference on first load
      const prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', systemTheme);
      // Do not persist this value; it is just an initial, system-matching default.
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
    window.dispatchEvent(
      new CustomEvent('ot-active-session-exit-request', {
        detail: {
          targetScreen: target,
        },
      })
    );
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
  return `\n<nav class="bottom-nav">\n  <button data-screen="lists" class="nav-button"><i data-feather="list"></i><span class="nav-label">Lists</span></button>\n  <button data-screen="track" class="nav-button"><i data-feather="target"></i><span class="nav-label">Track</span></button>\n  <button data-screen="history" class="nav-button"><i data-feather="clock"></i><span class="nav-label">History</span></button>\n</nav>`;
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
  const buttons = document.querySelectorAll('.bottom-nav .nav-button');
  buttons.forEach((b) => {
    b.addEventListener('click', () => setScreen(b.getAttribute('data-screen')));
  });
  updateNav();
}

function updateNav() {
  const buttons = document.querySelectorAll('.bottom-nav .nav-button');
  buttons.forEach((b) => {
    if (b.getAttribute('data-screen') === state.current)
      b.classList.add('active');
    else b.classList.remove('active');
  });
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
