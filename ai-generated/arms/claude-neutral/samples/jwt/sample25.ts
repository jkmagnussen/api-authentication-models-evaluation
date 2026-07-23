import Anthropic from '@anthropic-ai/sdk';

interface JWTMiddlewareImplementation {
  name: string;
  code: string;
}

export async function generateJWTMiddleware(): Promise<JWTMiddlewareImplementation> {
  const client = new Anthropic();

  const prompt = `Generate a unique JWT authentication middleware implementation in TypeScript for Express.js. 
This is sample 25 of 30, so create a variation with:
- Different function names than typical (avoid "authenticateJWT", "verifyToken", "protect")
- Different middleware structure approach
- Different error handling pattern
- Different claims validation approach
- Different secret management method

Requirements:
1. TypeScript code only
2. Must work with Express.js
3. Include JWT token verification
4. Include custom claims validation
5. Include proper error handling
6. Include inline comments
7. Use a unique structure approach

Provide ONLY the code, no markdown, no explanation. Make it production-ready.`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return {
    name: 'Sample 25 - Variant JWT Middleware',
    code: content.text,
  };
}

export async function main() {
  try {
    const implementation = await generateJWTMiddleware();
    console.log(`Generated: ${implementation.name}\n`);
    console.log(implementation.code);
  } catch (error) {
    console.error('Error generating JWT middleware:', error);
    throw error;
  }
}

main();