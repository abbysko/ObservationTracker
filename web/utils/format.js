/**
 * Formatting utilities.
 */

/**
 * Returns an escaped HTML string to prevent XSS when using innerHTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Truncates a string to maxLen characters, appending '…' if truncated.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen) {
  if (!str) return ''
  return str.length <= maxLen ? str : str.slice(0, maxLen) + '…'
}

/**
 * Pluralizes a word based on count.
 * @param {number} count
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
export function pluralize(count, singular, plural) {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`
}

/**
 * Formats coordinates as a human-readable string.
 * @param {number|null} lat
 * @param {number|null} lng
 * @returns {string}
 */
export function formatCoords(lat, lng) {
  if (lat == null || lng == null) return ''
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}
