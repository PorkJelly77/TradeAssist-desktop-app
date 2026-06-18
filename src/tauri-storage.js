// File-based storage for TradeAssist Tauri app
// Wraps localStorage with persistent file I/O
// The app stores everything under a single key: tradeassist-working-state-v2

(function() {
  const DATA_FILE = 'tradeassist-data.json';
  const STORAGE_KEY = 'tradeassist-working-state-v2';
  let _ready = false;

  // File helpers
  async function _readFile() {
    if (!window.__TAURI__) return null;
    try {
      const { readTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
      return await readTextFile(DATA_FILE, { baseDir: BaseDirectory.AppData });
    } catch { return null; }
  }

  async function _writeFile(data) {
    if (!window.__TAURI__) return;
    try {
      const { writeTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
      await writeTextFile(DATA_FILE, data, { baseDir: BaseDirectory.AppData });
    } catch (e) { console.error('TradeAssist save error:', e); }
  }

  // In-memory cache — stays synced with what the app sees
  let _cache = null;

  // Patch localStorage so the app's sync calls work with a memory cache,
  // while we persist to file asynchronously
  function _patchLocalStorage() {
    // Save original methods
    const _origSet = Storage.prototype.setItem;
    const _origGet = Storage.prototype.getItem;
    const _origRemove = Storage.prototype.removeItem;

    // We only wrap setItem/getItem/removeItem for our specific key
    Storage.prototype.getItem = function(key) {
      if (key === STORAGE_KEY) {
        if (_cache !== null) return _cache;
        // Fall through to original on first call before file load
        return _origGet.call(this, key);
      }
      return _origGet.call(this, key);
    };

    Storage.prototype.setItem = function(key, value) {
      if (key === STORAGE_KEY) {
        _cache = String(value);
        _origSet.call(this, key, value);
        if (_ready) _writeFile(value);
        return;
      }
      _origSet.call(this, key, value);
    };

    Storage.prototype.removeItem = function(key) {
      if (key === STORAGE_KEY) {
        _cache = null;
        _ready = false;
      }
      _origRemove.call(this, key);
    };
  }

  // Initialize: load from file and populate localStorage
  (async function init() {
    const fileData = await _readFile();
    if (fileData) {
      _cache = fileData;
      // Hydrate the real localStorage so the app's load() works
      window.localStorage.setItem(STORAGE_KEY, fileData);
    }
    _ready = true;
  })();

  // Patch localStorage after all scripts load, so the app's vars exist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _patchLocalStorage);
  } else {
    _patchLocalStorage();
  }

  // Save on unload
  window.addEventListener('beforeunload', () => {
    if (_cache !== null) _writeFile(_cache);
  });
})();
