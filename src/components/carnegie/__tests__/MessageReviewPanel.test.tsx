import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageReviewPanel } from '../MessageReviewPanel';

function revisar(texto: string) {
  render(<MessageReviewPanel />);
  fireEvent.change(screen.getByLabelText('Rascunho da mensagem'), { target: { value: texto } });
  fireEvent.click(screen.getByRole('button', { name: /revisar mensagem/i }));
}

describe('MessageReviewPanel', () => {
  it('começa vazio, com o botão desabilitado', () => {
    render(<MessageReviewPanel />);
    expect(screen.getByText(/nenhuma mensagem revisada ainda/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /revisar mensagem/i })).toBeDisabled();
  });

  it('mensagem sem problema não mostra ponto de atenção nem nota inventada', () => {
    revisar('Segue o orçamento em anexo.');
    expect(screen.getByText('Nenhum ponto de atenção encontrado')).toBeInTheDocument();
    expect(screen.getAllByText('Sem sinais no texto')).toHaveLength(2);
    expect(screen.getByText('Nenhuma ordem direta encontrada.')).toBeInTheDocument();
  });

  it('aponta os problemas e aplica a versão sugerida ao rascunho', () => {
    revisar('Você deveria rever o prazo.');
    expect(screen.getByText(/ponto\(s\) de atenção antes de enviar/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /usar esta versão/i }));
    expect(screen.getByLabelText('Rascunho da mensagem')).toHaveValue('você poderia considerar rever o prazo.');
    expect(screen.queryByRole('button', { name: /usar esta versão/i })).not.toBeInTheDocument();
  });
});
