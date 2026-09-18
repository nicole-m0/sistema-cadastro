import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { corsOrigins, isProduction, isTest } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { verifyOrigin } from './middlewares/csrf';

export function createApp() {
  const app = express();

  if (isProduction) {
    // A Railway roda a API atrás de um proxy reverso; sem isso, express-rate-limit e
    // req.ip enxergariam o IP do proxy para todo mundo, não o do cliente real.
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(verifyOrigin);

  if (!isTest) {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
