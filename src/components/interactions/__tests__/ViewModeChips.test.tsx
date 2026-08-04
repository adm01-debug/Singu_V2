import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewModeChips } from '@/components/interactions/ViewModeChips';

describe('ViewModeChips', () => {
  it('renderiza 3 chips', () => {
    render(<ViewModeChips value="list" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Lista' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Por pessoa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Por empresa' })).toBeInTheDocument();
  });

  it('chip ativo tem aria-pressed=true', () => {
    render(<ViewModeChips value="by-contact" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Por pessoa' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('click chama onChange com a key correta', () => {
    const onChange = vi.fn();
    render(<ViewModeChips value="list" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Por empresa' }));
    expect(onChange).toHaveBeenCalledWith('by-company');
  });

  it('click no chip ativo é no-op', () => {
    const onChange = vi.fn();
    render(<ViewModeChips value="by-contact" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Por pessoa' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
