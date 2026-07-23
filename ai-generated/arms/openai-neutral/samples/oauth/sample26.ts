import express, { Request, Response } from 'express';
import { OAuth2Server } from 'oauth2-server';
import { Request as OAuthRequest, Response as OAuthResponse } from 'oauth2-server';

const app = express();
const oauth = new OAuth2Server({
  model: require('./model'), 
  accessTokenLifetime: 3600,
  allowBearerTokensInQueryString: true
});

export const authorize = async (req: Request, res: Response) => {
  const oauthRequest = new OAuthRequest(req);
  const oauthResponse = new OAuthResponse(res);

  try {
    const authorizationCode = await oauth.authorize(oauthRequest, oauthResponse);
    res.json(authorizationCode);
  } catch (err) {
    res.status(err.code || 500).json(err);
  }
};

app.post('/authorize', authorize);