/**
 * NavBar component — renders the primary navigation.
 *
 * Highlights the active route based on the current hash.
 */

const NAV_ITEMS = [
  { route: '#/home',         label: 'Home',         icon: '🏠' },
  { route: '#/observations', label: 'Observations',  icon: '📋' },
  { route: '#/log',          label: 'Log',           icon: '➕' },
  { route: '#/map',          label: 'Map',           icon: '🗺️' },
  { route: '#/stats',        label: 'Stats',         icon: '📊' },
]

/**
 * Renders the nav bar into the given container element.
 * Re-renders on hashchange to update the active item.
 * @param {HTMLElement} container
 */
export function renderNavBar(container) {
  function render() {
    const current = window.location.hash || '#/home'
    container.innerHTML = `
      <nav class="nav-bar" role="navigation" aria-label="Main navigation">
        <ul class="nav-bar__list">
          ${NAV_ITEMS.map(item => `
            <li class="nav-bar__item${item.route === current ? ' nav-bar__item--active' : ''}">
              <a href="${item.route}"
                 class="nav-bar__link${item.route === '#/log' ? ' nav-bar__link--log' : ''}"
                 aria-label="${item.label}"
                 ${item.route === current ? 'aria-current="page"' : ''}>
                <span class="nav-bar__icon" aria-hidden="true">${item.icon}</span>
                <span class="nav-bar__label">${item.label}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </nav>
    `
  }

  render()
  window.addEventListener('hashchange', render)
}
