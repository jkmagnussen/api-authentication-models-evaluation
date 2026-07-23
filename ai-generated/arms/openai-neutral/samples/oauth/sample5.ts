import express, { Request, Response, NextFunction } from 'express';
import { generateAuthCode, validateClient, generateRedirectUri } from './authUtils';
import { query, validationResult } from 'express-validator';

const oauthRouter = express.Router();

oauthRouter.get('/authorize', [
  query('response_type').isString().equals('code'),
  query('client_id').isString(),
  query('redirect_uri').isString(),
  query('scope').isString(),
  query('state').optional().isString()
], async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { client_id, redirect_uri, scope, state } = req.query;
  
  try {
    const client = await validateClient(client_id as string, redirect_uri as string);
    if (!client) {
      return res.status(400).json({ error: 'Invalid client or redirect_uri' });
    }

    const authCode = await generateAuthCode(client_id as string, scope as string);
    const redirectUrl = generateRedirectUri(redirect_uri as string, authCode, state as string);

    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
});

export { oauthRouter };