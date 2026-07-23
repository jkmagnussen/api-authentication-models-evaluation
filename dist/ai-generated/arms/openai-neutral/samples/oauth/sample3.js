"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const authUtils_1 = require("./authUtils");
exports.authRouter = express_1.default.Router();
exports.authRouter.get('/oauth2/authorize', (req, res) => {
    const { client_id, redirect_uri, state, response_type } = req.query;
    if (!client_id || !redirect_uri || !response_type) {
        return res.status(400).send('Missing required query parameters');
    }
    try {
        const clientIsValid = (0, authUtils_1.validateClient)(client_id, redirect_uri);
        if (!clientIsValid) {
            return res.status(400).send('Invalid client credentials or redirect URI');
        }
        if (response_type !== 'code') {
            return res.status(400).send('Unsupported response type');
        }
        const authCode = (0, authUtils_1.generateAuthCode)(client_id, redirect_uri);
        const redirectUrl = `${redirect_uri}?code=${authCode}${state ? `&state=${state}` : ''}`;
        return res.redirect(redirectUrl);
    }
    catch (error) {
        return res.status(500).send('Server error');
    }
});
