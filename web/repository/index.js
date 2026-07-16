(function () {
  // Simple localStorage-backed repository for Milestone 2 prototype
  const KEY_LISTS = 'ot_lists_v1';
  const KEY_HISTORY = 'ot_history_v1';

  function loadBuiltins() {
    return fetch('data/builtins.json')
      .then((r) => r.json())
      .then((j) => j.lists || []);
  }

  function loadLists() {
    const raw = localStorage.getItem(KEY_LISTS);
    const custom = raw ? JSON.parse(raw) : [];
    return loadBuiltins().then((b) => {
      // merge builtins first, then custom after
      const all = b.concat(custom);
      return all;
    });
  }

  function saveList(list) {
    const raw = localStorage.getItem(KEY_LISTS);
    const custom = raw ? JSON.parse(raw) : [];
    // if list is builtIn, push as a new custom copy (caller should have duplicated)
    const idx = custom.findIndex((l) => l.id === list.id);
    if (idx >= 0) custom[idx] = list;
    else custom.push(list);
    localStorage.setItem(KEY_LISTS, JSON.stringify(custom));
    return Promise.resolve();
  }

  function deleteList(listId) {
    const raw = localStorage.getItem(KEY_LISTS);
    const custom = raw ? JSON.parse(raw) : [];
    const filtered = custom.filter((l) => l.id !== listId);
    localStorage.setItem(KEY_LISTS, JSON.stringify(filtered));
    return Promise.resolve();
  }

  function duplicateList(list) {
    const copy = JSON.parse(JSON.stringify(list));
    copy.id = 'custom-' + Date.now();
    copy.builtIn = false;
    return saveList(copy).then(() => copy);
  }

  window.repository = {
    loadLists,
    saveList,
    deleteList,
    duplicateList,
  };
})();
