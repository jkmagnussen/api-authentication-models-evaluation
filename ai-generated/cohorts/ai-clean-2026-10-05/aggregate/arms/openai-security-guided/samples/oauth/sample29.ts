import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { randomBytes } from 'crypto';

const app = express();

const clients = new Map<string, { clientSecret: string, redirectUris: string[] }>();
clients.set('client_id_123', {
  clientSecret: 'secret_456',
  redirectUris: ['http://localhost:3000/callback']
});

app.use(express.json());

export const authorizationEndpoint = [
  body('client_id').isString().withMessage('client_id must be a string'),
  body('redirect_uri').isURL().withMessage('redirect_uri must be a valid URL'),
  body('response_type').equals('code').withMessage('response_type must be "code"'),
  body('state').optional().isString().withMessage('state must be a string'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },

  (req: Request, res: Response) => {
    const { client_id, redirect_uri, response_type, state } = req.body;
    const client = clients.get(client_id);

    if (!client) {
      return res.status(400).json({ error: 'Invalid client_id' });
    }

    if (!client.redirectUris.includes(redirect_uri)) {
      return res.status(400).json({ error: 'Invalid redirect_uri' });
    }

    if (response_type !== 'code') {
      return res.status(400).json({ error: 'Unsupported response_type' });
    }

    const authorizationCode = randomBytes(20).toString('hex');
    // In a real application, store the code associated with the client_id and redirect_uri

    let redirectUrl = `${redirect_uri}?code=${authorizationCode}`;
    if (state) {
      redirectUrl += `&state=${state}`;
    }
    
    res.redirect(302, redirectUrl);
  }
];

app.post('/authorize', authorizationEndpoint);

app.listen(3000, () => {
  console.log('Authorization server running on http://localhost:3000');
});