import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

export const oauth2AuthEndpoint = (req: Request, res: Response) => {
    const { client_id, redirect_uri, response_type, scope, state } = req.query;

    if (!client_id || !redirect_uri || !response_type) {
        return res.status(400).send('Missing required parameters.');
    }

    if (response_type !== 'code') {
        return res.status(400).send('Unsupported response_type.');
    }

    // Mock user login
    const userIsAuthenticated = true;
    if (!userIsAuthenticated) {
        return res.status(401).send('User authentication required.');
    }

    const authorizationCode = generateAuthCode();
    const urlWithCode = `${redirect_uri}?code=${authorizationCode}${state ? `&state=${state}` : ''}`;

    res.redirect(urlWithCode);
};

function generateAuthCode(): string {
    return Math.random().toString(36).substring(2, 15);
}

app.get('/auth', oauth2AuthEndpoint);

export default app;