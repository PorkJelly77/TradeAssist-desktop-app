// File-based storage override for TradeAssist Tauri app
// Replaces localStorage with file reads/writes in app data directory

(function() {
  const STORAGE_FILE = 'tradeassist-data.json';
  let _store = {};
  let _ready = false;

  async function _load() {
    try {
      if (window.__TAURI__) {
        const { readTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
        const data = await readTextFile(STORAGE_FILE, { baseDir: BaseDirectory.AppData });
        if (data) _store = JSON.parse(data);
      }
    } catch (e) {
      // File doesn't exist yet - that's fine
      _store = {};
    }
    _ready = true;
  }

  async function _save() {
    try {
      if (window.__TAURI__) {
        const { writeTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
        await writeTextFile(STORAGE_FILE, JSON.stringify(_store), { baseDir: BaseDirectory.AppData });
      }
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  // Build a localStorage-like object
  const fileStorage = {
    get length() { return Object.keys(_store).length; },
    
    getItem(key) { return _store[key] || null; },
    
    key(index) { return Object.keys(_store)[index] || null; },
    
    async setItem(key, value) {
      _store[key] = value;
      if (_ready) await _save();
    },
    
    async removeItem(key) {
      delete _store[key];
      if (_ready) await _save();
    },
    
    async clear() {
      _store = {};
      if (_ready) await _save();
    }
  };

  // Override global localStorage
  Object.defineProperty(window, 'localStorage', {
    get: () => fileStorage,
    configurable: false,
    enumerable: true
  });

  // Load data on page load
  _load();

  // Also save on page unload
  window.addEventListener('beforeunload', () => { _save(); });
})();
