// UI glue for track screen
(function () {
  const container = document.querySelector('.screen-track');
  if (!container) return;

  const name = sessionStorage.getItem('ot_active_list_name');
  const action = sessionStorage.getItem('ot_list_action');
  const body = container.querySelector('p');
  if (!body) return;

  if (name) {
    body.textContent =
      action === 'start-track'
        ? `Placeholder for tracking observations in ${name}.`
        : `Placeholder for working with ${name}.`;
    return;
  }

  body.textContent =
    'Placeholder for the tracking interface. Choose a list and start a session.';
})();
