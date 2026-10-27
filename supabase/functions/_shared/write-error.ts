import { jsonError, scopedCorsHeaders } from './auth.ts';

export function databaseWriteError(error: { code?: string; message: string }, req: Request): Response {
  if (error.code === '42501') return jsonError('Forbidden', 403, req);
  if (error.code === 'PGRST116') return jsonError('Record unavailable', 404, req);
  if (['40P01', '40001', '55P03'].includes(error.code ?? '')) {
    return Response.json({
      error: 'WRITE_CONFLICT', message: 'Write conflict; retry the transaction', retryable: true, sqlState: error.code,
    }, { status: 409, headers: scopedCorsHeaders(req) });
  }
  return jsonError(`Write failed: ${error.message}`, 500, req);
}
