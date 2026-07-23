import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { check, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

export const authEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { redirect_uri, state, scope } = req.query;
  const allowedRedirects = ['https://example.com/callback', 'https://myapp.com/auth'];
  const validScopes = ['read', 'write', 'admin'];

  if (!allowedRedirects.includes(redirect_uri as string)) {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }

  const requestedScopes = (scope as string).split(' ');
  for (const s of requestedScopes) {
    if (!validScopes.includes(s)) {
      return res.status(400).json({ error: 'Invalid scope' });
    }
  }

  const stateToken = state || crypto.randomBytes(16).toString('hex');

  // Proceed with authorization logic (e.g., redirect to authorization server)
  res.json({
    message: 'Authorization successful',
    state: stateToken
  });
};

app.get('/auth', [
  check('redirect_uri').isURL().withMessage('Invalid redirect URI'),
  check('scope').isString().withMessage('Scope must be a string')
], authEndpoint);

export default app;