import { Router }          from 'express';
import { proxyController } from '../controllers/proxyController';
import { authMiddleware }  from '../middlewares/authMiddleware';
import { budgetMiddleware } from '../middlewares/budgetMiddleware';

const router = Router();

// POST /v1/proxy/:provider
// Headers: x-proxy-key, x-feature, (optional) x-customer-id
// Body: standard LLM provider request body
router.post(
  '/:provider',
  authMiddleware,
  budgetMiddleware,
  proxyController.handle
);

export default router;