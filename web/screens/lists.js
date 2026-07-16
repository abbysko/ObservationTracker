// UI glue for lists screen
(function () {
  function render(lists) {
    const container = document.querySelector('.screen-lists');
    if (!container) return;
    const ul = document.createElement('div');
    ul.className = 'lists-container';
    lists.forEach((l) => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.innerHTML = `<div class="list-title">${escapeHtml(
        l.name
      )}</div><div class="list-meta">${
        l.builtIn ? '<span class="badge">Built-in</span>' : ''
      }<button class="dup" data-id="${l.id}">Duplicate</button></div>`;
      ul.appendChild(row);
    });
    container.innerHTML = '<h1>Lists</h1>';
    container.appendChild(ul);
    attachHandlers();
  }

  function attachHandlers() {
    document.querySelectorAll('.list-row .dup').forEach((b) => {
      b.addEventListener('click', async (e) => {
        const id = b.getAttribute('data-id');
        const lists = await window.repository.loadLists();
        const list = lists.find((x) => x.id === id);
        if (list) {
          const copy = await window.repository.duplicateList(list);
          // assign a unique copy name: "Original Name #"
          const refreshed = await window.repository.loadLists();
          let n = 1;
          while (refreshed.some((l) => l.name === `${list.name} ${n}`)) {
            n++;
          }
          copy.name = `${list.name} ${n}`;
          await window.repository.saveList(copy);
          // re-render with updated lists
          const refreshed2 = await window.repository.loadLists();
          render(refreshed2);
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // bootstrap when script loads
  (async () => {
    const lists = await window.repository.loadLists();
    render(lists);
  })();
})();
