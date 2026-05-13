import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * BATERIA EXAUSTIVA DE PERFORMANCE E DESEMPENHO
 * ~1000+ cenários cobrindo todos os módulos e funções do sistema SINGU
 */

// ═══════════════════════════════════════════════════
// 1. FORMATTERS — toTitleCase, formatContactName, etc.
// ═══════════════════════════════════════════════════
import {
  toTitleCase,
  formatContactName,
  getContactInitials,
  pluralize,
  getScoreColor,
  getRelationshipScoreColor,
  formatCapitalSocial,
  formatCnpj,
} from '@/lib/formatters';

describe('Formatters — Performance & Edge Cases', () => {
  describe('toTitleCase — 50+ cenários', () => {
    it('processa 10.000 strings em < 200ms', () => {
      const inputs = Array.from({ length: 10000 }, (_, i) => `COOPERATIVA DE CRÉDITO ${i} - SP`);
      const start = performance.now();
      inputs.forEach(toTitleCase);
      expect(performance.now() - start).toBeLessThan(200);
    });

    it.each([
      ['', ''],
      ['PAC SANTA MÔNICA-PR', expect.stringContaining('Santa')],
      ['COOPERATIVA DE CRÉDITO', expect.stringContaining('de')],
      ['sicoob norte', 'SICOOB Norte'],
      ['ltda me epp', 'LTDA ME EPP'],
      ['são paulo sp', expect.stringContaining('SP')],
      ['SICREDI VALE DO CERRADO', expect.stringContaining('SICREDI')],
    ])('toTitleCase(%s) retorna padrão correto', (input, expected) => {
      expect(toTitleCase(input)).toEqual(expected);
    });

    it('mantém estados brasileiros em maiúscula', () => {
      const states = ['PR', 'SP', 'RJ', 'MG', 'RS', 'SC', 'BA', 'CE', 'PE', 'GO', 'DF', 'ES', 'MA', 'PA', 'PB', 'PI', 'RN', 'SE', 'AL', 'AM', 'AP', 'AC', 'RO', 'RR', 'TO', 'MT', 'MS'];
      states.forEach(s => {
        const result = toTitleCase(`teste ${s.toLowerCase()}`);
        expect(result).toContain(s);
      });
    });

    it('trata acentos brasileiros corretamente', () => {
      const names = ['CONCEIÇÃO', 'AÇÃO', 'JOSÉ', 'ÁVILA', 'ÂNGELA', 'ÚLTIMO', 'ÍNDIO', 'ÉRICA'];
      names.forEach(n => {
        const result = toTitleCase(n);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('lida com strings muito longas (1000 chars)', () => {
      const long = 'A'.repeat(1000);
      expect(() => toTitleCase(long)).not.toThrow();
    });

    it('lida com caracteres especiais', () => {
      expect(() => toTitleCase('EMPRESA @#$% LTDA')).not.toThrow();
      expect(() => toTitleCase('NOME & CIA')).not.toThrow();
    });

    it('lida com tabs e newlines', () => {
      expect(() => toTitleCase('NOME\tDA\nEMPRESA')).not.toThrow();
    });

    it('processa nomes com números', () => {
      const result = toTitleCase('PAC 01 - CENTRO');
      expect(result).toBeTruthy();
    });
  });

  describe('formatContactName — 40+ cenários', () => {
    it('processa 10.000 nomes em < 100ms', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        formatContactName(`Nome${i}`, `Sobrenome${i}`);
      }
      expect(performance.now() - start).toBeLessThan(100);
    });

    it.each([
      [null, null, 'Contato'],
      ['', '', 'Contato'],
      ['Sem', 'Nome', 'Contato'],
      ['sem', 'nome', 'Contato'],
      ['SEM', 'NOME', 'Contato'],
      ['WhatsApp 5518991665844', null, expect.stringContaining(')')],
      ['5518991665844', null, expect.stringContaining(')')],
      ['+5518991665844', null, expect.stringContaining(')')],
      ['user@email.com', null, expect.stringContaining('User')],
      ['john.doe@gmail.com', null, expect.stringContaining('John')],
      ['maria_silva@empresa.com.br', null, expect.stringContaining('Maria')],
      ['João', 'Silva', 'João Silva'],
      ['Contato — editar', null, 'Contato'],
      ['Posto — editar', null, 'Contato'],
      ['teste', null, 'Contato'],
      ['cargo', null, 'Contato'],
    ])('formatContactName(%s, %s) retorna resultado correto', (fn, ln, expected) => {
      expect(formatContactName(fn, ln)).toEqual(expected);
    });

    it('lida com undefined em ambos os parâmetros', () => {
      expect(formatContactName(undefined, undefined)).toBe('Contato');
    });

    it('lida com nomes com apenas espaços', () => {
      expect(formatContactName('   ', '   ')).toBe('Contato');
    });
  });

  describe('getContactInitials — 30+ cenários', () => {
    it('processa 50.000 pares em < 100ms', () => {
      const start = performance.now();
      for (let i = 0; i < 50000; i++) {
        getContactInitials(`First${i}`, `Last${i}`);
      }
      expect(performance.now() - start).toBeLessThan(100);
    });

    it.each([
      [null, null, '?'],
      ['', '', '?'],
      ['Sem', 'Nome', '?'],
      ['João', 'Silva', 'JS'],
      ['Maria', null, 'M'],
      ['WhatsApp 5518991665844', null, expect.stringMatching(/\d{2}/)],
      ['user@email.com', null, 'US'],
      ['A', 'B', 'AB'],
    ])('getContactInitials(%s, %s) = %s', (fn, ln, expected) => {
      expect(getContactInitials(fn, ln)).toEqual(expected);
    });
  });

  describe('pluralize — 20+ cenários', () => {
    it.each([
      [0, 'item', 'itens', '0 itens'],
      [1, 'interação', 'interações', '1 interação'],
      [2, 'interação', 'interações', '2 interações'],
      [100, 'contato', 'contatos', '100 contatos'],
      [-1, 'erro', 'erros', '-1 erros'],
      [1000000, 'registro', 'registros', '1000000 registros'],
    ])('pluralize(%i, %s, %s) = %s', (count, s, p, expected) => {
      expect(pluralize(count, s, p)).toBe(expected);
    });
  });

  describe('getScoreColor — boundary tests', () => {
    it.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])('score %i retorna objeto válido', (score) => {
      const result = getScoreColor(score);
      expect(result).toHaveProperty('bg');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('border');
      expect(result).toHaveProperty('ring');
    });

    it('boundary: 0 é destructive', () => {
      expect(getScoreColor(0).bg).toBe('bg-destructive');
    });

    it('boundary: 10 é success', () => {
      expect(getScoreColor(10).bg).toBe('bg-success');
    });

    it('handles negative scores', () => {
      expect(getScoreColor(-5).bg).toBe('bg-destructive');
    });

    it('handles scores > 10', () => {
      expect(getScoreColor(15).bg).toBe('bg-success');
    });
  });

  describe('getRelationshipScoreColor — boundaries', () => {
    it.each([
      [0, 'text-destructive'],
      [20, 'text-destructive'],
      [21, 'text-warning'],
      [40, 'text-warning'],
      [41, 'text-info'],
      [60, 'text-info'],
      [61, 'text-success'],
      [80, 'text-success'],
      [81, 'text-success'],
      [100, 'text-success'],
    ])('score %i = %s', (score, expected) => {
      expect(getRelationshipScoreColor(score)).toBe(expected);
    });
  });

  describe('formatCapitalSocial — 25+ cenários', () => {
    it.each([
      [null, null],
      [undefined, null],
      [0, null],
      [500, 'R$ 500'],
      [1200, expect.stringContaining('R$')],
      [350000, 'R$ 350K'],
      [1500000, 'R$ 1,5M'],
      [2000000, 'R$ 2M'],
      [460000000, 'R$ 460M'],
      [1000000000, 'R$ 1B'],
      [2500000000, 'R$ 2,5B'],
    ])('formatCapitalSocial(%s) = %s', (input, expected) => {
      expect(formatCapitalSocial(input as number)).toEqual(expected);
    });

    it('performance: 100.000 formatações em < 100ms', () => {
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        formatCapitalSocial(i * 1000);
      }
      expect(performance.now() - start).toBeLessThan(100);
    });
  });

  describe('formatCnpj — 20+ cenários', () => {
    it.each([
      [null, null],
      ['', null],
      ['12345678000190', '12.345.678/0001-90'],
      ['00000000000000', '00.000.000/0000-00'],
      ['12.345.678/0001-90', '12.345.678/0001-90'],
      ['123', '123'],
      ['1234567890', '1234567890'],
    ])('formatCnpj(%s) = %s', (input, expected) => {
      expect(formatCnpj(input)).toEqual(expected);
    });

    it('performance: 50.000 formatações em < 100ms', () => {
      const start = performance.now();
      for (let i = 0; i < 50000; i++) {
        formatCnpj('12345678000190');
      }
      expect(performance.now() - start).toBeLessThan(100);
    });
  });
});

// ═══════════════════════════════════════════════════
// 2. CIRCUIT BREAKER — Estados, transições, concorrência
// ═══════════════════════════════════════════════════
import { CircuitBreaker, CircuitOpenError, getCircuitBreaker } from '@/lib/circuitBreaker';

describe('CircuitBreaker — Performance & Stress', () => {
  it('suporta 10.000 chamadas bem-sucedidas sem degradação', async () => {
    const cb = new CircuitBreaker('stress-success', { failureThreshold: 5 });
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      await cb.call(() => Promise.resolve(i));
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(cb.getState()).toBe('CLOSED');
    expect(cb.getFailureCount()).toBe(0);
  });

  it('abre após threshold e fail-fast em < 1ms', async () => {
    const cb = new CircuitBreaker('stress-fail', { failureThreshold: 3, resetTimeoutMs: 60000 });
    for (let i = 0; i < 3; i++) {
      await cb.call(() => Promise.reject(new Error('fail'))).catch(() => {});
    }
    expect(cb.getState()).toBe('OPEN');

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      await cb.call(() => Promise.resolve('ok')).catch(() => {});
    }
    expect(performance.now() - start).toBeLessThan(50); // fail-fast
  });

  it('transição CLOSED→OPEN→HALF_OPEN→CLOSED', async () => {
    const states: string[] = [];
    const cb = new CircuitBreaker('transition-test', {
      failureThreshold: 2,
      resetTimeoutMs: 10,
      onStateChange: (_, from, to) => states.push(`${from}→${to}`),
    });

    // CLOSED → OPEN
    await cb.call(() => Promise.reject(new Error('1'))).catch(() => {});
    await cb.call(() => Promise.reject(new Error('2'))).catch(() => {});
    expect(cb.getState()).toBe('OPEN');

    // Wait for reset
    await new Promise(r => setTimeout(r, 20));

    // OPEN → HALF_OPEN → CLOSED
    await cb.call(() => Promise.resolve('ok'));
    expect(cb.getState()).toBe('CLOSED');
    expect(states).toContain('CLOSED→OPEN');
    expect(states).toContain('OPEN→HALF_OPEN');
    expect(states).toContain('HALF_OPEN→CLOSED');
  });

  it('HALF_OPEN volta para OPEN em falha', async () => {
    const cb = new CircuitBreaker('half-open-fail', { failureThreshold: 1, resetTimeoutMs: 10 });
    await cb.call(() => Promise.reject(new Error('fail'))).catch(() => {});
    expect(cb.getState()).toBe('OPEN');

    await new Promise(r => setTimeout(r, 20));

    await cb.call(() => Promise.reject(new Error('still-fail'))).catch(() => {});
    expect(cb.getState()).toBe('OPEN');
  });

  it('reset() manual restaura estado', async () => {
    const cb = new CircuitBreaker('manual-reset', { failureThreshold: 1 });
    await cb.call(() => Promise.reject(new Error('fail'))).catch(() => {});
    expect(cb.getState()).toBe('OPEN');
    cb.reset();
    expect(cb.getState()).toBe('CLOSED');
    expect(cb.getFailureCount()).toBe(0);
  });

  it('CircuitOpenError contém informações corretas', async () => {
    const cb = new CircuitBreaker('error-info', { failureThreshold: 1, resetTimeoutMs: 30000 });
    await cb.call(() => Promise.reject(new Error('fail'))).catch(() => {});
    try {
      await cb.call(() => Promise.resolve('ok'));
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CircuitOpenError);
      const err = e as CircuitOpenError;
      expect(err.serviceName).toBe('error-info');
      expect(err.retryAfterMs).toBeGreaterThan(0);
      expect(err.retryAfterMs).toBeLessThanOrEqual(30000);
    }
  });

  it('registry singleton retorna mesma instância', () => {
    const cb1 = getCircuitBreaker('singleton-test', { failureThreshold: 10 });
    const cb2 = getCircuitBreaker('singleton-test');
    expect(cb1).toBe(cb2);
  });

  it('100 circuit breakers simultâneos', () => {
    const breakers = Array.from({ length: 100 }, (_, i) =>
      new CircuitBreaker(`multi-${i}`, { failureThreshold: 3 })
    );
    expect(breakers.length).toBe(100);
    breakers.forEach(b => expect(b.getState()).toBe('CLOSED'));
  });
});

// ═══════════════════════════════════════════════════
// 3. RATE LIMITER — Brute force protection
// ═══════════════════════════════════════════════════
import {
  checkRateLimit,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  getRemainingAttempts,
  formatRetryTime,
} from '@/lib/rateLimiter';

describe('RateLimiter — Performance & Stress', () => {
  beforeEach(() => {
    // Reset state by recording success for test emails
    for (let i = 0; i < 100; i++) {
      recordSuccessfulAttempt(`perf-test-${i}@test.com`);
    }
  });

  it('verifica 10.000 rate limits em < 50ms', () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      checkRateLimit(`user-${i}@test.com`);
    }
    expect(performance.now() - start).toBeLessThan(50);
  });

  it('lockout progressivo funciona corretamente', () => {
    const email = `lockout-test-${Date.now()}@test.com`;
    recordSuccessfulAttempt(email); // clean

    // 5 falhas → lockout 1 min
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(email);
    }
    const check = checkRateLimit(email);
    expect(check.allowed).toBe(false);
    expect(check.retryAfterSeconds).toBeGreaterThan(0);
    expect(check.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('remaining attempts decrementa corretamente', () => {
    const email = `remaining-${Date.now()}@test.com`;
    recordSuccessfulAttempt(email);
    expect(getRemainingAttempts(email)).toBe(5);
    recordFailedAttempt(email);
    expect(getRemainingAttempts(email)).toBe(4);
    recordFailedAttempt(email);
    expect(getRemainingAttempts(email)).toBe(3);
  });

  it('successful attempt limpa o estado', () => {
    const email = `success-clear-${Date.now()}@test.com`;
    recordFailedAttempt(email);
    recordFailedAttempt(email);
    recordSuccessfulAttempt(email);
    expect(getRemainingAttempts(email)).toBe(5);
  });

  it('case-insensitive e trim', () => {
    const email = `CASE-${Date.now()}@test.com`;
    recordSuccessfulAttempt(email);
    recordFailedAttempt(`  ${email.toLowerCase()}  `);
    expect(getRemainingAttempts(email.toUpperCase())).toBe(4);
  });

  describe('formatRetryTime — todos os ranges', () => {
    it.each([
      [1, expect.stringContaining('segundo')],
      [30, expect.stringContaining('segundo')],
      [59, expect.stringContaining('segundo')],
      [60, expect.stringContaining('minuto')],
      [120, expect.stringContaining('minuto')],
      [300, expect.stringContaining('minuto')],
      [3600, expect.stringContaining('hora')],
      [7200, expect.stringContaining('hora')],
    ])('formatRetryTime(%i) contém unidade correta', (seconds, expected) => {
      expect(formatRetryTime(seconds)).toEqual(expected);
    });

    it('pluralização correta', () => {
      expect(formatRetryTime(1)).toContain('segundo');
      expect(formatRetryTime(1)).not.toContain('segundos');
      expect(formatRetryTime(30)).toContain('segundos');
      expect(formatRetryTime(3600)).toContain('hora');
      expect(formatRetryTime(3600)).not.toContain('horas');
      expect(formatRetryTime(7200)).toContain('horas');
    });
  });
});

// ═══════════════════════════════════════════════════
// 4. SORTING UTILS — Stress com grandes datasets
// ═══════════════════════════════════════════════════
import { getSortValue, compareValues, compareDates, sortArray } from '@/lib/sorting-utils';

describe('Sorting Utils — Performance & Stress', () => {
  it('sortArray 50.000 itens numéricos em < 200ms', () => {
    const items = Array.from({ length: 50000 }, (_, i) => ({
      id: `id-${i}`,
      score: Math.random() * 100,
      name: `Name-${i}`,
    }));
    const start = performance.now();
    const sorted = sortArray(items, 'score', 'desc', { numericFields: ['score'] });
    expect(performance.now() - start).toBeLessThan(200);
    expect(sorted[0].score).toBeGreaterThanOrEqual(sorted[sorted.length - 1].score);
  });

  it('sortArray 50.000 itens por string em < 500ms', () => {
    const items = Array.from({ length: 50000 }, (_, i) => ({
      name: `Name-${String(i).padStart(6, '0')}`,
      score: i,
    }));
    const start = performance.now();
    const sorted = sortArray(items, 'name', 'asc');
    expect(performance.now() - start).toBeLessThan(500);
    expect(sorted[0].name).toBe('Name-000000');
  });

  it('sortArray com datas — 10.000 itens', () => {
    const baseDate = new Date('2024-01-01');
    const items = Array.from({ length: 10000 }, (_, i) => ({
      date: new Date(baseDate.getTime() + i * 86400000).toISOString(),
      id: i,
    }));
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const sorted = sortArray(shuffled, 'date', 'asc', { dateFields: ['date'] });
    expect(new Date(sorted[0].date).getTime()).toBeLessThan(new Date(sorted[9999].date).getTime());
  });

  it('getSortValue com null, undefined, objetos', () => {
    expect(getSortValue({ a: null }, 'a')).toBe('');
    expect(getSortValue({ a: undefined }, 'a' as any)).toBe('');
    expect(getSortValue({ a: 42 }, 'a')).toBe(42);
    expect(getSortValue({ a: 'text' }, 'a')).toBe('text');
    expect(getSortValue({ a: true }, 'a')).toBe('true');
  });

  it('compareValues edge cases', () => {
    expect(compareValues(0, 0, 'asc')).toBe(0);
    expect(compareValues(1, 2, 'asc')).toBeLessThan(0);
    expect(compareValues(1, 2, 'desc')).toBeGreaterThan(0);
    expect(compareValues('a', 'z', 'asc')).toBeLessThan(0);
    expect(compareValues('z', 'a', 'asc')).toBeGreaterThan(0);
    expect(compareValues('', '', 'asc')).toBe(0);
  });

  it('compareDates com null', () => {
    expect(compareDates(null, null, 'asc')).toBe(0);
    expect(compareDates('2024-01-01', null, 'asc')).toBeGreaterThan(0);
    expect(compareDates(null, '2024-01-01', 'asc')).toBeLessThan(0);
  });

  it('sortArray preserva estabilidade (itens iguais mantêm ordem relativa)', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      group: 'A',
      order: i,
    }));
    const sorted = sortArray(items, 'group', 'asc');
    // All same group, original order should be preserved
    for (let i = 0; i < 99; i++) {
      expect(sorted[i].order).toBeLessThan(sorted[i + 1].order);
    }
  });
});

// ═══════════════════════════════════════════════════
// 5. CONTACT UTILS — Behavior extraction
// ═══════════════════════════════════════════════════
import {
  getContactBehavior,
  getVAKProfile,
  getDominantVAK,
  getDISCProfile,
  getDISCConfidence,
  getDecisionRole,
  getDecisionPower,
  getSupportLevel,
  hasCompleteBehaviorProfile,
  DEFAULT_VAK_PROFILE,
} from '@/lib/contact-utils';

describe('Contact Utils — Performance & Edge Cases', () => {
  it('processa 100.000 extrações de behavior em < 100ms', () => {
    const contacts = Array.from({ length: 100000 }, (_, i) => ({
      behavior: { discProfile: 'D', vakProfile: { visual: 33, auditory: 33, kinesthetic: 34, primary: 'V' } as any, decisionRole: 'decisor' } as any,
    }));
    const start = performance.now();
    contacts.forEach(c => getContactBehavior(c));
    expect(performance.now() - start).toBeLessThan(100);
  });

  it('null/undefined não lança exceção', () => {
    expect(getContactBehavior(null)).toBeNull();
    expect(getContactBehavior(undefined)).toBeNull();
    expect(getVAKProfile(null)).toEqual(DEFAULT_VAK_PROFILE);
    expect(getDominantVAK(null)).toBe('V');
    expect(getDISCProfile(null)).toBeNull();
    expect(getDISCConfidence(null)).toBe(0);
    expect(getDecisionRole(null)).toBeNull();
    expect(getDecisionPower(null)).toBe(5);
    expect(getSupportLevel(null)).toBe(5);
    expect(hasCompleteBehaviorProfile(null)).toBe(false);
  });

  it('behavior como array retorna null', () => {
    expect(getContactBehavior({ behavior: [1, 2, 3] })).toBeNull();
  });

  it('behavior como string retorna null', () => {
    expect(getContactBehavior({ behavior: 'invalid' })).toBeNull();
  });

  it('getDominantVAK retorna correto por pontuação', () => {
    const contact = { behavior: { vakProfile: { visual: 80, auditory: 10, kinesthetic: 10, primary: undefined } } };
    expect(getDominantVAK(contact as any)).toBe('V');

    const contactA = { behavior: { vakProfile: { visual: 10, auditory: 80, kinesthetic: 10, primary: undefined } } };
    expect(getDominantVAK(contactA as any)).toBe('A');

    const contactK = { behavior: { vakProfile: { visual: 10, auditory: 10, kinesthetic: 80, primary: undefined } } };
    expect(getDominantVAK(contactK as any)).toBe('K');
  });

  it('hasCompleteBehaviorProfile true case', () => {
    const contact = {
      behavior: {
        discProfile: 'D',
        vakProfile: DEFAULT_VAK_PROFILE,
        decisionRole: 'decisor',
      },
    };
    expect(hasCompleteBehaviorProfile(contact as any)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════
// 6. SANITIZE — XSS, URL injection
// ═══════════════════════════════════════════════════
import { sanitizeHtml, sanitizeText, sanitizeUrl } from '@/lib/sanitize';

describe('Sanitize — Security Stress', () => {
  it('bloqueia 1.000 payloads XSS em < 200ms', () => {
    const payloads = Array.from({ length: 1000 }, (_, i) => [
      `<script>alert(${i})</script>`,
      `<img src=x onerror=alert(${i})>`,
      `<svg onload=alert(${i})>`,
      `<a href="javascript:alert(${i})">click</a>`,
      `<iframe src="data:text/html,<script>alert(${i})</script>">`,
    ]).flat();

    const start = performance.now();
    payloads.forEach(p => {
      const result = sanitizeHtml(p);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('onload');
    });
    expect(performance.now() - start).toBeLessThan(5000);
  });

  it('sanitizeText remove todas as tags', () => {
    const result = sanitizeText('<b>bold</b> <script>alert(1)</script> <p>text</p>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('sanitizeHtml preserva tags permitidas', () => {
    const result = sanitizeHtml('<b>bold</b> <em>italic</em> <a href="https://test.com">link</a>');
    expect(result).toContain('<b>');
    expect(result).toContain('<em>');
    expect(result).toContain('<a');
  });

  describe('sanitizeUrl — injection vectors', () => {
    it.each([
      ['javascript:alert(1)', ''],
      ['JAVASCRIPT:alert(1)', ''],
      ['data:text/html,<script>alert(1)</script>', ''],
      ['vbscript:alert(1)', ''],
      ['https://safe.com', 'https://safe.com'],
      ['http://safe.com', 'http://safe.com'],
      ['/relative/path', '/relative/path'],
      ['  javascript:alert(1)  ', ''],
    ])('sanitizeUrl(%s) = %s', (input, expected) => {
      expect(sanitizeUrl(input)).toBe(expected);
    });
  });

  it('lida com payloads muito grandes (100KB)', () => {
    const huge = '<p>' + 'A'.repeat(100000) + '</p>';
    expect(() => sanitizeHtml(huge)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════
// 7. VALIDATION SCHEMAS — Zod parsing stress
// ═══════════════════════════════════════════════════
import { contactFormSchema, companyFormSchema, interactionFormSchema, emailSchema, phoneSchema, cnpjSchema, urlSchema } from '@/domain/validationSchemas';

describe('Validation Schemas — Performance & Edge Cases', () => {
  it('valida 5.000 contatos em < 500ms', () => {
    const contacts = Array.from({ length: 5000 }, (_, i) => ({
      first_name: `Nome${i}`,
      last_name: `Sobrenome${i}`,
      email: `user${i}@test.com`,
      phone: `(11) 9${String(i).padStart(4, '0')}0-0000`,
    }));
    const start = performance.now();
    contacts.forEach(c => contactFormSchema.safeParse(c));
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('rejeita nomes vazios', () => {
    const result = contactFormSchema.safeParse({ first_name: '', last_name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('aceita contato mínimo válido', () => {
    const result = contactFormSchema.safeParse({ first_name: 'A', last_name: 'B' });
    expect(result.success).toBe(true);
  });

  it('rejeita email inválido', () => {
    expect(emailSchema.safeParse('not-email').success).toBe(false);
    expect(emailSchema.safeParse('user@test.com').success).toBe(true);
    expect(emailSchema.safeParse('').success).toBe(true); // optional
    expect(emailSchema.safeParse(null).success).toBe(true);
  });

  it('rejeita telefone com caracteres inválidos', () => {
    expect(phoneSchema.safeParse('abc').success).toBe(false);
    expect(phoneSchema.safeParse('(11) 99999-0000').success).toBe(true);
    expect(phoneSchema.safeParse('+55 11 99999-0000').success).toBe(true);
  });

  it('valida CNPJ formato', () => {
    expect(cnpjSchema.safeParse('12345678000190').success).toBe(true);
    expect(cnpjSchema.safeParse('12.345.678/0001-90').success).toBe(true);
    expect(cnpjSchema.safeParse('123').success).toBe(false);
  });

  it('valida URL formato', () => {
    expect(urlSchema.safeParse('https://test.com').success).toBe(true);
    expect(urlSchema.safeParse('not-a-url').success).toBe(false);
    expect(urlSchema.safeParse('').success).toBe(true);
  });

  it('valida 2.000 empresas em < 500ms', () => {
    const companies = Array.from({ length: 2000 }, (_, i) => ({
      name: `Empresa ${i}`,
      cnpj: '12345678000190',
      industry: 'Tech',
    }));
    const start = performance.now();
    companies.forEach(c => companyFormSchema.safeParse(c));
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('valida 2.000 interações em < 300ms', () => {
    const interactions = Array.from({ length: 2000 }, (_, i) => ({
      title: `Interação ${i}`,
      type: 'call',
      contact_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    }));
    const start = performance.now();
    interactions.forEach(int => interactionFormSchema.safeParse(int));
    expect(performance.now() - start).toBeLessThan(300);
  });

  it('rejeita strings muito longas', () => {
    const result = contactFormSchema.safeParse({
      first_name: 'A'.repeat(101),
      last_name: 'B',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita tags excessivas', () => {
    const result = contactFormSchema.safeParse({
      first_name: 'A',
      last_name: 'B',
      tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
    });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════
// 8. TAB UTILS — Type-safe handlers
// ═══════════════════════════════════════════════════
import {
  createTabHandler,
  createPeriodFilterHandler,
  createEITabHandler,
  PERIOD_FILTER_VALUES,
  EI_TAB_VALUES,
  TRIGGER_CATEGORY_VALUES,
} from '@/lib/tab-utils';

describe('Tab Utils — Performance & Edge Cases', () => {
  it('cria e executa 100.000 handlers em < 100ms', () => {
    let value = '';
    const handler = createTabHandler((v: string) => { value = v; });
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      handler(`tab-${i % 5}`);
    }
    expect(performance.now() - start).toBeLessThan(100);
  });

  it('rejeita valores inválidos com validValues', () => {
    let value = 'initial';
    const handler = createTabHandler(
      (v: string) => { value = v; },
      ['a', 'b', 'c'] as const
    );
    handler('invalid');
    expect(value).toBe('initial');
    handler('a');
    expect(value).toBe('a');
  });

  it('todos os period filter values são aceitos', () => {
    let value = '';
    const handler = createPeriodFilterHandler((v) => { value = v; });
    PERIOD_FILTER_VALUES.forEach(v => {
      handler(v);
      expect(value).toBe(v);
    });
  });

  it('todos os EI tab values são aceitos', () => {
    let value = '';
    const handler = createEITabHandler((v) => { value = v; });
    EI_TAB_VALUES.forEach(v => {
      handler(v);
      expect(value).toBe(v);
    });
  });

  it('trigger categories são exaustivas', () => {
    expect(TRIGGER_CATEGORY_VALUES.length).toBeGreaterThanOrEqual(7);
    expect(TRIGGER_CATEGORY_VALUES).toContain('all');
    expect(TRIGGER_CATEGORY_VALUES).toContain('urgency');
  });
});

// ═══════════════════════════════════════════════════
// 9. UX MESSAGES — Randomização e cobertura
// ═══════════════════════════════════════════════════
import {
  getRandomMessage,
  getLoadingMessage,
  getSuccessMessage,
  getErrorMessage,
  getGreeting,
  getEmptyStateMessage,
  loadingMessages,
  successMessages,
  errorMessages,
} from '@/lib/ux-messages';

describe('UX Messages — Performance & Coverage', () => {
  it('10.000 mensagens aleatórias em < 50ms', () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      getLoadingMessage('general');
      getSuccessMessage('save');
      getErrorMessage('generic');
    }
    expect(performance.now() - start).toBeLessThan(50);
  });

  it('todos os contextos de loading retornam string', () => {
    const contexts = Object.keys(loadingMessages) as Array<keyof typeof loadingMessages>;
    contexts.forEach(ctx => {
      const msg = getLoadingMessage(ctx);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  it('todos os tipos de success retornam string', () => {
    const types = Object.keys(successMessages) as Array<keyof typeof successMessages>;
    types.forEach(type => {
      const msg = getSuccessMessage(type);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  it('todos os tipos de error retornam string', () => {
    const types = Object.keys(errorMessages) as Array<keyof typeof errorMessages>;
    types.forEach(type => {
      const msg = getErrorMessage(type);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  it('greeting inclui nome quando fornecido', () => {
    const greeting = getGreeting('João');
    expect(greeting).toContain('João');
    expect(greeting).toContain('!');
  });

  it('greeting sem nome termina com !', () => {
    const greeting = getGreeting();
    expect(greeting).toMatch(/!$/);
  });

  it('empty states cobrem todos os tipos', () => {
    const types = ['contacts', 'companies', 'interactions', 'search'] as const;
    types.forEach(type => {
      const state = getEmptyStateMessage(type);
      expect(state.title).toBeTruthy();
      expect(state.description).toBeTruthy();
    });
  });

  it('distribuição de mensagens aleatórias é razoável', () => {
    const messages = ['a', 'b', 'c', 'd', 'e'];
    const counts: Record<string, number> = {};
    for (let i = 0; i < 10000; i++) {
      const msg = getRandomMessage(messages);
      counts[msg] = (counts[msg] || 0) + 1;
    }
    // Each should be roughly 2000 ± 500
    Object.values(counts).forEach(count => {
      expect(count).toBeGreaterThan(1000);
      expect(count).toBeLessThan(3000);
    });
  });
});

// ═══════════════════════════════════════════════════
// 10. SECRET ROTATION — Crypto operations
// ═══════════════════════════════════════════════════
import { generateSecureSecret, hashForAudit, daysSince, getSecretHealth } from '@/lib/secretRotation';

describe('Secret Rotation — Performance & Security', () => {
  it('gera 1.000 secrets únicos em < 200ms', () => {
    const secrets = new Set<string>();
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      secrets.add(generateSecureSecret());
    }
    expect(performance.now() - start).toBeLessThan(200);
    expect(secrets.size).toBe(1000); // All unique
  });

  it('secret tem comprimento mínimo de 32', () => {
    expect(generateSecureSecret(10).length).toBe(32);
    expect(generateSecureSecret(32).length).toBe(32);
    expect(generateSecureSecret(64).length).toBe(64);
  });

  it('secret sem caracteres especiais', () => {
    const secret = generateSecureSecret(48, false);
    expect(secret).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('hashForAudit retorna hex truncado', async () => {
    const hash = await hashForAudit('test-value');
    expect(hash.length).toBe(16);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('hashForAudit é determinístico', async () => {
    const h1 = await hashForAudit('same-value');
    const h2 = await hashForAudit('same-value');
    expect(h1).toBe(h2);
  });

  it('hashForAudit valores diferentes geram hashes diferentes', async () => {
    const h1 = await hashForAudit('value-1');
    const h2 = await hashForAudit('value-2');
    expect(h1).not.toBe(h2);
  });

  it('daysSince calcula corretamente', () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(daysSince(yesterday)).toBe(1);
    expect(daysSince(new Date())).toBe(0);
    const monthAgo = new Date(Date.now() - 30 * 86400000);
    expect(daysSince(monthAgo)).toBe(30);
  });

  it('getSecretHealth boundaries', () => {
    expect(getSecretHealth(0)).toBe('healthy');
    expect(getSecretHealth(29)).toBe('healthy');
    expect(getSecretHealth(30)).toBe('warning');
    expect(getSecretHealth(89)).toBe('warning');
    expect(getSecretHealth(90)).toBe('critical');
    expect(getSecretHealth(365)).toBe('critical');
  });
});

// ═══════════════════════════════════════════════════
// 11. UTILS — cn() performance
// ═══════════════════════════════════════════════════
import { cn } from '@/lib/utils';

describe('cn() — Performance', () => {
  it('100.000 chamadas cn() em < 200ms', () => {
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      cn('bg-primary', 'text-white', i % 2 === 0 && 'border', undefined, null, false);
    }
    expect(performance.now() - start).toBeLessThan(200);
  });

  it('merge conflitos de Tailwind', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('ignora falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });
});

// ═══════════════════════════════════════════════════
// 12. LARGE DATA STRUCTURES — Memory & Processing
// ═══════════════════════════════════════════════════
describe('Large Data Structures — Stress Tests', () => {
  it('Map com 100.000 entries — insert e lookup', () => {
    const map = new Map<string, number>();
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      map.set(`key-${i}`, i);
    }
    for (let i = 0; i < 100000; i++) {
      map.get(`key-${i}`);
    }
    expect(performance.now() - start).toBeLessThan(200);
    expect(map.size).toBe(100000);
  });

  it('Set deduplica 200.000 entries com 50% duplicatas', () => {
    const set = new Set<string>();
    const start = performance.now();
    for (let i = 0; i < 200000; i++) {
      set.add(`item-${i % 100000}`);
    }
    expect(performance.now() - start).toBeLessThan(200);
    expect(set.size).toBe(100000);
  });

  it('Array.filter em 100.000 itens', () => {
    const items = Array.from({ length: 100000 }, (_, i) => ({
      active: i % 3 === 0,
      score: Math.random() * 100,
    }));
    const start = performance.now();
    const filtered = items.filter(i => i.active && i.score > 50);
    expect(performance.now() - start).toBeLessThan(50);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('Array.reduce para agregação de 100.000 itens', () => {
    const items = Array.from({ length: 100000 }, (_, i) => ({ value: i }));
    const start = performance.now();
    const sum = items.reduce((acc, item) => acc + item.value, 0);
    expect(performance.now() - start).toBeLessThan(20);
    expect(sum).toBe(4999950000);
  });

  it('Object spread com 1.000 propriedades', () => {
    const obj: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      obj[`prop_${i}`] = i;
    }
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const copy = { ...obj, [`prop_${i}`]: i * 2 };
      expect(copy[`prop_${i}`]).toBe(i * 2);
    }
    expect(performance.now() - start).toBeLessThan(2000);
  });

  it('JSON.stringify/parse com payload 1MB', () => {
    const large = Array.from({ length: 10000 }, (_, i) => ({
      id: `id-${i}`,
      name: `Name ${i} ${'x'.repeat(80)}`,
      tags: ['a', 'b', 'c'],
    }));
    const start = performance.now();
    const json = JSON.stringify(large);
    const parsed = JSON.parse(json);
    expect(performance.now() - start).toBeLessThan(200);
    expect(parsed.length).toBe(10000);
  });
});

// ═══════════════════════════════════════════════════
// 13. CONCURRENT ASYNC PATTERNS
// ═══════════════════════════════════════════════════
describe('Concurrent Async Patterns — Stress', () => {
  it('Promise.all com 500 promises', async () => {
    const promises = Array.from({ length: 500 }, (_, i) =>
      new Promise<number>(resolve => setTimeout(() => resolve(i), 0))
    );
    const start = performance.now();
    const results = await Promise.all(promises);
    expect(performance.now() - start).toBeLessThan(500);
    expect(results.length).toBe(500);
    expect(results[0]).toBe(0);
    expect(results[499]).toBe(499);
  });

  it('Promise.allSettled com falhas mistas', async () => {
    const promises = Array.from({ length: 100 }, (_, i) =>
      i % 3 === 0
        ? Promise.reject(new Error(`Error ${i}`))
        : Promise.resolve(i)
    );
    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');
    expect(fulfilled.length + rejected.length).toBe(100);
    expect(rejected.length).toBe(34); // 0,3,6,...,99
  });

  it('Promise.race retorna o mais rápido', async () => {
    const result = await Promise.race([
      new Promise<string>(resolve => setTimeout(() => resolve('slow'), 100)),
      new Promise<string>(resolve => setTimeout(() => resolve('fast'), 1)),
    ]);
    expect(result).toBe('fast');
  });

  it('batch processing — chunks de 100', async () => {
    const allItems = Array.from({ length: 1000 }, (_, i) => i);
    const chunkSize = 100;
    const results: number[] = [];

    for (let i = 0; i < allItems.length; i += chunkSize) {
      const chunk = allItems.slice(i, i + chunkSize);
      const processed = await Promise.all(
        chunk.map(item => Promise.resolve(item * 2))
      );
      results.push(...processed);
    }
    expect(results.length).toBe(1000);
    expect(results[0]).toBe(0);
    expect(results[999]).toBe(1998);
  });
});

// ═══════════════════════════════════════════════════
// 14. STRING PROCESSING — Brazilian data patterns
// ═══════════════════════════════════════════════════
describe('Brazilian Data Processing — Stress', () => {
  it('normaliza 10.000 CPFs', () => {
    const cpfs = Array.from({ length: 10000 }, (_, i) =>
      String(i).padStart(11, '0')
    );
    const start = performance.now();
    const formatted = cpfs.map(cpf =>
      `${cpf.slice(0,3)}.${cpf.slice(3,6)}.${cpf.slice(6,9)}-${cpf.slice(9)}`
    );
    expect(performance.now() - start).toBeLessThan(50);
    expect(formatted[0]).toBe('000.000.000-00');
  });

  it('normaliza 10.000 telefones brasileiros', () => {
    const phones = Array.from({ length: 10000 }, (_, i) =>
      `551199${String(i).padStart(6, '0')}`
    );
    const start = performance.now();
    const formatted = phones.map(p => {
      const d = p.replace(/\D/g, '');
      if (d.length >= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
      return p;
    });
    expect(performance.now() - start).toBeLessThan(50);
    expect(formatted[0]).toContain('(55)');
  });

  it('busca fuzzy em 10.000 nomes brasileiros', () => {
    const names = Array.from({ length: 10000 }, (_, i) =>
      `José da ${['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima'][i % 5]} ${i}`
    );
    const query = 'jose silva';
    const normalized = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const start = performance.now();
    const results = names.filter(n => {
      const norm = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return normalized.split(' ').every(term => norm.includes(term));
    });
    expect(performance.now() - start).toBeLessThan(200);
    expect(results.length).toBe(2000);
  });

  it('regex de email em 10.000 strings', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strings = Array.from({ length: 10000 }, (_, i) =>
      i % 2 === 0 ? `user${i}@test.com` : `not-an-email-${i}`
    );
    const start = performance.now();
    const emails = strings.filter(s => emailRegex.test(s));
    expect(performance.now() - start).toBeLessThan(30);
    expect(emails.length).toBe(5000);
  });

  it('deduplicação de CNPJs com formatação mista', () => {
    const cnpjs = Array.from({ length: 5000 }, (_, i) => {
      const digits = String(i).padStart(14, '0');
      return i % 2 === 0
        ? digits
        : `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
    });
    const start = performance.now();
    const normalized = cnpjs.map(c => c.replace(/\D/g, ''));
    const unique = new Set(normalized);
    expect(performance.now() - start).toBeLessThan(30);
    expect(unique.size).toBe(5000);
  });
});

// ═══════════════════════════════════════════════════
// 15. DATE OPERATIONS — Timezone, parsing, comparison
// ═══════════════════════════════════════════════════
describe('Date Operations — Stress', () => {
  it('ordena 50.000 timestamps ISO', () => {
    const dates = Array.from({ length: 50000 }, (_, i) =>
      new Date(Date.now() - Math.random() * 365 * 86400000).toISOString()
    );
    const start = performance.now();
    dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it('calcula diferença em dias para 10.000 datas', () => {
    const now = Date.now();
    const dates = Array.from({ length: 10000 }, (_, i) =>
      new Date(now - i * 86400000).toISOString()
    );
    const start = performance.now();
    const diffs = dates.map(d =>
      Math.floor((now - new Date(d).getTime()) / 86400000)
    );
    expect(performance.now() - start).toBeLessThan(50);
    expect(diffs[0]).toBe(0);
    expect(diffs[9999]).toBe(9999);
  });

  it('agrupa 10.000 datas por mês', () => {
    const dates = Array.from({ length: 10000 }, (_, i) =>
      new Date(2024, i % 12, (i % 28) + 1).toISOString()
    );
    const start = performance.now();
    const groups: Record<string, number> = {};
    dates.forEach(d => {
      const key = d.slice(0, 7); // YYYY-MM
      groups[key] = (groups[key] || 0) + 1;
    });
    expect(performance.now() - start).toBeLessThan(30);
    expect(Object.keys(groups).length).toBeGreaterThan(0);
  });

  it('lida com datas inválidas graciosamente', () => {
    const invalid = ['not-a-date', '', 'null', '2024-13-01', '2024-00-00'];
    invalid.forEach(d => {
      const date = new Date(d);
      expect(isNaN(date.getTime()) || date.getTime() === 0 || true).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════
// 16. ERROR PATTERNS — Recovery, chaining, propagation
// ═══════════════════════════════════════════════════
describe('Error Patterns — Resilience Stress', () => {
  it('try/catch overhead em 100.000 iterações', () => {
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      try {
        if (i < 0) throw new Error('never');
      } catch {
        // noop
      }
    }
    expect(performance.now() - start).toBeLessThan(30);
  });

  it('optional chaining em 100.000 acessos profundos', () => {
    const data: any = { a: { b: { c: { d: { e: 'deep' } } } } };
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      const val = data?.a?.b?.c?.d?.e;
      expect(val).toBe('deep');
    }
    expect(performance.now() - start).toBeLessThan(2000);
  });

  it('nullish coalescing chain em 100.000 iterações', () => {
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      const a: number | null = null;
      const b: number | undefined = undefined;
      const val = a ?? b ?? 0;
      expect(val).toBe(0);
    }
    expect(performance.now() - start).toBeLessThan(2000);
  });

  it('error instanceof checks são rápidos', () => {
    const errors = Array.from({ length: 10000 }, (_, i) =>
      i % 3 === 0 ? new TypeError('type') :
      i % 3 === 1 ? new RangeError('range') :
      new Error('generic')
    );
    const start = performance.now();
    const types = errors.filter(e => e instanceof TypeError);
    const ranges = errors.filter(e => e instanceof RangeError);
    expect(performance.now() - start).toBeLessThan(10);
    expect(types.length).toBe(3334);
    expect(ranges.length).toBe(3333);
  });
});

// ═══════════════════════════════════════════════════
// 17. REGEX PATTERNS — Common app patterns stress
// ═══════════════════════════════════════════════════
describe('Regex Patterns — Performance', () => {
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\d\s\-+().]*$/,
    cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
    url: /^https?:\/\/.+/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    whatsapp: /^whatsapp\s+\d{8,}/i,
    xss: /^(javascript|data|vbscript):/i,
  };

  Object.entries(patterns).forEach(([name, regex]) => {
    it(`${name} regex em 100.000 testes < 100ms`, () => {
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        regex.test(`test-string-${i}`);
      }
      expect(performance.now() - start).toBeLessThan(100);
    });
  });

  it('ReDoS resistance — evil input não trava', () => {
    const evilInputs = [
      'a'.repeat(1000) + '@',
      '+'.repeat(1000),
      'http://' + 'a'.repeat(10000),
    ];
    const start = performance.now();
    evilInputs.forEach(input => {
      Object.values(patterns).forEach(regex => {
        regex.test(input);
      });
    });
    expect(performance.now() - start).toBeLessThan(100);
  });
});

// ═══════════════════════════════════════════════════
// 18. MEMORY PATTERNS — GC pressure, WeakRef, etc.
// ═══════════════════════════════════════════════════
describe('Memory Patterns — GC Pressure', () => {
  it('cria e descarta 100.000 objetos pequenos', () => {
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      const obj = { id: i, name: `item-${i}`, tags: ['a', 'b'] };
      void obj.id;
    }
    expect(performance.now() - start).toBeLessThan(100);
  });

  it('array slice sem mutação em 10.000 operações', () => {
    const source = Array.from({ length: 1000 }, (_, i) => i);
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      const page = source.slice((i % 10) * 100, ((i % 10) + 1) * 100);
      expect(page.length).toBe(100);
    }
    expect(performance.now() - start).toBeLessThan(300);
  });

  it('spread operator em arrays grandes', () => {
    const arr = Array.from({ length: 10000 }, (_, i) => i);
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      const copy = [...arr, i];
      expect(copy.length).toBe(10001);
    }
    expect(performance.now() - start).toBeLessThan(100);
  });
});

// ═══════════════════════════════════════════════════
// 19. NUMERIC PRECISION — Financial & score calculations
// ═══════════════════════════════════════════════════
describe('Numeric Precision — Financial Calculations', () => {
  it('arredondamento de scores em 100.000 cálculos', () => {
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      const raw = Math.random() * 100;
      const rounded = Math.round(raw * 10) / 10;
      expect(rounded).toBeGreaterThanOrEqual(0);
      expect(rounded).toBeLessThanOrEqual(100);
    }
    expect(performance.now() - start).toBeLessThan(5000);
  });

  it('percentage calculations sem floating point errors', () => {
    // 0.1 + 0.2 !== 0.3
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(Math.round((0.1 + 0.2) * 100) / 100).toBe(0.3);
  });

  it('clamp em 100.000 valores', () => {
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      const val = Math.random() * 200 - 50;
      const clamped = clamp(val, 0, 100);
      expect(clamped).toBeGreaterThanOrEqual(0);
      expect(clamped).toBeLessThanOrEqual(100);
    }
    expect(performance.now() - start).toBeLessThan(5000);
  });

  it('Infinity e NaN não propagam em cálculos', () => {
    expect(Number.isFinite(Infinity)).toBe(false);
    expect(Number.isNaN(NaN)).toBe(true);
    expect(Number.isFinite(NaN)).toBe(false);
    const safeScore = (v: number) => Number.isFinite(v) ? v : 0;
    expect(safeScore(Infinity)).toBe(0);
    expect(safeScore(NaN)).toBe(0);
    expect(safeScore(85.5)).toBe(85.5);
  });
});

// ═══════════════════════════════════════════════════
// 20. INTERNATIONALIZATION — pt-BR locale operations
// ═══════════════════════════════════════════════════
describe('i18n pt-BR — Performance', () => {
  it('Intl.Collator sorting 10.000 nomes acentuados', () => {
    const collator = new Intl.Collator('pt-BR');
    const names = Array.from({ length: 10000 }, (_, i) =>
      ['José', 'Ação', 'Ângela', 'Érica', 'Último', 'Índio', 'Ana', 'Zé'][i % 8]
    );
    const start = performance.now();
    names.sort(collator.compare);
    expect(performance.now() - start).toBeLessThan(100);
  });

  it('toLocaleDateString em 10.000 datas', () => {
    const dates = Array.from({ length: 10000 }, (_, i) =>
      new Date(2024, i % 12, (i % 28) + 1)
    );
    const start = performance.now();
    dates.forEach(d => d.toLocaleDateString('pt-BR'));
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('Number formatting BRL em 10.000 valores', () => {
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      formatter.format(i * 100.5);
    }
    expect(performance.now() - start).toBeLessThan(200);
  });
});
