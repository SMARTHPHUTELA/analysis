import { Router }                from 'express';
import { credentialController }  from '../controllers/credentialController';

const router = Router({ mergeParams: true });

// POST /api/organizations/:orgId/credentials
router.post('/', credentialController.upsert);

export default router;