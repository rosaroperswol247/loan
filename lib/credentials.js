import fs from 'fs';
import path from 'path';

const CREDENTIALS_FILE = path.join(process.cwd(), 'data', 'credentials.json');

export function getStoredCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Error reading credentials:', err);
    return {};
  }
}

export function saveUserCredential(key, password) {
  if (!key || !password) return;
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const current = getStoredCredentials();
    current[key] = password;
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving credential:', err);
  }
}

export function saveUserCredentials(mapping) {
  if (!mapping || typeof mapping !== 'object') return;
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const current = getStoredCredentials();
    Object.assign(current, mapping);
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving credentials map:', err);
  }
}
