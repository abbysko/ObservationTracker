/**
 * ObservationCard component — renders a single observation as a card.
 */

import { getCategoryById } from '../models/Category.js'
import { formatDate } from '../utils/date.js'
import { escapeHtml, truncate } from '../utils/format.js'

/**
 * Returns the HTML string for an observation card.
 * @param {import('../models/Observation.js').Observation} obs
 * @returns {string}
 */
export function observationCard(obs) {
  const category = getCategoryById(obs.category)
  const icon = category?.icon ?? '🔭'
  const label = category?.label ?? obs.category
  const dateLabel = formatDate(obs.date)
  const locationText = obs.location?.name ? escapeHtml(truncate(obs.location.name, 40)) : ''
  const notesText = obs.notes ? escapeHtml(truncate(obs.notes, 100)) : ''

  return `
    <article class="observation-card" data-id="${escapeHtml(obs.id)}" tabindex="0"
             role="button" aria-label="View observation: ${escapeHtml(obs.species)}">
      <div class="observation-card__header">
        <span class="category-badge category-badge--${escapeHtml(obs.category)}"
              aria-label="${escapeHtml(label)}">
          <span aria-hidden="true">${icon}</span> ${escapeHtml(label)}
        </span>
        <span class="observation-card__date">${escapeHtml(dateLabel)}</span>
      </div>
      <h3 class="observation-card__species">${escapeHtml(obs.species)}</h3>
      ${locationText ? `<p class="observation-card__location">📍 ${locationText}</p>` : ''}
      ${notesText ? `<p class="observation-card__notes">${notesText}</p>` : ''}
      <div class="observation-card__footer">
        <span class="observation-card__count" aria-label="${escapeHtml(String(obs.count))} individual${obs.count !== 1 ? 's' : ''}">
          × ${escapeHtml(String(obs.count))}
        </span>
        <span class="observation-card__time">${escapeHtml(obs.time)}</span>
      </div>
    </article>
  `
}
