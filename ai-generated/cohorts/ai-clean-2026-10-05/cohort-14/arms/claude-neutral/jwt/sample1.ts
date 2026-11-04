import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function generateJWTAuthMiddleware(): Promise<void> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Generate a complete, self-contained TypeScript implementation of JWT authentication middleware for Express.js. 

Requirements:
1. Create middleware function that verifies JWT tokens
2. Include token generation function
3. Include token verification function
4. Use Express-friendly patterns with named exports
5. Handle authentication errors appropriately
6. Include type definitions for authenticated requests
7. Show example usage with Express routes

Return only the TypeScript code without markdown formatting or explanations.`,
      },
    ],
  });

  if (message.content[0].type === "text") {
    console.log(message.content[0].text);
  }
}

generateJWTAuthMiddleware().catch(console.error);