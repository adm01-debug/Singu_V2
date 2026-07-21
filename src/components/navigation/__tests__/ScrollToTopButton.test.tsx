import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ScrollToTopButton } from '../ScrollToTopButton';

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
}

function setScrollHeight(h: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: h,
    writable: true,
    configurable: true,
  });
}

function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function flushRaf() {
  // jsdom polyfill: requestAnimationFrame normalmente cai em setTimeout(0).
  // Usamos act + microtask flush.
  return act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
}

describe('ScrollToTopButton', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setReducedMotion(false);
    setScrollHeight(2000);
    setScrollY(0);
    scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;
    try { localStorage.removeItem('singu-table-density-anon'); } catch { /* noop */ }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try { localStorage.removeItem('singu-table-density-anon'); } catch { /* noop */ }
  });

  it('não fica visível com scrollY=0 (default threshold)', async () => {
    render(<ScrollToTopButton />);
    await flushRaf();
    expect(screen.queryByRole('button', { name: /voltar ao topo/i })).not.toBeInTheDocument();
  });

  it('fica visível quando scrollY > 400 (default)', async () => {
    render(<ScrollToTopButton />);
    setScrollY(500);
    fireEvent.scroll(window);
    await flushRaf();
    expect(screen.getByRole('button', { name: /voltar ao topo/i })).toBeInTheDocument();
  });

  it('respeita threshold customizado', async () => {
    render(<ScrollToTopButton threshold={200} />);
    setScrollY(250);
    fireEvent.scroll(window);
    await flushRaf();
    expect(screen.getByRole('button', { name: /voltar ao topo/i })).toBeInTheDocument();
  });

  it('some quando overlay mobile abre', async () => {
    render(<ScrollToTopButton />);
    setScrollY(800);
    fireEvent.scroll(window);
    await flushRaf();
    expect(screen.getByRole('button', { name: /voltar ao topo/i })).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('mobile-overlay-open'));
    });
    await flushRaf();
    expect(screen.queryByRole('button', { name: /voltar ao topo/i })).not.toBeInTheDocument();
  });

  it('click chama window.scrollTo com top:0', async () => {
    render(<ScrollToTopButton />);
    setScrollY(800);
    fireEvent.scroll(window);
    await flushRaf();
    fireEvent.click(screen.getByRole('button', { name: /voltar ao topo/i }));
    expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });

  it('usa behavior=auto quando prefers-reduced-motion', async () => {
    setReducedMotion(true);
    render(<ScrollToTopButton />);
    setScrollY(800);
    fireEvent.scroll(window);
    await flushRaf();
    fireEvent.click(screen.getByRole('button', { name: /voltar ao topo/i }));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('limiar adaptativo: scrollHeight > 4000 reduz threshold para 300', async () => {
    setScrollHeight(8000);
    render(<ScrollToTopButton />);
    setScrollY(350);
    fireEvent.scroll(window);
    await flushRaf();
    expect(screen.getByRole('button', { name: /voltar ao topo/i })).toBeInTheDocument();
  });

  it('densidade compact reduz threshold default (~280px)', async () => {
    localStorage.setItem('singu-table-density-anon', 'compact');
    render(<ScrollToTopButton />);
    // 250px < 280px → ainda invisível
    setScrollY(250);
    fireEvent.scroll(window);
    await flushRaf();
    expect(screen.queryByRole('button', { name: /voltar ao topo/i })).not.toBeInTheDocument();
    // 290px > 280px → aparece (em comfortable, 290 < 400 e ficaria oculto)
    setScrollY(290);
    fireEvent.scroll(window);
    await flushRaf();
    expect(screen.getByRole('button', { name: /voltar ao topo/i })).toBeInTheDocument();
  });

  it('compactRatio=1 desabilita o ajuste de densidade', async () => {
    localStorage.setItem('singu-table-density-anon', 'compact');
    render(<ScrollToTopButton compactRatio={1} />);
    setScrollY(290);
    fireEvent.scroll(window);
    await flushRaf();
    // Sem desconto, comportamento idêntico a comfortable: 290 < 400 → oculto
    expect(screen.queryByRole('button', { name: /voltar ao topo/i })).not.toBeInTheDocument();
  });
});
