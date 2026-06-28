import { Router }            from 'express';
import { apiKeyController }  from '../controllers/apiKeyController';

const router = Router({ mergeParams: true });

router.get('/',         apiKeyController.list);
router.post('/',        apiKeyController.create);
router.delete('/:keyId', apiKeyController.revoke);

export default router;