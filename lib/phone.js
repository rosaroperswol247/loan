export function normalizePhone(value) {
  const phone = String(value || '').replace(/[\s()-]/g, '');
  let normalized = phone;

  if (/^01\d{9}$/.test(phone)) {
    normalized = `+88${phone}`;
  } else if (/^8801\d{9}$/.test(phone)) {
    normalized = `+${phone}`;
  } else if (/^\+8801\d{9}$/.test(phone)) {
    normalized = phone;
  }

  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}