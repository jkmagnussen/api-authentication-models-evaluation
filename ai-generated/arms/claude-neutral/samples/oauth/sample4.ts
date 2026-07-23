import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateOAuthEndpointSample(): Promise<string> {
  const systemPrompt = `You are an expert TypeScript/Express developer specializing in OAuth2 implementations.
Generate a complete, working OAuth2 authorization endpoint implementation in TypeScript using Express.
The implementation should include:
1. Authorization request handling with PKCE support
2. State parameter validation
3. Scope parsing and validation
4. User authentication check
5. Consent screen handling
6. Authorization code generation
7. Proper error handling with OAuth2 error responses
8. Session management for the authorization flow
9. Redirect URI validation against registered clients
10. Full TypeScript types

Make the implementation vary in structure, variable naming, and approach from common patterns.
Return only working TypeScript code suitable for Express applications.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Generate OAuth2 authorization endpoint sample #4 of 30. 
Create a unique implementation with different architecture patterns and naming conventions.
Ensure it's production-ready with proper error handling, validation, and security measures.`,
      },
    ],
    system: systemPrompt,
  });

  const textContent = message.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response");
  }

  return textContent.text;
}

async function main(): Promise<void> {
  console.log(
    "Generating OAuth2 Authorization Endpoint Sample #4 of 30...\n"
  );
  const sample = await generateOAuthEndpointSample();
  console.log(sample);
}

main().catch(console.error);