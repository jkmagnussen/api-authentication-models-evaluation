import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const clients = new Map<string, { redirectUri: string }>();

clients.set('sampleClientId', { redirectUri: 'https://client.example.com/callback' });

export const authorizationEndpoint = async (req: Request, res: Response) => {
  try {
    await body('response_type').equals('code').run(req);
    await body('client_id').isString().run(req);
    await body('redirect_uri').isString().isURL().run(req);
    await body('scope').isString().optional().run(req);
    await body('state').isString().optional().run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, redirect_uri, state } = req.body;

    const client = clients.get(client_id);
    if (!client || client.redirectUri !== redirect_uri) {
      return res.status(400).send('Invalid client_id or redirect_uri');
    }

    const authorizationCode = crypto.randomBytes(20).toString('hex');

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.append('code', authorizationCode);
    if (state) {
      redirectUrl.searchParams.append('state', state);
    }

    res.redirect(redirectUrl.toString());
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
};

app.post('/authorize', authorizationEndpoint);

app.listen(3000, () => {
  console.log('Authorization server running on port 3000');
});