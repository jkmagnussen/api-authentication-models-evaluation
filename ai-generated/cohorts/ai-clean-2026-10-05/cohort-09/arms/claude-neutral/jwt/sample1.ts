import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateJWTAuthMiddleware(): Promise<void> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a complete TypeScript implementation of JWT authentication middleware for Express. Include:
1. A middleware function that verifies JWT tokens
2. A function to generate JWT tokens
3. Proper error handling
4. Type definitions for authenticated requests
5. Example usage with Express routes

Use jsonwebtoken library and provide production-ready code with proper security practices.`,
      },
    ],
  });

  // Extract the text content from the response
  const content = message.content[0];
  if (content.type === "text") {
    console.log(content.text);
  }
}

export async function demonstrateJWTImplementation(): Promise<void> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Create a complete, runnable TypeScript Express JWT authentication system. Include:

1. JWT token generation with claims
2. JWT verification middleware
3. Protected route examples
4. Refresh token mechanism
5. Error handling for expired/invalid tokens
6. Type-safe request extensions

Provide complete, production-ready code that can be used directly.`,
      },
    ],
  });

  // Extract the text content from the response
  const content = message.content[0];
  if (content.type === "text") {
    console.log(content.text);
  }
}

// Main execution
const args = process.argv.slice(2);
if (args[0] === "demo") {
  demonstrateJWTImplementation().catch(console.error);
} else {
  generateJWTAuthMiddleware().catch(console.error);
}