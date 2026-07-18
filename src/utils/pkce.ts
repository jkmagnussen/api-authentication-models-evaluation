import pkceChallenge from "pkce-challenge";

export async function createPkcePair() {
  const { code_verifier, code_challenge } = await pkceChallenge();
  return { code_verifier, code_challenge };
}
