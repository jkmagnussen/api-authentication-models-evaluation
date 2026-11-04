```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const client = new Anthropic();

// In-memory storage for authorization codes and tokens
const authorizationCodes: Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    userId: string;
    expiresAt: number;
  }
> = new Map();

const accessTokens: Map<
  string,
  {
    clientId: string;
    userId: string;
    scope: string;
    expiresAt: number;
  }
> = new Map();

const refreshTokens: Map<
  string,
  {
    clientId: string;
    userId: string;
    expiresAt: number;
  }
> = new Map();

// Registered OAuth clients
const registeredClients: Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    name: string;
  }
> = new Map([
  [
    "test-client-id",
    {
      clientSecret: "test-client-secret",
      redirectUris: [
        "http://localhost:3001/callback",
        "https://example.com/callback",
      ],
      name: "Test Application",
    },
  ],
]);

// Users for testing
const users: Map<
  string,
  {
    username: string;
    password: string;
    email: string;
  }
> = new Map([
  [
    "user-1",
    {
      username: "testuser",
      password: "password123",
      email: "test@example.com",
    },
  ],
]);

export const authorizeEndpoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      client_id,
      redirect_uri,
      response_type,
      scope,
      state,
      username,
      password,
    } = req.query;

    // Validate required parameters
    if (!client_id || !redirect_uri || response_type !== "code") {
      res.status(400).json({
        error: "invalid_request",
        error_description: "Missing or invalid parameters",
      });
      return;
    }

    // Validate client
    const client = registeredClients.get(client_id as string);
    if (!client) {
      res.status(401).json({
        error: "invalid_client",
        error_description: "Unknown client",
      });
      return;
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirect_uri as string)) {
      res.status(400).json({
        error: "invalid_grant",
        error_description: "Redirect URI not registered",
      });
      return;
    }

    // If no credentials provided, show login form
    if (!username || !password) {
      const loginForm = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Authorization</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 50px; }
            .form-group { margin: 15px 0; }
            input { padding: 8px; width: 200px; }
            button { padding: 10px 20px; background-color: #007bff; color: white; border: none; cursor