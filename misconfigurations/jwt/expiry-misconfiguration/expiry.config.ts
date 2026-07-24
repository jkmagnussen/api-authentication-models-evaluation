// In this variant, I set a very long JWT lifetime (`30d`).
// I use this to show how long-lived tokens keep replay risk high and make incident response weaker.
// This is a very common mistake in early implementations because long expiry feels easier during development.
export const jwtExpiryMisconfiguration = {
  expiry: '30d',
};
