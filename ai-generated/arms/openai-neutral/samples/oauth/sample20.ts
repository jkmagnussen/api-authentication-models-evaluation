import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const authRouter = express.Router();

export interface OAuth2Request extends Request {
  auth: {
    clientId: string;
    redirectUri: string;
    responseType: string;
    state: string;
    scope: string;
  }
}

authRouter.get('/authorize', (req: OAuth2Request, res: Response) => {
  const { clientId, redirectUri, responseType, state, scope } = req.query as Record<string, string>;

  if (!clientId || !redirectUri || !responseType) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Missing required parameters.' });
  }

  if (responseType !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type', error_description: 'Response type not supported.' });
  }

  const authorizationCode = uuidv4();

  // Simulated database save operation
  fakeDatabaseSave({ clientId, redirectUri, scope, authorizationCode });

  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) redirectUrl.searchParams.append('state', state);

  res.redirect(redirectUrl.toString());
});

function fakeDatabaseSave(data: Record<string, string>) {
  console.log('Saving data:', data);
}

export { authRouter };