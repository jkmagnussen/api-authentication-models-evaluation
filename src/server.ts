import "./express-session-augment";
import "dotenv/config";
import app from "./app";
import { PORT } from "./config";
import { createPkcePair } from "./oauth/pkce";

// Print PKCE pair on startup
async function printPkce() {
  const { code_verifier, code_challenge } = await createPkcePair();
  console.log("------------------------------------------------------------");
  console.log("🔐 Generated PKCE Pair:");
  console.log("code_challenge:", code_challenge);
  console.log("code_verifier:", code_verifier);
  console.log("------------------------------------------------------------");
}

printPkce();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});