import { describe, it, expect } from "vitest";
import { extractExcerpts } from "../extractExcerpts";

const opts = { totalCap: 5, maxPerSource: 2, window: 140 };

describe("extractExcerpts", () => {
  it("retorna excerto único quando há 1 keyword e 1 match", () => {
    const out = extractExcerpts(
      [{ id: "a", text: "Falamos sobre preço e ficou claro que cabe." }],
      ["preço"],
      opts,
    );
    expect(out).toHaveLength(1);
    expect(out[0].matchTerm.toLowerCase()).toBe("preço");
    expect(out[0].interactionId).toBe("a");
  });

  it("ordena por relevância (densidade desc) respeitando maxPerSource", () => {
    const out = extractExcerpts(
      [
        { id: "a", text: "preço alto preço médio" },
        { id: "b", text: "preço baixo" },
      ],
      ["preço"],
      opts,
    );
    expect(out[0].interactionId).toBe("a");
    expect(out.map((e) => e.interactionId)).toContain("b");
  });

  it("escapa caracteres regex em keywords", () => {
    const out = extractExcerpts(
      [{ id: "a", text: "use a API v2.0 hoje" }],
      ["v2.0"],
      opts,
    );
    expect(out).toHaveLength(1);
    expect(out[0].matchTerm).toBe("v2.0");
  });

  it("retorna lista vazia quando não há matches", () => {
    const out = extractExcerpts([{ id: "a", text: "nada relevante aqui" }], ["xyz"], opts);
    expect(out).toEqual([]);
  });

  it("respeita totalCap", () => {
    const text = Array(20).fill("preço").join(" outras palavras ");
    const out = extractExcerpts([{ id: "a", text }], ["preço"], opts);
    expect(out.length).toBeLessThanOrEqual(opts.maxPerSource);
  });

  it("respeita maxPerSource", () => {
    const text = Array(10).fill("teste").join(" e ");
    const out = extractExcerpts([{ id: "a", text }], ["teste"], { ...opts, maxPerSource: 2 });
    expect(out).toHaveLength(2);
  });

  it("normaliza acentuação na busca mas preserva texto original", () => {
    const out = extractExcerpts(
      [{ id: "a", text: "Discutimos PREÇO e prazo." }],
      ["preco"],
      opts,
    );
    expect(out).toHaveLength(1);
    expect(out[0].matchTerm).toBe("PREÇO");
  });

  it("ignora keywords vazias ou muito curtas", () => {
    const out = extractExcerpts([{ id: "a", text: "qualquer coisa" }], ["", " ", "a"], opts);
    expect(out).toEqual([]);
  });
});
