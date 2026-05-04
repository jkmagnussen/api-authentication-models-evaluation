"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("API is running");
});
app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const user = await db_1.prisma.user.create({
            data: { email, password, name },
        });
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create user" });
    }
});
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
