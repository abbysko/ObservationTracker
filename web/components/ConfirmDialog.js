/**
 * ConfirmDialog component — accessible confirmation dialog.
 */

/**
 * Shows a confirmation dialog.
 * @param {{
 *   title: string,
 *   message: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string
 * }} options
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled.
 */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  return new Promise(resolve => {
    const existing = document.getElementById('confirm-dialog')
    if (existing) existing.remove()

    const dialog = document.createElement('div')
    dialog.id = 'confirm-dialog'
    dialog.className = 'modal modal--open'
    dialog.setAttribute('role', 'alertdialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.setAttribute('aria-labelledby', 'confirm-title')
    dialog.setAttribute('aria-describedby', 'confirm-message')

    // Use static HTML structure; populate text content via DOM to prevent XSS
    dialog.innerHTML = `
      <div class="modal__overlay"></div>
      <div class="modal__content modal__content--sm">
        <h2 class="modal__title" id="confirm-title"></h2>
        <p id="confirm-message"></p>
        <div class="modal__actions">
          <button class="btn btn-primary" id="confirm-ok"></button>
          <button class="btn btn-ghost" id="confirm-cancel"></button>
        </div>
      </div>
    `
    dialog.querySelector('#confirm-title').textContent = title
    dialog.querySelector('#confirm-message').textContent = message

    document.body.appendChild(dialog)

    const okBtn = dialog.querySelector('#confirm-ok')
    const cancelBtn = dialog.querySelector('#confirm-cancel')
    okBtn.textContent = confirmLabel
    cancelBtn.textContent = cancelLabel
    okBtn.focus()

    function cleanup(result) {
      dialog.remove()
      resolve(result)
    }

    okBtn.addEventListener('click', () => cleanup(true))
    cancelBtn.addEventListener('click', () => cleanup(false))
    dialog.querySelector('.modal__overlay').addEventListener('click', () => cleanup(false))
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') {
        cleanup(false)
        document.removeEventListener('keydown', onKey)
      }
    })
  })
}
