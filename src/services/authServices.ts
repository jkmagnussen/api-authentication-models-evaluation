import bcrypt from "bcryptjs";
import { prisma } from "../db";

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);

//   For below, example post header - 
//   {
//   "email": "penny@example.com",
//   "password": "woof"
// }

const user = await prisma.user.create({

  data: {
    email,
    password: passwordHash,  
    role: { connect: { name: "USER" } }
  }
});
  return user;
}