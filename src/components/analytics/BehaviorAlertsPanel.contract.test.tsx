import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorAlertsPanel } from './BehaviorAlertsPanel';

const mocks = vi.hoisted(() => ({ detect: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
vi.mock('@/hooks/useBehaviorAlerts', () => ({ useBehaviorAlerts: () => ({
  alerts: [], stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }, loading: false,
  detectNewAlerts: mocks.detect, dismissAlert: vi.fn(), markActionTaken: vi.fn(), ALERT_TYPE_CONFIG: {},
}) }));
beforeEach(() => vi.resetAllMocks());

describe('recuperação da detecção de alertas', () => {
  it('informa a falha, libera o botão e permite repetir a consulta', async () => {
    let rejectRequest: (error: Error) => void = error => { throw error; };
    const pending = new Promise<void>((_, reject) => { rejectRequest = reject; });
    mocks.detect.mockReturnValueOnce(pending).mockResolvedValueOnce(0);
    render(<MemoryRouter><BehaviorAlertsPanel /></MemoryRouter>);
    const button = screen.getByRole('button', { name: 'Detectar novos alertas' });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    await act(async () => { rejectRequest(new Error('Servidor indisponível')); });
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(mocks.error).toHaveBeenCalledWith('Não foi possível detectar novos alertas. Tente novamente.');
    fireEvent.click(button);
    await waitFor(() => expect(mocks.detect).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(button).not.toBeDisabled());
  });
});
