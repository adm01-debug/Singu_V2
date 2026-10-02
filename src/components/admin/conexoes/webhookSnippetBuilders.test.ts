import { describe, expect, it } from 'vitest';
import { buildPythonWebhookSnippet } from './webhookSnippetBuilders';

describe('buildPythonWebhookSnippet', () => {
  it('carrega booleanos e nulos como JSON antes de serializar', () => {
    const snippet = buildPythonWebhookSnippet(
      JSON.stringify({ ativo: true, removido: false, valor: null }),
      'https://example.test/webhook',
    );

    expect(snippet).toContain('json.loads(');
    expect(snippet).not.toContain('json.dumps({');
    expect(snippet).toContain('\\"ativo\\":true');
    expect(snippet).toContain('\\"valor\\":null');
  });
});
