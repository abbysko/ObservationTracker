/**
 * FilterBar component — category + search filter controls.
 */

import { getCategories } from '../models/Category.js'
import { escapeHtml } from '../utils/format.js'

/**
 * Returns the HTML string for the filter bar.
 * @param {{ category?: string, query?: string }} currentFilters
 * @returns {string}
 */
export function filterBar(currentFilters = {}) {
  const categories = getCategories()
  const chips = [{ id: '', label: 'All', icon: '🔍' }, ...categories]

  return `
    <div class="filter-bar" role="search">
      <div class="filter-bar__chips" role="group" aria-label="Filter by category">
        ${chips.map(c => `
          <button
            class="chip${currentFilters.category === c.id || (!currentFilters.category && c.id === '') ? ' chip--active' : ''}"
            data-category="${escapeHtml(c.id)}"
            aria-pressed="${currentFilters.category === c.id || (!currentFilters.category && c.id === '') ? 'true' : 'false'}">
            <span aria-hidden="true">${c.icon}</span>
            ${escapeHtml(c.label)}
          </button>
        `).join('')}
      </div>
      <label class="sr-only" for="filter-search">Search observations</label>
      <input
        id="filter-search"
        class="filter-bar__search input"
        type="search"
        placeholder="Search species, notes, location…"
        value="${escapeHtml(currentFilters.query ?? '')}"
        aria-label="Search observations"
      >
    </div>
  `
}
