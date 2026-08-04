import { describe, it, expect } from "vitest";
import { pickTopPassages, MAX_TOTAL_CAP } from "../pickTopPassages";

const longText =
  "Falamos sobre o orçamento da empresa e a expectativa de retorno. " +
  "O cliente perguntou sobre prazos de entrega e qualidade do suporte? " +
  "Discutimos integração com o ERP atual e treinamento da equipe. " +
  "No fim, ele pediu uma proposta formal com escopo detalhado.";

describe("pickTopPassages", () => {
  it("retorna até MAX_TOTAL_CAP itens mesmo com totalCap maior", () => {
    const sources = Array.from({ length: 10 }, (_, i) => ({
      id: `src-${i}`,
      text: longText,
    }));
    const out = pickTopPassages(sources, { totalCap: 50, maxPerSource: 2, window: 140 });
    expect(out.length).toBeLessThanOrEqual(MAX_TOTAL_CAP);
    expect(MAX_TOTAL_CAP).toBe(5);
  });

  it("é determinística: mesma entrada → mesma saída", () => {
    const sources = [
      { id: "a", text: longText },
      { id: "b", text: longText },
      { id: "c", text: longText },
    ];
    const opts = { totalCap: 5, maxPerSource: 2, window: 140 };
    const a = pickTopPassages(sources, opts);
    const b = pickTopPassages(sources, opts);
    expect(a).toEqual(b);
  });

  it("aplica round-robin entre fontes (distribui antes de aprofundar)", () => {
    const sources = [
      { id: "a", text: longText },
      { id: "b", text: longText },
    ];
    const out = pickTopPassages(sources, { totalCap: 4, maxPerSource: 2, window: 140 });
    // Esperado: a, b, a, b
    expect(out.map((e) => e.interactionId)).toEqual(["a", "b", "a", "b"]);
  });

  it("recorta com janela centrada (~window chars + ellipsis quando trunca)", () => {
    const out = pickTopPassages([{ id: "a", text: longText }], {
      totalCap: 1,
      maxPerSource: 1,
      window: 100,
    });
    expect(out).toHaveLength(1);
    const snippet = out[0].text;
    // janela=100 → half>=50 → snippet (sem ellipsis) tem ~window de comprimento
    expect(snippet.length).toBeGreaterThan(40);
    expect(snippet.length).toBeLessThan(160);
  });

  it("retorna [] para sources vazios ou totalCap<=0", () => {
    expect(pickTopPassages([], { totalCap: 5, maxPerSource: 2, window: 140 })).toEqual([]);
    expect(
      pickTopPassages([{ id: "a", text: longText }], { totalCap: 0, maxPerSource: 2, window: 140 }),
    ).toEqual([]);
  });

  it("ignora fontes inválidas (id vazio, text vazio)", () => {
    const out = pickTopPassages(
      [
        { id: "", text: longText },
        { id: "ok", text: longText },
        { id: "x", text: "" },
      ],
      { totalCap: 5, maxPerSource: 2, window: 140 },
    );
    expect(out.every((e) => e.interactionId === "ok")).toBe(true);
  });
});
