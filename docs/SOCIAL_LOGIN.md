# Social login (Google + Apple)

How to obtain the two credentials, where to put them, and how to verify the
feature end to end.

Both providers use the **client-side id-token flow**: the provider's JS SDK
returns a signed identity token in the browser, the SPA POSTs it to our API,
and the server verifies it against the provider's public keys before issuing
its own session. There is deliberately **no server-side redirect/authorization-code
flow** — don't add redirect URIs expecting the server to handle a callback.

| | Google | Apple |
|---|---|---|
| Env var | `GOOGLE_CLIENT_ID` | `APPLE_CLIENT_ID` |
| What it is | OAuth 2.0 **Web application** client id | **Services ID** (not the App ID) |
| Cost | free | requires a **paid** Apple Developer account ($99/yr) |
| Works on `http://localhost`? | yes | **no** — Apple requires a public HTTPS domain |
| Endpoint | `POST /api/users/google` `{ credential }` | `POST /api/users/apple` `{ identityToken, name }` |

Each button renders **only** when its id is configured: the SPA reads
`GET /api/config/auth`, which returns an empty string for anything unset
(`backend/app.js`), and `SocialAuth.js` renders nothing for an empty id. So an
unconfigured provider is invisible rather than broken — and you must **restart
the server** after editing `.env`, since config is parsed once at boot
(`backend/config/env.js`).

---

## Google

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   create or select a project.
2. **APIs & Services → OAuth consent screen** — configure it if you haven't
   (User type "External" is fine; while it's in "Testing" only accounts listed
   under *Test users* can sign in, which is usually what you want first).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. **Authorized JavaScript origins** — add every origin the SPA is served from.
   Origins only: no path, no trailing slash.
   - `http://localhost:3000` — local dev (the Vite dev server port, see
     `frontend/vite.config.js`)
   - `https://pgait.up.railway.app` — production
6. **Authorized redirect URIs**: leave empty. Google Identity Services returns
   the credential to a JS callback (`google.accounts.id.initialize({ callback })`
   in `SocialAuth.js`), so no server redirect ever happens.
7. Copy the generated **Client ID** (ends in `.apps.googleusercontent.com`) into
   `.env` as `GOOGLE_CLIENT_ID`. The client *secret* is not used by this flow —
   leave it alone.

## Apple

Requires a paid Apple Developer account.

1. [Apple Developer](https://developer.apple.com/account) → **Certificates,
   Identifiers & Profiles → Identifiers**.
2. First create an **App ID** if you don't have one (Identifiers → `+` → App
   IDs), and enable the **Sign in with Apple** capability on it.
3. Now create the credential the web app actually uses: Identifiers → `+` →
   **Services IDs**. Give it a reverse-DNS identifier, e.g.
   `com.graniantichi.web`. **This identifier is the `APPLE_CLIENT_ID`** — not
   the App ID, and not the Team ID.
4. Enable **Sign in with Apple** on the Services ID → **Configure**:
   - *Primary App ID*: the App ID from step 2.
   - *Domains and Subdomains*: `pgait.up.railway.app`
   - *Return URLs*: `https://pgait.up.railway.app`
     This must match what the SDK sends. `SocialAuth.js` calls
     `AppleID.auth.init({ redirectURI: window.location.origin, usePopup: true })`,
     so the return URL is the **origin with no path** — and Apple validates it
     even in popup mode.
5. Copy the Services ID into `.env` as `APPLE_CLIENT_ID`.

> **Apple can't be tested on `localhost`.** Apple rejects `http://` and
> non-public domains for both Domains and Return URLs. To exercise it locally,
> put an HTTPS tunnel (e.g. `cloudflared tunnel --url http://localhost:3000`)
> in front of the dev server and register that hostname — or simply verify
> Apple in production and develop against Google locally.

---

## Where the credentials go

```bash
# .env at the repo root — gitignored, never committed.
GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
APPLE_CLIENT_ID=com.graniantichi.web
```

In production these are set as service variables (on Railway: the service's
**Variables** tab), not in a file. Neither value is a secret in the usual sense
— both are sent to the browser by design — but keep them out of git anyway so
environments stay independently configurable.

---

## Verifying it works (manual smoke test)

Automated coverage lives in `backend/__tests__/oauth.test.js` and
`oauthUnconfigured.test.js` (both fully mocked — they never call Google or
Apple). This checklist covers what tests can't: that your real credentials are
actually valid.

1. **Unconfigured baseline** — with neither id set, load `/login`. Expected: no
   social buttons, no console errors, and `GET /api/config/auth` returns
   `{"googleClientId":"","appleClientId":""}`.
2. **Button renders** — set `GOOGLE_CLIENT_ID`, restart the server, reload
   `/login`. Expected: Google's own rendered button appears. If it doesn't,
   check the browser console for a GSI origin error — that means the origin
   isn't in *Authorized JavaScript origins* (step 5).
3. **New account** — sign in with a Google account that has never used the
   site. Expected: redirected into the app as a logged-in user; a new
   `users` document exists with `authProvider: "google"` and one
   `socialAccounts` entry; the response set an `httpOnly` `refreshToken` cookie
   (DevTools → Application → Cookies).
4. **Linking** — register a normal password account with the *same* email as a
   Google account, then sign in with Google. Expected: you land in that same
   account (same `_id`), a `socialAccounts` entry is appended, and the original
   password still works on `/login`.
5. **Repeat login** — sign in with the same Google account again. Expected: the
   same user, no duplicate document.
6. **Failure modes are visible, not silent** — temporarily set
   `GOOGLE_CLIENT_ID` to a wrong-but-well-formed value and restart. Expected: a
   **401** (`Token Google non valido`) surfaced as a toast, because the token's
   `aud` no longer matches. Removing the var entirely instead yields **501**
   (`Google login non configurato`). Neither should ever appear as a generic
   500.
7. **Apple** — repeat 2–5 against the deployed HTTPS origin. On the *first*
   authorization only, Apple sends the user's name; confirm the created account
   uses it rather than the email local-part. Also confirm a
   `@privaterelay.appleid.com` ("Hide My Email") address is accepted — Apple
   marks those verified, and our check allows them.

## Notes

- The embeddable widget (`/order-pizza`) intentionally has **no** social login —
  it's guest-checkout only, and its endpoints use credential-less CORS which
  can't carry our refresh cookie. See the comment in
  `frontend/src/screens/PizzaOrderStandalone.js`.
- Accounts created before `socialAccounts` existed are migrated lazily: they're
  matched by email on the next social login and the linkage is backfilled then.
  No migration script is needed.
