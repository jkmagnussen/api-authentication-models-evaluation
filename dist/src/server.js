"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./express-session-augment");
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const pkce_1 = require("./oauth/pkce");
// Print PKCE pair on startup
async function printPkce() {
    const { code_verifier, code_challenge } = await (0, pkce_1.createPkcePair)();
    console.log("------------------------------------------------------------");
    console.log("🔐 Generated PKCE Pair:");
    console.log("code_challenge:", code_challenge);
    console.log("code_verifier:", code_verifier);
    console.log("------------------------------------------------------------");
}
printPkce();
app_1.default.listen(config_1.PORT, () => {
    console.log(`Server running on http://localhost:${config_1.PORT}`);
});
