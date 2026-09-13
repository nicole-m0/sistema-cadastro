import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { corsOrigins, isTest } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

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
