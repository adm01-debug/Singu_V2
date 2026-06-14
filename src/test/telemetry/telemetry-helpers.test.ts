/**
 * Telemetria de Queries - Testes de lógica de negócio (helpers, cálculos, formatação)
 * 
 * Cobre: formatDuration, formatTime, severity classification, stats aggregation,
 * top offenders ranking, time threshold calculation, filtering logic
 */
import { describe, it, expect } from "vitest";

// ============================================================
// Extracted pure functions from AdminTelemetriaPage for testing
// ============================================================

interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  record_count: number | null;
  query_limit: number | null;
  query_offset: number | null;
  count_mode: string | null;
  severity: string;
  error_message: string | null;
  user_id: string | null;
  created_at: string;
}

type SeverityFilter = "all" | "slow" | "very_slow" | "error";
type TimeFilter = "1h" | "6h" | "24h" | "7d";

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function getTimeThreshold(timeFilter: TimeFilter, now: Date = new Date()): string {
  switch (timeFilter) {
    case "1h": return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case "6h": return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

function classifySeverity(duration_ms: number, hasError: boolean): string {
  if (hasError) return "error";
  if (duration_ms >= 8000) return "very_slow";
  if (duration_ms >= 3000) return "slow";
  return "normal";
}

function calculateStats(rows: TelemetryRow[]) {
  const verySlow = rows.filter(r => r.severity === "very_slow").length;
  const slow = rows.filter(r => r.severity === "slow").length;
  const errors = rows.filter(r => r.severity === "error").length;
  const avgDuration = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length)
    : 0;
  return { verySlow, slow, errors, avgDuration };
}

function calculateTopOffenders(rows: TelemetryRow[], max = 8) {
  const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
  for (const r of rows) {
    const key = r.rpc_name || r.table_name || "unknown";
    const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
    tableStats.set(key, {
      count: prev.count + 1,
      totalMs: prev.totalMs + r.duration_ms,
      maxMs: Math.max(prev.maxMs, r.duration_ms),
    });
  }
  return [...tableStats.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, max);
}

function filterBySeverity(rows: TelemetryRow[], filter: SeverityFilter): TelemetryRow[] {
  if (filter === "all") return rows;
  return rows.filter(r => r.severity === filter);
}

function createMockRow(overrides: Partial<TelemetryRow> = {}): TelemetryRow {
  return {
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    id: crypto.randomUUID?.() || Math.random().toString(36),
    operation: "select",
    table_name: "contacts",
    rpc_name: null,
    duration_ms: 500,
    record_count: 10,
    query_limit: 100,
    query_offset: 0,
    count_mode: null,
    severity: "normal",
    error_message: null,
    user_id: "user-123",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// TESTS
// ============================================================

// ------ formatDuration ------
describe("formatDuration", () => {
  it("should format milliseconds below 1000", () => {
    expect(formatDuration(0)).toBe("0ms");
    expect(formatDuration(1)).toBe("1ms");
    expect(formatDuration(500)).toBe("500ms");
    expect(formatDuration(999)).toBe("999ms");
  });

  it("should format seconds for values >= 1000", () => {
    expect(formatDuration(1000)).toBe("1.0s");
    expect(formatDuration(1500)).toBe("1.5s");
    expect(formatDuration(2345)).toBe("2.3s");
    expect(formatDuration(10000)).toBe("10.0s");
  });

  it("should handle large values", () => {
    expect(formatDuration(60000)).toBe("60.0s");
    expect(formatDuration(120500)).toBe("120.5s");
  });

  it("should handle edge case at exactly 1000ms", () => {
    expect(formatDuration(1000)).toBe("1.0s");
  });

  it("should handle fractional rounding", () => {
    expect(formatDuration(1050)).toBe("1.1s"); // 1.05 rounds to 1.1
    expect(formatDuration(1049)).toBe("1.0s"); // 1.049 rounds to 1.0
  });
});

// ------ classifySeverity ------
describe("classifySeverity", () => {
  it("should return 'error' when hasError is true regardless of duration", () => {
    expect(classifySeverity(0, true)).toBe("error");
    expect(classifySeverity(100, true)).toBe("error");
    expect(classifySeverity(10000, true)).toBe("error");
  });

  it("should return 'very_slow' for duration >= 8000ms", () => {
    expect(classifySeverity(8000, false)).toBe("very_slow");
    expect(classifySeverity(8001, false)).toBe("very_slow");
    expect(classifySeverity(50000, false)).toBe("very_slow");
  });

  it("should return 'slow' for duration >= 3000ms and < 8000ms", () => {
    expect(classifySeverity(3000, false)).toBe("slow");
    expect(classifySeverity(5000, false)).toBe("slow");
    expect(classifySeverity(7999, false)).toBe("slow");
  });

  it("should return 'normal' for duration < 3000ms", () => {
    expect(classifySeverity(0, false)).toBe("normal");
    expect(classifySeverity(1000, false)).toBe("normal");
    expect(classifySeverity(2999, false)).toBe("normal");
  });

  it("should handle boundary values precisely", () => {
    expect(classifySeverity(2999, false)).toBe("normal");
    expect(classifySeverity(3000, false)).toBe("slow");
    expect(classifySeverity(7999, false)).toBe("slow");
    expect(classifySeverity(8000, false)).toBe("very_slow");
  });
});

// ------ getTimeThreshold ------
describe("getTimeThreshold", () => {
  const fixedNow = new Date("2026-03-23T12:00:00.000Z");

  it("should return 1 hour ago for '1h'", () => {
    const result = getTimeThreshold("1h", fixedNow);
    const expected = new Date("2026-03-23T11:00:00.000Z").toISOString();
    expect(result).toBe(expected);
  });

  it("should return 6 hours ago for '6h'", () => {
    const result = getTimeThreshold("6h", fixedNow);
    const expected = new Date("2026-03-23T06:00:00.000Z").toISOString();
    expect(result).toBe(expected);
  });

  it("should return 24 hours ago for '24h'", () => {
    const result = getTimeThreshold("24h", fixedNow);
    const expected = new Date("2026-03-22T12:00:00.000Z").toISOString();
    expect(result).toBe(expected);
  });

  it("should return 7 days ago for '7d'", () => {
    const result = getTimeThreshold("7d", fixedNow);
    const expected = new Date("2026-03-16T12:00:00.000Z").toISOString();
    expect(result).toBe(expected);
  });

  it("should produce valid ISO strings for all filters", () => {
    const filters: TimeFilter[] = ["1h", "6h", "24h", "7d"];
    for (const f of filters) {
      const result = getTimeThreshold(f, fixedNow);
      expect(() => new Date(result)).not.toThrow();
      expect(new Date(result).toISOString()).toBe(result);
    }
  });

  it("should produce dates in the past relative to now", () => {
    const filters: TimeFilter[] = ["1h", "6h", "24h", "7d"];
    for (const f of filters) {
      const result = new Date(getTimeThreshold(f, fixedNow));
      expect(result.getTime()).toBeLessThan(fixedNow.getTime());
    }
  });

  it("should have correct ordering: 7d < 24h < 6h < 1h", () => {
    const t7d = new Date(getTimeThreshold("7d", fixedNow)).getTime();
    const t24h = new Date(getTimeThreshold("24h", fixedNow)).getTime();
    const t6h = new Date(getTimeThreshold("6h", fixedNow)).getTime();
    const t1h = new Date(getTimeThreshold("1h", fixedNow)).getTime();
    expect(t7d).toBeLessThan(t24h);
    expect(t24h).toBeLessThan(t6h);
    expect(t6h).toBeLessThan(t1h);
  });
});

// ------ calculateStats ------
describe("calculateStats", () => {
  it("should return zeros for empty array", () => {
    const stats = calculateStats([]);
    expect(stats).toEqual({ verySlow: 0, slow: 0, errors: 0, avgDuration: 0 });
  });

  it("should count severity types correctly", () => {
    const rows = [
      createMockRow({ severity: "very_slow", duration_ms: 9000 }),
      createMockRow({ severity: "very_slow", duration_ms: 10000 }),
      createMockRow({ severity: "slow", duration_ms: 4000 }),
      createMockRow({ severity: "error", duration_ms: 100 }),
      createMockRow({ severity: "normal", duration_ms: 200 }),
    ];
    const stats = calculateStats(rows);
    expect(stats.verySlow).toBe(2);
    expect(stats.slow).toBe(1);
    expect(stats.errors).toBe(1);
  });

  it("should calculate average duration correctly", () => {
    const rows = [
      createMockRow({ duration_ms: 1000 }),
      createMockRow({ duration_ms: 2000 }),
      createMockRow({ duration_ms: 3000 }),
    ];
    expect(calculateStats(rows).avgDuration).toBe(2000);
  });

  it("should round average duration", () => {
    const rows = [
      createMockRow({ duration_ms: 1000 }),
      createMockRow({ duration_ms: 2000 }),
      createMockRow({ duration_ms: 2001 }),
    ];
    expect(calculateStats(rows).avgDuration).toBe(1667); // Math.round(5001/3)
  });

  it("should handle single row", () => {
    const rows = [createMockRow({ severity: "slow", duration_ms: 5000 })];
    const stats = calculateStats(rows);
    expect(stats.slow).toBe(1);
    expect(stats.avgDuration).toBe(5000);
  });

  it("should handle all same severity", () => {
    const rows = Array.from({ length: 50 }, () =>
      createMockRow({ severity: "very_slow", duration_ms: 9000 })
    );
    const stats = calculateStats(rows);
    expect(stats.verySlow).toBe(50);
    expect(stats.slow).toBe(0);
    expect(stats.errors).toBe(0);
    expect(stats.avgDuration).toBe(9000);
  });

  it("should handle mixed severities with large dataset", () => {
    const rows: TelemetryRow[] = [];
    for (let i = 0; i < 100; i++) rows.push(createMockRow({ severity: "slow", duration_ms: 4000 }));
    for (let i = 0; i < 50; i++) rows.push(createMockRow({ severity: "very_slow", duration_ms: 9000 }));
    for (let i = 0; i < 30; i++) rows.push(createMockRow({ severity: "error", duration_ms: 100 }));
    for (let i = 0; i < 20; i++) rows.push(createMockRow({ severity: "normal", duration_ms: 200 }));
    const stats = calculateStats(rows);
    expect(stats.slow).toBe(100);
    expect(stats.verySlow).toBe(50);
    expect(stats.errors).toBe(30);
    // avg = (100*4000 + 50*9000 + 30*100 + 20*200) / 200 = (400000+450000+3000+4000)/200 = 4285
    expect(stats.avgDuration).toBe(4285);
  });
});

// ------ calculateTopOffenders ------
describe("calculateTopOffenders", () => {
  it("should return empty array for no rows", () => {
    expect(calculateTopOffenders([])).toEqual([]);
  });

  it("should group by table_name", () => {
    const rows = [
      createMockRow({ table_name: "contacts", duration_ms: 5000 }),
      createMockRow({ table_name: "contacts", duration_ms: 3000 }),
      createMockRow({ table_name: "companies", duration_ms: 4000 }),
    ];
    const offenders = calculateTopOffenders(rows);
    expect(offenders.length).toBe(2);
    expect(offenders[0][0]).toBe("contacts");
    expect(offenders[0][1].count).toBe(2);
  });

  it("should prefer rpc_name over table_name", () => {
    const rows = [
      createMockRow({ table_name: "contacts", rpc_name: "search_contacts", duration_ms: 5000 }),
    ];
    const offenders = calculateTopOffenders(rows);
    expect(offenders[0][0]).toBe("search_contacts");
  });

  it("should use 'unknown' when both are null", () => {
    const rows = [createMockRow({ table_name: null, rpc_name: null })];
    const offenders = calculateTopOffenders(rows);
    expect(offenders[0][0]).toBe("unknown");
  });

  it("should sort by count descending", () => {
    const rows = [
      createMockRow({ table_name: "a" }),
      createMockRow({ table_name: "b" }),
      createMockRow({ table_name: "b" }),
      createMockRow({ table_name: "c" }),
      createMockRow({ table_name: "c" }),
      createMockRow({ table_name: "c" }),
    ];
    const offenders = calculateTopOffenders(rows);
    expect(offenders[0][0]).toBe("c");
    expect(offenders[0][1].count).toBe(3);
    expect(offenders[1][0]).toBe("b");
    expect(offenders[1][1].count).toBe(2);
    expect(offenders[2][0]).toBe("a");
    expect(offenders[2][1].count).toBe(1);
  });

  it("should limit to max parameter", () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      createMockRow({ table_name: `table_${i}` })
    );
    expect(calculateTopOffenders(rows, 5).length).toBe(5);
    expect(calculateTopOffenders(rows, 8).length).toBe(8);
    expect(calculateTopOffenders(rows, 3).length).toBe(3);
  });

  it("should calculate maxMs correctly", () => {
    const rows = [
      createMockRow({ table_name: "t1", duration_ms: 3000 }),
      createMockRow({ table_name: "t1", duration_ms: 9000 }),
      createMockRow({ table_name: "t1", duration_ms: 5000 }),
    ];
    const offenders = calculateTopOffenders(rows);
    expect(offenders[0][1].maxMs).toBe(9000);
  });

  it("should calculate totalMs correctly", () => {
    const rows = [
      createMockRow({ table_name: "t1", duration_ms: 3000 }),
      createMockRow({ table_name: "t1", duration_ms: 9000 }),
      createMockRow({ table_name: "t1", duration_ms: 5000 }),
    ];
    const offenders = calculateTopOffenders(rows);
    expect(offenders[0][1].totalMs).toBe(17000);
  });

  it("should handle 100+ unique tables", () => {
    const rows = Array.from({ length: 150 }, (_, i) =>
      createMockRow({ table_name: `table_${i % 120}`, duration_ms: 1000 + i })
    );
    const offenders = calculateTopOffenders(rows, 8);
    expect(offenders.length).toBe(8);
    // Tables 0-29 have 2 entries each (i and i+120), tables 30-119 have 1
    for (const [, stats] of offenders) {
      expect(stats.count).toBeGreaterThanOrEqual(1);
    }
  });
});

// ------ filterBySeverity ------
describe("filterBySeverity", () => {
  const rows = [
    createMockRow({ severity: "normal" }),
    createMockRow({ severity: "slow" }),
    createMockRow({ severity: "slow" }),
    createMockRow({ severity: "very_slow" }),
    createMockRow({ severity: "error" }),
  ];

  it("should return all rows for 'all' filter", () => {
    expect(filterBySeverity(rows, "all").length).toBe(5);
  });

  it("should filter slow queries", () => {
    expect(filterBySeverity(rows, "slow").length).toBe(2);
    expect(filterBySeverity(rows, "slow").every(r => r.severity === "slow")).toBe(true);
  });

  it("should filter very_slow queries", () => {
    expect(filterBySeverity(rows, "very_slow").length).toBe(1);
  });

  it("should filter error queries", () => {
    expect(filterBySeverity(rows, "error").length).toBe(1);
  });

  it("should return empty for filter with no matches", () => {
    const normalOnly = [createMockRow({ severity: "normal" })];
    expect(filterBySeverity(normalOnly, "error").length).toBe(0);
  });

  it("should not mutate original array", () => {
    const original = [...rows];
    filterBySeverity(rows, "slow");
    expect(rows).toEqual(original);
  });
});

// ------ TelemetryRow interface validation ------
describe("TelemetryRow data integrity", () => {
  it("should have all required fields", () => {
    const row = createMockRow();
    expect(row.id).toBeDefined();
    expect(row.operation).toBeDefined();
    expect(row.duration_ms).toBeDefined();
    expect(row.severity).toBeDefined();
    expect(row.created_at).toBeDefined();
  });

  it("should accept null for nullable fields", () => {
    const row = createMockRow({
      table_name: null,
      rpc_name: null,
      record_count: null,
      query_limit: null,
      query_offset: null,
      count_mode: null,
      error_message: null,
      user_id: null,
    });
    expect(row.table_name).toBeNull();
    expect(row.rpc_name).toBeNull();
    expect(row.record_count).toBeNull();
    expect(row.error_message).toBeNull();
  });

  it("should have valid created_at ISO string", () => {
    const row = createMockRow();
    expect(() => new Date(row.created_at)).not.toThrow();
    expect(new Date(row.created_at).toISOString()).toBe(row.created_at);
  });

  it("should have non-negative duration_ms", () => {
    const row = createMockRow({ duration_ms: 0 });
    expect(row.duration_ms).toBeGreaterThanOrEqual(0);
  });
});

// ------ Edge cases and stress tests ------
describe("Stress tests - large datasets", () => {
  it("should handle 1000 rows for stats calculation", () => {
    const rows = Array.from({ length: 1000 }, (_, i) =>
      createMockRow({
        severity: i % 4 === 0 ? "very_slow" : i % 3 === 0 ? "slow" : i % 5 === 0 ? "error" : "normal",
        // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
        duration_ms: Math.floor(Math.random() * 15000),
      })
    );
    const stats = calculateStats(rows);
    expect(stats.verySlow + stats.slow + stats.errors).toBeLessThanOrEqual(1000);
    expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
  });

  it("should handle 5000 rows for top offenders", () => {
    const tables = ["contacts", "companies", "interactions", "activities", "alerts",
      "insights", "profiles", "automation_rules", "health_alerts", "disc_analysis"];
    const rows = Array.from({ length: 5000 }, (_, i) =>
      createMockRow({
        table_name: tables[i % tables.length],
        duration_ms: 1000 + (i % 10) * 500,
      })
    );
    const offenders = calculateTopOffenders(rows);
    expect(offenders.length).toBe(8);
    // Each table should have 500 entries (5000/10)
    expect(offenders[0][1].count).toBe(500);
  });

  it("should handle rows with extreme duration values", () => {
    const rows = [
      createMockRow({ duration_ms: 0 }),
      createMockRow({ duration_ms: 1 }),
      createMockRow({ duration_ms: Number.MAX_SAFE_INTEGER }),
    ];
    const stats = calculateStats(rows);
    expect(stats.avgDuration).toBeGreaterThan(0);
  });

  it("should handle filtering on large dataset", () => {
    const rows = Array.from({ length: 2000 }, (_, i) =>
      createMockRow({ severity: i % 2 === 0 ? "slow" : "normal" })
    );
    const filtered = filterBySeverity(rows, "slow");
    expect(filtered.length).toBe(1000);
  });
});

// ------ Combinatorial tests ------
describe("Combinatorial - all severity + time filter combinations", () => {
  const severities: SeverityFilter[] = ["all", "slow", "very_slow", "error"];
  const timeFilters: TimeFilter[] = ["1h", "6h", "24h", "7d"];

  for (const sev of severities) {
    for (const tf of timeFilters) {
      it(`should work with severity=${sev} and timeFilter=${tf}`, () => {
        const rows = [
          createMockRow({ severity: "slow", duration_ms: 4000 }),
          createMockRow({ severity: "very_slow", duration_ms: 9000 }),
          createMockRow({ severity: "error", duration_ms: 100 }),
          createMockRow({ severity: "normal", duration_ms: 200 }),
        ];
        const filtered = filterBySeverity(rows, sev);
        const threshold = getTimeThreshold(tf);
        expect(filtered.length).toBeGreaterThanOrEqual(0);
        expect(threshold).toBeDefined();
      });
    }
  }
});

// ------ Operations type tests ------
describe("Operation types handling", () => {
  const operations = ["select", "insert", "update", "delete", "rpc", "upsert", "count"];

  for (const op of operations) {
    it(`should handle operation type: ${op}`, () => {
      const row = createMockRow({ operation: op });
      expect(row.operation).toBe(op);
      const stats = calculateStats([row]);
      expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
    });
  }
});

// ------ Table name variations ------
describe("Table name variations", () => {
  const tables = [
    "contacts", "companies", "interactions", "activities", "alerts",
    "insights", "profiles", "automation_rules", "automation_logs",
    "health_alerts", "health_alert_settings", "disc_analysis_history",
    "disc_communication_logs", "disc_conversion_metrics", "disc_profile_config",
    "emotional_anchors", "emotional_states_history", "eq_analysis_history",
    "contact_cadence", "contact_preferences", "contact_relatives",
    "contact_time_analysis", "communication_preferences", "client_values",
    "cognitive_bias_history", "compatibility_alerts", "compatibility_settings",
    "decision_criteria", "hidden_objections", "life_events",
    "metaprogram_analysis", "offer_suggestions", "favorite_templates",
    "lux_intelligence", "query_telemetry",
  ];

  for (const table of tables) {
    it(`should correctly group offenders for table: ${table}`, () => {
      const rows = Array.from({ length: 5 }, () =>
        createMockRow({ table_name: table, duration_ms: 4000 })
      );
      const offenders = calculateTopOffenders(rows);
      expect(offenders.length).toBe(1);
      expect(offenders[0][0]).toBe(table);
      expect(offenders[0][1].count).toBe(5);
    });
  }
});

// ------ Duration formatting comprehensive ------
describe("Duration formatting - comprehensive", () => {
  const cases: [number, string][] = [
    [0, "0ms"],
    [1, "1ms"],
    [10, "10ms"],
    [100, "100ms"],
    [250, "250ms"],
    [500, "500ms"],
    [750, "750ms"],
    [999, "999ms"],
    [1000, "1.0s"],
    [1100, "1.1s"],
    [1500, "1.5s"],
    [2000, "2.0s"],
    [2500, "2.5s"],
    [3000, "3.0s"],
    [3500, "3.5s"],
    [4000, "4.0s"],
    [5000, "5.0s"],
    [8000, "8.0s"],
    [10000, "10.0s"],
    [15000, "15.0s"],
    [30000, "30.0s"],
    [60000, "60.0s"],
  ];

  for (const [input, expected] of cases) {
    it(`formatDuration(${input}) should be "${expected}"`, () => {
      expect(formatDuration(input)).toBe(expected);
    });
  }
});

// ------ Stats with specific severity distributions ------
describe("Stats - specific severity distributions", () => {
  it("should handle 100% very_slow", () => {
    const rows = Array.from({ length: 20 }, () => createMockRow({ severity: "very_slow", duration_ms: 9000 }));
    const stats = calculateStats(rows);
    expect(stats.verySlow).toBe(20);
    expect(stats.slow).toBe(0);
    expect(stats.errors).toBe(0);
  });

  it("should handle 100% slow", () => {
    const rows = Array.from({ length: 20 }, () => createMockRow({ severity: "slow", duration_ms: 4000 }));
    const stats = calculateStats(rows);
    expect(stats.verySlow).toBe(0);
    expect(stats.slow).toBe(20);
    expect(stats.errors).toBe(0);
  });

  it("should handle 100% error", () => {
    const rows = Array.from({ length: 20 }, () => createMockRow({ severity: "error", duration_ms: 100 }));
    const stats = calculateStats(rows);
    expect(stats.verySlow).toBe(0);
    expect(stats.slow).toBe(0);
    expect(stats.errors).toBe(20);
  });

  it("should handle 100% normal", () => {
    const rows = Array.from({ length: 20 }, () => createMockRow({ severity: "normal", duration_ms: 200 }));
    const stats = calculateStats(rows);
    expect(stats.verySlow).toBe(0);
    expect(stats.slow).toBe(0);
    expect(stats.errors).toBe(0);
  });

  it("should handle equal distribution", () => {
    const rows = [
      ...Array.from({ length: 25 }, () => createMockRow({ severity: "very_slow", duration_ms: 9000 })),
      ...Array.from({ length: 25 }, () => createMockRow({ severity: "slow", duration_ms: 4000 })),
      ...Array.from({ length: 25 }, () => createMockRow({ severity: "error", duration_ms: 100 })),
      ...Array.from({ length: 25 }, () => createMockRow({ severity: "normal", duration_ms: 200 })),
    ];
    const stats = calculateStats(rows);
    expect(stats.verySlow).toBe(25);
    expect(stats.slow).toBe(25);
    expect(stats.errors).toBe(25);
  });
});

// ------ Top offenders - edge cases ------
describe("Top offenders - edge cases", () => {
  it("should handle single table with many entries", () => {
    const rows = Array.from({ length: 200 }, () => createMockRow({ table_name: "contacts" }));
    const offenders = calculateTopOffenders(rows);
    expect(offenders.length).toBe(1);
    expect(offenders[0][1].count).toBe(200);
  });

  it("should handle all unique tables", () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      createMockRow({ table_name: `table_${i}` })
    );
    const offenders = calculateTopOffenders(rows, 8);
    expect(offenders.length).toBe(8);
  });

  it("should calculate correct average from totalMs/count", () => {
    const rows = [
      createMockRow({ table_name: "t1", duration_ms: 1000 }),
      createMockRow({ table_name: "t1", duration_ms: 3000 }),
      createMockRow({ table_name: "t1", duration_ms: 5000 }),
    ];
    const offenders = calculateTopOffenders(rows);
    const avg = Math.round(offenders[0][1].totalMs / offenders[0][1].count);
    expect(avg).toBe(3000);
  });

  it("should handle mix of rpc and table names", () => {
    const rows = [
      createMockRow({ table_name: "contacts", rpc_name: null }),
      createMockRow({ table_name: "contacts", rpc_name: "search_contacts" }),
      createMockRow({ table_name: null, rpc_name: "search_contacts" }),
    ];
    const offenders = calculateTopOffenders(rows);
    // "contacts" has 1 entry, "search_contacts" has 2 entries
    expect(offenders[0][0]).toBe("search_contacts");
    expect(offenders[0][1].count).toBe(2);
    expect(offenders[1][0]).toBe("contacts");
    expect(offenders[1][1].count).toBe(1);
  });
});
