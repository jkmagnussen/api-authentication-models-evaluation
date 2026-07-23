import express, { Request, Response } from 'express';
import { generateAuthCode, validateClient, redirectUser } from './authUtils';

const authRoute = express.Router();

authRoute.get('/authorize', async (req: Request, res: Response) => {
    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    if (response_type !== 'code') {
        return res.status(400).send('Invalid response type');
    }

    const clientValid = await validateClient(client_id as string, redirect_uri as string);
    if (!clientValid) {
        return res.status(400).send('Invalid client or redirect URI');
    }

    const user = req.user; // Assuming user is attached to the request
    if (!user) {
        return redirectUser(req, res, redirect_uri as string, state as string, 'login_required');
    }

    const authorizationCode = await generateAuthCode(client_id as string, user.id, scope as string);
    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.set('code', authorizationCode);
    if (state) {
        redirectUrl.searchParams.set('state', state as string);
    }

    return res.redirect(redirectUrl.toString());
});

export { authRoute };