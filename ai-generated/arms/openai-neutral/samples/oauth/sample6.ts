import express, { Request, Response } from 'express';
import { generateAuthCode, getClient, saveAuthCode } from './oauthService'; 

const router = express.Router();

router.get('/authorize', async (req: Request, res: Response) => {
    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    if (response_type !== 'code') {
        return res.status(400).json({ error: 'unsupported_response_type' });
    }

    try {
        const client = await getClient(client_id as string);

        if (!client) {
            return res.status(400).json({ error: 'invalid_client' });
        }

        if (client.redirect_uri !== redirect_uri) {
            return res.status(400).json({ error: 'invalid_redirect_uri' });
        }

        const authCode = generateAuthCode(client_id as string, scope as string);

        await saveAuthCode(authCode);

        const redirectUrl = new URL(redirect_uri as string);
        redirectUrl.searchParams.append('code', authCode);
        if (state) {
            redirectUrl.searchParams.append('state', state as string);
        }

        res.redirect(redirectUrl.toString());
    } catch (error) {
        res.status(500).json({ error: 'server_error' });
    }
});

export { router as authRouter };