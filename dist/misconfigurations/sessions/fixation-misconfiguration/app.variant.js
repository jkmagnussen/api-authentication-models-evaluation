"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apply_override_1 = require("../../apply-override");
const fixation_config_1 = require("./fixation.config");
(0, apply_override_1.applyOverride)({ sessions: fixation_config_1.sessionFixationMisconfiguration });
const app_1 = __importDefault(require("../../../src/app"));
exports.default = app_1.default;
