import { describe, it, expect } from "vitest";
import {
  normalizeWeek,
  parseWeekLocal,
  isValidWeek,
  weekTimestamp,
  normalizeAndSortWeekPoints,
  type WeekPoint,
} from "../weekUtils";

const mkPoint = (week: string, overrides: Partial<WeekPoint> = {}): WeekPoint => ({
  week,
  positive: 0,
  neutral: 0,
  negative: 0,
  mixed: 0,
  total: 0,
  positivePct: 0,
  ...overrides,
});

describe("normalizeWeek", () => {
  it("trunca formato com hora local", () => {
    expect(normalizeWeek("2025-04-07T00:00:00")).toBe("2025-04-07");
  });

  it("trunca formato ISO completo com Z", () => {
    expect(normalizeWeek("2025-04-07T03:30:00.000Z")).toBe("2025-04-07");
  });

  it("mantém YYYY-MM-DD inalterado", () => {
    expect(normalizeWeek("2025-04-07")).toBe("2025-04-07");
  });

  it("devolve string vazia inalterada", () => {
    expect(normalizeWeek("")).toBe("");
  });

  it("devolve input cru se for menor que 10 caracteres", () => {
    expect(normalizeWeek("2025-4")).toBe("2025-4");
  });

  it("é defensivo contra tipos não-string", () => {
    expect(normalizeWeek(null as unknown as string)).toBe(null);
    expect(normalizeWeek(123 as unknown as string)).toBe(123);
  });
});

describe("isValidWeek", () => {
  it("aceita YYYY-MM-DD", () => {
    expect(isValidWeek("2025-04-07")).toBe(true);
  });

  it("aceita formato com hora (após normalização)", () => {
    expect(isValidWeek("2025-04-07T00:00:00")).toBe(true);
  });

  it("rejeita string vazia", () => {
    expect(isValidWeek("")).toBe(false);
  });

  it("rejeita string sem formato de data", () => {
    expect(isValidWeek("abc")).toBe(false);
  });

  it("rejeita data com mês/dia impossíveis (NaN no parse)", () => {
    expect(isValidWeek("2025-13-40")).toBe(false);
  });

  it("rejeita null/undefined/number", () => {
    expect(isValidWeek(null)).toBe(false);
    expect(isValidWeek(undefined)).toBe(false);
    expect(isValidWeek(123)).toBe(false);
  });
});

describe("parseWeekLocal", () => {
  it("retorna data no fuso local sem shift de -1 dia", () => {
    const d = parseWeekLocal("2025-04-07");
    // Validamos via getters locais (não toISOString) para ser TZ-independente
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(3); // abril (0-indexed)
    expect(d.getDate()).toBe(7);
    expect(d.getHours()).toBe(0);
  });

  it("normaliza antes de parsear", () => {
    const d = parseWeekLocal("2025-04-07T15:30:00.000Z");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(7);
  });
});

describe("weekTimestamp", () => {
  it("retorna timestamp finito para semana válida", () => {
    const ts = weekTimestamp("2025-04-07");
    expect(Number.isFinite(ts)).toBe(true);
  });

  it("retorna fallback para semana inválida (sentinela, não NaN)", () => {
    const ts = weekTimestamp("invalid");
    expect(Number.isFinite(ts)).toBe(true);
    expect(ts).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("comparator nunca produz NaN mesmo com lixo (válido vs lixo, lixo vs lixo)", () => {
    const items = ["2025-04-07", "lixo", "2025-04-14", "outra-coisa"];
    const cmp = (a: string, b: string) => weekTimestamp(a) - weekTimestamp(b);
    for (const a of items) {
      for (const b of items) {
        expect(Number.isNaN(cmp(a, b))).toBe(false);
      }
    }
  });
});

describe("weekTimestamp — TZ independence", () => {
  it("é idêntico ao Date.UTC do dia correspondente", () => {
    // 2025-04-07 -> ano 2025, mes 3 (abril), dia 7
    const ts = weekTimestamp("2025-04-07");
    expect(ts).toBe(Date.UTC(2025, 3, 7));
  });

  it("snapshot numérico fixo (determinismo)", () => {
    expect(weekTimestamp("2025-04-07")).toBe(1743984000000);
  });

  it("diferença entre semanas é exatamente 7 dias em ms (ignorando DST local)", () => {
    const ts1 = weekTimestamp("2025-04-07");
    const ts2 = weekTimestamp("2025-04-14");
    expect(ts2 - ts1).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("normalizeAndSortWeekPoints — sort cronológico", () => {
  it("ordena entrada fora de ordem em ordem crescente", () => {
    const out = normalizeAndSortWeekPoints([
      mkPoint("2025-04-21"),
      mkPoint("2025-04-07"),
      mkPoint("2025-04-14"),
    ]);
    expect(out.sortedData.map((p) => p.week)).toEqual([
      "2025-04-07",
      "2025-04-14",
      "2025-04-21",
    ]);
  });

  it("ordena corretamente com formatos mistos", () => {
    const out = normalizeAndSortWeekPoints([
      mkPoint("2025-04-14T00:00:00"),
      mkPoint("2025-04-07"),
      mkPoint("2025-04-21T03:30:00.000Z"),
    ]);
    expect(out.sortedData.map((p) => p.week)).toEqual([
      "2025-04-07",
      "2025-04-14",
      "2025-04-21",
    ]);
  });

  it("não usa ordenação lexicográfica em virada de ano", () => {
    // Lexicograficamente '2025-12-29' > '2026-01-05' seria errado
    const out = normalizeAndSortWeekPoints([
      mkPoint("2026-01-05"),
      mkPoint("2025-12-29"),
    ]);
    expect(out.sortedData.map((p) => p.week)).toEqual([
      "2025-12-29",
      "2026-01-05",
    ]);
  });
});

describe("normalizeAndSortWeekPoints — merge de duplicatas", () => {
  it("mescla entradas com mesma semana em formatos diferentes", () => {
    const out = normalizeAndSortWeekPoints([
      mkPoint("2025-04-07", { positive: 2, total: 4, positivePct: 50 }),
      mkPoint("2025-04-07T00:00:00", { positive: 3, total: 6, positivePct: 50 }),
    ]);
    expect(out.sortedData).toHaveLength(1);
    expect(out.sortedData[0].week).toBe("2025-04-07");
  });

  it("soma os contadores das duplicatas", () => {
    const out = normalizeAndSortWeekPoints([
      mkPoint("2025-04-07", {
        positive: 2,
        neutral: 1,
        negative: 1,
        mixed: 0,
        total: 4,
      }),
      mkPoint("2025-04-07", {
        positive: 3,
        neutral: 0,
        negative: 2,
        mixed: 1,
        total: 6,
      }),
    ]);
    const merged = out.sortedData[0];
    expect(merged.positive).toBe(5);
    expect(merged.neutral).toBe(1);
    expect(merged.negative).toBe(3);
    expect(merged.mixed).toBe(1);
    expect(merged.total).toBe(10);
  });

  it("recalcula positivePct a partir do total mesclado (não copia da duplicata)", () => {
    // Cada entrada tem 50%; mas mesclados: (2+8)/(4+12) = 10/16 = 62.5% ≈ 63
    const out = normalizeAndSortWeekPoints([
      mkPoint("2025-04-07", { positive: 2, total: 4, positivePct: 50 }),
      mkPoint("2025-04-07", { positive: 8, total: 12, positivePct: 67 }),
    ]);
    expect(out.sortedData[0].positivePct).toBe(63);
  });

  it("retorna positivePct = 0 quando o total mesclado é 0", () => {
    const out = normalizeAndSortWeekPoints([
      mkPoint("2025-04-07", { positivePct: 50 }),
      mkPoint("2025-04-07", { positivePct: 70 }),
    ]);
    expect(out.sortedData[0].positivePct).toBe(0);
  });
});

describe("normalizeAndSortWeekPoints — entradas inválidas", () => {
  it("descarta null/undefined no array e contabiliza", () => {
    const input = [
      null as unknown as WeekPoint,
      mkPoint("2025-04-07"),
      undefined as unknown as WeekPoint,
    ];
    const out = normalizeAndSortWeekPoints(input);
    expect(out.sortedData).toHaveLength(1);
    expect(out.invalidWeekCount).toBe(2);
  });

  it("descarta pontos com week vazio ou inválido", () => {
    const out = normalizeAndSortWeekPoints([
      mkPoint(""),
      mkPoint("lixo"),
      mkPoint("2025-13-40"),
      mkPoint("2025-04-07"),
    ]);
    expect(out.sortedData.map((p) => p.week)).toEqual(["2025-04-07"]);
    expect(out.invalidWeekCount).toBe(3);
  });

  it("entradas inválidas nunca aparecem em sortedData", () => {
    const out = normalizeAndSortWeekPoints([
      mkPoint("not-a-date"),
      mkPoint("2025-04-07"),
    ]);
    expect(out.sortedData.every((p) => p.week === "2025-04-07")).toBe(true);
  });

  it("retorna estrutura vazia para data null/undefined", () => {
    expect(normalizeAndSortWeekPoints(null)).toEqual({
      sortedData: [],
      invalidWeekCount: 0,
    });
    expect(normalizeAndSortWeekPoints(undefined)).toEqual({
      sortedData: [],
      invalidWeekCount: 0,
    });
  });
});
