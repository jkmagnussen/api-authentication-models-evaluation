"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apply_override_1 = require("../../apply-override");
const audience_config_1 = require("./audience.config");
(0, apply_override_1.applyOverride)({ jwt: audience_config_1.jwtAudienceMisconfiguration });
const app_1 = __importDefault(require("../../../src/app"));
exports.default = app_1.default;
