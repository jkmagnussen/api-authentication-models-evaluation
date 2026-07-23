import { Request, Response, NextFunction } from 'express';

export const oauthAuthorize = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { client_id, redirect_uri, state, scope } = req.query;

    if (typeof client_id !== 'string' || !client_id) {
      res.status(400).send('Invalid client_id');
      return;
    }

    if (typeof redirect_uri !== 'string' || !isValidRedirectUri(redirect_uri)) {
      res.status(400).send('Invalid redirect_uri');
      return;
    }

    if (typeof state !== 'string' || !state) {
      res.status(400).send('Invalid state parameter');
      return;
    }

    if (!isValidScope(scope)) {
      res.status(400).send('Invalid scope');
      return;
    }

    const authCode = generateAuthorizationCode(client_id, redirect_uri, scope);

    res.redirect(`${redirect_uri}?code=${authCode}&state=${state}`);
  } catch (err) {
    next(err);
  }
};

const isValidRedirectUri = (uri: string): boolean => {
  const allowedUris = ['https://example.com/callback', 'https://another.com/callback'];
  return allowedUris.includes(uri);
};

const isValidScope = (scope: any): boolean => {
  const allowedScopes = ['read', 'write'];
  if (typeof scope !== 'string') return false;
  const requestedScopes = scope.split(' ');
  return requestedScopes.every(s => allowedScopes.includes(s));
};

const generateAuthorizationCode = (clientId: string, redirectUri: string, scope: string): string => {
  // A secure random string generation implementation is required here
  return 'secureRandomString';
};