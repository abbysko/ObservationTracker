/**
 * HomeScreen — dashboard with greeting, recent observations, and quick-log button.
 */

import { listObservations, getStats } from '../services/ObservationService.js'
import { observationCard } from '../components/ObservationCard.js'
import { openObservationModal } from '../components/ObservationModal.js'
import { relativeDate, calculateStreak } from '../utils/date.js'
import { pluralize } from '../utils/format.js'

/**
 * Renders the Home screen into container.
 * @param {HTMLElement} container
 */
export default function render(container) {
  const all = listObservations()
  const stats = getStats()
  const recent = all.slice(0, 3)
  const streak = calculateStreak(all.map(o => o.date))

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const todayObs = all.filter(o => o.date === new Date().toISOString().slice(0, 10)).length

  container.innerHTML = `
    <div class="screen home-screen">
      <header class="home-screen__header">
        <p class="home-screen__date">${today}</p>
        <h1 class="home-screen__title">Welcome back</h1>
      </header>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-card__value">${stats.totalCount}</span>
          <span class="stat-card__label">Total observations</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">${stats.speciesCount}</span>
          <span class="stat-card__label">Species</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">${streak}</span>
          <span class="stat-card__label">Day streak 🔥</span>
        </div>
      </div>

      <div class="home-screen__today">
        <p>${pluralize(todayObs, 'observation', 'observations')} logged today</p>
        <a href="#/log" class="btn btn-primary">+ Log Observation</a>
      </div>

      <section class="home-screen__recent">
        <h2 class="section-title">Recent</h2>
        ${recent.length > 0
          ? `<div class="card-list">${recent.map(observationCard).join('')}</div>
             <a href="#/observations" class="view-all-link">View all observations →</a>`
          : `<div class="empty-state">
               <span class="empty-state__icon" aria-hidden="true">🔭</span>
               <p>No observations yet.</p>
               <a href="#/log" class="btn btn-primary">Log your first observation</a>
             </div>`
        }
      </section>
    </div>
  `

  // Bind card click events
  container.querySelectorAll('.observation-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id
      const obs = all.find(o => o.id === id)
      if (obs) {
        openObservationModal(obs, {
          onEdit: () => { window.location.hash = `#/log?id=${id}` },
          onDelete: () => { window.location.hash = '#/observations' },
        })
      }
    })
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') card.click()
    })
  })
}
