/**
 * LocationService — browser Geolocation API wrapper.
 */

/**
 * Requests the user's current GPS position.
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

/**
 * Reverse-geocodes coordinates using the Nominatim API (OpenStreetMap).
 * Returns a human-readable place name, or null on failure.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string|null>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    const resp = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'ObservationTracker/1.0' },
    })
    if (!resp.ok) return null
    const data = await resp.json()
    return data.display_name ?? null
  } catch {
    return null
  }
}
