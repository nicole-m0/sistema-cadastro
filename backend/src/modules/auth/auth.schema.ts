import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ required_error: 'E-mail é obrigatório.' }).email('E-mail inválido.'),
  password: z.string({ required_error: 'Senha é obrigatória.' }).min(1, 'Senha é obrigatória.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z
      .string()
      .min(8, 'A nova senha deve ter ao menos 8 caracteres.')
      .regex(/[a-z]/, 'A nova senha deve conter ao menos uma letra minúscula.')
      .regex(/[A-Z]/, 'A nova senha deve conter ao menos uma letra maiúscula.')
      .regex(/[0-9]/, 'A nova senha deve conter ao menos um número.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'A confirmação não corresponde à nova senha.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'A nova senha deve ser diferente da senha atual.',
    path: ['newPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
