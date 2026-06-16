"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
const authServices_1 = require("../services/authServices");
async function register(req, res, next) {
    try {
        const { email, password } = req.body;
        const user = await (0, authServices_1.registerUser)(email, password);
        return res.status(201).json({
            message: "User registered successfully",
            user,
        });
    }
    catch (error) {
        if (error.message === "Email already registered") {
            return res.status(409).json({ error: error.message });
        }
        return next(error);
    }
}
