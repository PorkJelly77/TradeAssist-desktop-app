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
  let _pendingWrite = null;
  let _writeTimer = null;

  // Debounced file write: coalesces rapid setItem calls
  function _scheduleWrite(value) {
    _pendingWrite = value;
    if (_writeTimer) clearTimeout(_writeTimer);
    _writeTimer = setTimeout(() => {
      _writeTimer = null;
      if (_pendingWrite !== null) {
        _writeFile(_pendingWrite);
        _pendingWrite = null;
      }
    }, 300);
  }

  // Patch localStorage BEFORE any scripts run
  // We do NOT wait for DOMContentLoaded — app.js calls load() immediately
  const _origSetItem = Storage.prototype.setItem;
  const _origGetItem = Storage.prototype.getItem;
  const _origRemoveItem = Storage.prototype.removeItem;
  const _origClear = Storage.prototype.clear;

  Storage.prototype.getItem = function(key) {
    if (key === STORAGE_KEY) {
      if (_cache !== null) {
        return _cache;
      }
    }
    return _origGetItem.call(this, key);
  };

  Storage.prototype.setItem = function(key, value) {
    _origSetItem.call(this, key, value);
    if (key === STORAGE_KEY) {
      _cache = String(value);
      if (_ready) _scheduleWrite(value);
    }
  };

  Storage.prototype.removeItem = function(key) {
    _origRemoveItem.call(this, key);
    if (key === STORAGE_KEY) {
      _cache = null;
    }
  };

  Storage.prototype.clear = function() {
    _origClear.call(this);
    _cache = null;
  };

  // Initialize: load from file, populate cache and real localStorage
  (async function init() {
    const fileData = await _readFile();
    if (fileData) {
      _cache = fileData;
      // Seed the real localStorage so the app's load() finds data
      _origSetItem.call(window.localStorage, STORAGE_KEY, fileData);
    }
    _ready = true;

    // If the app already loaded its state (scripts already ran),
    // save whatever is in localStorage now so we don't lose it
    const current = _origGetItem.call(window.localStorage, STORAGE_KEY);
    if (current && current !== fileData) {
      _cache = current;
      _scheduleWrite(current);
    }
  })();

  // Extra safety: save on page unload (no debounce — fire immediately)
  window.addEventListener('beforeunload', () => {
    if (_writeTimer) clearTimeout(_writeTimer);
    if (_cache !== null) _writeFile(_cache);
  });

  // Also save periodically every 10 seconds while there's pending data
  setInterval(() => {
    if (_cache !== null) {
      _writeFile(_cache);
    }
  }, 10000);
})();
