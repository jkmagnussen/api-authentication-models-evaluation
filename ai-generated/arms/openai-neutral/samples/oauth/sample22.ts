import express, { Request, Response } from 'express';
import { generateAuthorizationCode, validateClientId, saveAuthorizationRequest } from './authUtils';

export const authorizationRouter = express.Router();

authorizationRouter.get('/authorize', async (req: Request, res: Response) => {
  const clientId = req.query.client_id as string;
  const redirectUri = req.query.redirect_uri as string;
  const responseType = req.query.response_type as string;
  
  if (!clientId || !redirectUri || responseType !== 'code') {
    return res.status(400).send('Invalid request parameters');
  }

  try {
    const isValidClient = await validateClientId(clientId, redirectUri);
    if (!isValidClient) {
      return res.status(400).send('Invalid client credentials');
    }
    
    const authCode = generateAuthorizationCode();
    await saveAuthorizationRequest(clientId, authCode, redirectUri);

    res.redirect(`${redirectUri}?code=${authCode}`);
  } catch (err) {
    res.status(500).send('Server error');
  }
});