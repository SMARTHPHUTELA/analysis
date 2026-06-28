import express                from 'express';
import cors                   from 'cors';
import helmet                 from 'helmet';
import morgan                 from 'morgan';

import { errorMiddleware }    from './middlewares/errorMiddleware';
import { requestLogger }      from './middlewares/requestLogger';

import healthRoutes           from './routes/healthRoutes';
import proxyRoutes            from './routes/proxyRoutes';
import organizationRoutes     from './routes/organizationRoutes';
import apiKeyRoutes           from './routes/apiKeyRoutes';
import credentialRoutes       from './routes/credentialRoutes';
import analyticsRoutes        from './routes/analyticsRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();

// ── Security & parsing ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:  process.env['CORS_ORIGIN'] ?? '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-proxy-key',
    'x-feature',
    'x-customer-id',
    'x-request-id',
  ],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(requestLogger);

// ── Routes ─────────────────────────────────────────────────────

// Health check — no auth
app.use('/health', healthRoutes);

// Proxy — the core: POST /v1/proxy/:provider
// Headers: x-proxy-key, x-feature
// Body: standard LLM request body
app.use('/v1/proxy', proxyRoutes);

// Admin API — organization management
app.use('/api/organizations', organizationRoutes);

// Nested under organizations
app.use('/api/organizations/:orgId/keys',        apiKeyRoutes);
app.use('/api/organizations/:orgId/credentials', credentialRoutes);
app.use('/api/organizations/:orgId/analytics',   analyticsRoutes);

app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.path} not found` },
  });
});

// Global error handler — must be last
app.use(errorMiddleware);

export default app;