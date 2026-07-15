/**
 * app.js — bootstrap and hash router for ObservationTracker.
 */

import { renderNavBar } from './components/NavBar.js'
import { loadCategories } from './models/Category.js'

// Screen imports
import renderHome from './screens/HomeScreen.js'
import renderLog from './screens/LogObservationScreen.js'
import renderObservations from './screens/MyObservationsScreen.js'
import renderMap from './screens/MapScreen.js'
import renderStats from './screens/StatsScreen.js'

/** @type {Record<string, (container: HTMLElement) => void>} */
const ROUTES = {
  '/home': renderHome,
  '/log': renderLog,
  '/observations': renderObservations,
  '/map': renderMap,
  '/stats': renderStats,
}

/**
 * Returns the route key from the current hash (ignores query params).
 * @returns {string}
 */
function getCurrentRoute() {
  const hash = window.location.hash || '#/home'
  // Strip query params: '#/log?id=...' → '/log'
  return hash.replace('#', '').replace(/\?.*$/, '') || '/home'
}

/**
 * Navigates to the screen matching the current hash.
 */
async function navigate() {
  const route = getCurrentRoute()
  const renderFn = ROUTES[route] ?? ROUTES['/home']

  const main = document.getElementById('main-content')
  main.innerHTML = '<div class="loading" aria-live="polite">Loading…</div>'

  try {
    await renderFn(main)
  } catch (err) {
    console.error('Screen render error:', err)
    main.innerHTML = `<div class="error-screen">
      <p>Something went wrong loading this screen.</p>
      <a href="#/home" class="btn btn-primary">Go home</a>
    </div>`
  }
}

/**
 * Initializes the app.
 */
async function init() {
  // Pre-load categories so all screens have them synchronously
  await loadCategories()

  // Render persistent nav bar
  const navEl = document.getElementById('nav')
  renderNavBar(navEl)

  // Initial route
  await navigate()

  // Listen for hash changes
  window.addEventListener('hashchange', navigate)
}

// Boot
init().catch(err => {
  console.error('App init failed:', err)
  document.getElementById('main-content').innerHTML =
    '<p style="padding:2rem;color:red">Failed to initialize. Please refresh the page.</p>'
})
