/**
 * MyObservationsScreen — filterable list of all observations.
 */

import { filterObservations, deleteObservation } from '../services/ObservationService.js'
import { observationCard } from '../components/ObservationCard.js'
import { filterBar } from '../components/FilterBar.js'
import { openObservationModal } from '../components/ObservationModal.js'
import { confirmDialog } from '../components/ConfirmDialog.js'
import { showToast } from '../components/Toast.js'
import { loadCategories } from '../models/Category.js'

/** @type {{ category: string, query: string }} */
let currentFilters = { category: '', query: '' }

/**
 * Renders the My Observations screen into container.
 * @param {HTMLElement} container
 */
export default async function render(container) {
  await loadCategories()

  function renderContent() {
    const observations = filterObservations({
      category: currentFilters.category || undefined,
      query: currentFilters.query || undefined,
    })

    const listHtml = observations.length > 0
      ? `<div class="card-list">${observations.map(observationCard).join('')}</div>`
      : `<div class="empty-state">
           <span class="empty-state__icon" aria-hidden="true">🔍</span>
           <p>No observations match your filters.</p>
           ${!currentFilters.category && !currentFilters.query
             ? '<a href="#/log" class="btn btn-primary">Log your first observation</a>'
             : '<button class="btn btn-secondary" id="clear-filters-btn">Clear filters</button>'}
         </div>`

    container.innerHTML = `
      <div class="screen observations-screen">
        <header class="screen__header">
          <h1>My Observations</h1>
          <a href="#/log" class="btn btn-primary btn--sm" aria-label="Log new observation">+ Log</a>
        </header>
        ${filterBar(currentFilters)}
        <div id="observations-list">${listHtml}</div>
      </div>
    `

    bindEvents(container, observations)
  }

  function bindEvents(container, observations) {
    // Category chip clicks
    container.querySelectorAll('.chip[data-category]').forEach(chip => {
      chip.addEventListener('click', () => {
        currentFilters.category = chip.dataset.category
        renderContent()
      })
    })

    // Search input
    const searchInput = container.querySelector('#filter-search')
    if (searchInput) {
      let debounceTimer
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          currentFilters.query = searchInput.value
          renderContent()
        }, 300)
      })
    }

    // Clear filters button
    const clearBtn = container.querySelector('#clear-filters-btn')
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        currentFilters = { category: '', query: '' }
        renderContent()
      })
    }

    // Observation card clicks
    container.querySelectorAll('.observation-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id
        const obs = observations.find(o => o.id === id)
        if (!obs) return

        openObservationModal(obs, {
          onEdit: () => { window.location.hash = `#/log?id=${id}` },
          onDelete: async () => {
            const confirmed = await confirmDialog({
              title: 'Delete observation',
              message: `Delete observation of "${obs.species}"? This cannot be undone.`,
              confirmLabel: 'Delete',
              cancelLabel: 'Keep',
            })
            if (confirmed) {
              deleteObservation(id)
              showToast('Observation deleted', 'info')
              currentFilters = { category: '', query: '' }
              renderContent()
            }
          },
        })
      })
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') card.click()
      })
    })
  }

  renderContent()
}
