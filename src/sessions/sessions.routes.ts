import { Router } from 'express';
import { validateLogin } from '../middleware/validateLogin';
import { loginWithSession, getSessionProtected, logoutSession } from './sessions.controller';
import { requireSession } from './sessions.middleware';   // <— this is where the guard comes from

const router = Router();

router.post('/login', validateLogin, loginWithSession);

router.get('/protected', requireSession, getSessionProtected);

router.post('/logout', logoutSession);

export default router;
