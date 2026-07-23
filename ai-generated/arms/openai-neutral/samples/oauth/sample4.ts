import express, { Request, Response } from 'express';
import { generateAuthCode, validateClient, storeAuthCode } from './authService';

export const authRouter = express.Router();

authRouter.get('/authorize', async (req: Request, res: Response) => {
    try {
        const { client_id, redirect_uri, response_type, scope, state } = req.query;

        if (!client_id || !redirect_uri || !response_type) {
            return res.status(400).json({ error: 'invalid_request' });
        }

        const isValidClient = await validateClient(client_id as string, redirect_uri as string);
        if (!isValidClient) {
            return res.status(400).json({ error: 'unauthorized_client' });
        }

        if (response_type !== 'code') {
            return res.status(400).json({ error: 'unsupported_response_type' });
        }

        const authorizationCode = generateAuthCode();
        await storeAuthCode(client_id as string, authorizationCode, scope as string);

        const redirectURL = new URL(redirect_uri as string);
        redirectURL.searchParams.append('code', authorizationCode);
        if (state) {
            redirectURL.searchParams.append('state', state as string);
        }

        return res.redirect(redirectURL.toString());
    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(500).json({ error: 'server_error' });
    }
});