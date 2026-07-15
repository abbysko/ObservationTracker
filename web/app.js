// Small single-file app shell: state router and bottom navigation
console.log('ObservationTracker starting');
const app = document.getElementById('app');

// Theme initialization: allow forcing theme via ?theme=dark|light or persist in localStorage
(function initTheme() {
  try {
    const params = new URLSearchParams(location.search);
    const themeParam = params.get('theme');
    const saved = localStorage.getItem('theme');
    if (themeParam === 'dark' || themeParam === 'light') {
      document.documentElement.setAttribute('data-theme', themeParam);
      localStorage.setItem('theme', themeParam);
    } else if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // no explicit theme: let CSS prefers-color-scheme decide (no attribute)
      document.documentElement.removeAttribute('data-theme');
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

// initial load
setScreen(state.current);

// expose for debugging
window._obs = { setScreen, state };
