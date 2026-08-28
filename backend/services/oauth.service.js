import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";
import env from "../config/env.js";

const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

export const googleConfigured = () => !!env.GOOGLE_CLIENT_ID;
export const appleConfigured = () => !!env.APPLE_CLIENT_ID;

// Verify a Google ID token (the JWT credential the GSI button returns) against
// our client id. Returns a normalized identity or throws.
export const verifyGoogleToken = async (idToken) => {
  if (!googleClient) {
    const err = new Error("Google login non configurato");
    err.statusCode = 501;
    throw err;
  }
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    const err = new Error("Token Google non valido");
    err.statusCode = 401;
    throw err;
  }
  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.email_verified) {
    const err = new Error("Account Google senza email verificata");
    err.statusCode = 401;
    throw err;
  }
  return {
    provider: "google",
    providerId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
  };
};

// Verify an Apple identity token against our Service ID. Apple only sends the
// user's name on the *first* authorization (in the client payload), so callers
// pass it through as `fallbackName`.
export const verifyAppleToken = async (identityToken, fallbackName) => {
  if (!appleConfigured()) {
    const err = new Error("Apple login non configurato");
    err.statusCode = 501;
    throw err;
  }
  let payload;
  try {
    payload = await appleSignin.verifyIdToken(identityToken, {
      audience: env.APPLE_CLIENT_ID,
      ignoreExpiration: false,
    });
  } catch {
    const err = new Error("Token Apple non valido");
    err.statusCode = 401;
    throw err;
  }
  // Apple sends email_verified as the STRING "true"/"false" in most token
  // versions (unlike Google's boolean), and apple-signin-auth passes the claim
  // through unmodified — so normalize both shapes rather than trusting either.
  // A private-relay address (@privaterelay.appleid.com) is always verified by
  // Apple, so this doesn't reject "Hide My Email" users.
  const appleEmailVerified =
    payload?.email_verified === true || payload?.email_verified === "true";
  if (!payload || !payload.email || !appleEmailVerified) {
    const err = new Error("Account Apple senza email verificata");
    err.statusCode = 401;
    throw err;
  }
  return {
    provider: "apple",
    providerId: payload.sub,
    email: String(payload.email).toLowerCase(),
    name: fallbackName || String(payload.email).split("@")[0],
  };
};
