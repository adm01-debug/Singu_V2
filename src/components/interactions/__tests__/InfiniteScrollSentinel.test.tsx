import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { InfiniteScrollSentinel } from '../InfiniteScrollSentinel';

function makeRef() {
  return createRef<HTMLDivElement>();
}

describe('InfiniteScrollSentinel', () => {
  it('não renderiza nada quando total=0', () => {
    const { container } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={0} totalLoaded={0} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe progressbar com aria-values e contador no estado hasMore', () => {
    render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '10');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('10%');
    expect(screen.getByText(/10 de 100/)).toBeInTheDocument();
  });

  it('exibe estado final sem barra quando !hasMore', () => {
    render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore={false} total={50} totalLoaded={50} />
    );
    expect(
      screen.getByText(/Fim da lista — 50 de 50 interações exibidas · densidade confortável/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renderiza 3 skeletons em comfortable e 2 em compact', () => {
    const { container, rerender } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />
    );
    // comfortable: 3 ComfortableItemSkeleton, cada um com avatar .h-9.w-9
    expect(container.querySelectorAll('.h-9.w-9').length).toBe(3);

    rerender(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} density="compact" />
    );
    // compact: 2 CompactItemSkeleton, cada um com avatar .h-7.w-7; nenhum comfortable
    expect(container.querySelectorAll('.h-9.w-9').length).toBe(0);
    expect(container.querySelectorAll('.h-7.w-7').length).toBe(2);
  });

  it('aplica atributos de acessibilidade no estado de carregamento', () => {
    const { container } = render(
      <InfiniteScrollSentinel sentinelRef={makeRef()} hasMore total={100} totalLoaded={10} />
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Carregando mais interações');
  });
});
