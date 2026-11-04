import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';

const router = express.Router();

export const authorizationEndpoint = router.get(
  '/authorize',
  [
    query('response_type')
      .isIn(['code'])
      .withMessage('Invalid response_type'),
    query('client_id')
      .isString()
      .notEmpty()
      .withMessage('client_id is required'),
    query('redirect_uri')
      .isURL()
      .withMessage('Invalid redirect_uri format'),
    query('scope')
      .isString()
      .withMessage('Invalid scope format'),
    query('state')
      .optional()
      .isString(),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    // Here you would typically validate the client_id, redirect_uri, and scope against your database
    // Assuming client_id and redirect_uri are valid for demonstration purposes

    if (response_type !== 'code') {
      return res.status(400).send('Unsupported response_type');
    }

    // Generate authorization code
    const authorizationCode = 'generated-authorization-code'; // Replace with actual code generation logic

    // Construct the redirect URL
    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.append('code', authorizationCode);
    if (state) {
      redirectUrl.searchParams.append('state', state as string);
    }

    res.redirect(redirectUrl.toString());
  }
);

export default authorizationEndpoint;