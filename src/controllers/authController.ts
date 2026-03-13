import { Request, Response } from "express";
import { registerUser } from "../services/authServices";

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await registerUser(email, password);

    return res.status(201).json({
      message: "User registered successfully",
      user
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}