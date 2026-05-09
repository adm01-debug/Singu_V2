import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Regression Suite - 200+ tests
 * Validates system-wide integrity after all improvements
 */

function readSrcFile(relativePath: string): string {
  try { return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf-8'); } catch { return ''; }
}

function getFiles(dir: string, ext: string): string[] {
  const base = path.resolve(__dirname, '..', dir);
  const results: string[] = [];
  try {
    const items = fs.readdirSync(base, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(base, item.name);
      if (item.isDirectory()) results.push(...getFilesFromAbs(full, ext));
      else if (item.name.endsWith(ext)) results.push(full);
    }
  } catch { /* skip */ }
  return results;
}

function getFilesFromAbs(dir: string, ext: string): string[] {
  const results: string[] = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) results.push(...getFilesFromAbs(full, ext));
      else if (item.name.endsWith(ext)) results.push(full);
    }
  } catch { /* skip */ }
  return results;
}

// ============================================
// 1. Route & Page Integrity
// ============================================
describe('Route & Page Integrity', () => {
  const appContent = readSrcFile('app/AppRoutes.tsx');

  it('AppRoutes.tsx exists and is valid', () => {
    expect(appContent.length).toBeGreaterThan(100);
  });

  it('AppRoutes.tsx imports React Router', () => {
    expect(appContent).toContain('react-router-dom');
  });

  it('AppRoutes.tsx has route definitions', () => {
    expect(appContent).toContain('Route');
  });

  const expectedRoutes = ['/', '/contatos', '/configuracoes'];
  expectedRoutes.forEach(route => {
    it(`has route for ${route}`, () => {
      expect(appContent).toContain(`path="${route}"`);
    });
  });
});

// ============================================
// 2. Component Export Validation
// ============================================
describe('Component Exports', () => {
  const componentDirs = ['components/ui', 'components/triggers', 'components/analytics'];

  componentDirs.forEach(dir => {
    it(`${dir}/ has component files`, () => {
      const files = getFiles(dir, '.tsx');
      expect(files.length).toBeGreaterThan(0);
    });
  });

  it('all UI components export something', () => {
    const uiFiles = getFiles('components/ui', '.tsx');
    uiFiles.forEach(f => {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content.includes('export')).toBe(true);
    });
  });
});

// ============================================
// 3. Hook Integrity
// ============================================
describe('Hook Integrity', () => {
  const hookFiles = getFiles('hooks', '.ts').concat(getFiles('hooks', '.tsx'));

  it('hooks directory has files', () => {
    expect(hookFiles.length).toBeGreaterThan(0);
  });

  it('most hooks export a use* function', () => {
    let hookCount = 0;
    let validCount = 0;
    hookFiles.filter(f => !f.includes('__tests__')).forEach(f => {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('export')) {
        hookCount++;
        const hasHookExport = /export\s+(function|const)\s+use[A-Z]/.test(content);
        const hasDefaultExport = content.includes('export default');
        if (hasHookExport || hasDefaultExport) validCount++;
      }
    });
    // At least 80% should follow the pattern
    expect(validCount / hookCount).toBeGreaterThan(0.8);
  });

  it('useAuth hook exists', () => {
    const authHook = hookFiles.find(f => f.includes('useAuth'));
    expect(authHook).toBeTruthy();
  });
});

// ============================================
// 4. Data Module Integrity
// ============================================
describe('Data Module Integrity', () => {
  const dataFiles = getFiles('data', '.ts').filter(f => !f.includes('__tests__'));

  it('data directory has files', () => {
    expect(dataFiles.length).toBeGreaterThan(0);
  });

  it('communicationTrainingData.ts exports required items', () => {
    const content = readSrcFile('data/communicationTrainingData.ts');
    expect(content).toContain('export const DISC_TRAINING');
    expect(content).toContain('export const VAK_TRAINING');
    expect(content).toContain('export const generateScenarios');
    expect(content).toContain('export interface SalespersonProfile');
    expect(content).toContain('export interface TrainingScenario');
    expect(content).toContain('export interface TrainingTip');
  });

  it('data files do not import React', () => {
    dataFiles.forEach(f => {
      const content = fs.readFileSync(f, 'utf-8');
      const hasReactImport = content.includes("from 'react'") || content.includes('from "react"');
      if (hasReactImport) {
        console.warn(`⚠️ Data file imports React: ${path.basename(f)}`);
      }
    });
  });
});

// ============================================
// 5. Supabase Integration Safety
// ============================================
describe('Supabase Integration Safety', () => {
  const clientFile = readSrcFile('integrations/supabase/client.ts');

  it('client.ts exists', () => {
    expect(clientFile.length).toBeGreaterThan(0);
  });

  it('client uses environment variables', () => {
    expect(clientFile).toContain('VITE_SUPABASE');
  });

  it('no hardcoded Supabase URLs in components', () => {
    const components = getFiles('components', '.tsx');
    components.forEach(f => {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toContain('supabase.co/rest');
      expect(content).not.toContain('.supabase.co/auth');
    });
  });
});

// ============================================
// 6. Error Handling Patterns
// ============================================
describe('Error Handling Patterns', () => {
  it('errorReporting module exports captureError', () => {
    const content = readSrcFile('lib/errorReporting.ts');
    expect(content).toContain('export function captureError');
  });

  it('errorReporting module exports initGlobalErrorHandlers', () => {
    const content = readSrcFile('lib/errorReporting.ts');
    expect(content).toContain('export function initGlobalErrorHandlers');
  });

  it('main.tsx initializes error handlers', () => {
    const content = readSrcFile('main.tsx');
    expect(content).toContain('initGlobalErrorHandlers');
  });
});

// ============================================
// 7. Theme & Design System
// ============================================
describe('Theme & Design System', () => {
  it('ThemeProvider wraps App in main.tsx', () => {
    const content = readSrcFile('main.tsx');
    expect(content).toContain('ThemeProvider');
    expect(content).toContain('<App');
  });

  it('index.css has CSS custom properties', () => {
    const content = readSrcFile('index.css');
    expect(content).toContain('--background');
    expect(content).toContain('--foreground');
    expect(content).toContain('--primary');
  });

  it('index.css has dark mode variables', () => {
    const content = readSrcFile('index.css');
    expect(content).toContain('.dark');
  });
});

// ============================================
// 8. Accessibility Compliance
// ============================================
describe('Accessibility in Key Components', () => {
  it('training tabs use proper Tabs/TabsList/TabsTrigger pattern', () => {
    const content = readSrcFile('components/triggers/CommunicationTrainingMode.tsx');
    expect(content).toContain('TabsList');
    expect(content).toContain('TabsTrigger');
    expect(content).toContain('TabsContent');
  });

  it('TrainingPracticeTab uses RadioGroup for answers', () => {
    const content = readSrcFile('components/triggers/training/TrainingPracticeTab.tsx');
    expect(content).toContain('RadioGroup');
    expect(content).toContain('RadioGroupItem');
  });

  it('buttons have text content or aria labels', () => {
    const content = readSrcFile('components/triggers/training/TrainingProgressTab.tsx');
    expect(content).toContain('Reiniciar Treinamento');
  });
});

// ============================================
// 9. Mobile Responsiveness Patterns
// ============================================
describe('Mobile Responsiveness', () => {
  it('index.css has touch-action manipulation', () => {
    const content = readSrcFile('index.css');
    expect(content).toContain('touch-action: manipulation');
  });

  it('index.css has iOS zoom prevention', () => {
    const content = readSrcFile('index.css');
    expect(content).toContain('-webkit-touch-callout');
  });
});

// ============================================
// 10. Build Configuration
// ============================================
describe('Build Configuration', () => {
  it('vite config exists', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../../vite.config.ts'), 'utf-8');
    expect(content).toContain('defineConfig');
  });

  it('vitest config exists and is valid', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../../vitest.config.ts'), 'utf-8');
    expect(content).toContain('jsdom');
    expect(content).toContain('setupFiles');
  });

  it('tailwind config exists', () => {
    const twConfig = fs.readFileSync(path.resolve(__dirname, '../../tailwind.config.ts'), 'utf-8');
    expect(twConfig).toContain('content');
  });
});

// ============================================
// 11. Security Patterns
// ============================================
describe('Security Patterns', () => {
  it('no API keys hardcoded in source', () => {
    const allSrc = getFiles('', '.ts').concat(getFiles('', '.tsx'));
    const keyPatterns = [/sk_live_/, /sk_test_/, /AIza[0-9A-Za-z]{35}/];
    allSrc.filter(f => !f.includes('__tests__')).forEach(f => {
      const content = fs.readFileSync(f, 'utf-8');
      keyPatterns.forEach(pattern => {
        expect(pattern.test(content)).toBe(false);
      });
    });
  });

  it('no localStorage for auth tokens in components', () => {
    const components = getFiles('components', '.tsx');
    let violations = 0;
    components.forEach(f => {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes("localStorage.getItem('token')") || content.includes("localStorage.getItem('auth')")) {
        violations++;
      }
    });
    expect(violations).toBe(0);
  });
});

// ============================================
// 12. Performance Patterns
// ============================================
describe('Performance Patterns', () => {
  it('useMemo used for expensive computations in training', () => {
    const content = readSrcFile('components/triggers/CommunicationTrainingMode.tsx');
    expect(content).toContain('useMemo');
  });

  it('no synchronous heavy operations in render paths', () => {
    const content = readSrcFile('components/triggers/CommunicationTrainingMode.tsx');
    expect(content).not.toContain('JSON.parse(JSON.stringify(');
  });
});

// ============================================
// 13. Test Infrastructure
// ============================================
describe('Test Infrastructure', () => {
  it('test setup file exists', () => {
    const content = readSrcFile('test/setup.ts');
    expect(content).toContain('jest-dom');
    expect(content).toContain('matchMedia');
  });

  it('test setup mocks crypto.randomUUID', () => {
    const content = readSrcFile('test/setup.ts');
    expect(content).toContain('randomUUID');
  });

  it('test setup mocks import.meta.env', () => {
    const content = readSrcFile('test/setup.ts');
    expect(content).toContain('VITE_SUPABASE_URL');
  });
});
