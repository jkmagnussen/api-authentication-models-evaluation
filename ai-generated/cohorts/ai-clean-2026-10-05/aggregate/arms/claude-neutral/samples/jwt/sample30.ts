import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateJWTAuthMiddleware(): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a complete TypeScript implementation of JWT authentication middleware for Express.js. Include:
1. JWT token generation function
2. Token verification middleware
3. Error handling
4. TypeScript interfaces for token payload
5. Example usage with Express routes

Return only the TypeScript code, no markdown formatting or explanations.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }

  throw new Error("Unexpected response type from Claude");
}

export async function main(): Promise<void> {
  console.log("Generating JWT Authentication Middleware...\n");

  const middleware = await generateJWTAuthMiddleware();
  console.log(middleware);
}

main().catch(console.error);