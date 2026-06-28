import { Router }              from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router({ mergeParams: true });

router.get('/summary',          analyticsController.summary);
router.get('/daily',            analyticsController.daily);
router.get('/features',         analyticsController.features);
router.get('/models',           analyticsController.models);
router.get('/logs',             analyticsController.logs);
router.get('/savings',          analyticsController.savings);

export default router;