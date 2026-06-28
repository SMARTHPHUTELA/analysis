import express                from 'express';
import cors                   from 'cors';
import helmet                 from 'helmet';
import morgan                 from 'morgan';
import cookieParser           from 'cookie-parser';

import { errorMiddleware }    from './middlewares/errorMiddleware';
import { requestLogger }      from './middlewares/requestLogger';
import { jwtMiddleware }      from './middlewares/jwtMiddleware';
import { adminMiddleware }    from './middlewares/adminMiddleware';

import healthRoutes           from './routes/healthRoutes';
import authRoutes             from './routes/authRoutes';
import proxyRoutes            from './routes/proxyRoutes';
import organizationRoutes     from './routes/organizationRoutes';
import apiKeyRoutes           from './routes/apiKeyRoutes';
import credentialRoutes       from './routes/credentialRoutes';
import analyticsRoutes        from './routes/analyticsRoutes';
import adminRoutes            from './routes/adminRoutes';

const app = express();

app.use(helmet());
app.use(cors({
  origin:      ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 'Authorization',
    'x-proxy-key', 'x-feature', 'x-customer-id', 'x-request-id',
  ],
  credentials: true, // required for cookies
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // parse cookies
app.use(morgan('combined'));
app.use(requestLogger);

// ── Public routes ──────────────────────────────────────────────
app.use('/health', healthRoutes);
app.use('/auth',   authRoutes);

// ── Proxy route (uses its own x-proxy-key auth, not JWT) ───────
app.use('/v1/proxy', proxyRoutes);

// ── Protected API routes (JWT required) ───────────────────────
app.use('/api/organizations',                          jwtMiddleware, organizationRoutes);
app.use('/api/organizations/:orgId/keys',              jwtMiddleware, apiKeyRoutes);
app.use('/api/organizations/:orgId/credentials',       jwtMiddleware, credentialRoutes);
app.use('/api/organizations/:orgId/analytics',         jwtMiddleware, analyticsRoutes);

// ── Admin only ─────────────────────────────────────────────────
app.use('/api/admin', jwtMiddleware, adminMiddleware, adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use(errorMiddleware);

export default app;