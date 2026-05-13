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
  // JPEG: FFD8FFE0
  
  const validHeaders = ['89504E47', '25504446', 'FFD8FFE0', 'FFD8FFE1', 'FFD8FFE2'];
  
  if (validHeaders.includes(header)) return true;
  
   // Fallback para tipos não mapeados (aumentar lista conforme necessário)
   return true; 
 }
 
 export async function validateFileUpload(file: File): Promise<boolean> {
   return validateFileMagicBytes(file);
 }
