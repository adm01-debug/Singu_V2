import { describe, it, expect } from "vitest";
import { computeAlertStats, formatMtta } from "../behavioralAlertStats";

const iso = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();

describe("computeAlertStats", () => {
  it("retorna zeros quando não há alertas", () => {
    expect(computeAlertStats([])).toEqual({
      realTotal: 0,
      realCritical: 0,
      simulated: 0,
      mttaMinutes: null,
    });
  });

  it("separa reais de simulações e conta críticos", () => {
    const stats = computeAlertStats([
      { is_simulated: false, severity: "critical", created_at: iso(0), acknowledged_at: null },
      { is_simulated: false, severity: "warning", created_at: iso(0), acknowledged_at: null },
      { is_simulated: true, severity: "critical", created_at: iso(0), acknowledged_at: null },
    ]);
    expect(stats.realTotal).toBe(2);
    expect(stats.realCritical).toBe(1);
    expect(stats.simulated).toBe(1);
    expect(stats.mttaMinutes).toBeNull();
  });

  it("calcula MTTA médio apenas de alertas reais reconhecidos", () => {
    const created = new Date("2026-01-01T00:00:00Z").toISOString();
    const ack10 = new Date("2026-01-01T00:10:00Z").toISOString();
    const ack30 = new Date("2026-01-01T00:30:00Z").toISOString();
    const stats = computeAlertStats([
      { is_simulated: false, severity: "warning", created_at: created, acknowledged_at: ack10 },
      { is_simulated: false, severity: "critical", created_at: created, acknowledged_at: ack30 },
      { is_simulated: false, severity: "warning", created_at: created, acknowledged_at: null },
      { is_simulated: true, severity: "warning", created_at: created, acknowledged_at: ack10 },
    ]);
    expect(stats.mttaMinutes).toBe(20);
  });

  it("nunca retorna MTTA negativo se ack < created (clock skew)", () => {
    const created = new Date("2026-01-01T00:10:00Z").toISOString();
    const ack = new Date("2026-01-01T00:00:00Z").toISOString();
    const stats = computeAlertStats([
      { is_simulated: false, severity: "warning", created_at: created, acknowledged_at: ack },
    ]);
    expect(stats.mttaMinutes).toBe(0);
  });
});

describe("formatMtta", () => {
  it.each([
    [null, "—"],
    [0, "<1 min"],
    [1, "1 min"],
    [45, "45 min"],
    [60, "1h 0min"],
    [125, "2h 5min"],
    [1500, "1d 1h"],
  ])("formata %s → %s", (input, expected) => {
    expect(formatMtta(input)).toBe(expected);
  });
});