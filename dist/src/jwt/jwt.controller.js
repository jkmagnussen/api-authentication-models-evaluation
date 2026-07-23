"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtLogin = jwtLogin;
exports.jwtProtected = jwtProtected;
const user_1 = require("../auth/user");
const password_1 = require("../auth/password");
const jwt_service_1 = require("./jwt.service");
async function jwtLogin(req, res) {
    const { email, password } = req.body;
    const user = await (0, user_1.findUserByEmail)(email);
    if (!user)
        return res.status(400).json({ error: "Invalid credentials" });
    const valid = await (0, password_1.isValidPassword)(password, user.password);
    if (!valid)
        return res.status(400).json({ error: "Invalid credentials" });
    const token = (0, jwt_service_1.generateJwt)(user.id);
    return res.status(200).json({ token });
}
async function jwtProtected(req, res) {
    return res.json({
        message: "JWT protected route accessed",
        userId: req.userId
    });
}
