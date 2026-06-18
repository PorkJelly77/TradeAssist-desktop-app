import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { confirm } from '@tauri-apps/plugin-dialog';

// Replace localStorage save/load with file-based save/load
// Store in app data directory under TradeAssist/data.json

const DATA_FILE = 'tradeassist-data.json';

export async function saveStateToFile(state) {
  try {
    await writeTextFile(DATA_FILE, JSON.stringify(state, null, 2), {
      baseDir: BaseDirectory.AppData
    });
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

export async function loadStateFromFile() {
  try {
    const data = await readTextFile(DATA_FILE, {
      baseDir: BaseDirectory.AppData
    });
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export async function confirmAction(msg) {
  try {
    return await confirm(msg, { kind: 'warning' });
  } catch {
    return true;
  }
}
