<h1>API Authentication Models — Evaluation Project</h1>

<p>
  This project is my practical exploration of different API authentication models. 
  The goal is simple: understand how each approach works, what problems it solves, 
  where it falls short, and how it behaves in a real backend environment. 
  Everything here is built to be hands-on, easy to test, and useful for comparing 
  authentication strategies in a structured way.
</p>

<hr>

<h2>What This Project Covers</h2>

<p>I’ve implemented and evaluated several common authentication models:</p>

<ul>
  <li>API Keys</li>
  <li>Basic Authentication</li>
  <li>Session-Based Authentication</li>
  <li>JWT (JSON Web Tokens)</li>
  <li>OAuth 2.0</li>
  <li>HMAC Signatures</li>
  <li>Custom Token Approaches</li>
</ul>

<p>
  Each model includes a working example plus notes on security, developer experience, 
  performance considerations, and realistic use cases. This is all geared toward 
  understanding the trade-offs rather than just “getting it working”.
</p>

<hr>

<h2>Tech Stack</h2>

<table>
  <tr><th>Component</th><th>Technology</th></tr>
  <tr><td>Runtime</td><td>Node.js</td></tr>
  <tr><td>Framework</td><td>Express.js</td></tr>
  <tr><td>Language</td><td>TypeScript</td></tr>
  <tr><td>Database</td><td>PostgreSQL</td></tr>
  <tr><td>Auth Models</td><td>API Keys, JWT, OAuth2, HMAC</td></tr>
  <tr><td>Tooling</td><td>Nodemon, ts-node, dotenv</td></tr>
</table>

<hr>

<h2>Project Structure</h2>

<pre><code>
api-authentication-models-evaluation/
│
├── src/
│   ├── models/          # Implementations of each auth model
│   ├── middleware/      # Auth middleware for each model
│   ├── controllers/     # Example protected routes
│   ├── utils/           # Helpers (hashing, signing, validation)
│   └── server.ts        # App entrypoint
│
├── prisma/              # Database schema (if used)
├── .env                 # Environment variables
├── .gitignore
├── package.json
└── README.md
</code></pre>

<hr>

<h2>Getting Started</h2>

<h3>Clone the repo</h3>
<pre><code>git clone https://github.com/jkmagnussen/api-authentication-models-evaluation.git
cd api-authentication-models-evaluation
</code></pre>

<h3>Install dependencies</h3>
<pre><code>npm install
</code></pre>

<h3>Environment variables</h3>

<p>Create a <code>.env</code> file with your local settings:</p>

<pre><code>
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/authdb"

# JWT
JWT_SECRET="secretkey"
JWT_EXPIRES_IN="1h"

# API Keys
API_KEY="your-api-key"

# OAuth (optional)
OAUTH_CLIENT_ID=""
OAUTH_CLIENT_SECRET=""
</code></pre>

<hr>

<h2>PostgreSQL Setup</h2>

<p>Local Postgres defaults:</p>

<pre><code>
Username: postgres
Password: password
Port: 5432
Locale: DEFAULT
</code></pre>

<p>Create the database:</p>
<pre><code>createdb authdb</code></pre>

<p>If you're using Prisma:</p>
<pre><code>npx prisma migrate dev</code></pre>

<hr>

<h2>Running the Project</h2>

<h3>Development mode</h3>
<pre><code>npm run dev</code></pre>

<h3>Production build</h3>
<pre><code>
npm run build
npm start
</code></pre>

<hr>

<h2>Authentication Models</h2>

<h3>API Keys</h3>
<p>Simple and quick. Good for internal services. Weak if keys leak.</p>

<h3>Basic Auth</h3>
<p>Works, but only with HTTPS. Not ideal for modern APIs.</p>

<h3>Session-Based Auth</h3>
<p>Stateful. Great for web apps, not for stateless APIs.</p>

<h3>JWT</h3>
<p>Stateless and scalable. Token invalidation is the main headache.</p>

<h3>OAuth 2.0</h3>
<p>Standard for delegated access. Secure but more complex to implement.</p>

<h3>HMAC Signatures</h3>
<p>Very secure. Used by AWS/Stripe. Requires canonical signing.</p>

<hr>

<h2>Testing</h2>

<p>You can use Postman, Insomnia, Thunder Client, or cURL.</p>

<pre><code>
curl -H "Authorization: Bearer &lt;token&gt;" http://localhost:3000/protected
</code></pre>

<hr>

to reset the migration - npx prisma migrate reset