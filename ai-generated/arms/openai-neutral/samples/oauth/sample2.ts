import express, { Request, Response } from 'express';
import { generateAuthorizationCode, validateClient, redirectWithError } from './oauthHelpers';

export const oauthRouter = express.Router();

oauthRouter.get('/auth', async (req: Request, res: Response) => {
    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    if (response_type !== 'code') {
        return redirectWithError(res, redirect_uri as string, 'unsupported_response_type', state as string);
    }

    if (!client_id || !redirect_uri) {
        return redirectWithError(res, redirect_uri as string, 'invalid_request', state as string);
    }

    const client = await validateClient(client_id as string, redirect_uri as string);
    if (!client) {
        return redirectWithError(res, redirect_uri as string, 'unauthorized_client', state as string);
    }

    const authorizationCode = generateAuthorizationCode(client_id as string, scope as string);
    const redirectURL = new URL(redirect_uri as string);
    redirectURL.searchParams.set('code', authorizationCode);
    if (state) {
        redirectURL.searchParams.set('state', state as string);
    }

    res.redirect(redirectURL.toString());
});