import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export const DEFAULT_AGENT_NUMBERS = {
  bkash: '01318047404',
  nagad: '01706329691',
  rocket: '18577394046',
};

export function getAgentNumbers() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return DEFAULT_AGENT_NUMBERS;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const data = JSON.parse(raw || '{}');
    return {
      ...DEFAULT_AGENT_NUMBERS,
      ...(data.agentNumbers || {}),
    };
  } catch (err) {
    console.error('Error reading settings:', err);
    return DEFAULT_AGENT_NUMBERS;
  }
}

export function saveAgentNumbers(numbers) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    let current = {};
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8') || '{}');
      } catch {}
    }
    const updated = {
      ...DEFAULT_AGENT_NUMBERS,
      ...(current.agentNumbers || {}),
      ...(numbers || {}),
      updatedAt: new Date().toISOString(),
    };
    current.agentNumbers = updated;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.error('Error saving agent numbers:', err);
    throw err;
  }
}
