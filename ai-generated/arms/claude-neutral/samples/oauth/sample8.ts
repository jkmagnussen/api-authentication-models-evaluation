import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateOAuth2AuthorizationEndpoint() {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a complete TypeScript OAuth2 authorization endpoint implementation for Express.js. 
        
        Requirements:
        - Create an Express middleware function for handling OAuth2 authorization requests
        - Include state parameter validation and PKCE support
        - Implement consent screen handling with scope permissions
        - Generate authorization codes with proper expiration
        - Use unique variable names and function structure different from previous samples
        - Include redirect URI validation
        - Implement error handling for invalid requests
        - Store authorization codes in memory
        
        Return only the TypeScript code with no markdown formatting.`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

export async function demonstrateOAuth2Endpoint() {
  const generatedCode = await generateOAuth2AuthorizationEndpoint();
  console.log("Generated OAuth2 Authorization Endpoint:");
  console.log("=".repeat(50));
  console.log(generatedCode);

  return generatedCode;
}

demonstrateOAuth2Endpoint().catch(console.error);