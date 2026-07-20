/**
 * SINGU Design System Audit Tests
 * Validates all P0 design improvements across the codebase
 * 
 * Categories:
 * 1. Semantic Token Compliance (no hardcoded colors in non-print components)
 * 2. Accessibility (aria-labels, roles, focus management)
 * 3. Mobile UX (touch-manipulation, font sizes, iOS zoom prevention)
 * 4. Component Token Usage Validation
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Helper: recursively find all .tsx files in a directory
function findTsxFiles(dir: string, results: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        findTsxFiles(fullPath, results);
      } else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
        results.push(fullPath);
      }
    }
  } catch { /* ignore */ }
  return results;
}

// Files intentionally excluded from semantic token enforcement
const EXCLUDED_FILES = [
  'RelatorioContato.tsx', // Print/PDF page requires absolute colors
];

const COMPONENTS_DIR = path.resolve(__dirname, '../components');
const PAGES_DIR = path.resolve(__dirname, '../pages');

const componentFiles = findTsxFiles(COMPONENTS_DIR);
const pageFiles = findTsxFiles(PAGES_DIR);
const allFiles = [...componentFiles, ...pageFiles];

// Filter out excluded files
const auditableFiles = allFiles.filter(f => 
  !EXCLUDED_FILES.some(ex => f.endsWith(ex))
);

describe('Design System Audit - Semantic Token Compliance', () => {
  
  describe('text-white usage', () => {
    const allowedFiles = ['button.tsx']; // glass variant is intentional
    const filesToCheck = auditableFiles.filter(f => 
      !allowedFiles.some(a => f.endsWith(a))
    );

    it.each(filesToCheck.map(f => [path.basename(f), f]))(
      '%s should not use text-white (use text-primary-foreground or text-*-foreground)',
      (_name, filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/text-white(?!\/)/g) || [];
        expect(matches.length).toBe(0);
      }
    );
  });

  describe('bg-gray-* usage', () => {
    it.each(auditableFiles.map(f => [path.basename(f), f]))(
      '%s should not use bg-gray-* (use bg-muted, bg-card, bg-background)',
      (_name, filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/bg-gray-\d+/g) || [];
        expect(matches.length).toBe(0);
      }
    );
  });

  describe('text-black usage', () => {
    it.each(auditableFiles.map(f => [path.basename(f), f]))(
      '%s should not use text-black (use text-foreground)',
      (_name, filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        // text-black is ok, but not text-black without opacity
        const matches = (content.match(/\btext-black\b/g) || []);
        expect(matches.length).toBe(0);
      }
    );
  });
});

describe('Design System Audit - Accessibility', () => {
  
  it('MobileHeader bell button has aria-label', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'layout/MobileHeader.tsx'), 'utf8'
    );
    expect(content).toContain('aria-label');
  });

  it('Input component has touch-manipulation', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'ui/input.tsx'), 'utf8'
    );
    expect(content).toContain('touch-manipulation');
  });

  it('Sidebar Zap icon has aria-hidden', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'layout/AppSidebar.tsx'), 'utf8'
    );
    expect(content).toMatch(/aria-hidden|aria-label/);
  });

  it('main.tsx should NOT have duplicate skip-navigation', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../main.tsx'), 'utf8'
    );
    // Match only accessibility skip-nav patterns (not service-worker `skipWaiting` / `SKIP_WAITING`)
    const skipNavCount = (content.match(/SkipNav|skip-to-content|skip-link|skip-navigation/gi) || []).length;
    expect(skipNavCount).toBeLessThanOrEqual(1);
  });
});

describe('Design System Audit - iOS & Mobile UX', () => {
  
  it('index.css has iOS auto-zoom prevention', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../index.css'), 'utf8'
    );
    expect(content).toContain('-webkit-touch-callout');
    expect(content).toContain('font-size: 16px');
  });

  it('index.css has touch-manipulation on interactive elements', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../index.css'), 'utf8'
    );
    expect(content).toContain('touch-action: manipulation');
  });
});

describe('Design System Audit - Gradient Token Usage', () => {
  
  it('LuxButton uses bg-gradient-premium not hardcoded violet/fuchsia', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'lux/LuxButton.tsx'), 'utf8'
    );
    expect(content).not.toContain('from-violet-');
    expect(content).not.toContain('to-fuchsia-');
  });

  it('LuxIntelligencePanel uses gradient tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'lux/LuxIntelligencePanel.tsx'), 'utf8'
    );
    expect(content).not.toContain('from-indigo-500 to-violet-500');
    expect(content).not.toContain('from-violet-500 to-fuchsia-500');
  });
});

describe('Design System Audit - Status Color Tokens', () => {
  
  it('PortfolioHealthDashboard uses semantic status colors', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'dashboard/PortfolioHealthDashboard.tsx'), 'utf8'
    );
    expect(content).toContain('bg-success');
    expect(content).toContain('bg-warning');
    expect(content).toContain('bg-destructive');
    expect(content).not.toMatch(/text-white.*overallStatus/);
  });

  it('ClientHealthPanel uses semantic risk colors', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'analytics/ClientHealthPanel.tsx'), 'utf8'
    );
    expect(content).not.toContain('bg-orange-500 text-white');
  });

  it('DISCTrainingMode uses semantic success/destructive', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'disc/DISCTrainingMode.tsx'), 'utf8'
    );
    expect(content).toContain('bg-success');
    expect(content).toContain('bg-destructive');
    expect(content).not.toContain('bg-green-500 text-white');
    expect(content).not.toContain('bg-red-500 text-white');
  });

  it('AnimatedCounter uses semantic foreground tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'micro-interactions/AnimatedCounter.tsx'), 'utf8'
    );
    expect(content).toContain('text-success-foreground');
    expect(content).toContain('text-warning-foreground');
  });
});

describe('Design System Audit - Component Semantic Tokens', () => {
  
  it('FloatingQuickActions uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'quick-actions/FloatingQuickActions.tsx'), 'utf8'
    );
    expect(content).not.toContain('bg-blue-500');
    expect(content).not.toContain('bg-emerald-500');
  });

  it('QuickAddButton uses semantic color tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'quick-add/QuickAddButton.tsx'), 'utf8'
    );
    expect(content).toContain('bg-primary');
    expect(content).toContain('bg-success');
    expect(content).toContain('bg-warning');
    expect(content).not.toContain('bg-amber-500');
    expect(content).not.toContain('bg-blue-500');
  });

  it('relationship-stage uses bg-muted not bg-gray', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'ui/relationship-stage.tsx'), 'utf8'
    );
    expect(content).not.toContain('bg-gray-');
  });

  it('InteractionCardMemo uses semantic muted tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'interactions/InteractionCardMemo.tsx'), 'utf8'
    );
    expect(content).not.toContain('bg-gray-');
  });

  it('legacy skin theme files are hard deleted', () => {
    const legacyThemeFiles = [
      path.resolve(COMPONENTS_DIR, 'settings/theme/PresetCard.tsx'),
      path.resolve(COMPONENTS_DIR, 'settings/theme/BorderRadiusControl.tsx'),
      path.resolve(COMPONENTS_DIR, 'settings/theme/useThemePreset.ts'),
      path.resolve(COMPONENTS_DIR, 'settings/theme/presets.ts'),
    ];

    legacyThemeFiles.forEach((filePath) => {
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });

  it('ThemeProvider uses Nexus bootstrap and no legacy storage key', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'theme/ThemeProvider.tsx'), 'utf8'
    );
    expect(content).toContain('ACTIVE_THEME_STORAGE_KEY');
    expect(content).toContain('applyThemeToDocument');
    expect(content).not.toContain('storageKey = "relateiq-theme"');
  });

  it('stat-card uses semantic foreground tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'ui/stat-card.tsx'), 'utf8'
    );
    expect(content).toContain('text-foreground');
    expect(content).toContain('text-muted-foreground');
    expect(content).not.toMatch(/gradient.*text-white/);
  });

  it('badge gradient variant uses text-primary-foreground', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'ui/badge.tsx'), 'utf8'
    );
    expect(content).toMatch(/gradient.*text-primary-foreground/);
    expect(content).toMatch(/premium.*text-primary-foreground/);
  });
});

describe('Design System Audit - Page Level Tokens', () => {
  
  it('Auth page uses text-primary-foreground on branded panel', () => {
    const content = fs.readFileSync(
      path.resolve(PAGES_DIR, 'Auth.tsx'), 'utf8'
    );
    expect(content).toContain('text-primary-foreground');
    expect(content).not.toMatch(/text-white\/60/);
    expect(content).not.toMatch(/text-white\/80/);
    expect(content).not.toMatch(/text-white\/65/);
  });

  it('EmpresaDetalhe uses primary-foreground tokens', () => {
    const content = fs.readFileSync(
      path.resolve(PAGES_DIR, 'EmpresaDetalhe.tsx'), 'utf8'
    );
    expect(content).toContain('text-primary-foreground');
    expect(content).toContain('bg-primary-foreground/10');
    expect(content).not.toContain('bg-white/10');
    expect(content).not.toContain('text-white');
  });

  it('Onboarding page uses text-primary-foreground', () => {
    const content = fs.readFileSync(
      path.resolve(PAGES_DIR, 'Onboarding.tsx'), 'utf8'
    );
    expect(content).toContain('text-primary-foreground');
  });
});

describe('Design System Audit - NLP Components', () => {
  
  it('SwishPatternGenerator uses bg-success not bg-lime-500', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'nlp/SwishPatternGenerator.tsx'), 'utf8'
    );
    expect(content).toContain('bg-success');
    expect(content).not.toContain('bg-lime-500 text-white');
  });

  it('MiltonianCalibration uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'nlp/MiltonianCalibration.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('WellFormedOutcomeBuilder uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'nlp/WellFormedOutcomeBuilder.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('NLPEvolutionTimeline uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'nlp/NLPEvolutionTimeline.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });
});

describe('Design System Audit - Analytics Components', () => {
  
  it('ChurnPredictionPanel uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'analytics/ChurnPredictionPanel.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('AccountChurnPredictionPanel uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'analytics/AccountChurnPredictionPanel.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('CognitiveBiasesPanel uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'analytics/CognitiveBiasesPanel.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('RFMAnalysisPanel uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'analytics/RFMAnalysisPanel.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('ClosingScoreRanking uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'analytics/ClosingScoreRanking.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('ApproachRecommendationPanel uses text-primary-foreground', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'analytics/ApproachRecommendationPanel.tsx'), 'utf8'
    );
    expect(content).toContain('text-primary-foreground');
  });
});

describe('Design System Audit - Onboarding Components', () => {
  
  it('OnboardingWizard uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'onboarding/OnboardingWizard.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('WelcomeStep uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'onboarding/steps/WelcomeStep.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('CompletionStep uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'onboarding/steps/CompletionStep.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('ImportStep uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'onboarding/steps/ImportStep.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });

  it('PreferencesStep uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'onboarding/steps/PreferencesStep.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });
});

describe('Design System Audit - Neuromarketing Components', () => {
  
  it('NeuroHeatmapCalendar uses bg-success not bg-green-500 text-white', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'neuromarketing/NeuroHeatmapCalendar.tsx'), 'utf8'
    );
    expect(content).not.toContain('bg-green-500 text-white');
  });

  it('NeuroTooltipSystem uses text-primary-foreground', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'neuromarketing/NeuroTooltipSystem.tsx'), 'utf8'
    );
    expect(content).toContain('text-primary-foreground');
  });
});

describe('Design System Audit - Layout Components', () => {
  
  it('Sidebar uses text-primary-foreground on Zap icon', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'layout/AppSidebar.tsx'), 'utf8'
    );
    expect(content).toMatch(/text-primary-foreground|text-primary|foreground/);
    expect(content).not.toMatch(/Zap.*text-white/);
  });

  it('MobileHeader uses text-primary-foreground on brand icon', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'layout/MobileHeader.tsx'), 'utf8'
    );
    expect(content).toContain('text-primary-foreground');
  });
});

describe('Design System Audit - Stakeholder Components', () => {
  
  it('StakeholderAlertsList uses bg-warning not bg-orange-500', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'stakeholders/StakeholderAlertsList.tsx'), 'utf8'
    );
    expect(content).toContain('bg-warning');
    expect(content).not.toContain('bg-orange-500 text-white');
  });
});

describe('Design System Audit - CompanyCard', () => {
  
  it('CompanyCardWithContext uses text-primary-foreground', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'company-card/CompanyCardWithContext.tsx'), 'utf8'
    );
    expect(content).toContain('text-primary-foreground');
    expect(content).not.toMatch(/bg-gradient-primary.*text-white/);
  });
});

describe('Design System Audit - WhatsNew & PWA', () => {
  
  it('WhatsNewModal close button uses primary-foreground', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'features/WhatsNewModal.tsx'), 'utf8'
    );
    expect(content).toContain('text-primary-foreground');
    expect(content).not.toContain('text-white/80');
  });

  it('PWAComponents uses semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'pwa/PWAComponents.tsx'), 'utf8'
    );
    expect(content).not.toContain('text-white');
  });
});

describe('Design System Audit - Contact Detail', () => {
  
  it('ContactDetailHeader uses text-primary-foreground for score', () => {
    const content = fs.readFileSync(
      path.resolve(COMPONENTS_DIR, 'contact-detail/ContactDetailHeader.tsx'), 'utf8'
    );
    expect(content).toContain('text-primary-foreground');
    expect(content).not.toMatch(/rounded-full.*text-white.*ring/);
  });
});

describe('Design System Audit - CSS Variables Integrity', () => {
  
  it('index.css defines all required semantic tokens', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../index.css'), 'utf8'
    );
    const requiredTokens = [
      '--background', '--foreground',
      '--primary', '--primary-foreground',
      '--secondary', '--secondary-foreground',
      '--muted', '--muted-foreground',
      '--accent', '--accent-foreground',
      '--success', '--success-foreground',
      '--warning', '--warning-foreground',
      '--destructive', '--destructive-foreground',
      '--info', '--info-foreground',
      '--card', '--card-foreground',
      '--popover', '--popover-foreground',
      '--border', '--input', '--ring',
    ];
    
    for (const token of requiredTokens) {
      expect(content).toContain(token);
    }
  });

  it('index.css defines glass and surface utilities', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../index.css'), 'utf8'
    );
    expect(content).toContain('--glass-bg');
    expect(content).toContain('--glass-blur');
    expect(content).toContain('--surface-0');
  });

  it('index.css has dark mode definitions', () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../index.css'), 'utf8'
    );
    expect(content).toContain('.dark');
  });
});
