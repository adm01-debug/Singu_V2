import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { SentimentDistributionChart } from "../SentimentDistributionChart";
import type { SentimentOverall } from "@/hooks/useConversationIntel";

// Recharts ResponsiveContainer requires layout dimensions; jsdom doesn't provide them.
// Stub a fixed size so the chart renders deterministically in tests.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 400 });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 224 });
  if (!(globalThis as { ResizeObserver?: unknown }).ResizeObserver) {
    (globalThis as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

const baseData = [
  { key: "positive", count: 12, pct: 40 },
  { key: "neutral", count: 9, pct: 30 },
  { key: "negative", count: 6, pct: 20 },
  { key: "mixed", count: 3, pct: 10 },
];

function getLegendButtons() {
  return screen.getAllByRole("button").filter((el) => el.tagName.toLowerCase() === "li");
}

describe("SentimentDistributionChart — acessibilidade da legenda", () => {
  it("renderiza um botão acessível por bucket clicável com aria-label e aria-pressed", () => {
    render(<SentimentDistributionChart data={baseData} onSelectBucket={vi.fn()} activeBucket={null} />);
    const buttons = getLegendButtons();
    expect(buttons).toHaveLength(4);
    buttons.forEach((b) => {
      expect(b).toHaveAttribute("aria-label");
      expect(b).toHaveAttribute("aria-pressed", "false");
      expect(b).toHaveAttribute("tabindex", "0");
    });
  });

  it("destaca o bucket ativo com aria-pressed=true e sufixo (selecionado) no aria-label", () => {
    render(<SentimentDistributionChart data={baseData} onSelectBucket={vi.fn()} activeBucket="neutral" />);
    const buttons = getLegendButtons();
    const neutral = buttons.find((b) => b.dataset.bucketKey === "neutral");
    const positive = buttons.find((b) => b.dataset.bucketKey === "positive");
    expect(neutral).toHaveAttribute("aria-pressed", "true");
    expect(neutral?.getAttribute("aria-label")).toMatch(/\(selecionado\)/i);
    expect(positive).toHaveAttribute("aria-pressed", "false");
    expect(positive?.getAttribute("aria-label") ?? "").not.toMatch(/\(selecionado\)/i);
  });

  it("Enter dispara onSelectBucket no item focado", () => {
    const onSelect = vi.fn();
    render(<SentimentDistributionChart data={baseData} onSelectBucket={onSelect} activeBucket={null} />);
    const buttons = getLegendButtons();
    const positive = buttons.find((b) => b.dataset.bucketKey === "positive")!;
    positive.focus();
    fireEvent.keyDown(positive, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("positive");
  });

  it("Espaço dispara onSelectBucket no item focado", () => {
    const onSelect = vi.fn();
    render(<SentimentDistributionChart data={baseData} onSelectBucket={onSelect} activeBucket={null} />);
    const buttons = getLegendButtons();
    const negative = buttons.find((b) => b.dataset.bucketKey === "negative")!;
    negative.focus();
    fireEvent.keyDown(negative, { key: " " });
    expect(onSelect).toHaveBeenCalledWith("negative");
  });

  it("ArrowRight move o foco para o próximo bucket clicável", () => {
    render(<SentimentDistributionChart data={baseData} onSelectBucket={vi.fn()} activeBucket={null} />);
    const buttons = getLegendButtons();
    const positive = buttons.find((b) => b.dataset.bucketKey === "positive")!;
    const neutral = buttons.find((b) => b.dataset.bucketKey === "neutral")!;
    positive.focus();
    fireEvent.keyDown(positive, { key: "ArrowRight" });
    expect(document.activeElement).toBe(neutral);
  });

  it("ArrowLeft move o foco para o bucket anterior (com wrap-around)", () => {
    render(<SentimentDistributionChart data={baseData} onSelectBucket={vi.fn()} activeBucket={null} />);
    const buttons = getLegendButtons();
    const positive = buttons.find((b) => b.dataset.bucketKey === "positive")!;
    const mixed = buttons.find((b) => b.dataset.bucketKey === "mixed")!;
    positive.focus();
    fireEvent.keyDown(positive, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(mixed);
  });

  it("ArrowDown e ArrowUp também navegam entre buckets", () => {
    render(<SentimentDistributionChart data={baseData} onSelectBucket={vi.fn()} activeBucket={null} />);
    const buttons = getLegendButtons();
    const positive = buttons.find((b) => b.dataset.bucketKey === "positive")!;
    const neutral = buttons.find((b) => b.dataset.bucketKey === "neutral")!;
    positive.focus();
    fireEvent.keyDown(positive, { key: "ArrowDown" });
    expect(document.activeElement).toBe(neutral);
    fireEvent.keyDown(neutral, { key: "ArrowUp" });
    expect(document.activeElement).toBe(positive);
  });

  it("Home foca o primeiro e End foca o último bucket clicável", () => {
    render(<SentimentDistributionChart data={baseData} onSelectBucket={vi.fn()} activeBucket={null} />);
    const buttons = getLegendButtons();
    const positive = buttons.find((b) => b.dataset.bucketKey === "positive")!;
    const mixed = buttons.find((b) => b.dataset.bucketKey === "mixed")!;
    const neutral = buttons.find((b) => b.dataset.bucketKey === "neutral")!;
    neutral.focus();
    fireEvent.keyDown(neutral, { key: "End" });
    expect(document.activeElement).toBe(mixed);
    fireEvent.keyDown(mixed, { key: "Home" });
    expect(document.activeElement).toBe(positive);
  });

  it("ignora buckets vazios (count=0) na navegação por teclado", () => {
    const data = [
      { key: "positive", count: 5, pct: 50 },
      { key: "neutral", count: 0, pct: 0 },
      { key: "negative", count: 5, pct: 50 },
      { key: "mixed", count: 0, pct: 0 },
    ];
    render(<SentimentDistributionChart data={data} onSelectBucket={vi.fn()} activeBucket={null} />);
    const buttons = getLegendButtons();
    expect(buttons.map((b) => b.dataset.bucketKey)).toEqual(["positive", "negative"]);
    const positive = buttons[0];
    positive.focus();
    fireEvent.keyDown(positive, { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("a <ul> expõe role=group com aria-label de instrução", () => {
    render(<SentimentDistributionChart data={baseData} onSelectBucket={vi.fn()} activeBucket={null} />);
    const group = screen.getByRole("group");
    expect(group.tagName.toLowerCase()).toBe("ul");
    expect(group.getAttribute("aria-label") ?? "").toMatch(/setas/i);
    expect(group.getAttribute("aria-label") ?? "").toMatch(/enter/i);
  });

  it("não chama onSelectBucket em buckets sem dados", () => {
    const onSelect = vi.fn();
    const data = [
      { key: "positive", count: 5, pct: 100 },
      { key: "neutral", count: 0, pct: 0 },
    ];
    render(<SentimentDistributionChart data={data} onSelectBucket={onSelect} activeBucket={null} />);
    // Item neutro não deve estar entre os botões clicáveis.
    const buttons = getLegendButtons();
    expect(buttons.find((b) => b.dataset.bucketKey === "neutral")).toBeUndefined();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("buckets vazios são removidos do tab order e expõem aria-disabled + aria-label informativo", () => {
    const data = [
      { key: "positive", count: 5, pct: 100 },
      { key: "neutral", count: 0, pct: 0 },
    ];
    render(<SentimentDistributionChart data={data} onSelectBucket={vi.fn()} activeBucket={null} />);
    const empty = document.querySelector('[data-bucket-key="neutral"]') as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.getAttribute("tabindex")).toBe("-1");
    expect(empty.getAttribute("aria-disabled")).toBe("true");
    expect(empty.getAttribute("aria-label")).toBe("Sem conversas no bucket Neutro");
    expect(empty.getAttribute("role")).toBeNull();
  });

  describe("live region de seleção", () => {
    function ControlledChart() {
      const [active, setActive] = useState<SentimentOverall | null>(null);
      return (
        <SentimentDistributionChart
          data={baseData}
          activeBucket={active}
          onSelectBucket={setActive}
        />
      );
    }

    it("renderiza uma região aria-live=polite vazia quando nada está selecionado", () => {
      render(<SentimentDistributionChart data={baseData} onSelectBucket={vi.fn()} activeBucket={null} />);
      const live = screen.getByTestId("sentiment-bucket-live");
      expect(live).toHaveAttribute("aria-live", "polite");
      expect(live).toHaveAttribute("aria-atomic", "true");
      expect(live).toHaveAttribute("role", "status");
      expect(live.textContent ?? "").toBe("");
    });

    it("anuncia o bucket ao selecionar via Enter pelo teclado", () => {
      render(<ControlledChart />);
      const positive = getLegendButtons().find((b) => b.dataset.bucketKey === "positive")!;
      positive.focus();
      fireEvent.keyDown(positive, { key: "Enter" });
      expect(screen.getByTestId("sentiment-bucket-live").textContent).toBe(
        "Bucket selecionado: positivo",
      );
    });

    it("anuncia o bucket ao selecionar via Espaço pelo teclado", () => {
      render(<ControlledChart />);
      const negative = getLegendButtons().find((b) => b.dataset.bucketKey === "negative")!;
      negative.focus();
      fireEvent.keyDown(negative, { key: " " });
      expect(screen.getByTestId("sentiment-bucket-live").textContent).toBe(
        "Bucket selecionado: negativo",
      );
    });

    it("atualiza o anúncio ao alternar entre buckets via teclado", () => {
      render(<ControlledChart />);
      const buttons = getLegendButtons();
      const positive = buttons.find((b) => b.dataset.bucketKey === "positive")!;
      positive.focus();
      fireEvent.keyDown(positive, { key: "Enter" });
      expect(screen.getByTestId("sentiment-bucket-live").textContent).toBe(
        "Bucket selecionado: positivo",
      );
      const mixed = buttons.find((b) => b.dataset.bucketKey === "mixed")!;
      mixed.focus();
      fireEvent.keyDown(mixed, { key: "Enter" });
      expect(screen.getByTestId("sentiment-bucket-live").textContent).toBe(
        "Bucket selecionado: misto",
      );
    });

    it("não anuncia ao apenas navegar com setas (sem ativar)", () => {
      render(<ControlledChart />);
      const positive = getLegendButtons().find((b) => b.dataset.bucketKey === "positive")!;
      positive.focus();
      fireEvent.keyDown(positive, { key: "ArrowRight" });
      fireEvent.keyDown(positive, { key: "ArrowDown" });
      expect(screen.getByTestId("sentiment-bucket-live").textContent).toBe("");
    });
  });

  describe("retenção e restauração de foco no ciclo do drawer", () => {
    function ControlledChart() {
      const [active, setActive] = useState<SentimentOverall | null>(null);
      return (
        <>
          <button data-testid="external-button" onClick={() => setActive(null)}>fechar</button>
          <SentimentDistributionChart
            data={baseData}
            activeBucket={active}
            onSelectBucket={setActive}
          />
        </>
      );
    }

    it("mantém o foco na fatia selecionada ao abrir o drawer via teclado", () => {
      render(<ControlledChart />);
      const positive = getLegendButtons().find((b) => b.dataset.bucketKey === "positive")!;
      positive.focus();
      fireEvent.keyDown(positive, { key: "Enter" });
      expect(document.activeElement).toBe(positive);
    });

    it("restaura o foco no último bucket ativo ao fechar o drawer via teclado", () => {
      render(<ControlledChart />);
      const buttons = getLegendButtons();
      const negative = buttons.find((b) => b.dataset.bucketKey === "negative")!;
      negative.focus();
      fireEvent.keyDown(negative, { key: " " });
      expect(document.activeElement).toBe(negative);

      // Simula foco saindo (ex.: usuário tabula até o drawer) e drawer fechando.
      const externalBtn = screen.getByTestId("external-button");
      externalBtn.focus();
      expect(document.activeElement).toBe(externalBtn);

      // Fecha o drawer (com teclado).
      fireEvent.keyDown(externalBtn, { key: "Enter" });
      fireEvent.click(externalBtn);
      // Foco volta ao bucket previamente ativo.
      expect(document.activeElement).toBe(negative);
    });

    it("não rouba o foco quando a seleção é feita por mouse (clique)", () => {
      render(<ControlledChart />);
      const externalBtn = screen.getByTestId("external-button");
      externalBtn.focus();
      const positive = getLegendButtons().find((b) => b.dataset.bucketKey === "positive")!;
      // Mousedown registra interação por mouse antes do click.
      fireEvent.mouseDown(positive);
      fireEvent.click(positive);
      // Como não foi teclado, o foco não é movido para o item.
      expect(document.activeElement).toBe(externalBtn);
    });
  });

  describe("atalhos globais (sem foco prévio na legenda)", () => {
    function ControlledChart() {
      const [active, setActive] = useState<SentimentOverall | null>(null);
      return (
        <>
          <button data-testid="external">externo</button>
          <SentimentDistributionChart
            data={baseData}
            activeBucket={active}
            onSelectBucket={setActive}
          />
        </>
      );
    }

    it("ArrowRight global foca a primeira fatia quando nenhum item está focado", () => {
      render(<ControlledChart />);
      const externalBtn = screen.getByTestId("external");
      externalBtn.focus();
      fireEvent.keyDown(externalBtn, { key: "ArrowRight" });
      const positive = getLegendButtons().find((b) => b.dataset.bucketKey === "positive")!;
      expect(document.activeElement).toBe(positive);
    });

    it("ArrowRight global avança para a próxima fatia (cursor persistente)", () => {
      render(<ControlledChart />);
      const externalBtn = screen.getByTestId("external");
      externalBtn.focus();
      fireEvent.keyDown(externalBtn, { key: "ArrowRight" }); // → positive
      const positive = getLegendButtons().find((b) => b.dataset.bucketKey === "positive")!;
      fireEvent.keyDown(positive, { key: "ArrowRight" }); // → neutral (handler local)
      const neutral = getLegendButtons().find((b) => b.dataset.bucketKey === "neutral")!;
      expect(document.activeElement).toBe(neutral);
    });

    it("ArrowLeft global retorna ao bucket anterior usando o cursor memorizado", () => {
      render(<ControlledChart />);
      const buttons = getLegendButtons();
      const positive = buttons.find((b) => b.dataset.bucketKey === "positive")!;
      positive.focus();
      fireEvent.keyDown(positive, { key: "ArrowRight" }); // cursor → neutral
      const externalBtn = screen.getByTestId("external");
      externalBtn.focus();
      fireEvent.keyDown(externalBtn, { key: "ArrowLeft" });
      expect(document.activeElement).toBe(positive);
    });

    it("Enter global seleciona a fatia sob o cursor mesmo sem foco na lista", () => {
      render(<ControlledChart />);
      const externalBtn = screen.getByTestId("external");
      externalBtn.focus();
      fireEvent.keyDown(externalBtn, { key: "ArrowRight" }); // cursor + foco → positive
      externalBtn.focus(); // tira o foco
      fireEvent.keyDown(externalBtn, { key: "Enter" });
      expect(screen.getByTestId("sentiment-bucket-live").textContent).toBe(
        "Bucket selecionado: positivo",
      );
    });

    it("atalhos globais são ignorados quando o foco está em um input", () => {
      render(
        <>
          <input data-testid="input" />
          <ControlledChart />
        </>,
      );
      const input = screen.getByTestId("input") as HTMLInputElement;
      input.focus();
      fireEvent.keyDown(input, { key: "ArrowRight" });
      expect(document.activeElement).toBe(input);
    });
  });
});
