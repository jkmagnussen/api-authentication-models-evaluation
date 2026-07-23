import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import querystring from 'querystring';

const app = express();

interface AuthRequest extends Request {
  query: {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    scope?: string;
    state?: string;
  };
}

const clients = new Map<string, { redirectUri: string }>([
  ['client1', { redirectUri: 'http://localhost:3000/callback' }]
]);

function validateAuthRequest(req: AuthRequest, res: Response, next: NextFunction) {
  const { response_type, client_id, redirect_uri } = req.query;
  
  if (!response_type || !client_id || !redirect_uri) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }
  
  const client = clients.get(client_id);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: 'Invalid client details' });
  }
  
  if (response_type !== 'code') {
    return res.status(400).json({ error: 'Unsupported response type' });
  }
  
  next();
}

function handleAuthorization(req: AuthRequest, res: Response) {
  const { client_id, redirect_uri, state } = req.query;
  const authorizationCode = uuidv4();

  const redirectParams = {
    code: authorizationCode,
    state: state || undefined
  };

  const redirectUrl = `${redirect_uri}?${querystring.stringify(redirectParams)}`;

  res.redirect(302, redirectUrl);
}

app.get('/authorize', validateAuthRequest, handleAuthorization);

export { app };