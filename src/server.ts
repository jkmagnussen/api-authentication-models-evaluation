import express from "express";
import { prisma } from "./db";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const user = await prisma.user.create({
      data: { email, password, name },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});