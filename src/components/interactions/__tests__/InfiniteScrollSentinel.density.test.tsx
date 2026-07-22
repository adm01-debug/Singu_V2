import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { InfiniteScrollSentinel } from '../InfiniteScrollSentinel';
import { DensityProvider, notifyDensityChange } from '@/contexts/DensityContext';

const makeRef = () => createRef<HTMLDivElement>();

beforeEach(() => {
  localStorage.clear();
});

describe('InfiniteScrollSentinel — densidade ambiente', () => {
  it('usa "comfortable" por padrão (sem provider, sem localStorage)', () => {
    const { container } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />,
    );
    // 3 ComfortableItemSkeleton, cada um com avatar .h-9.w-9
    expect(container.querySelectorAll('.h-9.w-9').length).toBe(3);
  });

  it('lê "compact" do localStorage automaticamente', () => {
    localStorage.setItem('singu-table-density-anon', 'compact');
    notifyDensityChange();
    const { container } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />,
    );
    // 2 CompactItemSkeleton, cada um com avatar .h-7.w-7
    expect(container.querySelectorAll('.h-7.w-7').length).toBe(2);
    expect(container.querySelectorAll('.h-9.w-9').length).toBe(0);
  });

  it('DensityProvider tem prioridade sobre localStorage', () => {
    localStorage.setItem('singu-table-density-anon', 'comfortable');
    const { container } = render(
      <DensityProvider value="compact">
        <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />
      </DensityProvider>,
    );
    expect(container.querySelectorAll('.h-7.w-7').length).toBe(2);
    expect(container.querySelectorAll('.h-9.w-9').length).toBe(0);
  });

  it('prop density explícita sobrescreve provider', () => {
    const { container } = render(
      <DensityProvider value="compact">
        <InfiniteScrollSentinel
          sentinelRef={makeRef()}
          hasMore
          total={100}
          totalLoaded={10}
          density="comfortable"
        />
      </DensityProvider>,
    );
    expect(container.querySelectorAll('.h-9.w-9').length).toBe(3);
  });

  it('mensagem final inclui total exibido e densidade compacta', () => {
    localStorage.setItem('singu-table-density-anon', 'compact');
    render(
      <InfiniteScrollSentinel
        sentinelRef={makeRef()}
        hasMore={false}
        total={50}
        totalLoaded={50}
      />,
    );
    expect(
      screen.getByText(/Fim da lista — 50 de 50 interações exibidas · densidade compacta/),
    ).toBeInTheDocument();
  });

  it('mensagem final usa singular quando total=1 (densidade confortável)', () => {
    render(
      <InfiniteScrollSentinel
        sentinelRef={makeRef()}
        hasMore={false}
        total={1}
        totalLoaded={1}
      />,
    );
    expect(
      screen.getByText(/Fim da lista — 1 de 1 interação exibida · densidade confortável/),
    ).toBeInTheDocument();
  });
});
