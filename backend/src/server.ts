import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`API da Associação Asafe rodando na porta ${env.PORT} [${env.NODE_ENV}]`);
});
