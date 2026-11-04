import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const clients = new Map<string, string>(); // client_id to redirect_uri
clients.set('trusted-client-id', 'https://trusted.redirect.uri');

const generateAuthCode = (): string => {
    return crypto.randomBytes(20).toString('hex');
};

export const authorizationEndpoint = [
    body('response_type').equals('code'),
    body('client_id').isString(),
    body('redirect_uri').isURL(),
    body('state').optional().isString(),

    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid request parameters', details: errors.array() });
        }

        const { response_type, client_id, redirect_uri, state } = req.body;

        const expectedRedirectUri = clients.get(client_id);
        if (!expectedRedirectUri || expectedRedirectUri !== redirect_uri) {
            return res.status(400).json({ error: 'Invalid client_id or redirect_uri' });
        }

        const authCode = generateAuthCode();
        const redirectParams = new URLSearchParams({ code: authCode });
        if (state) redirectParams.append('state', state);

        return res.redirect(`${redirect_uri}?${redirectParams.toString()}`);
    }
];

app.post('/oauth/authorize', authorizationEndpoint);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Authorization server listening on port ${PORT}`);
});