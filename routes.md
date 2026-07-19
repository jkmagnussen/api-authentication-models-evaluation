<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>API Route Structure</title>
<style>
    body {
        font-family: Arial, sans-serif;
        background: #f7f7f7;
        padding: 40px;
        color: #333;
    }
    h1 {
        text-align: center;
        margin-bottom: 40px;
        font-size: 32px;
        letter-spacing: 1px;
    }
    .section {
        background: #fff;
        padding: 25px;
        margin-bottom: 30px;
        border-radius: 10px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    h2 {
        margin-top: 0;
        font-size: 24px;
        border-bottom: 2px solid #ddd;
        padding-bottom: 10px;
    }
    ul {
        list-style: none;
        padding-left: 0;
        margin-top: 15px;
    }
    li {
        background: #f0f0f0;
        padding: 10px 15px;
        margin-bottom: 8px;
        border-radius: 6px;
        font-family: "Courier New", monospace;
        font-size: 15px;
    }
</style>
</head>
<body>

<h1>API Route Structure</h1>

<div class="section">
    <h2>Sessions</h2>
    <ul>
        <li>POST /sessions/login</li>
        <li>POST /sessions/logout</li>
        <li>GET /sessions/protected</li>
        <li>GET /sessions/csrf <em>(Not Used)</em></li>
    </ul>
</div>

<div class="section">
    <h2>JWT</h2>
    <ul>
        <li>POST /jwt/login</li>
        <li>GET /jwt/protected</li>
    </ul>
</div>

<div class="section">
    <h2>OAuth</h2>
    <ul>
        <li>POST /oauth/authorize</li>
        <li>POST /oauth/token</li>
        <li>GET /oauth/protected</li>
    </ul>
</div>

</body>