/**
 * LogObservationScreen — form to create or edit an observation.
 *
 * Reads an optional `?id=<obsId>` query from the hash to enter edit mode.
 */

import { getCategories } from '../models/Category.js'
import { addObservation, editObservation, getObservation } from '../services/ObservationService.js'
import { getCurrentPosition, reverseGeocode } from '../services/LocationService.js'
import { showToast } from '../components/Toast.js'
import { validateObservation } from '../utils/validation.js'
import { escapeHtml } from '../utils/format.js'

/**
 * Parses the id query param from the current hash, if any.
 * @returns {string|null}
 */
function getEditId() {
  const hash = window.location.hash
  const match = hash.match(/[?&]id=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Renders the Log Observation screen into container.
 * @param {HTMLElement} container
 */
export default function render(container) {
  const editId = getEditId()
  const existing = editId ? getObservation(editId) : null
  const categories = getCategories()

  const now = new Date()
  const defaultDate = now.toISOString().slice(0, 10)
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const v = existing ?? {}

  container.innerHTML = `
    <div class="screen log-screen">
      <header class="screen__header">
        <a href="${existing ? '#/observations' : '#/home'}" class="back-link" aria-label="Go back">← Back</a>
        <h1>${existing ? 'Edit Observation' : 'Log Observation'}</h1>
      </header>

      <form id="log-form" class="form" novalidate>
        <div class="form__row">
          <div class="form__group">
            <label class="form__label" for="field-date">Date</label>
            <input id="field-date" name="date" type="date" class="input" required
                   value="${escapeHtml(v.date ?? defaultDate)}">
            <span class="form__error" id="err-date" role="alert"></span>
          </div>
          <div class="form__group">
            <label class="form__label" for="field-time">Time</label>
            <input id="field-time" name="time" type="time" class="input" required
                   value="${escapeHtml(v.time ?? defaultTime)}">
            <span class="form__error" id="err-time" role="alert"></span>
          </div>
        </div>

        <div class="form__group">
          <fieldset class="form__fieldset">
            <legend class="form__label">Category</legend>
            <div class="category-selector">
              ${categories.map(c => `
                <label class="category-option${(v.category ?? 'birds') === c.id ? ' category-option--selected' : ''}">
                  <input type="radio" name="category" value="${escapeHtml(c.id)}"
                         ${(v.category ?? 'birds') === c.id ? 'checked' : ''}>
                  <span aria-hidden="true">${c.icon}</span>
                  ${escapeHtml(c.label)}
                </label>
              `).join('')}
            </div>
          </fieldset>
          <span class="form__error" id="err-category" role="alert"></span>
        </div>

        <div class="form__group">
          <label class="form__label" for="field-species">Species</label>
          <input id="field-species" name="species" type="text" class="input"
                 list="species-list" placeholder="e.g. American Robin" required
                 value="${escapeHtml(v.species ?? '')}">
          <datalist id="species-list"></datalist>
          <span class="form__error" id="err-species" role="alert"></span>
        </div>

        <div class="form__group form__group--sm">
          <label class="form__label" for="field-count">Count</label>
          <input id="field-count" name="count" type="number" class="input input--sm"
                 min="1" step="1" required
                 value="${escapeHtml(String(Number(v.count) || 1))}">
          <span class="form__error" id="err-count" role="alert"></span>
        </div>

        <div class="form__group">
          <label class="form__label" for="field-location">Location</label>
          <div class="input-with-action">
            <input id="field-location" name="location" type="text" class="input"
                   placeholder="e.g. Central Park, New York"
                   value="${escapeHtml(v.location?.name ?? '')}">
            <button type="button" id="gps-btn" class="btn btn-secondary btn--icon"
                    aria-label="Use my current GPS location">📍</button>
          </div>
          <span class="form__hint" id="gps-status"></span>
        </div>

        <div class="form__group">
          <label class="form__label" for="field-notes">Notes <span class="form__optional">(optional)</span></label>
          <textarea id="field-notes" name="notes" class="input textarea" rows="4"
                    maxlength="2000" placeholder="What did you observe?">${escapeHtml(v.notes ?? '')}</textarea>
          <span class="form__hint"><span id="notes-count">0</span> / 2000</span>
          <span class="form__error" id="err-notes" role="alert"></span>
        </div>

        <div class="form__actions">
          <button type="submit" class="btn btn-primary btn--full">
            ${existing ? 'Save changes' : 'Save observation'}
          </button>
        </div>
      </form>
    </div>
  `

  // Hidden lat/lng fields
  let capturedLat = v.location?.lat ?? null
  let capturedLng = v.location?.lng ?? null

  // Notes character counter
  const notesField = container.querySelector('#field-notes')
  const notesCount = container.querySelector('#notes-count')
  notesCount.textContent = notesField.value.length
  notesField.addEventListener('input', () => {
    notesCount.textContent = notesField.value.length
  })

  // Category selection highlight
  container.querySelectorAll('input[name="category"]').forEach(radio => {
    radio.addEventListener('change', () => {
      container.querySelectorAll('.category-option').forEach(opt => {
        opt.classList.toggle('category-option--selected', opt.querySelector('input').checked)
      })
      // Update species autocomplete for new category
      updateSpeciesList(radio.value)
    })
  })

  // Species autocomplete
  async function updateSpeciesList(categoryId) {
    try {
      const resp = await fetch('./data/species.json')
      const data = await resp.json()
      const datalist = container.querySelector('#species-list')
      const species = data[categoryId] ?? []
      datalist.innerHTML = species.map(s => `<option value="${escapeHtml(s)}">`).join('')
    } catch { /* non-critical */ }
  }

  // Load initial species list
  const initialCategory = container.querySelector('input[name="category"]:checked')?.value ?? 'birds'
  updateSpeciesList(initialCategory)

  // GPS button
  const gpsBtn = container.querySelector('#gps-btn')
  const gpsStatus = container.querySelector('#gps-status')
  const locationInput = container.querySelector('#field-location')

  gpsBtn.addEventListener('click', async () => {
    gpsBtn.disabled = true
    gpsStatus.textContent = 'Detecting location…'
    try {
      const { lat, lng } = await getCurrentPosition()
      capturedLat = lat
      capturedLng = lng
      gpsStatus.textContent = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} — fetching name…`
      const name = await reverseGeocode(lat, lng)
      if (name && !locationInput.value) {
        locationInput.value = name
      }
      gpsStatus.textContent = `Location captured ✓`
    } catch (err) {
      gpsStatus.textContent = `GPS unavailable: ${err.message}`
      capturedLat = null
      capturedLng = null
    } finally {
      gpsBtn.disabled = false
    }
  })

  // Form submission
  const form = container.querySelector('#log-form')
  form.addEventListener('submit', e => {
    e.preventDefault()

    const fields = {
      date: form.elements['date'].value,
      time: form.elements['time'].value,
      category: form.elements['category'].value,
      species: form.elements['species'].value.trim(),
      count: Number(form.elements['count'].value),
      location: {
        name: form.elements['location'].value.trim(),
        lat: capturedLat,
        lng: capturedLng,
      },
      notes: form.elements['notes'].value.trim(),
    }

    const { valid, errors } = validateObservation(fields)

    // Clear previous errors
    container.querySelectorAll('.form__error').forEach(el => { el.textContent = '' })

    if (!valid) {
      for (const [field, msg] of Object.entries(errors)) {
        const el = container.querySelector(`#err-${field}`)
        if (el) el.textContent = msg
      }
      return
    }

    try {
      if (existing) {
        editObservation(existing.id, fields)
        showToast('Observation updated ✓', 'success')
      } else {
        addObservation(fields)
        showToast('Observation saved ✓', 'success')
      }
      window.location.hash = '#/observations'
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  })
}
