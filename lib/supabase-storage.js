const BUCKET = 'applicant-documents';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCUMENT_FIELDS = {
  nidFront: 'nid_front_path',
  nidBack: 'nid_back_path',
  applicantPhoto: 'applicant_photo_path',
  signature: 'signature_path',
  nomineePhoto: 'nominee_photo_path',
  nomineeNidFront: 'nominee_nid_front_path',
  nomineeNidBack: 'nominee_nid_back_path',
};

export async function saveApplicantDocuments(supabase, userId, values, existing = {}, fields = Object.keys(DOCUMENT_FIELDS)) {
  const saved = {};

  for (const field of fields) {
    const column = DOCUMENT_FIELDS[field];
    const value = values[field];
    const currentPath = existing[column];

    if (value === '') {
      if (currentPath) {
        const { error } = await supabase.storage.from(BUCKET).remove([currentPath]);
        if (error) throw error;
      }
      saved[column] = null;
      continue;
    }

    if (typeof value !== 'string' || !value.startsWith('data:')) {
      saved[column] = currentPath || null;
      continue;
    }

    const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
    if (!match) {
      throw new Error('শুধুমাত্র JPG, PNG অথবা WebP ছবি আপলোড করা যাবে');
    }

    const [, contentType, encoded] = match;
    if (encoded.length > Math.ceil(MAX_FILE_SIZE / 3) * 4) {
      throw new Error('প্রতিটি ছবির আকার ৫ MB-এর মধ্যে হতে হবে');
    }
    const bytes = Buffer.from(encoded, 'base64');
    if (!bytes.length || bytes.length > MAX_FILE_SIZE) {
      throw new Error('প্রতিটি ছবির আকার ৫ MB-এর মধ্যে হতে হবে');
    }

    const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1];
    const path = `${userId}/${field}.${extension}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      upsert: true,
    });

    if (error) throw error;
    saved[column] = path;
  }

  return saved;
}

export async function attachSignedDocumentUrls(supabase, record, fields) {
  if (!record) return null;

  const result = { ...record };
  await Promise.all(fields.map(async ([field, column]) => {
    const path = record[column];
    delete result[column];
    if (!path) {
      result[field] = '';
      return;
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error) throw error;
    result[field] = data.signedUrl;
  }));

  return result;
}

export const PERSONAL_DOCUMENT_FIELDS = [
  ['nidFront', 'nid_front_path'],
  ['nidBack', 'nid_back_path'],
  ['applicantPhoto', 'applicant_photo_path'],
  ['signature', 'signature_path'],
];

export const NOMINEE_DOCUMENT_FIELDS = [
  ['nomineePhoto', 'nominee_photo_path'],
  ['nomineeNidFront', 'nominee_nid_front_path'],
  ['nomineeNidBack', 'nominee_nid_back_path'],
];