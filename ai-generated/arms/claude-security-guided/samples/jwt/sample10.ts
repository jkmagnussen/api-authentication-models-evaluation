import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function generateSecureJWTMiddleware(): Promise<void> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a complete Express middleware for JWT authentication in TypeScript with these requirements:
1. Use jose library for JWT operations
2. Implement audience claim validation
3. Implement issuer claim validation
4. Support multiple signing algorithms (HS256, RS256)
5. Validate token expiry with clock skew tolerance
6. Include explicit error handling
7. Use named exports
8. Include usage example

Make this the 10th sample with a different structure from previous ones.
Format:
- Different middleware naming pattern
- Alternative validation approach
- Unique error handling mechanism

Here's the code structure to follow:
- Use async validation patterns
- Implement middleware factory pattern
- Include configuration interface`,
      }
    ],
  });

  // Extract text content from the response
  const responseText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.type === 'text' ? block.text : '')
    .join('');

  console.log('Generated JWT Authentication Middleware (Sample 10/30):');
  console.log('='.repeat(60));
  console.log(responseText);
  console.log('='.repeat(60));
}

// Execute the function
generateSecureJWTMiddleware().catch(console.error);