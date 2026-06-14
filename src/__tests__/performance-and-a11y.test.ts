/**
 * Tests for performance optimizations and accessibility improvements.
 * Validates React.memo wrappers, lazy loading, aria-labels, and SkipNav.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../..');
const read = (p: string) => readFileSync(join(root, p), 'utf-8');

describe('Performance Optimizations', () => {
  it('CompanyListItem uses React.memo', () => {
    const src = read('src/components/companies/CompanyListItem.tsx');
    expect(src).toContain('React.memo');
  });

  it('CompaniesTableView uses React.memo', () => {
    const src = read('src/components/companies/CompaniesTableView.tsx');
    expect(src).toContain('React.memo');
  });

  it('ContactsTableView uses React.memo', () => {
    const src = read('src/components/contacts/ContactsTableView.tsx');
    expect(src).toContain('React.memo');
  });

  it('DashboardStatsGrid uses React.memo', () => {
    const src = read('src/components/dashboard/DashboardStatsGrid.tsx');
    expect(src).toContain('React.memo');
  });

  it('all company logos have loading="lazy"', () => {
    const listItem = read('src/components/companies/CompanyListItem.tsx');
    const tableView = read('src/components/companies/CompaniesTableView.tsx');
    // Every <img in these files should have loading="lazy"
    const imgTags1 = listItem.match(/<img [^>]+>/g) || [];
    const imgTags2 = tableView.match(/<img [^>]+>/g) || [];
    [...imgTags1, ...imgTags2].forEach(tag => {
      expect(tag).toContain('loading="lazy"');
    });
  });

  it('all company logos have decoding="async"', () => {
    const listItem = read('src/components/companies/CompanyListItem.tsx');
    const tableView = read('src/components/companies/CompaniesTableView.tsx');
    const imgTags1 = listItem.match(/<img [^>]+>/g) || [];
    const imgTags2 = tableView.match(/<img [^>]+>/g) || [];
    [...imgTags1, ...imgTags2].forEach(tag => {
      expect(tag).toContain('decoding="async"');
    });
  });

  it('all company logos have proper alt text', () => {
    const listItem = read('src/components/companies/CompanyListItem.tsx');
    const tableView = read('src/components/companies/CompaniesTableView.tsx');
    const imgTags1 = listItem.match(/<img [^>]+>/g) || [];
    const imgTags2 = tableView.match(/<img [^>]+>/g) || [];
    [...imgTags1, ...imgTags2].forEach(tag => {
      // alt="" is acceptable for decorative but we prefer meaningful alt
      expect(tag).toMatch(/alt=/);
      // Should not have empty alt for logos
      expect(tag).not.toContain('alt=""');
    });
  });
});

describe('Accessibility Improvements', () => {
  it('SkipNav component exists', () => {
    const src = read('src/components/navigation/SkipNav.tsx');
    expect(src).toContain('main-content');
    expect(src).toContain('sr-only');
    expect(src).toContain('focus:not-sr-only');
  });

  it('SkipNav is included in the app composition root', () => {
    const app = read('src/app/AppProviders.tsx');
    expect(app).toContain('SkipNav');
    expect(app).toContain('@/components/navigation/SkipNav');
  });

  it('main content has id="main-content" and tabIndex', () => {
    const layout = read('src/components/layout/AppLayout.tsx');
    expect(layout).toContain('id="main-content"');
    expect(layout).toContain('tabIndex={-1}');
  });

  it('CompaniesTableView has aria-label', () => {
    const src = read('src/components/companies/CompaniesTableView.tsx');
    expect(src).toContain('aria-label="Lista de empresas"');
  });

  it('ContactsTableView has aria-label', () => {
    const src = read('src/components/contacts/ContactsTableView.tsx');
    expect(src).toContain('aria-label="Lista de contatos"');
  });

  it('AriaLiveProvider is in the app composition root', () => {
    const app = read('src/app/AppProviders.tsx');
    expect(app).toContain('AriaLiveProvider');
  });

  it('RouteAnnouncer is in the app composition root', () => {
    const app = read('src/app/AppProviders.tsx');
    expect(app).toContain('RouteAnnouncer');
  });
});
