// File-based storage for TradeAssist Tauri app
// Wraps localStorage with persistent file I/O
// Uses Tauri's plugin-fs for file access

(function() {
  const DATA_FILE = 'tradeassist-data.json';
  const STORAGE_KEY = 'tradeassist-working-state-v2';

  function _log(msg) {
    try { console.log('[TradeAssistStorage] ' + msg); } catch(e) {}
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
        _log('Saving ' + data.length + ' bytes to file...');
        const { writeTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
        await writeTextFile(DATA_FILE, data, { baseDir: BaseDirectory.AppData });
        _log('Save complete!');
      } else {
        _log('No data to save (localStorage key is empty)');
      }
    } catch (e) {
      _log('SAVE ERROR: ' + e.message);
      console.error('TradeAssist file save error:', e);
    }
  }

  // Load from file into localStorage
  async function _loadFromFile() {
    if (!window.__TAURI__) {
      _log('TAURI not available, skipping file load');
      return;
    }
    try {
      const { readTextFile, BaseDirectory } = window.__TAURI__['plugin-fs'];
      _log('Reading from file...');
      const data = await readTextFile(DATA_FILE, { baseDir: BaseDirectory.AppData });
      if (data) {
        _log('Loaded ' + data.length + ' bytes from file');
        window.localStorage.setItem(STORAGE_KEY, data);
        _log('Data written to localStorage. Key now has data.');
        return true;
      }
    } catch (e) {
      _log('LOAD: File not found or error: ' + e.message + ' (normal on first run)');
    }
    return false;
  }

  // Initial load from file on startup
  (async function() {
    _log('Starting up...');
    _log('TAURI available: ' + (window.__TAURI__ ? 'YES' : 'NO'));
    if (window.__TAURI__) {
      _log('plugin-fs available: ' + (window.__TAURI__['plugin-fs'] ? 'YES' : 'NO'));
    }
    const loaded = await _loadFromFile();
    _log('Startup load result: ' + (loaded ? 'loaded data from file' : 'no file found, starting fresh'));
  })();

  // Save whenever localStorage changes
  const origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    origSetItem.call(this, key, value);
    if (key === STORAGE_KEY) {
      _log('Data changed (' + (value ? value.length : 0) + ' bytes), scheduling save...');
      _syncToFile();
    }
  };

  // Save on page unload
  window.addEventListener('beforeunload', () => {
    _log('Page closing, saving...');
    _syncToFile();
  });
})();
