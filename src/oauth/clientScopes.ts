export const clientScopes: Record<string, string[]> = {
  'client-basic': ['read'], // read-only client
  'client-privileged': ['read', 'write'], // read + write client
  'client-admin': ['read', 'write', 'admin'], // full admin privileges
};
