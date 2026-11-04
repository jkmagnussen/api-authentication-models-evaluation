import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { body, query, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

const clients = {
  'client_id_123': {
    redirectUris: ['https://client.example.com/callback'],
    clientSecret: 'secret_456',
  },
};

const authorizationCodes: Record<string, any> = {};

export const authorizeRouter = express.Router();

authorizeRouter.get(
  '/authorize',
  [
    query('response_type').equals('code').withMessage('Invalid response_type'),
    query('client_id').isString().withMessage('Invalid client_id'),
    query('redirect_uri').isURL().withMessage('Invalid redirect_uri'),
    query('scope').isString().withMessage('Invalid scope'),
    query('state').optional().isString().withMessage('Invalid state'),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, redirect_uri, scope, state } = req.query;
    const client = clients[client_id as string];

    if (!client || !client.redirectUris.includes(redirect_uri as string)) {
      return res.status(400).send('Invalid client or redirect URI');
    }

    // Simulate user authorization process
    res.send(`
      <html>
        <body>
          <form method="post" action="/authorize">
            <input type="hidden" name="client_id" value="${client_id}">
            <input type="hidden" name="redirect_uri" value="${redirect_uri}">
            <input type="hidden" name="scope" value="${scope}">
            <input type="hidden" name="state" value="${state}">
            <button type="submit">Authorize</button>
          </form>
        </body>
      </html>
    `);
  }
);

authorizeRouter.post(
  '/authorize',
  [
    body('client_id').isString().withMessage('Invalid client_id'),
    body('redirect_uri').isString().withMessage('Invalid redirect_uri'),
    body('scope').isString().withMessage('Invalid scope'),
    body('state').optional().isString().withMessage('Invalid state'),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, redirect_uri, scope, state } = req.body;
    const client = clients[client_id as string];

    if (!client || !client.redirectUris.includes(redirect_uri as string)) {
      return res.status(400).send('Invalid client or redirect URI');
    }

    const code = crypto.randomBytes(20).toString('hex');
    authorizationCodes[code] = { client_id, scope };

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.append('code', code);
    if (state) redirectUrl.searchParams.append('state', state);

    res.redirect(redirectUrl.toString());
  }
);

app.use(authorizeRouter);

app.listen(3000, () => {
  console.log('OAuth 2.0 Authorization Server running on http://localhost:3000');
});