import { Router } from 'express';
import { validateLogin } from '../middleware/validateLogin';
import { loginWithSession, getSessionProtected, logoutSession } from './sessions.controller';
import { requireSession } from './sessions.middleware';  

const router = Router();

router.post('/login', validateLogin, loginWithSession);


// for replay attacks, header > key = Cookie | value = sessionId=*DB-session-id*
router.get('/protected', requireSession, getSessionProtected);

router.post('/logout', logoutSession);

export default router;
