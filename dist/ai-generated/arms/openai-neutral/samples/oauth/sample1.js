"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizationEndpoint = void 0;
const express_1 = __importDefault(require("express"));
const oauthUtils_1 = require("./oauthUtils");
const app = (0, express_1.default)();
const authorizationEndpoint = async (req, res) => {
    const { client_id, redirect_uri, response_type, scope, state } = req.query;
    if (!client_id || !redirect_uri || !response_type || response_type !== 'code') {
        return res.status(400).send('Invalid request parameters');
    }
    const isClientValid = await (0, oauthUtils_1.validateClient)(client_id);
    if (!isClientValid) {
        return res.status(401).send('Unauthorized client');
    }
    const isRedirectUriValid = await (0, oauthUtils_1.validateRedirectUri)(client_id, redirect_uri);
    if (!isRedirectUriValid) {
        return res.status(400).send('Invalid redirect URI');
    }
    const authorizationCode = await (0, oauthUtils_1.generateAuthorizationCode)(client_id, scope);
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', authorizationCode);
    if (state) {
        redirectUrl.searchParams.set('state', state);
    }
    res.redirect(redirectUrl.toString());
};
exports.authorizationEndpoint = authorizationEndpoint;
app.get('/oauth2/authorize', exports.authorizationEndpoint);
