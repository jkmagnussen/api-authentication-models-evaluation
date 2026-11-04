import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateJWTAuthMiddleware(): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate a complete, production-ready JWT authentication middleware implementation in TypeScript for Express.js. 

Requirements:
1. Create middleware that verifies JWT tokens from Authorization headers
2. Support token generation with a secret key
3. Include error handling for invalid/expired tokens
4. Use industry-standard libraries (jsonwebtoken, express)
5. Include proper TypeScript types
6. Provide example usage with Express routes
7. Use named exports for functions
8. Make it self-contained and independently executable
9. Include environment variable support for JWT secret

Return only the TypeScript code without markdown formatting or explanations.`,
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response");
  }

  return textContent.text;
}

async function main() {
  console.log("Generating JWT authentication middleware...\n");
  const middleware = await generateJWTAuthMiddleware();
  console.log(middleware);
}

main().catch(console.error);