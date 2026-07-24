// In this variant, I remove the HttpOnly cookie flag.
// I use this to show how a script-readable session cookie makes XSS-led session theft much easier.
// This is a very common mistake when cookie settings are tuned manually per environment.
export const cookieFlagMisconfiguration = {
  cookie: {
    httpOnly: false,
  },
};
