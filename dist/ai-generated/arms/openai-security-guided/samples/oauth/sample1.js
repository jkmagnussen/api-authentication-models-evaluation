"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const validators_1 = require("./validators");
const app = (0, express_1.default)();
exports.app = app;
const generateAuthorizeURL = (client_id, redirect_uri, state, scope) => {
    const url = new URL(redirect_uri);
    url.searchParams.append('state', state);
    url.searchParams.append('scope', scope);
    url.searchParams.append('client_id', client_id);
    return url.toString();
};
app.get('/oauth2/authorize', (req, res) => {
    const { client_id, redirect_uri, response_type, scope, state } = req.query;
    if (!client_id || !redirect_uri || !response_type || !scope) {
        return res.status(400).send('Missing required parameters.');
    }
    if (!(0, validators_1.validateRedirectURI)(redirect_uri)) {
        return res.status(400).send('Invalid redirect URI.');
    }
    if (!(0, validators_1.validateScope)(scope)) {
        return res.status(400).send('Invalid scope.');
    }
    const generatedState = state ? state : (0, validators_1.generateState)();
    const authorizationURL = generateAuthorizeURL(client_id, redirect_uri, generatedState, scope);
    res.redirect(authorizationURL);
});
