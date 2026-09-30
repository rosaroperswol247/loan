import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

/**
 * Preset administrator account.
 * Only this account is seeded. Everything else (customers, profiles, loans,
 * messages) is created by real usage after the site starts — nothing is
 * pre-populated.
 *
 * To change the admin credentials, edit ADMIN_USERNAME / ADMIN_PASSWORD below
 * (or update the record directly in data/db.json) and restart the server.
 */
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

const ADMIN_SEED = {
  id: '1001',
  fullName: 'MyBank Administrator',
  phone: ADMIN_USERNAME,
  password: ADMIN_PASSWORD,
  role: 'staff',
  createdAt: '2026-01-01 10:00:00'
};

// Empty starting state — only the admin exists.
const INITIAL_DATA = {
  users: [ADMIN_SEED],
  personalInfo: {},
  nomineeInfo: {},
  bankInfo: {},
  loans: [],
  notices: []
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  }
}

export function getDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);

    // Guarantee the shape so older/hand-edited files never crash the app.
    data.users = data.users || [];
    data.personalInfo = data.personalInfo || {};
    data.nomineeInfo = data.nomineeInfo || {};
    data.bankInfo = data.bankInfo || {};
    data.loans = data.loans || [];
    data.notices = data.notices || [];

    // Make sure the preset admin account is always present and usable.
    const admin = data.users.find(u => u.role === 'staff' && u.phone === ADMIN_USERNAME);
    if (!admin) {
      data.users.push({ ...ADMIN_SEED });
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    return data;
  } catch (err) {
    console.error('Failed to read DB, returning initial data:', err);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

export function saveDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
