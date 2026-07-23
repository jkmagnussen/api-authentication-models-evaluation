import "./express-session-augment";
import "dotenv/config";
import net from "net";
import app from "./app";
import { PORT, validateRuntimeConfig } from "./config";
import { log } from "./logger";
import { createPkcePair } from "./oauth/pkce";

// Optional PKCE startup output for Postman-driven testing.
async function printPkce() {
  if (process.env.LOG_PKCE_STARTUP !== "true") return;

  const { code_verifier, code_challenge } = await createPkcePair();
  console.log("------------------------------------------------------------");
  console.log("🔐 Generated PKCE Pair:");
  console.log("code_challenge:", code_challenge);
  console.log("code_verifier:", code_verifier);
  console.log("------------------------------------------------------------");
}

async function startServer() {
  const configValidation = validateRuntimeConfig();

  for (const warning of configValidation.warnings) {
    log("warn", "runtime.config.warning", { warning });
  }

  if (configValidation.errors.length > 0) {
    for (const error of configValidation.errors) {
      log("error", "runtime.config.error", { error });
    }
    process.exit(1);
  }

  try {
    await printPkce();
  } catch (error) {
    console.error("Failed to generate startup PKCE pair:", error);
  }

  const hasExplicitPort = process.env.PORT !== undefined && process.env.PORT !== "";
  const fallbackPorts = hasExplicitPort ? [PORT] : [PORT, PORT + 1, PORT + 2, PORT + 3, PORT + 4];

  const canBindPort = (port: number) =>
    new Promise<boolean>((resolve) => {
      const probe = net.createServer();
      probe.unref();
      probe.on("error", () => resolve(false));
      probe.listen(port, () => {
        probe.close(() => resolve(true));
      });
    });

  let selectedPort: number | null = null;
  for (const port of fallbackPorts) {
    if (await canBindPort(port)) {
      selectedPort = port;
      break;
    }
  }

  if (selectedPort === null) {
    console.error(`Port ${PORT} is already in use. Stop the other process or change PORT.`);
    process.exit(1);
  }

  if (!hasExplicitPort && selectedPort !== PORT) {
    console.warn(`Port ${PORT} is already in use; using ${selectedPort} instead.`);
  }

  const server = app.listen(selectedPort, () => {
    console.log(`Server running on http://localhost:${selectedPort}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });
}

void startServer();