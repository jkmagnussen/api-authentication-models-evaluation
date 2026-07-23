```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";

const app = express();
const client = new Anthropic();

interface OAuthConversation {
  conversationId: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

const activeConversations = new Map<string, OAuthConversation>();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export async function handleAuthorizationRequest(
  req: Request,
  res: Response
): Promise<void> {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    conversation_id,
  } = req.query;

  const conversationId = (conversation_id as string) || generateConversationId();
  const userMessage = `OAuth2 Authorization Request:
- Client ID: ${client_id}
- Redirect URI: ${redirect_uri}
- Response Type: ${response_type}
- Scope: ${scope}
- State: ${state}

Please help me understand this OAuth2 request and provide guidance on whether to authorize it.`;

  let conversation = activeConversations.get(conversationId);
  if (!conversation) {
    conversation = {
      conversationId,
      messages: [],
    };
    activeConversations.set(conversationId, conversation);
  }

  conversation.messages.push({
    role: "user",
    content: userMessage,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system:
      "You are an OAuth2 authorization assistant. Help users understand authorization requests and make informed decisions about granting access.",
    messages: conversation.messages,
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";

  conversation.messages.push({
    role: "assistant",
    content: assistantMessage,
  });

  res.json({
    conversationId,
    authorizationRequest: {
      clientId: client_id,
      redirectUri: redirect_uri,
      responseType: response_type,
      scope: scope,
      state: state,
    },
    assistantResponse: assistantMessage,
  });
}

export async function handleAuthorizationApproval(
  req: Request,
  res: Response
): Promise<void> {
  const { conversation_id, approval_decision } = req.body;

  const conversation = activeConversations.get(conversation_id);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const decisionMessage = `User decision: ${approval_decision ? "APPROVED" : "DENIED"}. Please provide next steps for this OAuth2 flow based on the user's decision.`;

  conversation.messages.push({
    role: "user",
    content: decisionMessage,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system:
      "You are an OAuth2 authorization assistant. Help users understand authorization requests and next steps.",
    messages: conversation.messages,
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";

  conversation.messages.push({
    role: "assistant",
    content: assistantMessage,
  });

  const authoriz