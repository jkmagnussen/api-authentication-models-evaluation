import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const CLIENTS = new Map<string, { redirectUri: string }>();
CLIENTS.set("client-id-example", { redirectUri: "https://valid.redirect.uri/callback" });

const AUTHORIZATION_CODES = new Map<string, { clientId: string, redirectUri: string }>();

const generateAuthorizationCode = (): string => {
    return crypto.randomBytes(20).toString('hex');
};

const isValidRedirectUri = (clientRedirectUri: string, requestedRedirectUri: string): boolean => {
    return clientRedirectUri === requestedRedirectUri;
};

app.post('/oauth2/authorize',
    body('response_type').equals('code'),
    body('client_id').isString(),
    body('redirect_uri').isURL(),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { response_type, client_id, redirect_uri } = req.body;

        const client = CLIENTS.get(client_id);
        if (!client) {
            return res.status(400).json({ error: 'Invalid client_id' });
        }

        if (!isValidRedirectUri(client.redirectUri, redirect_uri)) {
            return res.status(400).json({ error: 'Invalid redirect_uri' });
        }

        const authorizationCode = generateAuthorizationCode();
        AUTHORIZATION_CODES.set(authorizationCode, { clientId: client_id, redirectUri: redirect_uri });

        res.redirect(`${redirect_uri}?code=${authorizationCode}`);
    });

export { app };