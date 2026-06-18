// File-based storage for TradeAssist Tauri app
// Wraps localStorage with persistent file I/O
// Uses Tauri's plugin-fs for file access, falls back to localStorage only

(function() {
  const DATA_FILE = 'tradeassist-data.json';

  // Save current localStorage to file
  async function _syncToFile() {
    if (!window.__TAURI__) return;
    try {
      const data = window.localStorage.getItem('tradeassist-working-state-v2');
      if (data) {
        const { writeTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
        await writeTextFile(DATA_FILE, data, { baseDir: BaseDirectory.AppData });
      }
    } catch (e) {
      console.error('TradeAssist file save error:', e);
    }
  }

  // Load from file into localStorage
  async function _loadFromFile() {
    if (!window.__TAURI__) return;
    try {
      const { readTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
      const data = await readTextFile(DATA_FILE, { baseDir: BaseDirectory.AppData });
      if (data) {
        window.localStorage.setItem('tradeassist-working-state-v2', data);
        return true;
      }
    } catch (e) {
      // File doesn't exist yet — fine
    }
    return false;
  }

  // Initial load from file on startup
  (async function() {
    await _loadFromFile();
  })();

  // Save to file whenever data changes — intercept setItem
  const origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    origSetItem.call(this, key, value);
    if (key === 'tradeassist-working-state-v2') {
      _syncToFile();
    }
  };

  // Save on page unload 
  window.addEventListener('beforeunload', () => {
    _syncToFile();
  });
})();
