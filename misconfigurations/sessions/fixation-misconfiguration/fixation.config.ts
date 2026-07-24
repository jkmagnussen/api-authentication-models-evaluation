// In this variant, I turn off session ID regeneration on login.
// I use this to show session fixation risk: an attacker can pre-set a session ID and reuse it after login.
// This is a known issue and still appears in custom auth flows and older session setups.
export const sessionFixationMisconfiguration = {
  regenerateOnLogin: false,
};
