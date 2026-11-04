import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function generateJWTAuthMiddleware(): Promise<void> {
  const prompt = `Generate a complete TypeScript JWT authentication middleware implementation for Express that follows these secure coding principles:

1. Secure defaults:
   - Use strong default algorithm (HS256 or RS256)
   - Set reasonable token expiration times (15 min access, 7 day refresh)
   - Use secure cookie settings (httpOnly, secure, sameSite)
   - Validate all required fields strictly

2. Input validation:
   - Validate token format before processing
   - Validate claims within token (iss, aud, exp, iat)
   - Sanitize all user input
   - Type-check all parameters

3. Fail closed approach:
   - Reject requests if any validation fails
   - Return 401 Unauthorized for invalid tokens
   - Return 403 Forbidden for insufficient permissions
   - Log security events for audit trails

4. Additional security measures:
   - Use environment variables for secrets
   - Implement token blacklist/revocation
   - Add rate limiting for auth endpoints
   - Validate token signature

The implementation should include:
- JWT token generation with secure defaults
- Express middleware for token validation
- Refresh token rotation mechanism
- Logout/token revocation functionality
- Type-safe interfaces for claims and payloads
- Error handling with secure messages (no sensitive info leaks)
- Unit test examples

Use jsonwebtoken library and follow Express conventions with named exports.`;

  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    console.log("JWT Authentication Middleware Implementation:");
    console.log("=".repeat(50));
    console.log(responseText);
  } catch (error) {
    console.error("Error generating JWT middleware:", error);
    throw error;
  }
}

generateJWTAuthMiddleware();