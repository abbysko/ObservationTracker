// Small single-file app shell: state router and bottom navigation
console.log('ObservationTracker starting');
const app = document.getElementById('app');

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

let state = {
  current: 'lists',
};

function setScreen(name) {
  if (!screens[name]) return;
  state.current = name;
  loadScreen(screens[name]);
  updateNav();
}

async function loadScreen(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load ' + url);
    const html = await res.text();
    app.innerHTML = html + '\n' + renderBottomNav();
    attachNavHandlers();
    // Also load corresponding screen JS if it exists
    const jsPath = url.replace(/\.html$/, '') + '.js';
    const scr = document.createElement('script');
    scr.src = jsPath;
    scr.async = true;
    document.body.appendChild(scr);
  } catch (err) {
    app.innerHTML =
      '<div class="screen error">Error loading screen</div>' +
      renderBottomNav();
    attachNavHandlers();
    console.error(err);
  }
}

function renderBottomNav() {
  return `\n<nav class="bottom-nav">\n  <button data-screen="lists" class="nav-button">Lists</button>\n  <button data-screen="track" class="nav-button">Track</button>\n  <button data-screen="history" class="nav-button">History</button>\n</nav>`;
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
loadRepository()
  .then(() => {
    setScreen(state.current);
  })
  .catch((err) => {
    console.error('Failed to load repository', err);
    // still try to load UI
    setScreen(state.current);
  });

// expose for debugging
window._obs = { setScreen, state };
