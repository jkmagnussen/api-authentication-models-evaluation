<h1 style="text-align:center; font-size:32px; margin-bottom:30px;">
  API Route Structure
</h1>

<div style="background:#fff; padding:20px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1); margin-bottom:25px;">
  <h2 style="border-bottom:2px solid #ddd; padding-bottom:8px;">Sessions</h2>
  <ul style="list-style:none; padding-left:0;">
    <li style="background:#f0f0f0; padding:10px 15px; margin-bottom:8px; border-radius:6px; font-family:'Courier New', monospace;">
      POST /sessions/login
    </li>
    <li style="background:#f0f0f0; padding:10px 15px; margin-bottom:8px; border-radius:6px; font-family:'Courier New', monospace;">
      POST /sessions/logout
    </li>
    <li style="background:#f0f0f0; padding:10px 15px; margin-bottom:8px; border-radius:6px; font-family:'Courier New', monospace;">
      GET /sessions/protected
    </li>
    <li style="background:#f0f0f0; padding:10px 15px; margin-bottom:8px; border-radius:6px; font-family:'Courier New', monospace;">
      GET /sessions/csrf <em>(Not Used)</em>
    </li>
  </ul>
</div>

<div style="background:#fff; padding:20px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1); margin-bottom:25px;">
  <h2 style="border-bottom:2px solid #ddd; padding-bottom:8px;">JWT</h2>
  <ul style="list-style:none; padding-left:0;">
    <li style="background:#f0f0f0; padding:10px 15px; margin-bottom:8px; border-radius:6px; font-family:'Courier New', monospace;">
      POST /jwt/login
    </li>
    <li style="background:#f0f0f0; padding:10px 15px; margin-bottom:8px; border-radius:6px; font-family:'Courier New', monospace;">
      GET /jwt/protected
    </li>
  </ul>
</div>

<div style="background:#fff; padding:20px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1); margin-bottom:25px;">
  <h2 style="border-bottom:2px solid #ddd; padding-bottom:8px;">OAuth</h2>
  <ul style="list-style:none; padding-left:0;">
    <li style="background:#f0f0f0; padding:10px 15px; margin-bottom:8px; border-radius:6px; font-family:'Courier New', monospace;">
      POST /oauth/authorize
    </li>
    <li style="background:#f0f0f0; padding:10px 15px; margin-bottom:8px; border-radius:6px; font-family:'Courier New', monospace;">
      POST /oauth/token
    </li>
    <li style="background:#f0f0f0; padding:10px 15px; margin-bottom:8px; border-radius:6px; font-family:'Courier New', monospace;">
      GET /oauth/protected
    </li>
  </ul>
</div>
