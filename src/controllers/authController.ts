import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/authServices";


export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await registerUser(email, password);

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error: any) {
    if (error.message === "Email already registered") {
      return res.status(409).json({ error: error.message });
    }

    return next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);
    return res.status(200).json({
      message: "Login successful",
      user,
    });
  } catch (error: any) {
    if (error.message === "Invalid credentials") {
      return res.status(401).json({ error: error.message });
    }
    return next(error);
  }
}