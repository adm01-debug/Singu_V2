import { describe, expect, it } from 'vitest';
import { mapImportBatch } from './useBulkImport';

describe('mapImportBatch', () => {
  it('preserva o número original das linhas válidas após descartar uma linha inválida', () => {
    const result = mapImportBatch(
      [
        { Nome: 'Ana' },
        { Nome: '' },
        { Nome: 'Carlos' },
      ],
      0,
      ['Nome'],
      ['first_name'],
      ['first_name'],
      'usuario-1',
      'contacts',
    );

    expect(result.errors).toEqual([{ row: 3, message: 'Nome obrigatório' }]);
    expect(result.records.map(record => record.rowNumber)).toEqual([2, 4]);
  });
});
