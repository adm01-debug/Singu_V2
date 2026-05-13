/**
 * Utility for validating file magic bytes (real file type) to prevent extension spoofing.
 */

const MAGIC_NUMBERS: Record<string, string[]> = {
  'image/jpeg': ['ffd8ff'],
  'image/png': ['89504e47'],
  'image/gif': ['47494638'],
  'application/pdf': ['25504446'],
  'application/zip': ['504b0304', '504b0506', '504b0708'],
  'audio/mpeg': ['494433', 'fffb', 'fff3', 'fff2'],
  'audio/wav': ['52494646'],
};

/**
 * Validates if the file's binary content matches its declared type or extension.
 * @param file The File object to validate.
 * @returns A promise that resolves to true if valid, false otherwise.
 */
export async function validateFileMagicBytes(file: File): Promise<boolean> {
  // We only check the first 8 bytes
  const blob = file.slice(0, 8);
  const buffer = await blob.arrayBuffer();
  const uint = new Uint8Array(buffer);
  let bytes = '';
  uint.forEach((b) => {
    bytes += b.toString(16).padStart(2, '0');
  });

  const type = file.type;
  const allowedMagics = MAGIC_NUMBERS[type];

  if (!allowedMagics) {
    // If we don't have magic numbers for this type, we allow it (soft validation)
    // but log a warning in dev mode.
    if (import.meta.env.DEV) {
      console.warn(`No magic numbers defined for type: ${type}. Bypassing deep validation.`);
    }
    return true;
  }

  const isValid = allowedMagics.some((magic) => bytes.startsWith(magic));
  return isValid;
}

/**
 * Comprehensive file validation (Size + Type + Magic Bytes)
 */
export async function validateFileUpload(
  file: File, 
  options: { maxSizeMB?: number; allowedTypes?: string[] } = {}
): Promise<{ valid: boolean; error?: string }> {
  const { maxSizeMB = 10, allowedTypes = [] } = options;

  // 1. Size Check
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Arquivo muito grande. Limite: ${maxSizeMB}MB.` };
  }

  // 2. Extension/MIME Check
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `Tipo de arquivo não permitido: ${file.type}` };
  }

  // 3. Deep Magic Byte Validation
  const magicValid = await validateFileMagicBytes(file);
  if (!magicValid) {
    return { valid: false, error: 'O conteúdo do arquivo não corresponde à sua extensão (possível spoofing).' };
  }

  return { valid: true };
}