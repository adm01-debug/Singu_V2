import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";

/**
 * Auditoria a11y automatizada (Rodada I — item 1).
 * Roda axe-core em primitivas e composições críticas.
 * Falha se houver violação serious/critical.
 */
describe("a11y — primitivas críticas", () => {
  it("Button sem violações", async () => {
    const { container } = render(<Button>Salvar contato</Button>);
    const results = await axe(container);
    const serious = (results.violations ?? []).filter((v) =>
      ["serious", "critical"].includes(v.impact ?? "")
    );
    expect(serious).toEqual([]);
  });

  it("Badge sem violações", async () => {
    const { container } = render(<Badge>Novo</Badge>);
    const results = await axe(container);
    const serious = (results.violations ?? []).filter((v) =>
      ["serious", "critical"].includes(v.impact ?? "")
    );
    expect(serious).toEqual([]);
  });

  it("EmptyState com ação acessível", async () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="Sem itens"
        description="Adicione o primeiro item."
        actions={[{ label: "Adicionar", onClick: () => {} }]}
      />
    );
    const results = await axe(container);
    const serious = (results.violations ?? []).filter((v) =>
      ["serious", "critical"].includes(v.impact ?? "")
    );
    expect(serious).toEqual([]);
  });

  it("Form com label associado", async () => {
    const { container } = render(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" />
        <Button type="submit">Enviar</Button>
      </form>
    );
    const results = await axe(container);
    const serious = (results.violations ?? []).filter((v) =>
      ["serious", "critical"].includes(v.impact ?? "")
    );
    expect(serious).toEqual([]);
  });
});
