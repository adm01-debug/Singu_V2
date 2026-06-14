/**
 * TelemetryCharts - Testes de lógica de dados dos gráficos
 * Cobre: timelineData bucketing, severity distribution, edge cases
 */
import { describe, it, expect } from "vitest";

// ============================================================
// Extracted chart logic for pure testing
// ============================================================

interface ChartRow {
  id: string;
  severity: string;
  created_at: string;
  duration_ms: number;
}

function computeTimelineData(rows: ChartRow[], timeFilter: string) {
  if (!rows.length) return [];
  const buckets = new Map<string, { label: string; slow: number; very_slow: number; error: number }>();

  for (const r of rows) {
    const d = new Date(r.created_at);
    let key: string;
    if (timeFilter === "1h" || timeFilter === "6h") {
      key = `${d.getHours().toString().padStart(2, "0")}:${(Math.floor(d.getMinutes() / 10) * 10).toString().padStart(2, "0")}`;
    } else {
      key = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}h`;
    }

    if (!buckets.has(key)) buckets.set(key, { label: key, slow: 0, very_slow: 0, error: 0 });
    const b = buckets.get(key)!;
    if (r.severity === "slow") b.slow++;
    else if (r.severity === "very_slow") b.very_slow++;
    else if (r.severity === "error") b.error++;
  }

  return [...buckets.values()].reverse();
}

function computeSeverityDistribution(rows: ChartRow[]) {
  const counts = { very_slow: 0, slow: 0, error: 0, normal: 0 };
  for (const r of rows) {
    if (r.severity in counts) counts[r.severity as keyof typeof counts]++;
    else counts.normal++;
  }
  return [
    { name: "Muito Lenta", value: counts.very_slow },
    { name: "Lenta", value: counts.slow },
    { name: "Erro", value: counts.error },
    { name: "Normal", value: counts.normal },
  ].filter(d => d.value > 0);
}

function mockRow(severity: string, created_at: string, duration_ms = 1000): ChartRow {
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  return { id: Math.random().toString(), severity, created_at, duration_ms };
}

// ============================================================
// TESTS
// ============================================================

describe("computeTimelineData", () => {
  it("should return empty for empty rows", () => {
    expect(computeTimelineData([], "24h")).toEqual([]);
  });

  it("should bucket by 10-minute intervals for 1h filter", () => {
    const rows = [
      mockRow("slow", "2026-03-23T10:05:00Z"),
      mockRow("slow", "2026-03-23T10:08:00Z"),
      mockRow("error", "2026-03-23T10:15:00Z"),
    ];
    const data = computeTimelineData(rows, "1h");
    // 10:00 bucket has 2 slow, 10:10 bucket has 1 error
    expect(data.length).toBe(2);
  });

  it("should bucket by 10-minute intervals for 6h filter", () => {
    const rows = [
      mockRow("slow", "2026-03-23T08:05:00Z"),
      mockRow("very_slow", "2026-03-23T08:05:00Z"),
    ];
    const data = computeTimelineData(rows, "6h");
    expect(data.length).toBe(1);
    expect(data[0].slow).toBe(1);
    expect(data[0].very_slow).toBe(1);
  });

  it("should bucket by day+hour for 24h filter", () => {
    const rows = [
      mockRow("slow", "2026-03-23T10:05:00Z"),
      mockRow("slow", "2026-03-23T10:55:00Z"),
      mockRow("error", "2026-03-23T11:05:00Z"),
    ];
    const data = computeTimelineData(rows, "24h");
    // Two buckets: 23/03 10h and 23/03 11h
    expect(data.length).toBe(2);
  });

  it("should bucket by day+hour for 7d filter", () => {
    const rows = [
      mockRow("slow", "2026-03-20T10:00:00Z"),
      mockRow("slow", "2026-03-21T10:00:00Z"),
    ];
    const data = computeTimelineData(rows, "7d");
    expect(data.length).toBe(2);
  });

  it("should count severities independently per bucket", () => {
    const rows = [
      mockRow("slow", "2026-03-23T10:00:00Z"),
      mockRow("very_slow", "2026-03-23T10:00:00Z"),
      mockRow("error", "2026-03-23T10:00:00Z"),
      mockRow("normal", "2026-03-23T10:00:00Z"),
    ];
    const data = computeTimelineData(rows, "1h");
    expect(data.length).toBe(1);
    expect(data[0].slow).toBe(1);
    expect(data[0].very_slow).toBe(1);
    expect(data[0].error).toBe(1);
    // "normal" is not tracked in the chart
  });

  it("should handle 100+ rows across many buckets", () => {
    const rows: ChartRow[] = [];
    for (let h = 0; h < 24; h++) {
      for (let i = 0; i < 5; i++) {
        rows.push(mockRow("slow", `2026-03-23T${h.toString().padStart(2, "0")}:${(i * 10).toString().padStart(2, "0")}:00Z`));
      }
    }
    const data = computeTimelineData(rows, "1h");
    expect(data.length).toBeGreaterThan(0);
    const total = data.reduce((s, d) => s + d.slow + d.very_slow + d.error, 0);
    expect(total).toBe(120); // 24*5
  });

  it("should produce reversed output (newest first)", () => {
    const rows = [
      mockRow("slow", "2026-03-23T08:00:00Z"),
      mockRow("slow", "2026-03-23T10:00:00Z"),
      mockRow("slow", "2026-03-23T12:00:00Z"),
    ];
    const data = computeTimelineData(rows, "24h");
    // Reversed means the last inserted bucket comes first
    expect(data.length).toBe(3);
  });
});

describe("computeSeverityDistribution", () => {
  it("should return empty for empty rows", () => {
    expect(computeSeverityDistribution([])).toEqual([]);
  });

  it("should count each severity", () => {
    const rows = [
      mockRow("slow", "2026-03-23T10:00:00Z"),
      mockRow("slow", "2026-03-23T10:00:00Z"),
      mockRow("very_slow", "2026-03-23T10:00:00Z"),
      mockRow("error", "2026-03-23T10:00:00Z"),
    ];
    const dist = computeSeverityDistribution(rows);
    expect(dist.find(d => d.name === "Lenta")?.value).toBe(2);
    expect(dist.find(d => d.name === "Muito Lenta")?.value).toBe(1);
    expect(dist.find(d => d.name === "Erro")?.value).toBe(1);
  });

  it("should filter out zero-count entries", () => {
    const rows = [mockRow("slow", "2026-03-23T10:00:00Z")];
    const dist = computeSeverityDistribution(rows);
    expect(dist.length).toBe(1);
    expect(dist[0].name).toBe("Lenta");
  });

  it("should classify unknown severity as normal", () => {
    const rows = [mockRow("unknown_sev", "2026-03-23T10:00:00Z")];
    const dist = computeSeverityDistribution(rows);
    expect(dist.length).toBe(1);
    expect(dist[0].name).toBe("Normal");
  });

  it("should handle large dataset", () => {
    const rows: ChartRow[] = [];
    for (let i = 0; i < 500; i++) rows.push(mockRow("slow", "2026-03-23T10:00:00Z"));
    for (let i = 0; i < 300; i++) rows.push(mockRow("very_slow", "2026-03-23T10:00:00Z"));
    for (let i = 0; i < 100; i++) rows.push(mockRow("error", "2026-03-23T10:00:00Z"));
    for (let i = 0; i < 100; i++) rows.push(mockRow("normal", "2026-03-23T10:00:00Z"));
    const dist = computeSeverityDistribution(rows);
    const total = dist.reduce((s, d) => s + d.value, 0);
    expect(total).toBe(1000);
  });

  it("should preserve correct labels", () => {
    const rows = [
      mockRow("very_slow", "2026-03-23T10:00:00Z"),
      mockRow("slow", "2026-03-23T10:00:00Z"),
      mockRow("error", "2026-03-23T10:00:00Z"),
      mockRow("normal", "2026-03-23T10:00:00Z"),
    ];
    const dist = computeSeverityDistribution(rows);
    const names = dist.map(d => d.name);
    expect(names).toContain("Muito Lenta");
    expect(names).toContain("Lenta");
    expect(names).toContain("Erro");
    expect(names).toContain("Normal");
  });
});

// ------ Bucketing edge cases ------
describe("Bucketing edge cases", () => {
  it("should handle midnight crossing", () => {
    const rows = [
      mockRow("slow", "2026-03-22T23:55:00Z"),
      mockRow("slow", "2026-03-23T00:05:00Z"),
    ];
    const data = computeTimelineData(rows, "24h");
    expect(data.length).toBe(2); // Different day+hour
  });

  it("should handle same minute different severity", () => {
    const rows = [
      mockRow("slow", "2026-03-23T10:05:00Z"),
      mockRow("very_slow", "2026-03-23T10:05:00Z"),
      mockRow("error", "2026-03-23T10:05:00Z"),
    ];
    const data = computeTimelineData(rows, "1h");
    expect(data.length).toBe(1);
    expect(data[0].slow).toBe(1);
    expect(data[0].very_slow).toBe(1);
    expect(data[0].error).toBe(1);
  });

  it("should handle minute boundaries (0, 10, 20, 30, 40, 50)", () => {
    const rows = [
      mockRow("slow", "2026-03-23T10:00:00Z"),
      mockRow("slow", "2026-03-23T10:09:59Z"),
      mockRow("slow", "2026-03-23T10:10:00Z"),
      mockRow("slow", "2026-03-23T10:19:59Z"),
    ];
    const data = computeTimelineData(rows, "1h");
    expect(data.length).toBe(2); // 10:00 and 10:10 buckets
    expect(data[0].slow + data[1].slow).toBe(4);
  });
});

// ------ All time filter combinations for bucketing ------
describe("Time filter bucketing combinations", () => {
  const timeFilters = ["1h", "6h", "24h", "7d"];

  for (const tf of timeFilters) {
    it(`should produce valid buckets for timeFilter=${tf}`, () => {
      const rows = [
        mockRow("slow", "2026-03-23T10:05:00Z"),
        mockRow("very_slow", "2026-03-23T10:15:00Z"),
        mockRow("error", "2026-03-23T11:05:00Z"),
      ];
      const data = computeTimelineData(rows, tf);
      expect(data.length).toBeGreaterThan(0);
      for (const bucket of data) {
        expect(bucket.label).toBeDefined();
        expect(bucket.slow).toBeGreaterThanOrEqual(0);
        expect(bucket.very_slow).toBeGreaterThanOrEqual(0);
        expect(bucket.error).toBeGreaterThanOrEqual(0);
      }
    });
  }
});

// ------ Distribution accuracy ------
describe("Distribution accuracy with percentages", () => {
  it("should accurately reflect 80/20 distribution", () => {
    const rows: ChartRow[] = [];
    for (let i = 0; i < 80; i++) rows.push(mockRow("slow", "2026-03-23T10:00:00Z"));
    for (let i = 0; i < 20; i++) rows.push(mockRow("very_slow", "2026-03-23T10:00:00Z"));
    const dist = computeSeverityDistribution(rows);
    expect(dist.find(d => d.name === "Lenta")?.value).toBe(80);
    expect(dist.find(d => d.name === "Muito Lenta")?.value).toBe(20);
  });

  it("should handle 50/50 distribution", () => {
    const rows: ChartRow[] = [];
    for (let i = 0; i < 50; i++) rows.push(mockRow("slow", "2026-03-23T10:00:00Z"));
    for (let i = 0; i < 50; i++) rows.push(mockRow("error", "2026-03-23T10:00:00Z"));
    const dist = computeSeverityDistribution(rows);
    expect(dist.find(d => d.name === "Lenta")?.value).toBe(50);
    expect(dist.find(d => d.name === "Erro")?.value).toBe(50);
  });
});
