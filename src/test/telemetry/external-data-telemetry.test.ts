/**
 * External Data Edge Function - Testes de lógica de telemetria e persistência
 * 
 * Cobre: validação de input, construção de queries, emissão de telemetria,
 * filtros, paginação, busca, tratamento de erros, segurança
 */
import { describe, it, expect } from "vitest";

// ============================================================
// Extracted pure logic from external-data edge function
// ============================================================

interface ExternalDataRequest {
  table: string;
  filters?: Array<{ type: string; column: string; value: unknown }>;
  select?: string;
  order?: { column: string; ascending?: boolean };
  range?: { from: number; to: number };
  search?: { term: string; columns?: string[] };
}

interface TelemetryEntry {
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
}

const ALLOWED_TABLES = ["companies", "contacts"];

function validateRequest(body: Partial<ExternalDataRequest>): string | null {
  if (!body.table) return "Missing table parameter";
  if (!ALLOWED_TABLES.includes(body.table)) return `Invalid table. Only "${ALLOWED_TABLES.join('", "')}" are allowed.`;
  if (body.filters && !Array.isArray(body.filters)) return "Filters must be an array";
  if (body.range && (typeof body.range.from !== "number" || typeof body.range.to !== "number"))
    return "Range must have numeric 'from' and 'to'";
  if (body.search && !body.search.term) return "Search must have a 'term'";
  return null;
}

function buildSearchOrConditions(columns: string[], term: string): string {
  const escaped = `%${term}%`;
  return columns.map(col => `${col}.ilike.${escaped}`).join(",");
}

function classifyDuration(ms: number): string {
  if (ms >= 8000) return "very_slow";
  if (ms >= 3000) return "slow";
  return "normal";
}

function createTelemetryEntry(
  request: ExternalDataRequest,
  durationMs: number,
  recordCount: number | null,
  errorMessage: string | null,
  userId: string | null
): TelemetryEntry {
  return {
    operation: "select",
    table_name: request.table,
    rpc_name: "external-data",
    duration_ms: durationMs,
    record_count: recordCount,
    query_limit: request.range ? (request.range.to - request.range.from + 1) : null,
    query_offset: request.range?.from ?? null,
    count_mode: "exact",
    severity: errorMessage ? "error" : classifyDuration(durationMs),
    error_message: errorMessage,
    user_id: userId,
  };
}

function computeFilterCount(request: ExternalDataRequest): number {
  let count = 0;
  if (request.filters) count += request.filters.length;
  if (request.search?.term) count += 1;
  if (request.order) count += 1;
  if (request.range) count += 1;
  return count;
}

// ============================================================
// TESTS
// ============================================================

// ------ Request Validation ------
describe("Request validation", () => {
  it("should reject missing table", () => {
    expect(validateRequest({})).toBe("Missing table parameter");
  });

  it("should reject empty table", () => {
    expect(validateRequest({ table: "" })).toBe("Missing table parameter");
  });

  it("should reject invalid table names", () => {
    const invalid = ["users", "profiles", "interactions", "auth.users", "pg_catalog", "SELECT * FROM", "contacts; DROP TABLE"];
    for (const t of invalid) {
      expect(validateRequest({ table: t })).toContain("Invalid table");
    }
  });

  it("should accept 'companies' table", () => {
    expect(validateRequest({ table: "companies" })).toBeNull();
  });

  it("should accept 'contacts' table", () => {
    expect(validateRequest({ table: "contacts" })).toBeNull();
  });

  it("should reject non-array filters", () => {
    expect(validateRequest({ table: "contacts", filters: "bad" as never })).toBe("Filters must be an array");
  });

  it("should accept empty filters array", () => {
    expect(validateRequest({ table: "contacts", filters: [] })).toBeNull();
  });

  it("should reject range without numeric from", () => {
    expect(validateRequest({ table: "contacts", range: { from: "a" as never, to: 10 } })).toContain("Range must have numeric");
  });

  it("should reject range without numeric to", () => {
    expect(validateRequest({ table: "contacts", range: { from: 0, to: "b" as never } })).toContain("Range must have numeric");
  });

  it("should accept valid range", () => {
    expect(validateRequest({ table: "contacts", range: { from: 0, to: 49 } })).toBeNull();
  });

  it("should reject search without term", () => {
    expect(validateRequest({ table: "contacts", search: { term: "" } })).toBe("Search must have a 'term'");
  });

  it("should accept valid search", () => {
    expect(validateRequest({ table: "contacts", search: { term: "test", columns: ["name"] } })).toBeNull();
  });

  it("should accept full valid request", () => {
    const req: ExternalDataRequest = {
      table: "companies",
      filters: [{ type: "eq", column: "industry", value: "Tech" }],
      select: "id,name,industry",
      order: { column: "name", ascending: true },
      range: { from: 0, to: 49 },
      search: { term: "acme", columns: ["name"] },
    };
    expect(validateRequest(req)).toBeNull();
  });
});

// ------ SQL Injection Prevention ------
describe("SQL injection prevention", () => {
  const malicious = [
    "contacts; DROP TABLE contacts;--",
    "contacts UNION SELECT * FROM auth.users",
    "contacts' OR '1'='1",
    "../../../etc/passwd",
    "contacts\nDELETE FROM contacts",
  ];

  for (const input of malicious) {
    it(`should reject malicious table name: ${input.slice(0, 30)}...`, () => {
      expect(validateRequest({ table: input })).toContain("Invalid table");
    });
  }
});

// ------ Search OR conditions ------
describe("buildSearchOrConditions", () => {
  it("should build single column condition", () => {
    const result = buildSearchOrConditions(["name"], "test");
    expect(result).toBe("name.ilike.%test%");
  });

  it("should build multi-column conditions", () => {
    const result = buildSearchOrConditions(["name", "email", "phone"], "john");
    expect(result).toBe("name.ilike.%john%,email.ilike.%john%,phone.ilike.%john%");
  });

  it("should handle empty columns", () => {
    expect(buildSearchOrConditions([], "test")).toBe("");
  });

  it("should handle special characters in term", () => {
    const result = buildSearchOrConditions(["name"], "O'Brien");
    expect(result).toContain("O'Brien");
  });

  it("should handle many columns", () => {
    const cols = Array.from({ length: 10 }, (_, i) => `col_${i}`);
    const result = buildSearchOrConditions(cols, "x");
    expect(result.split(",").length).toBe(10);
  });
});

// ------ Duration classification ------
describe("classifyDuration", () => {
  it("should classify < 3000ms as normal", () => {
    expect(classifyDuration(0)).toBe("normal");
    expect(classifyDuration(500)).toBe("normal");
    expect(classifyDuration(2999)).toBe("normal");
  });

  it("should classify 3000-7999ms as slow", () => {
    expect(classifyDuration(3000)).toBe("slow");
    expect(classifyDuration(5000)).toBe("slow");
    expect(classifyDuration(7999)).toBe("slow");
  });

  it("should classify >= 8000ms as very_slow", () => {
    expect(classifyDuration(8000)).toBe("very_slow");
    expect(classifyDuration(15000)).toBe("very_slow");
    expect(classifyDuration(60000)).toBe("very_slow");
  });
});

// ------ Telemetry entry creation ------
describe("createTelemetryEntry", () => {
  const baseReq: ExternalDataRequest = { table: "contacts" };

  it("should create entry with correct table_name", () => {
    const entry = createTelemetryEntry(baseReq, 500, 10, null, "user-1");
    expect(entry.table_name).toBe("contacts");
    expect(entry.rpc_name).toBe("external-data");
  });

  it("should set operation to select", () => {
    const entry = createTelemetryEntry(baseReq, 500, 10, null, "user-1");
    expect(entry.operation).toBe("select");
  });

  it("should calculate severity from duration", () => {
    expect(createTelemetryEntry(baseReq, 500, 10, null, null).severity).toBe("normal");
    expect(createTelemetryEntry(baseReq, 4000, 10, null, null).severity).toBe("slow");
    expect(createTelemetryEntry(baseReq, 9000, 10, null, null).severity).toBe("very_slow");
  });

  it("should override severity to error when error_message exists", () => {
    const entry = createTelemetryEntry(baseReq, 100, null, "Connection failed", null);
    expect(entry.severity).toBe("error");
    expect(entry.error_message).toBe("Connection failed");
  });

  it("should calculate query_limit from range", () => {
    const req: ExternalDataRequest = { table: "contacts", range: { from: 0, to: 49 } };
    const entry = createTelemetryEntry(req, 500, 50, null, "user-1");
    expect(entry.query_limit).toBe(50);
    expect(entry.query_offset).toBe(0);
  });

  it("should set null limit/offset when no range", () => {
    const entry = createTelemetryEntry(baseReq, 500, 10, null, "user-1");
    expect(entry.query_limit).toBeNull();
    expect(entry.query_offset).toBeNull();
  });

  it("should set count_mode to exact", () => {
    const entry = createTelemetryEntry(baseReq, 500, 10, null, null);
    expect(entry.count_mode).toBe("exact");
  });

  it("should store record_count", () => {
    expect(createTelemetryEntry(baseReq, 500, 0, null, null).record_count).toBe(0);
    expect(createTelemetryEntry(baseReq, 500, 100, null, null).record_count).toBe(100);
    expect(createTelemetryEntry(baseReq, 500, null, null, null).record_count).toBeNull();
  });

  it("should store user_id", () => {
    expect(createTelemetryEntry(baseReq, 500, 10, null, "abc-123").user_id).toBe("abc-123");
    expect(createTelemetryEntry(baseReq, 500, 10, null, null).user_id).toBeNull();
  });

  it("should handle companies table", () => {
    const req: ExternalDataRequest = { table: "companies" };
    const entry = createTelemetryEntry(req, 2000, 5, null, "user-1");
    expect(entry.table_name).toBe("companies");
  });

  it("should handle large record counts", () => {
    const entry = createTelemetryEntry(baseReq, 5000, 10000, null, null);
    expect(entry.record_count).toBe(10000);
  });

  it("should handle offset pagination", () => {
    const req: ExternalDataRequest = { table: "contacts", range: { from: 100, to: 149 } };
    const entry = createTelemetryEntry(req, 500, 50, null, null);
    expect(entry.query_limit).toBe(50);
    expect(entry.query_offset).toBe(100);
  });
});

// ------ Filter count computation ------
describe("computeFilterCount", () => {
  it("should return 0 for no filters", () => {
    expect(computeFilterCount({ table: "contacts" })).toBe(0);
  });

  it("should count filters", () => {
    expect(computeFilterCount({
      table: "contacts",
      filters: [{ type: "eq", column: "a", value: 1 }, { type: "eq", column: "b", value: 2 }],
    })).toBe(2);
  });

  it("should count search as 1", () => {
    expect(computeFilterCount({
      table: "contacts",
      search: { term: "test", columns: ["name"] },
    })).toBe(1);
  });

  it("should count order as 1", () => {
    expect(computeFilterCount({
      table: "contacts",
      order: { column: "name", ascending: true },
    })).toBe(1);
  });

  it("should count range as 1", () => {
    expect(computeFilterCount({
      table: "contacts",
      range: { from: 0, to: 49 },
    })).toBe(1);
  });

  it("should sum all components", () => {
    expect(computeFilterCount({
      table: "contacts",
      filters: [{ type: "eq", column: "a", value: 1 }],
      search: { term: "test" },
      order: { column: "name" },
      range: { from: 0, to: 49 },
    })).toBe(4);
  });
});

// ------ Telemetry persistence scenarios ------
describe("Telemetry persistence scenarios", () => {
  it("should create valid entry for successful query", () => {
    const entry = createTelemetryEntry({ table: "contacts" }, 200, 25, null, "user-1");
    expect(entry.severity).toBe("normal");
    expect(entry.error_message).toBeNull();
    expect(entry.record_count).toBe(25);
  });

  it("should create valid entry for slow query", () => {
    const entry = createTelemetryEntry(
      { table: "companies", range: { from: 0, to: 999 } },
      5000, 1000, null, "user-2"
    );
    expect(entry.severity).toBe("slow");
    expect(entry.query_limit).toBe(1000);
  });

  it("should create valid entry for very slow query", () => {
    const entry = createTelemetryEntry(
      { table: "contacts", search: { term: "complex search" } },
      12000, 5, null, "user-3"
    );
    expect(entry.severity).toBe("very_slow");
    expect(entry.duration_ms).toBe(12000);
  });

  it("should create valid entry for error", () => {
    const entry = createTelemetryEntry(
      { table: "contacts" },
      50, null, "External query failed: connection timeout", "user-4"
    );
    expect(entry.severity).toBe("error");
    expect(entry.record_count).toBeNull();
    expect(entry.error_message).toContain("connection timeout");
  });

  it("should create valid entry for empty result", () => {
    const entry = createTelemetryEntry({ table: "companies" }, 100, 0, null, "user-5");
    expect(entry.record_count).toBe(0);
    expect(entry.severity).toBe("normal");
  });

  it("should handle unauthenticated requests (null user_id)", () => {
    const entry = createTelemetryEntry({ table: "contacts" }, 300, 10, null, null);
    expect(entry.user_id).toBeNull();
  });
});

// ------ Allowed tables exhaustive ------
describe("Allowed tables - exhaustive", () => {
  it("should only allow companies and contacts", () => {
    expect(ALLOWED_TABLES).toEqual(["companies", "contacts"]);
    expect(ALLOWED_TABLES.length).toBe(2);
  });

  const forbidden = [
    "profiles", "interactions", "activities", "alerts", "automation_rules",
    "automation_logs", "health_alerts", "insights", "disc_analysis_history",
    "query_telemetry", "auth.users", "pg_catalog.pg_tables",
  ];

  for (const t of forbidden) {
    it(`should reject forbidden table: ${t}`, () => {
      expect(validateRequest({ table: t })).not.toBeNull();
    });
  }
});

// ------ Filter types ------
describe("Filter types", () => {
  const filterTypes = ["eq", "ilike", "in"];

  for (const type of filterTypes) {
    it(`should accept filter type: ${type}`, () => {
      const req = {
        table: "contacts" as const,
        filters: [{ type, column: "name", value: type === "in" ? ["a", "b"] : "test" }],
      };
      expect(validateRequest(req)).toBeNull();
    });
  }
});

// ------ Pagination ranges ------
describe("Pagination ranges", () => {
  const ranges = [
    { from: 0, to: 9, expectedLimit: 10 },
    { from: 0, to: 49, expectedLimit: 50 },
    { from: 50, to: 99, expectedLimit: 50 },
    { from: 0, to: 199, expectedLimit: 200 },
    { from: 0, to: 999, expectedLimit: 1000 },
    { from: 1000, to: 1999, expectedLimit: 1000 },
  ];

  for (const r of ranges) {
    it(`should calculate limit=${r.expectedLimit} for range ${r.from}-${r.to}`, () => {
      const entry = createTelemetryEntry(
        { table: "contacts", range: { from: r.from, to: r.to } },
        500, r.expectedLimit, null, null
      );
      expect(entry.query_limit).toBe(r.expectedLimit);
      expect(entry.query_offset).toBe(r.from);
    });
  }
});

// ------ Duration boundary matrix ------
describe("Duration boundary matrix", () => {
  const cases: [number, string][] = [
    [0, "normal"], [1, "normal"], [100, "normal"], [1000, "normal"],
    [2999, "normal"], [3000, "slow"], [3001, "slow"], [5000, "slow"],
    [7999, "slow"], [8000, "very_slow"], [8001, "very_slow"],
    [10000, "very_slow"], [30000, "very_slow"], [60000, "very_slow"],
  ];

  for (const [ms, expected] of cases) {
    it(`${ms}ms should be ${expected}`, () => {
      expect(classifyDuration(ms)).toBe(expected);
    });
  }
});

// ------ Bulk telemetry entries ------
describe("Bulk telemetry entry generation", () => {
  it("should generate 200 valid entries for contacts", () => {
    for (let i = 0; i < 200; i++) {
      // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
      const dur = Math.floor(Math.random() * 15000);
      const hasError = i % 20 === 0;
      const entry = createTelemetryEntry(
        { table: "contacts", range: { from: i * 50, to: i * 50 + 49 } },
        dur,
        // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
        hasError ? null : Math.floor(Math.random() * 100),
        hasError ? "Random error" : null,
        `user-${i % 5}`
      );
      expect(entry.operation).toBe("select");
      expect(entry.table_name).toBe("contacts");
      expect(entry.duration_ms).toBe(dur);
      if (hasError) {
        expect(entry.severity).toBe("error");
      } else {
        expect(["normal", "slow", "very_slow"]).toContain(entry.severity);
      }
    }
  });

  it("should generate 200 valid entries for companies", () => {
    for (let i = 0; i < 200; i++) {
      const dur = 100 + i * 50;
      const entry = createTelemetryEntry(
        { table: "companies" },
        dur, i, null, `user-${i}`
      );
      expect(entry.table_name).toBe("companies");
      expect(entry.record_count).toBe(i);
    }
  });
});
