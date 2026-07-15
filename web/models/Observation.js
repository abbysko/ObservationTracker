/**
 * Observation model factory and helpers.
 *
 * @typedef {{
 *   id: string,
 *   createdAt: string,
 *   updatedAt: string,
 *   date: string,
 *   time: string,
 *   category: string,
 *   species: string,
 *   count: number,
 *   location: { name: string, lat: number|null, lng: number|null },
 *   notes: string,
 *   photoDataUrl: string|null
 * }} Observation
 */

/**
 * Generates a unique observation id.
 * @returns {string}
 */
function generateId() {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  return `obs_${ts}_${rand}`
}

/**
 * Returns today's date as a YYYY-MM-DD string in local time.
 * @returns {string}
 */
function todayDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Returns the current time as an HH:MM string.
 * @returns {string}
 */
function currentTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Creates a new Observation with defaults.
 * @param {Partial<Observation>} fields
 * @returns {Observation}
 */
export function createObservation(fields = {}) {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    date: todayDate(),
    time: currentTime(),
    category: 'birds',
    species: '',
    count: 1,
    location: { name: '', lat: null, lng: null },
    notes: '',
    photoDataUrl: null,
    ...fields,
  }
}

/**
 * Returns a copy of the observation with updatedAt refreshed.
 * @param {Observation} obs
 * @param {Partial<Observation>} changes
 * @returns {Observation}
 */
export function updateObservation(obs, changes) {
  return {
    ...obs,
    ...changes,
    id: obs.id,
    createdAt: obs.createdAt,
    updatedAt: new Date().toISOString(),
  }
}
