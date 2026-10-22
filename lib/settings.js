import fs from 'fs';
import path from 'path';
import os from 'os';

let inMemorySettings = null;

function getSettingsFilePath() {
  const primaryPath = path.join(process.cwd(), 'data', 'settings.json');
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return primaryPath;
  } catch {
    return path.join(os.tmpdir(), 'loan_settings.json');
  }
}

export const DEFAULT_AGENT_NUMBERS = {
  bkash: '01318047404',
  nagad: '01706329691',
  rocket: '18577394046',
};

export const DEFAULT_AUTHORITY_SETTINGS = {
  officerName: 'Md Hannan Mia',
  officerTitle: 'Principal Loan Officer',
  signatureUrl: '/documents/sig_officer.png',
};

export function getLocalSettings() {
  if (inMemorySettings) return inMemorySettings;
  try {
    const file = getSettingsFilePath();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      inMemorySettings = JSON.parse(raw || '{}');
      return inMemorySettings;
    }
  } catch (err) {
    console.warn('Local settings read warning:', err?.message);
  }
  inMemorySettings = {
    agentNumbers: DEFAULT_AGENT_NUMBERS,
    authority: DEFAULT_AUTHORITY_SETTINGS,
  };
  return inMemorySettings;
}

export function saveLocalSettings(updater) {
  try {
    const current = getLocalSettings();
    const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    inMemorySettings = updated;
    const file = getSettingsFilePath();
    try {
      fs.writeFileSync(file, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {
      const tmpFile = path.join(os.tmpdir(), 'loan_settings.json');
      fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2), 'utf-8');
    }
    return updated;
  } catch (err) {
    console.warn('Local settings write warning (ignorable in serverless):', err?.message);
    return inMemorySettings;
  }
}

export function getAgentNumbers() {
  const settings = getLocalSettings();
  return {
    ...DEFAULT_AGENT_NUMBERS,
    ...(settings.agentNumbers || {}),
  };
}

export function saveAgentNumbers(numbers) {
  const updated = {
    ...DEFAULT_AGENT_NUMBERS,
    ...(getLocalSettings().agentNumbers || {}),
    ...(numbers || {}),
    updatedAt: new Date().toISOString(),
  };
  saveLocalSettings(current => ({ ...current, agentNumbers: updated }));
  return updated;
}

export function getAuthoritySettings() {
  const settings = getLocalSettings();
  return {
    ...DEFAULT_AUTHORITY_SETTINGS,
    ...(settings.authority || {}),
  };
}

export function saveAuthoritySettings(authority) {
  const updated = {
    ...DEFAULT_AUTHORITY_SETTINGS,
    ...(getLocalSettings().authority || {}),
    ...(authority || {}),
    updatedAt: new Date().toISOString(),
  };
  saveLocalSettings(current => ({ ...current, authority: updated }));
  return updated;
}
