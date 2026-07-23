import { generateCurrentTotp, generateTotpSecret } from "../src/auth/totp";

const providedSecret = process.argv[2] ?? process.env.MFA_SECRET;

if (!providedSecret) {
  console.log(generateTotpSecret());
  process.exit(0);
}

console.log(generateCurrentTotp(providedSecret));