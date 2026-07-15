/**
 * MapScreen — Leaflet map showing geolocated observations.
 *
 * Leaflet and OpenStreetMap tiles are loaded from CDN.
 */

import { getObservationsWithCoords } from '../services/ObservationService.js'
import { getCategoryById, loadCategories } from '../models/Category.js'
import { formatDate } from '../utils/date.js'
import { escapeHtml } from '../utils/format.js'

/** Leaflet map instance (retained across re-renders to avoid duplicate init) */
let _map = null

/**
 * Renders the Map screen into container.
 * @param {HTMLElement} container
 */
export default async function render(container) {
  await loadCategories()

  container.innerHTML = `
    <div class="screen map-screen">
      <header class="screen__header">
        <h1>Map</h1>
      </header>
      <div id="map-container" class="map-container" aria-label="Observation map"></div>
      <p class="map-hint">Only observations with a recorded GPS location appear on the map.</p>
    </div>
  `

  // Load Leaflet if not already loaded
  if (!window.L) {
    await loadLeaflet()
  }

  const mapEl = container.querySelector('#map-container')

  // Leaflet may already be attached to the element if the screen was visited before
  if (_map) {
    _map.remove()
    _map = null
  }

  const observations = getObservationsWithCoords()

  const defaultCenter = observations.length > 0
    ? [observations[0].location.lat, observations[0].location.lng]
    : [20, 0]

  _map = window.L.map(mapEl).setView(defaultCenter, observations.length > 0 ? 10 : 2)

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(_map)

  for (const obs of observations) {
    const category = getCategoryById(obs.category)
    const icon = category?.icon ?? '📍'
    const popupContent = `
      <strong>${escapeHtml(obs.species)}</strong><br>
      ${icon} ${escapeHtml(category?.label ?? obs.category)}<br>
      ${escapeHtml(formatDate(obs.date))}<br>
      ${obs.location.name ? escapeHtml(obs.location.name) : ''}
    `
    window.L.marker([obs.location.lat, obs.location.lng])
      .bindPopup(popupContent)
      .addTo(_map)
  }

  if (observations.length === 0) {
    const hint = container.querySelector('.map-hint')
    hint.textContent = 'No observations with GPS coordinates yet. Use the GPS button when logging an observation.'
  }
}

/**
 * Dynamically loads Leaflet CSS and JS from CDN.
 * @returns {Promise<void>}
 */
function loadLeaflet() {
  return new Promise((resolve, reject) => {
    const cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(cssLink)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}
