/**
 * Toast component — brief non-blocking notifications.
 */

let _toastTimeout = null

/**
 * Shows a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} [type='success']
 * @param {number} [duration=3000]
 */
export function showToast(message, type = 'success', duration = 3000) {
  let toast = document.getElementById('toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'toast'
    toast.setAttribute('role', 'alert')
    toast.setAttribute('aria-live', 'polite')
    document.body.appendChild(toast)
  }

  if (_toastTimeout) {
    clearTimeout(_toastTimeout)
    toast.classList.remove('toast--visible')
  }

  toast.className = `toast toast--${type}`
  toast.textContent = message

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast--visible'))
  })

  _toastTimeout = setTimeout(() => {
    toast.classList.remove('toast--visible')
  }, duration)
}
