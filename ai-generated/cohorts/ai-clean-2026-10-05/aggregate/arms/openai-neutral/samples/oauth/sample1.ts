import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const PORT = 3000;
const CLIENT_ID = 'your-client-id';
const CLIENT_SECRET = 'your-client-secret';
const REDIRECT_URI = 'http://localhost:3000/callback';

interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface TokenRequest {
  grant_type: string;
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
}

const authorizationEndpoint = (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query as AuthorizationRequest;

  if (response_type !== 'code') {
    return res.status(400).send("Invalid response_type");
  }
  
  if (client_id !== CLIENT_ID) {
    return res.status(400).send("Invalid client_id");
  }
  
  if (redirect_uri !== REDIRECT_URI) {
    return res.status(400).send("Invalid redirect_uri");
  }

  const authorizationCode = jwt.sign({ client_id, scope }, CLIENT_SECRET, { expiresIn: '10m' });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
};

const tokenEndpoint = (req: Request, res: Response) => {
  const { grant_type, code, redirect_uri, client_id, client_secret } = req.body as TokenRequest;

  if (grant_type !== 'authorization_code') {
    return res.status(400).send("Invalid grant_type");
  }

  if (client_id !== CLIENT_ID || client_secret !== CLIENT_SECRET) {
    return res.status(400).send("Invalid client credentials");
  }

  if (redirect_uri !== REDIRECT_URI) {
    return res.status(400).send("Invalid redirect_uri");
  }

  try {
    const payload = jwt.verify(code, CLIENT_SECRET) as jwt.JwtPayload;

    const accessToken = jwt.sign({ client_id: payload.client_id, scope: payload.scope }, CLIENT_SECRET, { expiresIn: '1h' });

    const response: TokenResponse = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: payload.scope
    };

    res.json(response);
  } catch (err) {
    res.status(400).send("Invalid authorization code");
  }
};

app.get('/authorize', authorizationEndpoint);
app.post('/token', tokenEndpoint);

app.listen(PORT, () => {
  console.log(`OAuth 2.0 server running on http://localhost:${PORT}`);
});

export { authorizationEndpoint, tokenEndpoint };