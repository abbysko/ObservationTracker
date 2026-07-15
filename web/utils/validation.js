/**
 * Validation utilities for observation form fields.
 */

/**
 * Validates an observation form payload.
 * @param {Record<string, unknown>} fields
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateObservation(fields) {
  const errors = {}

  if (!fields.date || !/^\d{4}-\d{2}-\d{2}$/.test(fields.date)) {
    errors.date = 'A valid date is required'
  }

  if (!fields.time || !/^\d{2}:\d{2}$/.test(fields.time)) {
    errors.time = 'A valid time is required'
  }

  if (!fields.category) {
    errors.category = 'Please select a category'
  }

  if (!fields.species || String(fields.species).trim().length === 0) {
    errors.species = 'Species name is required'
  } else if (String(fields.species).trim().length > 200) {
    errors.species = 'Species name must be 200 characters or fewer'
  }

  const count = Number(fields.count)
  if (!Number.isInteger(count) || count < 1) {
    errors.count = 'Count must be a positive whole number'
  }

  if (fields.notes && String(fields.notes).length > 2000) {
    errors.notes = 'Notes must be 2000 characters or fewer'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Returns true if the string is a valid YYYY-MM-DD date.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str))
}
