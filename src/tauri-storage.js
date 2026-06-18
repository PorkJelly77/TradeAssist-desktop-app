// File-based storage for TradeAssist Tauri app
// Wraps localStorage with persistent file I/O
// Uses Tauri's plugin-fs for file access

(function() {
  const DATA_FILE = 'tradeassist-data.json';
  const LOG_FILE = 'tradeassist-debug.log';
  const STORAGE_KEY = 'tradeassist-working-state-v2';

  // Write log to file since console isn't visible in release builds
  async function _logToFile(msg) {
    try {
      if (!window.__TAURI__) return;
      const { writeTextFile, readTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
      let existing = '';
      try { existing = await readTextFile(LOG_FILE, { baseDir: BaseDirectory.AppData }); } catch(e) {}
      await writeTextFile(LOG_FILE, existing + new Date().toISOString().slice(11,19) + ' ' + msg + '\n', { baseDir: BaseDirectory.AppData, append: true });
    } catch(e) {}
  }

  function _log(msg) {
    console.log('[TradeAssist] ' + msg);
    _logToFile(msg);
  }

  // Save current localStorage to file
  async function _syncToFile() {
    if (!window.__TAURI__) {
      _log('TAURI not available, skipping file save');
      return;
    }
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        _log('Saving ' + data.length + ' bytes to ' + DATA_FILE);
        const { writeTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
        await writeTextFile(DATA_FILE, data, { baseDir: BaseDirectory.AppData });
        _log('Save OK');
      } else {
        _log('Nothing to save (localStorage key empty)');
      }
    } catch (e) {
      _log('SAVE ERROR: ' + e.message);
    }
  }

  // Load from file into localStorage
  async function _loadFromFile() {
    if (!window.__TAURI__) {
      _log('TAURI not available, skipping load');
      return false;
    }
    try {
      const { readTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
      _log('Reading ' + DATA_FILE + '...');
      const data = await readTextFile(DATA_FILE, { baseDir: BaseDirectory.AppData });
      if (data) {
        _log('Loaded ' + data.length + ' bytes from file');
        window.localStorage.setItem(STORAGE_KEY, data);
        _log('Written to localStorage. Data available on restart.');
        return true;
      }
    } catch (e) {
      _log('No saved data found (' + e.message + ')');
    }
    return false;
  }

  // Startup
  (async function() {
    _log('=== TradeAssist START ===');
    _log('TAURI: ' + (window.__TAURI__ ? 'YES' : 'NO'));
    if (window.__TAURI__) {
      _log('plugin-fs: ' + (window.__TAURI__['plugin-fs'] ? 'YES' : 'NO'));
    }
    await _loadFromFile();
  })();

  // Intercept saves
  const origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    origSetItem.call(this, key, value);
    if (key === STORAGE_KEY) {
      _log('localStorage updated (' + (value ? value.length : 0) + ' bytes)');
      _syncToFile();
    }
  };

  // Save on close
  window.addEventListener('beforeunload', () => {
    _log('Window closing, saving...');
    _syncToFile();
  });
})();
