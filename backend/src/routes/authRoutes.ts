import { Router }          from 'express';
import { authController }  from '../controllers/authController';
import { jwtMiddleware }   from '../middlewares/jwtMiddleware';

const router = Router();

router.post('/register',        authController.register);
router.post('/login',           authController.login);
router.post('/logout',          authController.logout);
router.get( '/me',              jwtMiddleware, authController.me);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);

export default router;