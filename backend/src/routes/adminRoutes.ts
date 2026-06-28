import { Router }              from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router();

// GET /api/admin/platform — all orgs with current month spend
router.get('/platform', analyticsController.platformSummary);

export default router;