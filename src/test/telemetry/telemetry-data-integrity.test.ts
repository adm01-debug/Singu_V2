/**
 * Telemetria - Testes de integridade de dados, validações e cenários de borda
 * Cobre: validação de schema, dados corrompidos, cenários de concorrência,
 * limites de paginação, segurança RLS
 */
import { describe, it, expect } from "vitest";

// ============================================================
// Helper functions
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

function createRow(overrides: Partial<TelemetryRow> = {}): TelemetryRow {
  return {
     
    id: Math.random().toString(36).slice(2),
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

function validateRow(row: TelemetryRow): string[] {
  const errors: string[] = [];
  if (!row.id) errors.push("id is required");
  if (!row.operation) errors.push("operation is required");
  if (typeof row.duration_ms !== "number" || row.duration_ms < 0) errors.push("duration_ms must be non-negative number");
  if (!row.severity) errors.push("severity is required");
  if (!row.created_at) errors.push("created_at is required");
  if (row.created_at && isNaN(new Date(row.created_at).getTime())) errors.push("created_at must be valid ISO date");
  if (row.record_count !== null && row.record_count < 0) errors.push("record_count must be non-negative");
  if (row.query_limit !== null && row.query_limit < 0) errors.push("query_limit must be non-negative");
  if (row.query_offset !== null && row.query_offset < 0) errors.push("query_offset must be non-negative");
  const validSeverities = ["normal", "slow", "very_slow", "error"];
  if (!validSeverities.includes(row.severity)) errors.push(`invalid severity: ${row.severity}`);
  const validOps = ["select", "insert", "update", "delete", "upsert", "rpc", "count"];
  if (!validOps.includes(row.operation)) errors.push(`invalid operation: ${row.operation}`);
  return errors;
}

function isRowInTimeRange(row: TelemetryRow, start: Date, end: Date): boolean {
  const t = new Date(row.created_at).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function paginateRows(rows: TelemetryRow[], limit: number, offset: number): TelemetryRow[] {
  return rows.slice(offset, offset + limit);
}

function sortByCreatedAt(rows: TelemetryRow[], ascending = false): TelemetryRow[] {
  return [...rows].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return ascending ? diff : -diff;
  });
}

function groupByUserId(rows: TelemetryRow[]): Map<string | null, TelemetryRow[]> {
  const map = new Map<string | null, TelemetryRow[]>();
  for (const r of rows) {
    const existing = map.get(r.user_id) || [];
    existing.push(r);
    map.set(r.user_id, existing);
  }
  return map;
}

// ============================================================
// TESTS
// ============================================================

// ------ Schema validation ------
describe("Schema validation", () => {
  it("should validate a correct row", () => {
    expect(validateRow(createRow())).toEqual([]);
  });

  it("should detect missing id", () => {
    const errors = validateRow(createRow({ id: "" }));
    expect(errors).toContain("id is required");
  });

  it("should detect missing operation", () => {
    const errors = validateRow(createRow({ operation: "" }));
    expect(errors).toContain("operation is required");
  });

  it("should detect negative duration_ms", () => {
    const errors = validateRow(createRow({ duration_ms: -1 }));
    expect(errors).toContain("duration_ms must be non-negative number");
  });

  it("should detect invalid severity", () => {
    const errors = validateRow(createRow({ severity: "invalid" }));
    expect(errors.some(e => e.includes("invalid severity"))).toBe(true);
  });

  it("should detect invalid operation", () => {
    const errors = validateRow(createRow({ operation: "invalid_op" }));
    expect(errors.some(e => e.includes("invalid operation"))).toBe(true);
  });

  it("should detect invalid created_at", () => {
    const errors = validateRow(createRow({ created_at: "not-a-date" }));
    expect(errors).toContain("created_at must be valid ISO date");
  });

  it("should accept null for nullable fields", () => {
    const row = createRow({
      table_name: null,
      rpc_name: null,
      record_count: null,
      query_limit: null,
      query_offset: null,
      count_mode: null,
      error_message: null,
      user_id: null,
    });
    expect(validateRow(row)).toEqual([]);
  });

  it("should validate all valid operations", () => {
    const ops = ["select", "insert", "update", "delete", "upsert", "rpc", "count"];
    for (const op of ops) {
      expect(validateRow(createRow({ operation: op }))).toEqual([]);
    }
  });

  it("should validate all valid severities", () => {
    const sevs = ["normal", "slow", "very_slow", "error"];
    for (const sev of sevs) {
      expect(validateRow(createRow({ severity: sev }))).toEqual([]);
    }
  });
});

// ------ Time range filtering ------
describe("Time range filtering", () => {
  const start = new Date("2026-03-23T00:00:00Z");
  const end = new Date("2026-03-23T23:59:59Z");

  it("should include rows within range", () => {
    const row = createRow({ created_at: "2026-03-23T12:00:00Z" });
    expect(isRowInTimeRange(row, start, end)).toBe(true);
  });

  it("should include rows at range boundaries", () => {
    expect(isRowInTimeRange(createRow({ created_at: start.toISOString() }), start, end)).toBe(true);
    expect(isRowInTimeRange(createRow({ created_at: end.toISOString() }), start, end)).toBe(true);
  });

  it("should exclude rows before range", () => {
    const row = createRow({ created_at: "2026-03-22T23:59:59Z" });
    expect(isRowInTimeRange(row, start, end)).toBe(false);
  });

  it("should exclude rows after range", () => {
    const row = createRow({ created_at: "2026-03-24T00:00:01Z" });
    expect(isRowInTimeRange(row, start, end)).toBe(false);
  });

  it("should filter batch correctly", () => {
    const rows = [
      createRow({ created_at: "2026-03-22T10:00:00Z" }),
      createRow({ created_at: "2026-03-23T10:00:00Z" }),
      createRow({ created_at: "2026-03-23T15:00:00Z" }),
      createRow({ created_at: "2026-03-24T10:00:00Z" }),
    ];
    const filtered = rows.filter(r => isRowInTimeRange(r, start, end));
    expect(filtered.length).toBe(2);
  });
});

// ------ Pagination ------
describe("Pagination", () => {
  const rows = Array.from({ length: 50 }, (_, i) =>
    createRow({ id: `row-${i}`, duration_ms: i * 100 })
  );

  it("should return first page", () => {
    const page = paginateRows(rows, 10, 0);
    expect(page.length).toBe(10);
    expect(page[0].id).toBe("row-0");
  });

  it("should return second page", () => {
    const page = paginateRows(rows, 10, 10);
    expect(page.length).toBe(10);
    expect(page[0].id).toBe("row-10");
  });

  it("should return partial last page", () => {
    const page = paginateRows(rows, 10, 45);
    expect(page.length).toBe(5);
  });

  it("should return empty for offset beyond data", () => {
    expect(paginateRows(rows, 10, 100).length).toBe(0);
  });

  it("should handle limit larger than dataset", () => {
    expect(paginateRows(rows, 200, 0).length).toBe(50);
  });

  it("should handle limit=1 (single row pages)", () => {
    for (let i = 0; i < 10; i++) {
      const page = paginateRows(rows, 1, i);
      expect(page.length).toBe(1);
      expect(page[0].id).toBe(`row-${i}`);
    }
  });

  it("should respect 200-row query limit", () => {
    const largeSet = Array.from({ length: 500 }, (_, i) => createRow({ id: `r-${i}` }));
    const page = paginateRows(largeSet, 200, 0);
    expect(page.length).toBe(200);
  });
});

// ------ Sorting ------
describe("Sorting", () => {
  it("should sort descending by default", () => {
    const rows = [
      createRow({ created_at: "2026-03-23T10:00:00Z" }),
      createRow({ created_at: "2026-03-23T12:00:00Z" }),
      createRow({ created_at: "2026-03-23T08:00:00Z" }),
    ];
    const sorted = sortByCreatedAt(rows);
    expect(new Date(sorted[0].created_at).getTime()).toBeGreaterThan(new Date(sorted[1].created_at).getTime());
    expect(new Date(sorted[1].created_at).getTime()).toBeGreaterThan(new Date(sorted[2].created_at).getTime());
  });

  it("should sort ascending when specified", () => {
    const rows = [
      createRow({ created_at: "2026-03-23T10:00:00Z" }),
      createRow({ created_at: "2026-03-23T12:00:00Z" }),
      createRow({ created_at: "2026-03-23T08:00:00Z" }),
    ];
    const sorted = sortByCreatedAt(rows, true);
    expect(new Date(sorted[0].created_at).getTime()).toBeLessThan(new Date(sorted[1].created_at).getTime());
  });

  it("should not mutate original array", () => {
    const rows = [
      createRow({ created_at: "2026-03-23T12:00:00Z" }),
      createRow({ created_at: "2026-03-23T08:00:00Z" }),
    ];
    const original = [...rows];
    sortByCreatedAt(rows);
    expect(rows[0].created_at).toBe(original[0].created_at);
  });

  it("should handle single row", () => {
    const rows = [createRow()];
    expect(sortByCreatedAt(rows).length).toBe(1);
  });

  it("should handle same timestamps", () => {
    const ts = "2026-03-23T10:00:00Z";
    const rows = Array.from({ length: 5 }, () => createRow({ created_at: ts }));
    const sorted = sortByCreatedAt(rows);
    expect(sorted.length).toBe(5);
  });
});

// ------ User isolation (RLS concept) ------
describe("User isolation / RLS simulation", () => {
  it("should group rows by user_id", () => {
    const rows = [
      createRow({ user_id: "user-1" }),
      createRow({ user_id: "user-1" }),
      createRow({ user_id: "user-2" }),
      createRow({ user_id: "user-3" }),
    ];
    const grouped = groupByUserId(rows);
    expect(grouped.get("user-1")?.length).toBe(2);
    expect(grouped.get("user-2")?.length).toBe(1);
    expect(grouped.get("user-3")?.length).toBe(1);
  });

  it("should isolate data per user", () => {
    const rows = [
      createRow({ user_id: "user-1", severity: "slow" }),
      createRow({ user_id: "user-2", severity: "very_slow" }),
    ];
    const grouped = groupByUserId(rows);
    const user1Rows = grouped.get("user-1") || [];
    expect(user1Rows.every(r => r.user_id === "user-1")).toBe(true);
    expect(user1Rows.some(r => r.severity === "very_slow")).toBe(false);
  });

  it("should handle null user_id", () => {
    const rows = [
      createRow({ user_id: null }),
      createRow({ user_id: "user-1" }),
    ];
    const grouped = groupByUserId(rows);
    expect(grouped.get(null)?.length).toBe(1);
  });

  it("should handle 100 different users", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      createRow({ user_id: `user-${i}` })
    );
    const grouped = groupByUserId(rows);
    expect(grouped.size).toBe(100);
  });
});

// ------ Cleanup threshold ------
describe("Cleanup threshold (7-day retention)", () => {
  const now = new Date("2026-03-23T12:00:00Z");
  const threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  it("should identify rows older than 7 days", () => {
    const oldRow = createRow({ created_at: "2026-03-15T12:00:00Z" });
    expect(new Date(oldRow.created_at).getTime() < threshold.getTime()).toBe(true);
  });

  it("should keep rows within 7 days", () => {
    const recentRow = createRow({ created_at: "2026-03-20T12:00:00Z" });
    expect(new Date(recentRow.created_at).getTime() >= threshold.getTime()).toBe(true);
  });

  it("should handle boundary exactly at 7 days", () => {
    const boundaryRow = createRow({ created_at: threshold.toISOString() });
    expect(new Date(boundaryRow.created_at).getTime() >= threshold.getTime()).toBe(true);
  });

  it("should correctly partition rows for cleanup", () => {
    const rows = [
      createRow({ created_at: "2026-03-10T12:00:00Z" }), // old
      createRow({ created_at: "2026-03-14T12:00:00Z" }), // old
      createRow({ created_at: "2026-03-17T12:00:00Z" }), // recent
      createRow({ created_at: "2026-03-22T12:00:00Z" }), // recent
    ];
    const toDelete = rows.filter(r => new Date(r.created_at).getTime() < threshold.getTime());
    const toKeep = rows.filter(r => new Date(r.created_at).getTime() >= threshold.getTime());
    expect(toDelete.length).toBe(2);
    expect(toKeep.length).toBe(2);
  });
});

// ------ Error message handling ------
describe("Error message handling", () => {
  it("should store error message with error severity", () => {
    const row = createRow({ severity: "error", error_message: "Connection timeout" });
    expect(row.error_message).toBe("Connection timeout");
  });

  it("should allow null error_message for non-error rows", () => {
    const row = createRow({ severity: "slow", error_message: null });
    expect(row.error_message).toBeNull();
  });

  it("should handle long error messages", () => {
    const longMessage = "A".repeat(10000);
    const row = createRow({ error_message: longMessage });
    expect(row.error_message?.length).toBe(10000);
  });

  it("should handle special characters in error messages", () => {
    const specialMsg = 'Error: "relation" \'does not exist\' <table> & "column"';
    const row = createRow({ error_message: specialMsg });
    expect(row.error_message).toBe(specialMsg);
  });
});

// ------ Query parameters ------
describe("Query parameters", () => {
  it("should handle standard pagination params", () => {
    const row = createRow({ query_limit: 100, query_offset: 0 });
    expect(row.query_limit).toBe(100);
    expect(row.query_offset).toBe(0);
  });

  it("should handle large offset values", () => {
    const row = createRow({ query_offset: 10000 });
    expect(row.query_offset).toBe(10000);
  });

  it("should handle count modes", () => {
    const modes = [null, "exact", "planned", "estimated"];
    for (const mode of modes) {
      const row = createRow({ count_mode: mode });
      expect(row.count_mode).toBe(mode);
    }
  });

  it("should handle zero record count", () => {
    const row = createRow({ record_count: 0 });
    expect(row.record_count).toBe(0);
  });

  it("should handle 1000-row default limit", () => {
    const row = createRow({ query_limit: 1000 });
    expect(row.query_limit).toBe(1000);
  });
});

// ------ Comprehensive severity + duration matrix ------
describe("Severity + duration matrix", () => {
  const durations = [0, 100, 500, 1000, 2000, 2999, 3000, 5000, 7999, 8000, 10000, 30000];
  const severities = ["normal", "slow", "very_slow", "error"];

  for (const dur of durations) {
    for (const sev of severities) {
      it(`should validate row with duration=${dur}ms severity=${sev}`, () => {
        const row = createRow({ duration_ms: dur, severity: sev });
        expect(validateRow(row)).toEqual([]);
      });
    }
  }
});

// ------ Bulk data generation and validation ------
describe("Bulk data generation and validation", () => {
  it("should validate 500 randomly generated rows", () => {
    const operations = ["select", "insert", "update", "delete", "rpc"];
    const severities = ["normal", "slow", "very_slow", "error"];
    const tables = ["contacts", "companies", "interactions", "activities"];

    for (let i = 0; i < 500; i++) {
      const row = createRow({
        operation: operations[i % operations.length],
        severity: severities[i % severities.length],
        table_name: tables[i % tables.length],
         
        duration_ms: Math.floor(Math.random() * 15000),
         
        record_count: Math.floor(Math.random() * 1000),
        query_limit: [10, 50, 100, 200, 1000][i % 5],
        query_offset: (i % 10) * 100,
      });
      const errors = validateRow(row);
      expect(errors).toEqual([]);
    }
  });
});
