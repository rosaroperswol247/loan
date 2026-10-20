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
    if (!column) continue;
    const value = values[field];
    const currentPath = existing[column];

    if (value === '') {
      if (currentPath && !currentPath.startsWith('data:')) {
        try {
          await supabase.storage.from(BUCKET).remove([currentPath]);
        } catch (removeErr) {
          console.warn('Storage remove error:', removeErr?.message);
        }
      }
      saved[column] = null;
      continue;
    }

    if (typeof value !== 'string' || !value.startsWith('data:')) {
      saved[column] = currentPath || null;
      continue;
    }

    const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp|pjpeg|jfif));base64,([\s\S]+)$/i);
    if (!match) {
      console.warn('Unknown image type format, saving dataUrl directly:', value.slice(0, 30));
      saved[column] = value;
      continue;
    }

    const [, rawContentType, encoded] = match;
    const contentType = rawContentType.toLowerCase();
    if (encoded.length > Math.ceil(MAX_FILE_SIZE / 3) * 4) {
      throw new Error('প্রতিটি ছবির আকার ৫ MB-এর মধ্যে হতে হবে');
    }
    const bytes = Buffer.from(encoded, 'base64');
    if (!bytes.length || bytes.length > MAX_FILE_SIZE) {
      throw new Error('প্রতিটি ছবির আকার ৫ MB-এর মধ্যে হতে হবে');
    }

    const extension = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/jfif'].includes(contentType) ? 'jpg' : contentType.split('/')[1];
    const path = `${userId}/${field}.${extension}`;

    try {
      const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType,
        upsert: true,
      });

      if (error) {
        console.warn(`Storage upload warning for ${field}, fallback to dataUrl:`, error.message);
        saved[column] = value;
      } else {
        saved[column] = path;
      }
    } catch (uploadErr) {
      console.warn(`Storage upload exception for ${field}, fallback to dataUrl:`, uploadErr?.message);
      saved[column] = value;
    }
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

    // If already a base64 dataUrl or web URL, return immediately
    if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
      result[field] = path;
      return;
    }

    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (error) {
        console.warn(`Failed to create signed URL for ${field}:`, error.message);
        result[field] = path;
      } else {
        result[field] = data?.signedUrl || path;
      }
    } catch (signedErr) {
      console.warn(`Signed URL exception for ${field}:`, signedErr?.message);
      result[field] = path;
    }
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
