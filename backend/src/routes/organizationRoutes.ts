import { Router }                   from 'express';
import { organizationController }   from '../controllers/organizationController';

const router = Router();

router.get('/',     organizationController.list);
router.get('/:id',  organizationController.getOne);
router.post('/',    organizationController.create);
router.patch('/:id', organizationController.update);

export default router;