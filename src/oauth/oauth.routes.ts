import { Router } from 'express';
import { oauthLimiter } from './rateLimit';
import { authorize, token, introspect, refresh, revoke } from './oauth.controller';
import { verifyAccessToken, validateAuthorize, validateToken } from './oauth.middleware';

const router = Router();

// Apply rate limiting to ALL OAuth2 endpoints
router.post('/authorize', oauthLimiter, validateAuthorize, authorize);
router.post('/token', oauthLimiter, validateToken, token);

router.post('/refresh', oauthLimiter, refresh);
router.post('/revoke', oauthLimiter, revoke);

router.get('/protected', verifyAccessToken, (req, res) => {
  return res.json({
    message: 'Protected resource accessed',
    user_id: (req as any).userId,
    scope: (req as any).scope,
  });
});

// Introspection endpoint (also rate‑limited)
router.post('/introspect', oauthLimiter, introspect);

export default router;
