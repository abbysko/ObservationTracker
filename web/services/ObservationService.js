/**
 * ObservationService — business logic for managing observations.
 */

import { createObservation, updateObservation } from '../models/Observation.js'
import * as repo from '../repository/ObservationRepository.js'

/**
 * Returns all observations sorted by date/time descending (newest first).
 * @returns {import('../models/Observation.js').Observation[]}
 */
export function listObservations() {
  return repo.getAll().slice().sort((a, b) => {
    const ta = `${a.date}T${a.time}`
    const tb = `${b.date}T${b.time}`
    return tb.localeCompare(ta)
  })
}

/**
 * Returns observations matching the given filter criteria.
 * @param {{
 *   category?: string,
 *   dateFrom?: string,
 *   dateTo?: string,
 *   query?: string
 * }} filters
 * @returns {import('../models/Observation.js').Observation[]}
 */
export function filterObservations(filters = {}) {
  let results = listObservations()

  if (filters.category) {
    results = results.filter(o => o.category === filters.category)
  }
  if (filters.dateFrom) {
    results = results.filter(o => o.date >= filters.dateFrom)
  }
  if (filters.dateTo) {
    results = results.filter(o => o.date <= filters.dateTo)
  }
  if (filters.query) {
    const q = filters.query.toLowerCase()
    results = results.filter(o =>
      o.species.toLowerCase().includes(q) ||
      o.notes.toLowerCase().includes(q) ||
      (o.location.name && o.location.name.toLowerCase().includes(q))
    )
  }

  return results
}

/**
 * Returns a single observation by id, or null if not found.
 * @param {string} id
 * @returns {import('../models/Observation.js').Observation|null}
 */
export function getObservation(id) {
  return repo.getById(id) ?? null
}

/**
 * Creates and saves a new observation.
 * @param {Partial<import('../models/Observation.js').Observation>} fields
 * @returns {import('../models/Observation.js').Observation}
 */
export function addObservation(fields) {
  const obs = createObservation(fields)
  repo.insert(obs)
  return obs
}

/**
 * Updates an existing observation with new field values.
 * @param {string} id
 * @param {Partial<import('../models/Observation.js').Observation>} changes
 * @returns {import('../models/Observation.js').Observation}
 */
export function editObservation(id, changes) {
  const existing = repo.getById(id)
  if (!existing) throw new Error(`Observation ${id} not found`)
  const updated = updateObservation(existing, changes)
  repo.update(updated)
  return updated
}

/**
 * Deletes an observation by id.
 * @param {string} id
 */
export function deleteObservation(id) {
  repo.remove(id)
}

/**
 * Returns summary statistics.
 * @returns {{
 *   totalCount: number,
 *   speciesCount: number,
 *   activeDays: number,
 *   byCategory: Record<string, number>,
 *   byMonth: Record<string, number>,
 *   topSpecies: { species: string, count: number }[]
 * }}
 */
export function getStats() {
  const all = repo.getAll()

  const speciesSet = new Set(all.map(o => o.species))
  const daysSet = new Set(all.map(o => o.date))

  const byCategory = {}
  const byMonth = {}
  const speciesCounts = {}

  for (const obs of all) {
    byCategory[obs.category] = (byCategory[obs.category] ?? 0) + obs.count
    const month = obs.date.slice(0, 7) // YYYY-MM
    byMonth[month] = (byMonth[month] ?? 0) + 1
    speciesCounts[obs.species] = (speciesCounts[obs.species] ?? 0) + obs.count
  }

  const topSpecies = Object.entries(speciesCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([species, count]) => ({ species, count }))

  return {
    totalCount: all.length,
    speciesCount: speciesSet.size,
    activeDays: daysSet.size,
    byCategory,
    byMonth,
    topSpecies,
  }
}

/**
 * Returns observations that have GPS coordinates.
 * @returns {import('../models/Observation.js').Observation[]}
 */
export function getObservationsWithCoords() {
  return repo.getAll().filter(o => o.location.lat != null && o.location.lng != null)
}
