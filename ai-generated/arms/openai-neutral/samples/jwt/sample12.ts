import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateSecureJWTMiddleware(
  sampleNumber: number
): Promise<string> {
  const systemPrompt = `You are a TypeScript security expert generating secure JWT authentication middleware for Express.js applications.

Generate complete, production-ready middleware that implements:
1. JWT verification with explicit algorithm selection
2. Audience (aud) claim validation
3. Issuer (iss) claim validation  
4. Token expiry (exp) validation
5. Type-safe error handling
6. Rate limiting considerations
7. Secure defaults (no "none" algorithm, required claims validation)
8. Environment-based configuration

Return ONLY valid TypeScript code with:
- Named exports for middleware functions
- Proper Express types (Request, Response, NextFunction)
- Complete implementation with no placeholders
- Security best practices throughout
- Clear variable and function names that differ from standard examples`;

  const userPrompt = `Generate the ${sampleNumber}nd variant of secure JWT Express middleware with:
- Different structure and naming conventions from typical implementations
- Algorithm selection from ['HS256', 'RS256', 'ES256'] 
- Custom claim validation patterns
- Unique error handling approach
- Environmental configuration strategy
Focus on production security while maintaining code clarity.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract code block if wrapped in markdown
  let code = responseText;
  const codeBlockMatch = responseText.match(/```(?:typescript|ts)?\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    code = codeBlockMatch[1];
  }

  return code;
}

async function main() {
  console.log("Generating secure JWT authentication middleware (Sample 12 of 30)");
  console.log("=".repeat(60));

  const middleware = await generateSecureJWTMiddleware(12);
  console.log(middleware);
}

main().catch(console.error);