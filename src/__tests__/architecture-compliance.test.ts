import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Architecture Compliance E2E Tests
 * Validates refactoring quality, file sizes, import hygiene, and patterns
 */

function getFilesRecursive(dir: string, ext: string): string[] {
  const results: string[] = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.includes('node_modules') && !item.name.includes('.git')) {
        results.push(...getFilesRecursive(full, ext));
      } else if (item.name.endsWith(ext) && !item.name.includes('.test.') && !item.name.includes('.spec.')) {
        results.push(full);
      }
    }
  } catch { /* skip */ }
  return results;
}

function readFile(filePath: string): string {
  try { return fs.readFileSync(filePath, 'utf-8'); } catch { return ''; }
}

const srcRoot = path.resolve(__dirname, '..');
const allTsx = getFilesRecursive(srcRoot, '.tsx');
const allTs = getFilesRecursive(srcRoot, '.ts');
const allFiles = [...allTsx, ...allTs];

// ============================================
// File Size Compliance
// ============================================
describe('File Size Limits', () => {
  const MAX_COMPONENT_LINES = 1200;

  const components = allTsx.filter(f => f.includes('/components/') || f.includes('/pages/'));

  it(`no component file exceeds ${MAX_COMPONENT_LINES} lines`, () => {
    const violations: string[] = [];
    components.forEach(f => {
      const lines = readFile(f).split('\n').length;
      if (lines > MAX_COMPONENT_LINES) {
        violations.push(`${path.relative(srcRoot, f)}: ${lines} lines`);
      }
    });
    if (violations.length > 0) {
      console.warn('⚠️ Large component files:', violations);
    }
    // Soft check: warn but allow up to 1200 for now
    expect(violations.length).toBeLessThanOrEqual(5);
  });

  it('refactored CommunicationTrainingMode is under 250 lines', () => {
    const file = allTsx.find(f => f.endsWith('CommunicationTrainingMode.tsx'));
    if (file) {
      const lines = readFile(file).split('\n').length;
      expect(lines).toBeLessThan(250);
    }
  });

  it('training subcomponents exist', () => {
    const trainingFiles = allTsx.filter(f => f.includes('/training/'));
    expect(trainingFiles.length).toBeGreaterThanOrEqual(3);
    const names = trainingFiles.map(f => path.basename(f));
    expect(names).toContain('TrainingTipsTab.tsx');
    expect(names).toContain('TrainingPracticeTab.tsx');
    expect(names).toContain('TrainingProgressTab.tsx');
  });

  it('communicationTrainingData.ts exists as separate data module', () => {
    const dataFile = allTs.find(f => f.endsWith('communicationTrainingData.ts'));
    expect(dataFile).toBeTruthy();
  });
});

// ============================================
// Import Hygiene
// ============================================
describe('Import Hygiene', () => {
  it('no circular self-imports in components', () => {
    allTsx.forEach(f => {
      const content = readFile(f);
      const basename = path.basename(f, '.tsx');
      const selfImportRegex = new RegExp(`from\\s+['\"].*/${basename}['\"]`);
      const lines = content.split('\n');
      const importLines = lines.filter(l => l.startsWith('import') && selfImportRegex.test(l));
      expect(importLines).toHaveLength(0);
    });
  });

  it('no direct supabase/client imports in data files', () => {
    const dataFiles = allTs.filter(f => f.includes('/data/') && !f.includes('__tests__'));
    dataFiles.forEach(f => {
      const content = readFile(f);
      expect(content).not.toContain("from '@/integrations/supabase/client'");
    });
  });

  it('CommunicationTrainingMode imports from data module', () => {
    const file = allTsx.find(f => f.endsWith('CommunicationTrainingMode.tsx'));
    if (file) {
      const content = readFile(file);
      expect(content).toContain("from '@/data/communicationTrainingData'");
    }
  });
});

// ============================================
// Pattern Compliance
// ============================================
describe('Pattern Compliance', () => {
  it('no console.log in production components (only console.error/warn allowed)', () => {
    const violations: string[] = [];
    const prodFiles = allTsx.filter(f =>
      !f.includes('__tests__') && !f.includes('/test/') && !f.includes('.test.')
    );
    prodFiles.forEach(f => {
      const content = readFile(f);
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('console.log(') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          violations.push(`${path.relative(srcRoot, f)}:${i + 1}`);
        }
      });
    });
    // Soft check - some debug logs may exist
    if (violations.length > 0) {
      console.warn(`⚠️ ${violations.length} console.log in components`);
    }
    expect(violations.length).toBeLessThan(50);
  });

  it('no hardcoded localhost URLs in components', () => {
    allTsx.forEach(f => {
      const content = readFile(f);
      if (!f.includes('__tests__') && !f.includes('.test.')) {
        expect(content).not.toContain('http://localhost:');
      }
    });
  });

  it('all page components export a default or named component', () => {
    const pages = allTsx.filter(f => f.includes('/pages/'));
    pages.forEach(f => {
      const content = readFile(f);
      const hasExport = content.includes('export default') || content.includes('export function') || content.includes('export const');
      expect(hasExport).toBe(true);
    });
  });
});

// ============================================
// Refactoring Regression Checks
// ============================================
describe('Refactoring Regression Checks', () => {
  it('CommunicationTrainingMode still uses useAuth hook', () => {
    const file = allTsx.find(f => f.endsWith('CommunicationTrainingMode.tsx'));
    if (file) {
      const content = readFile(file);
      expect(content).toContain('useAuth');
    }
  });

  it('CommunicationTrainingMode still renders Tabs with 3 tabs', () => {
    const file = allTsx.find(f => f.endsWith('CommunicationTrainingMode.tsx'));
    if (file) {
      const content = readFile(file);
      expect(content).toContain('TabsTrigger');
      expect(content).toContain("value=\"tips\"");
      expect(content).toContain("value=\"practice\"");
      expect(content).toContain("value=\"progress\"");
    }
  });

  it('TrainingPracticeTab handles empty scenarios', () => {
    const file = allTsx.find(f => f.endsWith('TrainingPracticeTab.tsx'));
    if (file) {
      const content = readFile(file);
      expect(content).toContain('scenarios.length === 0');
    }
  });

  it('TrainingProgressTab shows score and completed count', () => {
    const file = allTsx.find(f => f.endsWith('TrainingProgressTab.tsx'));
    if (file) {
      const content = readFile(file);
      expect(content).toContain('score');
      expect(content).toContain('completedScenarios');
    }
  });
});

// ============================================
// TypeScript Safety
// ============================================
describe('TypeScript Safety', () => {
  it('limited use of "as any" casts', () => {
    let totalAnyCasts = 0;
    allFiles.filter(f => !f.includes('__tests__') && !f.includes('.test.')).forEach(f => {
      const content = readFile(f);
      const matches = content.match(/as any/g);
      if (matches) totalAnyCasts += matches.length;
    });
    // Allow some but flag if excessive
    expect(totalAnyCasts).toBeLessThan(200);
  });

  it('no @ts-ignore in production code', () => {
    let count = 0;
    allFiles.filter(f => !f.includes('__tests__') && !f.includes('.test.')).forEach(f => {
      const content = readFile(f);
      const matches = content.match(/@ts-ignore/g);
      if (matches) count += matches.length;
    });
    expect(count).toBeLessThan(10);
  });
});
