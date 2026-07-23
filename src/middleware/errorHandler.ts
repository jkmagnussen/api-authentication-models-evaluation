import { NextFunction, Request, Response } from "express";
import { log } from "../logger";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  if (status >= 500) {
    log("error", "Unhandled request error", {
      method: req.method,
      path: req.originalUrl,
      status,
      error: message,
    });
  }

  res.status(status).json({ error: message });
}
