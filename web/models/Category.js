/**
 * Category model — thin wrapper around the categories.json data.
 *
 * @typedef {{
 *   id: string,
 *   label: string,
 *   icon: string,
 *   colorToken: string
 * }} Category
 */

/** @type {Category[]|null} */
let _cache = null

/**
 * Loads and caches the categories from categories.json.
 * @returns {Promise<Category[]>}
 */
export async function loadCategories() {
  if (_cache) return _cache
  const response = await fetch('./data/categories.json')
  _cache = await response.json()
  return _cache
}

/**
 * Returns the cached categories synchronously, or an empty array if not yet loaded.
 * @returns {Category[]}
 */
export function getCategories() {
  return _cache ?? []
}

/**
 * Finds a category by id.
 * @param {string} id
 * @returns {Category|undefined}
 */
export function getCategoryById(id) {
  return (_cache ?? []).find(c => c.id === id)
}
