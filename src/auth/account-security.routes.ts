import { Router } from 'express';
import { validateLogin } from '../middleware/validateLogin';
import { authLimiter } from '../middleware/rateLimiter';
import {
  confirmPasswordReset,
  requestPasswordReset,
  startMfaEnrollment,
  verifyMfaEnrollment,
} from './account-security.service';

const router = Router();

router.post('/password-reset/request', authLimiter, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const token = await requestPasswordReset(email, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return res.status(202).json({
    message: 'If the account exists, a password reset has been initiated.',
    reset_token: token ?? undefined,
  });
});

router.post('/password-reset/confirm', authLimiter, async (req, res) => {
  const token = typeof req.body.token === 'string' ? req.body.token : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'token and newPassword are required' });
  }

  const success = await confirmPasswordReset(token, newPassword, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  if (!success) {
    return res.status(400).json({ error: 'Invalid or expired password reset token' });
  }

  return res.json({ message: 'Password updated' });
});

router.post('/mfa/enroll', authLimiter, validateLogin, async (req, res) => {
  const enrollment = await startMfaEnrollment(req.body.email, req.body.password, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  if (!enrollment) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  return res.json(enrollment);
});

router.post('/mfa/verify', authLimiter, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const code = typeof req.body.code === 'string' ? req.body.code : '';

  if (!email || !code) {
    return res.status(400).json({ error: 'email and code are required' });
  }

  const success = await verifyMfaEnrollment(email, code, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  if (!success) {
    return res.status(400).json({ error: 'Invalid MFA code' });
  }

  return res.json({ message: 'MFA enabled' });
});

export default router;
