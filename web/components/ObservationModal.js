/**
 * ObservationModal component — detail/edit modal for a single observation.
 */

import { getCategoryById } from '../models/Category.js'
import { formatDate } from '../utils/date.js'
import { escapeHtml } from '../utils/format.js'

/**
 * Opens the observation detail/edit modal.
 * @param {import('../models/Observation.js').Observation} obs
 * @param {{ onEdit: (id: string) => void, onDelete: (id: string) => void }} callbacks
 * @returns {{ close: () => void }}
 */
export function openObservationModal(obs, { onEdit, onDelete }) {
  const existing = document.getElementById('obs-modal')
  if (existing) existing.remove()

  const category = getCategoryById(obs.category)
  const icon = category?.icon ?? '🔭'
  const label = category?.label ?? obs.category

  const modal = document.createElement('div')
  modal.id = 'obs-modal'
  modal.className = 'modal'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-modal', 'true')
  modal.setAttribute('aria-label', `Observation: ${obs.species}`)
  modal.innerHTML = `
    <div class="modal__overlay"></div>
    <div class="modal__content">
      <button class="modal__close" aria-label="Close modal">✕</button>
      <div class="modal__header">
        <span class="category-badge category-badge--${escapeHtml(obs.category)}">
          <span aria-hidden="true">${icon}</span> ${escapeHtml(label)}
        </span>
        <h2 class="modal__title">${escapeHtml(obs.species)}</h2>
      </div>
      <dl class="modal__details">
        <dt>Date</dt><dd>${escapeHtml(formatDate(obs.date))} at ${escapeHtml(obs.time)}</dd>
        ${obs.location?.name ? `<dt>Location</dt><dd>${escapeHtml(obs.location.name)}</dd>` : ''}
        <dt>Count</dt><dd>${escapeHtml(String(obs.count))}</dd>
        ${obs.notes ? `<dt>Notes</dt><dd>${escapeHtml(obs.notes)}</dd>` : ''}
      </dl>
      ${obs.photoDataUrl ? `<img class="modal__photo" id="modal-photo" alt="Photo of ${escapeHtml(obs.species)}">` : ''}
      <div class="modal__actions">
        <button class="btn btn-secondary" id="modal-edit-btn">Edit</button>
        <button class="btn btn-ghost" id="modal-delete-btn">Delete</button>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Set photo src via DOM property to avoid HTML injection
  if (obs.photoDataUrl) {
    const photoEl = modal.querySelector('#modal-photo')
    if (photoEl) photoEl.src = obs.photoDataUrl
  }

  requestAnimationFrame(() => modal.classList.add('modal--open'))

  // Focus management
  const closeBtn = modal.querySelector('.modal__close')
  closeBtn.focus()

  function close() {
    modal.classList.remove('modal--open')
    modal.addEventListener('transitionend', () => modal.remove(), { once: true })
  }

  modal.querySelector('.modal__overlay').addEventListener('click', close)
  closeBtn.addEventListener('click', close)
  document.addEventListener('keydown', function onKeyDown(e) {
    if (e.key === 'Escape') {
      close()
      document.removeEventListener('keydown', onKeyDown)
    }
  })

  modal.querySelector('#modal-edit-btn').addEventListener('click', () => {
    close()
    onEdit(obs.id)
  })

  modal.querySelector('#modal-delete-btn').addEventListener('click', () => {
    close()
    onDelete(obs.id)
  })

  return { close }
}
