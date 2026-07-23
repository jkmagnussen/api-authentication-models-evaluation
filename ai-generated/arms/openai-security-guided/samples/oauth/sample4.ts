import express, { Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';

const app = express();

// Sample authorized redirect URIs and scopes
const authorizedRedirectURIs = new Set(['https://client.example.com/callback']);
const validScopes = new Set(['read', 'write', 'admin']);

export const oauthAuthorizationHandler = [
  query('response_type').isIn(['code']).withMessage('Invalid response type'),
  query('client_id').isString().notEmpty().withMessage('Client ID is required'),
  query('redirect_uri').isURL().withMessage('Invalid redirect URI'),
  query('state').isString().notEmpty().withMessage('State parameter is required'),
  query('scope').custom((value) => {
    const scopes = value.split(' ');
    for (const scope of scopes) {
      if (!validScopes.has(scope)) {
        throw new Error(`Invalid scope: ${scope}`);
      }
    }
    return true;
  }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { redirect_uri, state } = req.query;

    if (!authorizedRedirectURIs.has(redirect_uri as string)) {
      return res.status(400).send('Unauthorized redirect URI');
    }

    const authorizationCode = generateAuthorizationCode(); // Assume this function securely generates a code

    const responseRedirectUri = new URL(redirect_uri as string);
    responseRedirectUri.searchParams.append('code', authorizationCode);
    responseRedirectUri.searchParams.append('state', state as string);

    res.redirect(responseRedirectUri.toString());
  },
];

function generateAuthorizationCode(): string {
  return Math.random().toString(36).substr(2, 12); // Simplified code generation for illustration
}

app.get('/authorize', oauthAuthorizationHandler);

export default app;