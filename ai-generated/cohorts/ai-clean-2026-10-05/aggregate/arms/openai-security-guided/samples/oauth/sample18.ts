import express, { Request, Response } from 'express';
import { validateClient, generateAuthCode, validateRedirectUri } from './authUtils';

const app = express();

app.use(express.urlencoded({ extended: true }));

export const authorizationEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = req.query.client_id as string;
    const redirectUri = req.query.redirect_uri as string;
    const responseType = req.query.response_type as string;
    const state = req.query.state as string | undefined;

    if (!clientId || !redirectUri || !responseType) {
      res.status(400).send('Invalid request');
      return;
    }

    if (responseType !== 'code') {
      res.status(400).send('Unsupported response type');
      return;
    }

    const clientValidated = await validateClient(clientId);
    if (!clientValidated) {
      res.status(401).send('Invalid client');
      return;
    }

    const redirectUriValidated = await validateRedirectUri(clientId, redirectUri);
    if (!redirectUriValidated) {
      res.status(401).send('Invalid redirect URI');
      return;
    }

    // Assuming user authentication already handled
    const authCode = await generateAuthCode(clientId, redirectUri);

    const redirectResponseUri = new URL(redirectUri);
    redirectResponseUri.searchParams.append('code', authCode);
    if (state) {
      redirectResponseUri.searchParams.append('state', state);
    }

    res.redirect(303, redirectResponseUri.toString());
  } catch (error) {
    res.status(500).send('Internal server error');
  }
};

app.get('/authorize', authorizationEndpoint);

app.listen(3000, () => {
  console.log('OAuth 2.0 Authorization Server running on port 3000');
});