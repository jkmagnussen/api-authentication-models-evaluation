"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPasswordReset = requestPasswordReset;
exports.confirmPasswordReset = confirmPasswordReset;
exports.startMfaEnrollment = startMfaEnrollment;
exports.verifyMfaEnrollment = verifyMfaEnrollment;
exports.validateMfaForUser = validateMfaForUser;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const config_1 = require("../config");
const user_1 = require("./user");
const password_1 = require("./password");
const audit_service_1 = require("../security/audit.service");
const totp_1 = require("./totp");
function hashResetToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
async function requestPasswordReset(email, context) {
    const user = await (0, user_1.findUserByEmail)(email);
    if (!user) {
        await (0, audit_service_1.writeAuditEvent)({
            eventType: 'password_reset.request',
            outcome: 'failure',
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            metadata: { email },
        });
        return null;
    }
    const token = crypto_1.default.randomBytes(32).toString('base64url');
    const tokenHash = hashResetToken(token);
    await db_1.prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
    });
    await (0, audit_service_1.writeAuditEvent)({
        userId: user.id,
        eventType: 'password_reset.request',
        outcome: 'success',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
    });
    return config_1.APP_CONFIG.isProduction ? null : token;
}
async function confirmPasswordReset(token, newPassword, context) {
    const tokenHash = hashResetToken(token);
    const record = await db_1.prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
        await (0, audit_service_1.writeAuditEvent)({
            eventType: 'password_reset.confirm',
            outcome: 'failure',
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
        });
        return false;
    }
    const passwordHash = await (0, password_1.hashPassword)(newPassword);
    await db_1.prisma.$transaction([
        db_1.prisma.user.update({
            where: { id: record.userId },
            data: { password: passwordHash },
        }),
        db_1.prisma.passwordResetToken.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        }),
    ]);
    await (0, audit_service_1.writeAuditEvent)({
        userId: record.userId,
        eventType: 'password_reset.confirm',
        outcome: 'success',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
    });
    return true;
}
async function startMfaEnrollment(email, password, context) {
    const user = await (0, user_1.findUserByEmail)(email);
    if (!user || !(await (0, password_1.isValidPassword)(password, user.password))) {
        await (0, audit_service_1.writeAuditEvent)({
            eventType: 'mfa.enroll',
            outcome: 'failure',
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            metadata: { email },
        });
        return null;
    }
    const secret = (0, totp_1.generateTotpSecret)();
    const issuer = process.env.MFA_ISSUER ?? 'API Auth Evaluation';
    const otpauthUrl = (0, totp_1.buildOtpAuthUrl)(user.email, issuer, secret);
    await db_1.prisma.user.update({
        where: { id: user.id },
        data: {
            mfaSecret: secret,
            mfaEnabled: false,
        },
    });
    await (0, audit_service_1.writeAuditEvent)({
        userId: user.id,
        eventType: 'mfa.enroll',
        outcome: 'success',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
    });
    return {
        secret,
        otpauthUrl,
    };
}
async function verifyMfaEnrollment(email, code, context) {
    const user = await (0, user_1.findUserByEmail)(email);
    if (!user?.mfaSecret) {
        await (0, audit_service_1.writeAuditEvent)({
            eventType: 'mfa.verify',
            outcome: 'failure',
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            metadata: { email },
        });
        return false;
    }
    const valid = (0, totp_1.verifyTotp)(code, user.mfaSecret);
    if (!valid) {
        await (0, audit_service_1.writeAuditEvent)({
            userId: user.id,
            eventType: 'mfa.verify',
            outcome: 'failure',
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
        });
        return false;
    }
    await db_1.prisma.user.update({
        where: { id: user.id },
        data: { mfaEnabled: true },
    });
    await (0, audit_service_1.writeAuditEvent)({
        userId: user.id,
        eventType: 'mfa.verify',
        outcome: 'success',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
    });
    return true;
}
async function validateMfaForUser(userId, code) {
    const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaEnabled) {
        return true;
    }
    if (!code || !user.mfaSecret) {
        return false;
    }
    return (0, totp_1.verifyTotp)(code, user.mfaSecret);
}
