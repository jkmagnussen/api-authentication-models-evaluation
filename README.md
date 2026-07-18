<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>API Authentication Models — Evaluation Project</title>
<style>
  body {
    font-family: Arial, sans-serif;
    max-width: 900px;
    margin: auto;
    padding: 20px;
    line-height: 1.6;
    color: #222;
  }
  h1, h2, h3 {
    color: #333;
    margin-top: 40px;
  }
  pre {
    background: #f4f4f4;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
  }
  code {
    background: #eee;
    padding: 2px 4px;
    border-radius: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  th, td {
    padding: 10px;
    border-bottom: 1px solid #ccc;
    text-align: left;
  }
  hr {
    margin: 40px 0;
  }
</style>
</head>
<body>

<h1>A Comparative Evaluation of API Authentication Models in Multi‑Tenant Web Applications</h1>

<p>
This project implements and evaluates three authentication models — Sessions, JWT, and OAuth 2.0 — inside a single, controlled Express + TypeScript backend. 
The artefact supports the dissertation’s aim: a fair, empirical comparison of security resilience, performance overhead, and maintainability under identical architectural conditions.
</p>

<hr>

<h2>Table of Contents</h2>
<ul>
  <li><a href="#context">Project Context</a></li>
  <li><a href="#models">Supported Authentication Models</a></li>
  <li><a href="#stack">Tech Stack</a></li>
  <li><a href="#structure">Project Structure</a></li>
  <li><a href="#quickstart">Quick Start</a></li>
  <li><a href="#database">Database Setup & Seeding</a></li>
  <li><a href="#routes">API Routes & JSON Examples</a></li>
  <li><a href="#reference">Quick Reference</a></li>
  <li><a href="#license">License</a></li>
</ul>

<hr>

<h2 id="context">Project Context</h2>

<p>
Modern multi‑tenant applications rely on secure API authentication. Research often evaluates session cookies, JWTs, and OAuth2 in isolation, making like‑for‑like comparison difficult. 
This artefact implements all three models as interchangeable middleware inside one backend, enabling controlled evaluation using STRIDE threat modelling, OWASP ZAP scanning, replay testing, and performance benchmarking.
</p>

<hr>

<h2 id="models">Supported Authentication Models</h2>

<ul>
  <li><strong>Session-Based Authentication</strong> — Cookie + server-side session store.</li>
  <li><strong>JWT Authentication</strong> — Stateless, signed tokens.</li>
  <li><strong>OAuth 2.0 Authorization Code + PKCE</strong> — Delegated access.</li>
</ul>

<hr>

<h2 id="stack">Tech Stack</h2>

<table>
  <tr><th>Component</th><th>Technology</th></tr>
  <tr><td>Runtime</td><td>Node.js</td></tr>
  <tr><td>Framework</td><td>Express.js</td></tr>
  <tr><td>Language</td><td>TypeScript</td></tr>
  <tr><td>Database</td><td>PostgreSQL</td></tr>
  <tr><td>ORM</td><td>Prisma 6</td></tr>
  <tr><td>Testing</td><td>OWASP ZAP, k6/Artillery</td></tr>
</table>

<hr>

<h2 id="structure">Project Structure</h2>

<pre><code>
api-authentication-models-evaluation/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── src/
│   ├── controllers/
│   ├── jwt/
│   ├── middleware/
│   ├── oauth/
│   ├── routes/
│   ├── services/
│   ├── sessions/
│   ├── types/
│   ├── app.ts
│   ├── config.ts
│   ├── db.ts
│   └── server.ts
│
├── package.json
├── tsconfig.json
├── .env
└── README.html
</code></pre>

<hr>

<h2 id="quickstart">Quick Start</h2>

<h3>1. Clone the Repository</h3>
<pre><code>
git clone https://github.com/jkmagnussen/api-authentication-models-evaluation.git
cd api-authentication-models-evaluation
</code></pre>

<h3>2. Install Dependencies</h3>
<pre><code>npm install</code></pre>

<h3>3. Create Environment File</h3>

<p><strong>Example .env file (values shown are examples only):</strong></p>

<pre><code>
PORT=3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/dissertation_auth_db"

SESSION_SECRET=305f1ebe98b4e057fd33f8e26e0d7858d5693c6d095cff26f2c1fd7fb13773f4

JWT_SECRET=lkj23lkj23lkj23lkj23lkj23lkj23
</code></pre>

<hr>

<h2 id="database">Database Setup & Seeding</h2>

<h3>1. Create PostgreSQL Database</h3>
<pre><code>createdb dissertation_auth_db</code></pre>

<h3>2. Run Prisma Migrations</h3>
<pre><code>npx prisma migrate dev</code></pre>

<h3>3. Generate Prisma Client</h3>
<pre><code>npx prisma generate</code></pre>

<h3>4. Seed Initial Data</h3>

<p>The seed file is located at <code>prisma/seed.ts</code>.</p>

<p>It inserts:</p>

<ul>
  <li><strong>Main User</strong>: ID <code>d9c7dba3-3f97-4418-9f7b-f89d8fa5d925</code>, email <code>main@example.com</code>, password <code>password123</code></li>
  <li><strong>OAuth Client</strong>: ID <code>client-123</code>, secret <code>super-secret</code></li>
</ul>

<h4>Seed Script</h4>

<pre><code>
import { prisma } from "../src/db";
import bcrypt from "bcrypt";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { id: "d9c7dba3-3f97-4418-9f7b-f89d8fa5d925" },
    update: {},
    create: {
      id: "d9c7dba3-3f97-4418-9f7b-f89d8fa5d925",
      email: "main@example.com",
      password: passwordHash,
    },
  });

  await prisma.oAuthClient.upsert({
    where: { id: "client-123" },
    update: {},
    create: {
      id: "client-123",
      secret: "super-secret",
      name: "Test Client",
    },
  });

  console.log("Seed complete.");
}

main().finally(() => process.exit(0));
</code></pre>

<h4>Run the Seed</h4>
<pre><code>npx ts-node prisma/seed.ts</code></pre>

<hr>

<h2 id="routes">API Routes & JSON Examples</h2>

<h3>Session Authentication</h3>

<h4>POST /auth/login</h4>
<pre><code>
{
  "email": "main@example.com",
  "password": "password123"
}
</code></pre>

<h4>GET /auth/me</h4>
<p>Requires session cookie.</p>

<hr>

<h3>JWT Authentication</h3>

<h4>POST /jwt/login</h4>
<pre><code>
{
  "email": "main@example.com",
  "password": "password123"
}
</code></pre>

<h4>GET /jwt/protected</h4>
<p>Requires <code>Authorization: Bearer &lt;token&gt;</code></p>

<hr>

<h3>OAuth 2.0 — Authorization Code + PKCE</h3>

<h4>POST /oauth/authorize</h4>
<pre><code>
{
  "userId": "d9c7dba3-3f97-4418-9f7b-f89d8fa5d925",
  "client_id": "client-123",
  "redirect_uri": "http://localhost:3000/callback",
  "state": "xyz",
  "scope": "read",
  "code_challenge": "Q7m2xK9t1pL4vS8bZ3rT0uE5wY9nC2fJ6kH1dQ4hA7U",
  "code_challenge_method": "S256"
}
</code></pre>

<h4>POST /oauth/token</h4>

<p>Requires Basic Auth header:</p>
<pre><code>client-123:super-secret</code></pre>

<pre><code>
{
  "code": "&lt;authorization_code&gt;",
  "code_verifier": "&lt;original_verifier&gt;"
}
</code></pre>

<hr>

<h2 id="reference">Quick Reference</h2>

<h3>Reset Database</h3>
<pre><code>npx prisma migrate reset</code></pre>

<h3>Fresh Start</h3>
<pre><code>
npx prisma migrate reset
npx ts-node prisma/seed.ts
npm run dev
</code></pre>

<h3>Run Server</h3>
<pre><code>npm run dev</code></pre>

<hr>

<h2 id="license">License</h2>
<p>MIT</p>

</body>
</html>
