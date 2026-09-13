import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';
import * as authService from '../../services/auth';

vi.mock('../../services/auth');

function Secret() {
  return <p>Área restrita</p>;
}

function LoginStub() {
  return <p>Página de login</p>;
}

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/area-restrita']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginStub />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/area-restrita" element={<Secret />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProtectedRoute', () => {
  it('redireciona para /login quando não autenticado', async () => {
    vi.mocked(authService.fetchCurrentAdmin).mockRejectedValue(new Error('not authenticated'));

    renderProtected();

    expect(await screen.findByText(/página de login/i)).toBeInTheDocument();
  });

  it('renderiza a rota protegida quando autenticado', async () => {
    vi.mocked(authService.fetchCurrentAdmin).mockResolvedValue({
      success: true,
      data: { id: '1', name: 'Admin', email: 'admin@asafe.org' },
    });

    renderProtected();

    await waitFor(() => expect(screen.getByText(/área restrita/i)).toBeInTheDocument());
  });
});
