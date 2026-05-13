/**
 * Validação de magic bytes para garantir a integridade dos arquivos enviados.
 */
export async function validateFileMagicBytes(file: File): Promise<boolean> {
  const slice = file.slice(0, 4);
  const buffer = await slice.arrayBuffer();
  const view = new Uint8Array(buffer);
  
  const header = Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  // Exemplos de headers:
  // PNG: 89504E47
  // PDF: 25504446
  // Headers mapping
  const magicNumbers: Record<string, string[]> = {
    'image/png': ['89504E47'],
    'application/pdf': ['25504446'],
    'image/jpeg': ['FFD8FFE0', 'FFD8FFE1', 'FFD8FFE2', 'FFD8FFDB'],
    'image/gif': ['47494638'],
    'application/zip': ['504B0304', '504B0506', '504B0708'],
  };

  const fileType = file.type;
  if (!magicNumbers[fileType]) {
    // If we don't have the magic number for this type, we allow it but log a warning in dev
    if (import.meta.env.DEV) console.warn(`Magic bytes validation skipped for unknown type: ${fileType}`);
    return true; 
  }

  return magicNumbers[fileType].some(m => header.startsWith(m));
}
 
 export async function validateFileUpload(file: File, options?: { maxSizeMB: number }): Promise<{ valid: boolean; error?: string }> {
   if (options?.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
     return { valid: false, error: `Arquivo muito grande (máximo ${options.maxSizeMB}MB)` };
   }
   
   const magicValid = await validateFileMagicBytes(file);
   if (!magicValid) {
     return { valid: false, error: "Arquivo corrompido ou formato inválido (magic bytes mismatch)" };
   }
   
   return { valid: true };
 }
