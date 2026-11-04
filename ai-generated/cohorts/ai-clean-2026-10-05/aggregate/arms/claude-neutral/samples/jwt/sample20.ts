import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateJWTAuthMiddleware(): Promise<void> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a complete TypeScript implementation of JWT authentication middleware for Express.js. 
        
Requirements:
1. Create a middleware function that verifies JWT tokens
2. Include token generation functionality
3. Handle token expiration
4. Include proper error handling
5. Use Express request/response types
6. Export named functions for middleware and token generation
7. Use a secret key for signing/verifying tokens
8. Include type definitions for the authenticated request

Provide only the TypeScript code without markdown formatting or explanations.`,
      },
    ],
  });

  // Extract the text content from the response
  const content = message.content[0];
  if (content.type === "text") {
    console.log(content.text);
  }
}

// Run the generation
generateJWTAuthMiddleware().catch(console.error);