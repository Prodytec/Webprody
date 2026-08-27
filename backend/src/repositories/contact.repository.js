const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'contacts.json');

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
  }
}

async function save(entry) {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  const contacts = JSON.parse(raw);

  const record = { id: Date.now().toString(36), receivedAt: new Date().toISOString(), ...entry };
  contacts.push(record);

  await fs.writeFile(DATA_FILE, JSON.stringify(contacts, null, 2), 'utf-8');
  return record;
}

module.exports = { save };
