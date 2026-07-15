/**
 * ExportService — JSON export and import of observations.
 */

import * as repo from '../repository/ObservationRepository.js'

const EXPORT_VERSION = '1'

/**
 * Exports all observations as a downloadable JSON file.
 */
export function exportObservations() {
  const observations = repo.getAll()
  const payload = {
    exportedAt: new Date().toISOString(),
    version: EXPORT_VERSION,
    observations,
  }
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `observations_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Imports observations from a JSON file.
 * Merges with existing observations; duplicate ids are skipped.
 * @param {File} file
 * @returns {Promise<{imported: number, skipped: number}>}
 */
export async function importObservations(file) {
  const text = await file.text()
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file')
  }

  if (!Array.isArray(payload.observations)) {
    throw new Error('File does not contain an observations array')
  }

  const existing = repo.getAll()
  const existingIds = new Set(existing.map(o => o.id))

  const toImport = payload.observations.filter(o => !existingIds.has(o.id))
  const skipped = payload.observations.length - toImport.length

  repo.replaceAll([...existing, ...toImport])

  return { imported: toImport.length, skipped }
}
