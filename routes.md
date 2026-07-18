# API Route Structure

## Sessions
POST /sessions/login
POST /sessions/logout
GET  /sessions/protected
GET  /sessions/csrf

## JWT
POST /jwt/login
GET  /jwt/protected

## OAuth
POST /oauth/authorize
POST /oauth/token
GET  /oauth/resource