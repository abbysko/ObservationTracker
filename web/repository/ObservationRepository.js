/**
 * ObservationRepository — localStorage CRUD for observations.
 *
 * Storage key: 'ot_observations'
 * Value: JSON array of Observation objects
 */

const STORAGE_KEY = 'ot_observations'

/**
 * Reads all observations from localStorage.
 * @returns {import('../models/Observation.js').Observation[]}
 */
export function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('ObservationRepository.getAll failed:', err)
    return []
  }
}

/**
 * Persists the full observations array to localStorage.
 * @param {import('../models/Observation.js').Observation[]} observations
 */
function saveAll(observations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations))
  } catch (err) {
    console.error('ObservationRepository.saveAll failed:', err)
    throw err
  }
}

/**
 * Finds an observation by id.
 * @param {string} id
 * @returns {import('../models/Observation.js').Observation|undefined}
 */
export function getById(id) {
  return getAll().find(o => o.id === id)
}

/**
 * Inserts a new observation. Throws if an observation with the same id already exists.
 * @param {import('../models/Observation.js').Observation} observation
 */
export function insert(observation) {
  const all = getAll()
  if (all.some(o => o.id === observation.id)) {
    throw new Error(`Observation with id ${observation.id} already exists`)
  }
  saveAll([...all, observation])
}

/**
 * Replaces an existing observation by id. Throws if not found.
 * @param {import('../models/Observation.js').Observation} observation
 */
export function update(observation) {
  const all = getAll()
  const idx = all.findIndex(o => o.id === observation.id)
  if (idx === -1) {
    throw new Error(`Observation with id ${observation.id} not found`)
  }
  const updated = [...all]
  updated[idx] = observation
  saveAll(updated)
}

/**
 * Removes an observation by id. Throws if not found.
 * @param {string} id
 */
export function remove(id) {
  const all = getAll()
  const filtered = all.filter(o => o.id !== id)
  if (filtered.length === all.length) {
    throw new Error(`Observation with id ${id} not found`)
  }
  saveAll(filtered)
}

/**
 * Replaces all stored observations with the provided array.
 * Used during import.
 * @param {import('../models/Observation.js').Observation[]} observations
 */
export function replaceAll(observations) {
  saveAll(observations)
}

/**
 * Removes all stored observations.
 */
export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('ObservationRepository.clear failed:', err)
  }
}
