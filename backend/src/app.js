// Builds the Express application. Order matters: security headers, then sessions and CSRF,
// then routes, then error handling. It opens no port and no database connection; server.js
// does both and calls createApp() only once MongoDB is connected.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import './models/index.js'; // registers every Mongoose model before any route uses populate()
import { createSessionMiddleware } from './middleware/session.js';
import { csrfProtection } from './middleware/csrf.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import taxonomyRoutes from './routes/taxonomy.routes.js';
import evidenceRoutes from './routes/evidence.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import auditRoutes from './routes/audit.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // The "simple" parser never builds nested objects, so a URL such as ?status[$ne]=DRAFT
  // cannot slip a MongoDB operator into a database filter.
  app.set('query parser', 'simple');

  app.use(helmet());

  // In development the browser reaches the API through Vite's proxy, so requests are
  // same-origin. This still restricts anything that calls port 5000 directly.
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));

  app.use(morgan('dev'));

  // 100 kb is ample for form data; files go through multer, not this parser.
  app.use(express.json({ limit: '100kb' }));

  app.use(createSessionMiddleware());

  // Applies to the whole API, so no route can forget it.
  app.use('/api', csrfProtection);

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/taxonomy', taxonomyRoutes);
  app.use('/api/evidence', evidenceRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/audit-logs', auditRoutes);

  // Must stay last: anything reaching here matched no route.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
