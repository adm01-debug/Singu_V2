import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

vi.mock('@/components/navigation/BackButton', () => ({ BackButton: () => null }));
vi.mock('@/components/notifications/UnifiedNotificationsBell', () => ({ UnifiedNotificationsBell: () => null }));
vi.mock('@/components/notifications/SmartNotificationsBell', () => ({ SmartNotificationsBell: () => null }));
vi.mock('@/components/ui/global-density-toggle', () => ({ GlobalDensityToggle: () => null }));
vi.mock('@/components/ui/SystemStatusBadge', () => ({ SystemStatusBadge: () => null }));

describe('Pesquisa contextual do cabeçalho', () => {
  it('restaura o termo recebido e acompanha mudanças de contexto e limpeza', () => {
    const onSearchChange = vi.fn();
    const page = (value: string) => <MemoryRouter><Header title="Contatos" showSearch searchValue={value} onSearchChange={onSearchChange} /></MemoryRouter>;
    const { rerender } = render(page('0310'));
    const input = screen.getByRole('textbox', { name: 'Buscar em Contatos' });
    expect(input).toHaveValue('0310');
    fireEvent.change(input, { target: { value: 'Acme' } });
    expect(onSearchChange).toHaveBeenCalledWith('Acme');
    rerender(page('Acme'));
    expect(input).toHaveValue('Acme');
    rerender(page('0310'));
    expect(input).toHaveValue('0310');
    rerender(page(''));
    expect(input).toHaveValue('');
  });
});
