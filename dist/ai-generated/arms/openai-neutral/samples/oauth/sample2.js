"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const authUtils_1 = require("./authUtils");
const authRouter = express_1.default.Router();
exports.authRouter = authRouter;
authRouter.get('/oauth/authorize', (req, res) => {
    const clientId = req.query.client_id;
    const redirectUri = req.query.redirect_uri;
    const responseType = req.query.response_type;
    const state = req.query.state;
    if (!clientId || !redirectUri || responseType !== 'code') {
        return res.status(400).send('Invalid request');
    }
    if (!(0, authUtils_1.validateClient)(clientId)) {
        return res.status(401).send('Unauthorized client');
    }
    if (!(0, authUtils_1.redirectUriMatches)(clientId, redirectUri)) {
        return res.status(400).send('Invalid redirect URI');
    }
    const userConsent = checkUserConsent(req.session.user);
    if (!userConsent) {
        return res.status(403).send('User consent required');
    }
    const authCode = (0, authUtils_1.generateAuthCode)(clientId, req.session.user);
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.append('code', authCode);
    if (state) {
        redirectUrl.searchParams.append('state', state);
    }
    return res.redirect(redirectUrl.toString());
});
