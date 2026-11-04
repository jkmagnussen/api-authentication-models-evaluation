import express, { Request, Response } from 'express';
import { URL } from 'url';
import { validationResult, check, ValidationChain } from 'express-validator';

const app = express();
app.use(express.urlencoded({ extended: false }));

const VALID_CLIENT_IDS = new Set(['client123', 'client456']);
const VALID_REDIRECT_URIS = new Set(['https://example.com/callback']);

const validateAuthRequest: ValidationChain[] = [
    check('response_type').equals('code'),
    check('client_id').isString().custom(value => VALID_CLIENT_IDS.has(value)),
    check('redirect_uri').isString().custom(value => {
        try {
            const uri = new URL(value);
            return VALID_REDIRECT_URIS.has(uri.origin);
        } catch {
            return false;
        }
    }),
    check('scope').isString().optional(),
    check('state').isString().optional()
];

app.get('/authorize', validateAuthRequest, (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'invalid_request' });
    }

    const { response_type, client_id, redirect_uri, scope, state } = req.query as { 
        response_type: string, 
        client_id: string, 
        redirect_uri: string, 
        scope?: string, 
        state?: string 
    };

    const authorizationCode = 'auth_code'; // Generate and store securely
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', authorizationCode);
    if (state) {
        redirectUrl.searchParams.set('state', state);
    }

    return res.redirect(redirectUrl.toString());
});

export { app };