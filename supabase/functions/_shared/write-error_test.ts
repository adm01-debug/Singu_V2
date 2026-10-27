import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { databaseWriteError } from './write-error.ts';

for (const [code, status] of [
  ['42501', 403], ['PGRST116', 404], ['40P01', 409], ['40001', 409], ['55P03', 409], ['23505', 500],
] as const) {
  Deno.test(`erro de escrita ${code} retorna ${status}`, () => {
    const req = new Request('http://127.0.0.1/');
    assertEquals(databaseWriteError({ code, message: 'falha simulada' }, req).status, status);
  });
}
