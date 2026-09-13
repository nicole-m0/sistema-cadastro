import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';
import * as authService from '../../services/auth';

vi.mock('../../services/auth');

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <ToastProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(authService.fetchCurrentAdmin).mockRejectedValue(new Error('not authenticated'));
});

describe('Login page', () => {
  it('exibe erros de validação ao enviar o formulário vazio', async () => {
    const user = userEvent.setup();
    renderLogin();

    await waitFor(() => expect(authService.fetchCurrentAdmin).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/informe o e-mail/i)).toBeInTheDocument();
    expect(await screen.findByText(/informe a senha/i)).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('chama o serviço de login com as credenciais informadas', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      success: true,
      data: { id: '1', name: 'Admin', email: 'admin@asafe.org' },
    });

    const user = userEvent.setup();
    renderLogin();

    await waitFor(() => expect(authService.fetchCurrentAdmin).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/e-mail/i), 'admin@asafe.org');
    await user.type(screen.getByLabelText(/senha/i), 'senha-correta');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith('admin@asafe.org', 'senha-correta'),
    );
  });

  it('exibe mensagem de erro quando as credenciais são inválidas', async () => {
    const { ApiRequestError } = await import('../../lib/api');
    vi.mocked(authService.login).mockRejectedValue(
      new ApiRequestError(401, 'E-mail ou senha inválidos.'),
    );

    const user = userEvent.setup();
    renderLogin();

    await waitFor(() => expect(authService.fetchCurrentAdmin).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/e-mail/i), 'admin@asafe.org');
    await user.type(screen.getByLabelText(/senha/i), 'senha-errada');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/e-mail ou senha inválidos/i)).toBeInTheDocument();
  });
});
