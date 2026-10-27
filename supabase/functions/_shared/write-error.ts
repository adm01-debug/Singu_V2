import { jsonError } from './auth.ts';

export function databaseWriteError(error: { code?: string; message: string }, req: Request): Response {
  if (error.code === '42501') return jsonError('Forbidden', 403, req);
  if (error.code === 'PGRST116') return jsonError('Record unavailable', 404, req);
  if (['40P01', '40001', '55P03'].includes(error.code ?? '')) {
    return jsonError('Write conflict; retry the transaction', 409, req);
  }
  return jsonError(`Write failed: ${error.message}`, 500, req);
}
