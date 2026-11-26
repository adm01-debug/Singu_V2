import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { useSocialInsightsMock } = vi.hoisted(() => ({ useSocialInsightsMock: vi.fn() }));

vi.mock("@/hooks/useSocialInsights", () => ({
  useSocialInsights: useSocialInsightsMock,
}));

import { SocialMatchDetails } from "./SocialMatchDetails";

const insight = {
  id: "11111111-1111-1111-1111-111111111111",
  platform: "analysis" as const,
  insight_type: "behavior_summary" as const,
  content: "comunicacao",
  indicator_score: 70,
  sentiment: "neutral" as const,
  created_at: "2026-11-26T11:45:45.817Z",
};

describe("SocialMatchDetails", () => {
  beforeEach(() => {
    useSocialInsightsMock.mockReturnValue({
      data: [insight],
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
  });

  it("mostra o insight vindo de social_behavior_analysis com rotulo legivel", async () => {
    render(
      <SocialMatchDetails
        contactId="bbf441ee-a679-4189-bcab-f825c10b2021"
        metadata={{ sources: ["analysis"], keywords: ["comunicacao"] }}
        offerName="Caneta personalizada"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /VER DETALHES DO MATCH/i }));

    expect(await screen.findByText("análise")).toBeInTheDocument();
    expect(screen.getByText("perfil")).toBeInTheDocument();
    expect(screen.getAllByText("comunicacao").length).toBeGreaterThan(0);
    expect(screen.queryByText("behavior_summary")).not.toBeInTheDocument();
  });
});