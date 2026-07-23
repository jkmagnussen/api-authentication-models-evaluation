"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthAuthorize = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const crypto_1 = __importDefault(require("crypto"));
const app = (0, express_1.default)();
exports.oauthAuthorize = [
    (0, express_validator_1.query)('response_type').equals('code'),
    (0, express_validator_1.query)('client_id').isString().notEmpty(),
    (0, express_validator_1.query)('redirect_uri').isURL(),
    (0, express_validator_1.query)('state').isString().notEmpty(),
    (0, express_validator_1.query)('scope').isString().notEmpty(),
    async (req, res) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { client_id, redirect_uri, state, scope } = req.query;
        try {
            const validScopes = ['read', 'write', 'profile'];
            const requestedScopes = scope.split(' ');
            const isScopeValid = requestedScopes.every(s => validScopes.includes(s));
            if (!isScopeValid) {
                return res.status(400).json({ error: 'invalid_scope' });
            }
            const isValidRedirect = await isRedirectUriValid(client_id, redirect_uri);
            if (!isValidRedirect) {
                return res.status(400).json({ error: 'invalid_redirect_uri' });
            }
            const authCode = crypto_1.default.randomBytes(20).toString('hex');
            res.redirect(`${redirect_uri}?code=${authCode}&state=${state}`);
        }
        catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    }
];
async function isRedirectUriValid(clientId, redirectUri) {
    // Implementation details for checking client and redirectUri in database.
    return true; // Placeholder; replace with actual validation logic.
}
app.get('/authorize', exports.oauthAuthorize);
app.listen(3000);
