<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>API Authentication Models — Evaluation Project</title>
<style>
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    max-width: 900px;
    margin: auto;
    padding: 20px;
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

<h1>API Authentication Models — Evaluation Project</h1>

<p>
This project is a practical exploration of different API authentication models. 
The goal is simple: understand how each approach works, what problems it solves, 
where it falls short, and how it behaves in a real backend environment. 
Everything here is built to be hands-on, easy to test, and useful for comparing 
authentication strategies in a structured way.
</p>

<hr>

<h2>Table of Contents</h2>
<ul>
  <li><a href="#supported-authentication-models">Supported Authentication Models</a></li>
  <li><a href="#tech-stack">Tech Stack</a></li>
  <li><a href="#project-structure">Project Structure</a></li>
  <li><a href="#quick-start">Quick Start</a></li>
  <li><a href="#database-setup">Database Setup & Seeding</a></li>
  <li><a href="#running-the-project">Running the Project</a></li>
  <li><a href="#testing">Testing</a></li>
  <li><a href="#authentication-models-overview">Authentication Models Overview</a></li>
  <li><a href="#quick-reference">Quick Reference</a></li>
  <li><a href="#contributing">Contributing</a></li>
  <li><a href="#license">License</a></li>
</ul>

<hr>

<h2 id="supported-authentication-models">Supported Authentication Models</h2>

<p>I've implemented and evaluated three core authentication models:</p>

<ul>
  <li><strong>Session-Based Authentication</strong> — Stateful. Great for web apps, not for stateless APIs.</li>
  <li><strong>JWT (JSON Web Tokens)</strong> — Stateless and scalable. Token invalidation is the main headache.</li>
  <li><strong>OAuth 2.0</strong> — Standard for delegated access. Secure but more complex to implement.</li>
</ul>

<hr>

<h2 id="tech-stack">Tech Stack</h2>

<table>
  <tr><th>Component</th><th>Technology</th></tr>
  <tr><td>Runtime</td><td>Node.js</td></tr>
  <tr><td>Framework</td><td>Express.js</td></tr>
  <tr><td>Language</td><td>TypeScript</td></tr>
  <tr><td>Database</td><td>PostgreSQL</td></tr>
  <tr><td>Auth Models</td><td>JWT, OAuth2, Sessions</td></tr>
  <tr><td>Tooling</td><td>Nodemon, ts-node, dotenv</td></tr>
</table>

<hr>

<h2 id="project-structure">Project Structure</h2>

<pre><code>
api-authentication-models-evaluation/
│
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── app.ts
│   ├── config.ts
│   ├── db.ts
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── seedClients.ts
│   └── migrations/
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
</code></pre>

<hr>

<h2 id="quick-start">Quick Start</h2>

<h3>Prerequisites</h3>
<ul>
  <li>Node.js (v16+)</li>
  <li>PostgreSQL (v12+)</li>
  <li>npm or yarn</li>
</ul>

<h3>1. Clone the Repository</h3>
<pre><code>git clone https://github.com/jkmagnussen/api-authentication-models-evaluation.git
cd api-authentication-models-evaluation
</code></pre>

<h3>2. Install Dependencies</h3>
<pre><code>npm install</code></pre>

<h3>3. Environment Variables</h3>
<pre><code>
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/authdb"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1h"
API_KEY="your-api-key"
</code></pre>

<hr>

<h2 id="database-setup">Database Setup & Seeding</h2>

<p>This project uses PostgreSQL + Prisma. Before running any authentication model, you must prepare the database schema and seed the initial data.</p>

<h3>1. Ensure PostgreSQL Is Running</h3>
<pre><code>createdb authdb</code></pre>

<h3>2. Apply Prisma Migrations</h3>
<pre><code>npx prisma migrate dev</code></pre>

<h3>3. Seed Initial Data</h3>

<p>The seed script inserts:</p>

<ul>
  <li><strong>Main User</strong>: ID <code>d9c7dba3-3f97-4418-9f7b-f89d8fa5d925</code>, email <code>main@example.com</code>, password <code>password123</code></li>
  <li><strong>OAuth Client</strong>: ID <code>client-123</code>, secret <code>super-secret</code></li>
</ul>

<pre><code>npx ts-node src/seed/seedClients.ts</code></pre>

<h3>4. Start the API</h3>
<pre><code>npm run dev</code></pre>

<hr>

<h2 id="running-the-project">Running the Project</h2>

<h3>Development Mode</h3>
<pre><code>npm run dev</code></pre>

<h3>Production Build</h3>
<pre><code>
npm run build
npm start
</code></pre>

<hr>

<h2 id="testing">Testing</h2>

<p>You can use Postman, Insomnia, Thunder Client, or cURL.</p>

<h3>Register a User</h3>
<pre><code>
POST http://localhost:3000/auth/register
{
  "email": "penny@example.com",
  "password": "test123"
}
</code></pre>

<hr>

<h2 id="authentication-models-overview">Authentication Models Overview</h2>

<h3>Session-Based Authentication</h3>
<p>Stateful, easy to revoke, but requires server-side storage.</p>

<h3>JWT</h3>
<p>Stateless and scalable, but token invalidation is difficult.</p>

<h3>OAuth 2.0</h3>
<p>Industry standard for delegated access, but more complex.</p>

<hr>

<h2 id="quick-reference">Quick Reference</h2>

<h3>Reset Database</h3>
<pre><code>npx prisma migrate reset</code></pre>

<h3>Run Migrations</h3>
<pre><code>npx prisma migrate dev</code></pre>

<h3>Seed Database</h3>
<pre><code>npx ts-node src/seed/seedClients.ts</code></pre>

<h3>Fresh Start</h3>
<pre><code>
npx prisma migrate reset
npx ts-node src/seed/seedClients.ts
npm run dev
</code></pre>

<h3>Prisma Studio</h3>
<pre><code>npx prisma studio</code></pre>

<hr>

<h2 id="contributing">Contributing</h2>
<p>Feel free to explore, test, and modify the authentication models.</p>

<hr>

<h2 id="license">License</h2>
<p>MIT</p>

</body>
</html>
