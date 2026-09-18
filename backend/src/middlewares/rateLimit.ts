import rateLimit from 'express-rate-limit';

// Protege POST /api/auth/login contra força bruta. Com skipSuccessfulRequests, um login
// bem-sucedido não deixa marca no contador — então errar a senha uma vez e acertar em
// seguida não consome a "cota" do usuário legítimo ao longo do dia (embora, se o limite já
// tiver sido atingido no momento da tentativa, ela também é bloqueada até a janela resetar;
// é assim que o limite realmente barra um flood de tentativas). A mensagem é a mesma
// genérica de sempre, para não revelar se o bloqueio ocorreu por causa de um e-mail
// específico existir ou não.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
    });
  },
});
