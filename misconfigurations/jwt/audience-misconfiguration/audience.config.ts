// In this variant, I loosen audience validation by using a broad value (`anyone`).
// I use this to show how a token meant for one service can be accepted by another if audience checks are weak.
// This is a common slip in multi-service deployments where config values get copied across environments.
export const jwtAudienceMisconfiguration = {
  audience: 'anyone',
};
