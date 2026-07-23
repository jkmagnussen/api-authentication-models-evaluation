import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { URL } from 'url';
import { body, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

const validRedirectUris = new Set(['https://example.com/callback']);
const allowedScopes = new Set(['read', 'write', 'admin']);

const generateState = (): string => randomBytes(16).toString('hex');

app.post('/oauth2/authorize', 
  body('redirect_uri').isURL(), 
  body('scope').isString(), 
  body('state').optional().isString(), 
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { redirect_uri, scope, state } = req.body;
    let parsedRedirect;
    try {
      parsedRedirect = new URL(redirect_uri);
    } catch {
      return res.status(400).json({ error: 'Invalid redirect URI' });
    }
    
    if (!validRedirectUris.has(parsedRedirect.origin)) {
      return res.status(400).json({ error: 'Invalid redirect URI' });
    }
    
    const requestedScopes = scope.split(' ');
    if (!requestedScopes.every(s => allowedScopes.has(s))) {
      return res.status(400).json({ error: 'Invalid scope' });
    }
    
    const responseState = state || generateState();

    res.json({
      authorization_url: `${redirect_uri}?state=${responseState}&scope=${encodeURIComponent(scope)}`,
      state: responseState
    });
  }
);

export { app };