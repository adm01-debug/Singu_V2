import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PublicSurvey from './PublicSurvey';

const { rpc, toastError } = vi.hoisted(() => ({ rpc: vi.fn(), toastError: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
vi.mock('sonner', () => ({ toast: { error: toastError } }));

const token = '00000000-0000-4000-8000-000000000001';
const survey = {
  id: token, score: null, feedback: null, status: 'pending', channel: 'email',
  expires_at: null, survey_type: 'nps', rating_min: 0, rating_max: 10,
};
const renderSurvey = () => render(
  <MemoryRouter initialEntries={[`/survey/${token}`]}>
    <Routes><Route path="/survey/:token" element={<PublicSurvey />} /></Routes>
  </MemoryRouter>,
);

describe('Resposta pública de pesquisa', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each([
    ['csat', 1, 5], ['nps', 0, 10], ['ces', 1, 7],
  ] as const)('usa os limites da pesquisa %s', async (type, min, max) => {
    rpc.mockResolvedValue({ data: { ...survey, survey_type: type, rating_min: min, rating_max: max }, error: null });
    renderSurvey();
    await screen.findByRole('button', { name: `Nota ${min}` });
    expect(screen.getAllByRole('button', { name: /^Nota / })).toHaveLength(max - min + 1);
    expect(screen.getByRole('button', { name: `Nota ${max}` })).toBeInTheDocument();
    if (min === 1) expect(screen.queryByRole('button', { name: 'Nota 0' })).not.toBeInTheDocument();
  });

  it('envia NPS zero e só confirma após persistência', async () => {
    rpc.mockResolvedValueOnce({ data: survey, error: null }).mockResolvedValueOnce({ data: true, error: null });
    renderSurvey();
    fireEvent.click(await screen.findByRole('button', { name: 'Nota 0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar resposta' }));
    await screen.findByText('Obrigado!');
    expect(rpc).toHaveBeenLastCalledWith('submit_public_csat_survey', { _token: token, _score: 0, _feedback: null });
  });

  it('não confirma sucesso quando a RPC recusa a resposta', async () => {
    rpc.mockResolvedValueOnce({ data: survey, error: null }).mockResolvedValueOnce({ data: false, error: null });
    renderSurvey();
    fireEvent.click(await screen.findByRole('button', { name: 'Nota 10' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar resposta' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Não foi possível registrar sua resposta. Tente novamente.'));
    expect(screen.queryByText('Obrigado!')).not.toBeInTheDocument();
  });

  it('bloqueia uma escala pública não configurada', async () => {
    rpc.mockResolvedValue({ data: { ...survey, survey_type: 'custom', rating_min: null, rating_max: null }, error: null });
    renderSurvey();
    await screen.findByText(/não possui uma escala/);
    expect(screen.queryByRole('button', { name: 'Enviar resposta' })).not.toBeInTheDocument();
    await waitFor(() => expect(rpc).toHaveBeenCalledOnce());
  });
});
