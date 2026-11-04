import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { urlencoded } from 'body-parser';

const app = express();
app.use(urlencoded({ extended: true }));

const clients = new Map<string, { redirectUri: string }>();
const authorizationCodes = new Map<string, { clientId: string, redirectUri: string }>();

clients.set('client_id_example', { redirectUri: 'http://localhost:3000/callback' });

export const authorizationEndpoint = (req: Request, res: Response) => {
    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    if (response_type !== 'code') {
        return res.status(400).send('Unsupported response type');
    }

    if (!client_id || typeof client_id !== 'string') {
        return res.status(400).send('Missing or invalid client_id');
    }

    const client = clients.get(client_id);
    if (!client || client.redirectUri !== redirect_uri) {
        return res.status(400).send('Invalid client or redirect URI');
    }

    const authorizationCode = uuidv4();
    authorizationCodes.set(authorizationCode, { clientId: client_id, redirectUri: redirect_uri as string });

    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.append('code', authorizationCode);
    if (state) {
        redirectUrl.searchParams.append('state', state as string);
    }

    res.redirect(redirectUrl.toString());
};

app.get('/authorize', authorizationEndpoint);

app.listen(4000, () => {
    console.log('Authorization server started on port 4000');
});