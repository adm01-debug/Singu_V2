import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncrementalLoadStickyBar } from '../IncrementalLoadStickyBar';

describe('IncrementalLoadStickyBar', () => {
  it('não renderiza quando total=0', () => {
    const { container } = render(
      <IncrementalLoadStickyBar hasMore totalLoaded={0} total={0} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe estado de "completo" por padrão quando !hasMore', () => {
    render(<IncrementalLoadStickyBar hasMore={false} totalLoaded={50} total={50} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/50/);
    expect(status).toHaveTextContent(/itens/);
    expect(status).toHaveTextContent(/todos carregados/);
  });

  it('usa singular "item" quando total=1', () => {
    render(<IncrementalLoadStickyBar hasMore={false} totalLoaded={1} total={1} />);
    expect(screen.getByRole('status')).toHaveTextContent(/^1 item/);
  });

  it('oculta no estado completo quando showWhenComplete=false', () => {
    const { container } = render(
      <IncrementalLoadStickyBar
        hasMore={false}
        totalLoaded={50}
        total={50}
        showWhenComplete={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe contagem e restantes quando hasMore', () => {
    render(<IncrementalLoadStickyBar hasMore totalLoaded={15} total={100} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent(/Exibindo/);
    expect(status).toHaveTextContent('15');
    expect(status).toHaveTextContent('100');
    expect(status).toHaveTextContent(/85 restantes/);
  });

  it('usa singular para 1 restante', () => {
    render(<IncrementalLoadStickyBar hasMore totalLoaded={99} total={100} />);
    expect(screen.getByRole('status')).toHaveTextContent(/1 restante(?!s)/);
  });

  it('aplica top offset via style inline', () => {
    render(
      <IncrementalLoadStickyBar hasMore totalLoaded={10} total={100} topOffset="3.5rem" />,
    );
    expect(screen.getByRole('status')).toHaveStyle({ top: '3.5rem' });
  });

  it('barra de progresso reflete percentual carregado quando hasMore', () => {
    const { container } = render(
      <IncrementalLoadStickyBar hasMore totalLoaded={25} total={100} />,
    );
    const fill = container.querySelector('[aria-hidden="true"] > div') as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.style.width).toBe('25%');
  });

  it('não renderiza barra de progresso no estado completo', () => {
    const { container } = render(
      <IncrementalLoadStickyBar hasMore={false} totalLoaded={50} total={50} />,
    );
    // Apenas o ícone tem aria-hidden no estado completo; nenhum filho > div
    const progressFill = container.querySelector('[aria-hidden="true"] > div');
    expect(progressFill).toBeNull();
  });
});
