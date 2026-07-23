"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthRouter = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
exports.oauthRouter = express_1.default.Router();
const validRedirectUris = ['https://yourapp.com/callback', 'https://yourapp.com/othercallback'];
const validScopes = ['read', 'write', 'admin'];
exports.oauthRouter.get('/authorize', [
    (0, express_validator_1.query)('response_type').equals('code'),
    (0, express_validator_1.query)('client_id').notEmpty(),
    (0, express_validator_1.query)('redirect_uri').custom((value) => validRedirectUris.includes(value)),
    (0, express_validator_1.query)('scope').custom((value) => {
        const requestedScopes = value.split(' ');
        return requestedScopes.every(scope => validScopes.includes(scope));
    }),
    (0, express_validator_1.query)('state').notEmpty()
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { client_id, redirect_uri, state } = req.query;
    // Here, you would authenticate the user and generate an authorization code
    const code = 'generated-auth-code'; // Replace with actual code generation logic
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.append('code', code);
    redirectUrl.searchParams.append('state', state);
    res.redirect(redirectUrl.toString());
});
