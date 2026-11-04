import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';

const router = express.Router();

const validClients = new Map<string, string>([
  ['client_id_123', 'http://localhost/callback'],
]);

const authorize = [
  body('response_type').equals('code'),
  body('client_id').isString(),
  body('redirect_uri').isURL(),
  body('scope').isString(),
  body('state').optional().isString()
];

router.post('/authorize', authorize, (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid request', details: errors.array() });
  }

  const { client_id, redirect_uri, state } = req.body;

  if (!validClients.has(client_id) || validClients.get(client_id) !== redirect_uri) {
    return res.status(400).json({ error: 'Unauthorized client' });
  }

  const authorizationCode = crypto.randomBytes(20).toString('hex');

  let redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.status(302).redirect(redirectUrl.toString());
});

export { router as authRouter };