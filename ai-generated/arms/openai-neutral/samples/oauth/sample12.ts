import express, { Request, Response } from 'express';
import { generateAuthorizationCode, validateClient, redirectWithError } from './oauthUtils';

const oauthRouter = express.Router();

oauthRouter.get('/authorize', async (req: Request, res: Response) => {
    try {
        const { response_type, client_id, redirect_uri, scope, state } = req.query;

        if (response_type !== 'code') {
            return redirectWithError(res, redirect_uri as string, 'unsupported_response_type', state as string);
        }

        const client = await validateClient(client_id as string, redirect_uri as string);
        if (!client) {
            return redirectWithError(res, redirect_uri as string, 'invalid_client', state as string);
        }

        const authorizationCode = generateAuthorizationCode(client_id as string, scope as string);
        const redirectUrl = new URL(redirect_uri as string);
        redirectUrl.searchParams.append('code', authorizationCode);
        if (state) {
            redirectUrl.searchParams.append('state', state as string);
        }

        res.redirect(redirectUrl.toString());
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

export { oauthRouter };