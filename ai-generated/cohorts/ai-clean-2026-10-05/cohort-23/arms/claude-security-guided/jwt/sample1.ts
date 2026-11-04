```typescript
import Anthropic from "@anthropic-ai/sdk";
import * as crypto from "crypto";

const client = new Anthropic();

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const conversationHistory: ConversationMessage[] = [];

async function chat(userMessage: string): Promise<string> {
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8096,
    system: `You are an expert TypeScript developer specializing in secure authentication and Express.js middleware. 
Your task is to help implement a complete JWT authentication middleware with secure coding principles.
Focus on:
1. Secure defaults (short token expiration, strong algorithms)
2. Input validation and sanitization
3. Fail-closed security patterns
4. Error handling that doesn't leak information
5. Type safety with TypeScript
6. Express.js best practices
7. OWASP security guidelines

Provide complete, production-ready code with proper error handling.`,
    messages: conversationHistory,
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";

  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  return assistantMessage;
}

async function generateJWTAuthMiddleware(): Promise<string> {
  const initialPrompt = `Please provide a complete TypeScript implementation of JWT authentication middleware for Express.js that includes:

1. A JWT token generator with secure defaults:
   - Use HS256 algorithm
   - Set token expiration to 15 minutes
   - Include proper claims (iss, sub, iat, exp)

2. A verification middleware that:
   - Extracts JWT from Authorization header (Bearer token)
   - Validates the token signature
   - Checks expiration
   - Validates all claims
   - Fails closed on any validation error

3. Security features:
   - Input sanitization for all user inputs
   - No information leakage in error messages
   - Protection against token tampering
   - Rate limiting considerations
   - CORS security headers
   - XSS protection

4. Error handling:
   - Custom error classes for different failure scenarios
   - Proper HTTP status codes
   - Generic error messages to clients
   - Detailed logging for debugging

5. Usage example with Express app

Make sure the code is production-ready and follows TypeScript best practices. Include proper types and interfaces.`;

  const response1 = await chat(initialPrompt);
  console.log("Initial Implementation Request:");
  console.log(response1);
  console.log("\n" + "=".repeat(80) + "\n");

  const refinementPrompt = `Now, please enhance the implementation with:

1. Add a refresh token mechanism:
   - Separate refresh token with longer expiration (7 days)
   - Token rotation strategy
   - Blacklist mechanism for revoked tokens

2. Add additional security measures:
   - HMAC-SHA256 for token signing
   - Token versioning to invalidate old tokens
   - Device fingerprinting consideration
   - Secure cookie support for tokens

3. Add comprehensive testing helpers:
   - Mock token generation for testing
   - Token validation test cases
   - Error scenario coverage

4. Add configuration management:
   - Environment-based configuration
   - Secret key management
   - Token lifetime configuration
   - Secure defaults that can't be weakened

Please provide the enhanced code with all these features integrated.`;

  const response2 = await chat(refinementPrompt);
  console.log("Enhanced Implementation:");
  console.log(