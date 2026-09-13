import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InstrumentForm } from '../InstrumentForm';
import { ToastProvider } from '../../../context/ToastContext';
import * as instrumentsService from '../../../services/instruments';

vi.mock('../../../services/instruments');

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/instrumentos/novo']}>
      <ToastProvider>
        <InstrumentForm />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('InstrumentForm', () => {
  it('exibe erro de validação quando o nome é muito curto', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^nome/i), 'A');
    await user.click(screen.getByRole('button', { name: /cadastrar instrumento/i }));

    expect(await screen.findByText(/mínimo 2 caracteres/i)).toBeInTheDocument();
    expect(instrumentsService.createInstrument).not.toHaveBeenCalled();
  });

  it('cria um instrumento com dados válidos', async () => {
    vi.mocked(instrumentsService.createInstrument).mockResolvedValue({
      success: true,
      data: { id: 'i1', name: 'Violão', status: 'ACTIVE', displayOrder: 0 },
    });

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^nome/i), 'Violão');
    await user.click(screen.getByRole('button', { name: /cadastrar instrumento/i }));

    await waitFor(() =>
      expect(instrumentsService.createInstrument).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Violão', status: 'ACTIVE' }),
      ),
    );
  });
});
