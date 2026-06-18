// TradeAssist Desktop Storage
// Tauri's webview already persists localStorage between sessions.
// This file ensures data is also written to a plain file in AppData
// as a backup and for cross-version compatibility.

(function() {
  const DATA_FILE = 'tradeassist-data.json';
  const STORAGE_KEY = 'tradeassist-working-state-v2';

  async function _writeFile(data) {
    if (!window.__TAURI__) return;
    try {
      const { writeTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
      await writeTextFile(DATA_FILE, data, { baseDir: BaseDirectory.AppData });
    } catch (e) {
      // Silent — localStorage already handles runtime persistence
    }
  }

  async function _readFile() {
    if (!window.__TAURI__) return null;
    try {
      const { readTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
      return await readTextFile(DATA_FILE, { baseDir: BaseDirectory.AppData });
    } catch (e) {
      return null;
    }
  }

  // On startup: if file exists and localStorage is empty, restore from file
  (async function() {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (!current) {
      const saved = await _readFile();
      if (saved) {
        window.localStorage.setItem(STORAGE_KEY, saved);
      }
    }
  })();

  // On save: also write to file
  const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, val) {
    orig.call(this, key, val);
    if (key === STORAGE_KEY) {
      _writeFile(val);
    }
  };

  // Final save on close
  window.addEventListener('beforeunload', () => {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (data) _writeFile(data);
  });
})();
