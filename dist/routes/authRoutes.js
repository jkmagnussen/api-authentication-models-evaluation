"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validateRegister_1 = require("../middleware/validateRegister");
const router = (0, express_1.Router)();
router.post("/register", validateRegister_1.validateRegister, authController_1.register);
exports.default = router;
