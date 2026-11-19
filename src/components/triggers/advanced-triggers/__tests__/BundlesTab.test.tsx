import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { TRIGGER_BUNDLES, getBundleByScenario } from '@/data/triggerBundles';
import { BundlesTab } from '../BundlesTab';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const precoObjecao = getBundleByScenario('price_objection');

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('BundlesTab', () => {
  it('abre no roteiro de objeção de preço, com abertura, passos e fechamento', () => {
    render(<BundlesTab />);
    expect(screen.getByRole('heading', { name: precoObjecao?.name })).toBeInTheDocument();
    expect(screen.getByText(precoObjecao?.openingTemplate ?? '')).toBeInTheDocument();
    expect(screen.getByText(precoObjecao?.closingTemplate ?? '')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(precoObjecao?.timing.length ?? 0);
  });

  it('não mostra a taxa de sucesso fixa do arquivo de dados', () => {
    render(<BundlesTab />);
    expect(screen.queryByText(new RegExp(`${precoObjecao?.successRate}\\s*%`))).not.toBeInTheDocument();
  });

  it('oferece as 8 situações e troca o roteiro ao escolher outra', () => {
    render(<BundlesTab />);
    for (const pacote of TRIGGER_BUNDLES) {
      expect(screen.getByRole('button', { name: pacote.name })).toBeInTheDocument();
    }
    const renovacao = getBundleByScenario('contract_renewal');
    fireEvent.click(screen.getByRole('button', { name: renovacao?.name }));
    expect(screen.getByRole('heading', { name: renovacao?.name })).toBeInTheDocument();
  });

  it('só mostra frase por perfil depois que o perfil é escolhido, e some ao desmarcar', () => {
    render(<BundlesTab />);
    expect(screen.queryByText('Frase para como ele percebe')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Visual' }));
    expect(screen.getAllByText('Frase para como ele percebe').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Visual' }));
    expect(screen.queryByText('Frase para como ele percebe')).not.toBeInTheDocument();
  });

  it('pré-seleciona o perfil DISC recebido do contato', () => {
    render(<BundlesTab discInicial="S" />);
    expect(screen.getByRole('button', { name: 'S · Estável' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('leva ao roteiro reserva pelo botão "Se não funcionar"', () => {
    render(<BundlesTab />);
    fireEvent.click(screen.getByRole('button', { name: /se não funcionar/i }));
    expect(screen.getByRole('heading', { name: getBundleByScenario('general')?.name })).toBeInTheDocument();
  });

  it('copia a frase de abertura e confirma; avisa quando o navegador recusa', async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('negado'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<BundlesTab />);

    const copiar = screen.getAllByRole('button', { name: /copiar/i })[0];
    fireEvent.click(copiar);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Frase copiada'));
    expect(writeText).toHaveBeenCalledWith(precoObjecao?.openingTemplate);

    fireEvent.click(copiar);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
