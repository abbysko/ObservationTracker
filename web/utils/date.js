/**
 * Date utilities.
 */

/**
 * Formats a YYYY-MM-DD date string as a human-readable string.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string} e.g. "June 12, 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Formats a YYYY-MM date string as a month/year label.
 * @param {string} monthStr - YYYY-MM
 * @returns {string} e.g. "Jun 2026"
 */
export function formatMonth(monthStr) {
  if (!monthStr) return ''
  const [year, month] = monthStr.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

/**
 * Returns today's date as a YYYY-MM-DD string.
 * @returns {string}
 */
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Returns a relative label for a date (Today, Yesterday, or formatted date).
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
export function relativeDate(dateStr) {
  const today = todayISO()
  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return formatDate(dateStr)
}

/**
 * Returns the number of consecutive days (ending today) that have at least one observation.
 * @param {string[]} dates - Array of YYYY-MM-DD strings
 * @returns {number}
 */
export function calculateStreak(dates) {
  if (!dates.length) return 0
  const uniqueDates = [...new Set(dates)].sort().reverse()
  let streak = 0
  let check = todayISO()
  for (const d of uniqueDates) {
    if (d === check) {
      streak++
      const prev = new Date(check)
      prev.setDate(prev.getDate() - 1)
      check = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`
    } else {
      break
    }
  }
  return streak
}
