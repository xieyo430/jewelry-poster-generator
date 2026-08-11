const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../../data');

class StorageService {
  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  _filePath(key) {
    return path.join(DATA_DIR, `${key}.json`);
  }

  async save(key, data) {
    const fp = this._filePath(key);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, key };
  }

  async load(key) {
    const fp = this._filePath(key);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  }

  async list() {
    if (!fs.existsSync(DATA_DIR)) return [];
    return fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }

  async delete(key) {
    const fp = this._filePath(key);
    try {
      await fs.promises.unlink(fp);
      return { success: true };
    } catch (e) {
      if (e.code === 'ENOENT') return { success: false, reason: 'not_found' };
      throw e;
    }
  }
}

module.exports = new StorageService();
