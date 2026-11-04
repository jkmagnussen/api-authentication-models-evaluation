import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function generateJWTAuthMiddleware(): Promise<void> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a complete TypeScript implementation of JWT authentication middleware for Express.js. 
        
Requirements:
- Create middleware functions for token verification and generation
- Use jsonwebtoken library for JWT operations
- Include proper type definitions
- Support both synchronous and asynchronous token verification
- Include error handling for invalid/expired tokens
- Provide Express-friendly middleware that can be used with app.use()
- Use named exports only
- Make it self-contained and production-ready

Return only the TypeScript code without markdown, comments explaining the code, or any other text.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    console.log(content.text);
  }
}

generateJWTAuthMiddleware().catch(console.error);