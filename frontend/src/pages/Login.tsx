import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Location, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth, isApiError } from '../context/AuthContext';
import { InputField } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import logo from '../assets/logo-asafe.png';

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { admin, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: { from?: Location } };
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (!isLoading && admin) {
    return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;
  }

  async function onSubmit(data: LoginForm) {
    setFormError(null);
    try {
      await signIn(data.email, data.password);
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setFormError(isApiError(err) ? err.message : 'Não foi possível entrar. Tente novamente.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream via-white to-gold-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={logo}
            alt="Logo da Associação Asafe"
            className="mb-4 h-24 w-24 rounded-full object-cover"
          />
          <h1 className="text-xl font-bold text-garnet-700">Associação Asafe</h1>
          <p className="text-sm text-gray-500">Painel administrativo · Acesso restrito</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <InputField
            label="E-mail"
            type="email"
            autoComplete="username"
            required
            error={errors.email?.message}
            {...register('email')}
          />
          <InputField
            label="Senha"
            type="password"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          {formError && (
            <p role="alert" className="rounded-lg bg-garnet-50 px-3 py-2 text-sm text-garnet-700">
              {formError}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            <LogIn className="h-4 w-4" />
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
