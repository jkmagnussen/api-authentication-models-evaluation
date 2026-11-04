```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { createHash, randomBytes } from 'crypto';

// Secure session store implementation
class SecureSessionStore extends session.Store {
  private sessions: Map<string, { data: Record<string, unknown>; expiresAt: number }> = new Map();
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours

  get(sid: string, callback: (err: Error | null, session?: session.SessionData | null) => void): void {
    try {
      // Validate session ID format (alphanumeric, dashes, underscores only)
      if (!/^[a-zA-Z0-9\-_]+$/.test(sid)) {
        return callback(new Error('Invalid session ID format'));
      }

      const sessionData = this.sessions.get(sid);
      if (!sessionData) {
        return callback(null, null);
      }

      // Check expiration
      if (sessionData.expiresAt < Date.now()) {
        this.sessions.delete(sid);
        return callback(null, null);
      }

      callback(null, sessionData.data as session.SessionData);
    } catch (err) {
      callback(err instanceof Error ? err : new Error('Session retrieval failed'));
    }
  }

  set(sid: string, session: session.SessionData, callback?: (err?: Error | null) => void): void {
    try {
      // Validate session ID
      if (!/^[a-zA-Z0-9\-_]+$/.test(sid)) {
        const error = new Error('Invalid session ID format');
        if (callback) callback(error);
        return;
      }

      // Validate session data
      if (!session || typeof session !== 'object') {
        const error = new Error('Invalid session data');
        if (callback) callback(error);
        return;
      }

      this.sessions.set(sid, {
        data: session,
        expiresAt: Date.now() + this.maxAge,
      });

      if (callback) callback(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Session storage failed');
      if (callback) callback(error);
    }
  }

  destroy(sid: string, callback?: (err?: Error | null) => void): void {
    try {
      // Validate session ID
      if (!/^[a-zA-Z0-9\-_]+$/.test(sid)) {
        const error = new Error('Invalid session ID format');
        if (callback) callback(error);
        return;
      }

      this.sessions.delete(sid);
      if (callback) callback(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Session destruction failed');
      if (callback) callback(error);
    }
  }

  clear(callback?: (err?: Error | null) => void): void {
    try {
      this.sessions.clear();
      if (callback) callback(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Session clear failed');
      if (callback) callback(error);
    }
  }
}

// Input validation utilities
function validateUsername(username: unknown): username is string {
  if (typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 50) return false;
  return /^[a-zA-Z0-9_\-]+$/.test(username);
}