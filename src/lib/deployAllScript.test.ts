import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const deployScript = readFileSync(
  resolve(process.cwd(), 'scripts/migration/functions/deploy-all.sh'),
  'utf8',
);
const blockStart = deployScript.indexOf('NO_JWT_FUNCTIONS=(');
const blockEnd = deployScript.indexOf('\n)', blockStart);
const noJwtFunctions = deployScript.slice(blockStart, blockEnd).split(/\s+/);

describe('deploy-all.sh', () => {
  it.each(['intent-pixel-snippet', 'intent-tracker'])(
    'mantém %s com autenticação customizada',
    (functionName) => {
      expect(noJwtFunctions).toContain(functionName);
    },
  );
});
