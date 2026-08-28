import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

// ⚠ Plain process.env assignments only at module top level — importing any app
// module here would load (and freeze) config/env.js before startTestApp() can
// point MONGO_URI at the in-memory server. See helpers/setup.js.
//
// Both provider ids must be set BEFORE env.js is parsed: oauth.service.js
// builds its OAuth2Client at module-load time from env.GOOGLE_CLIENT_ID, and
// *Configured() reads the same frozen env. The unconfigured (501) case can't
// be expressed in this process and lives in oauthUnconfigured.test.js.
process.env.GOOGLE_CLIENT_ID = "test-google-client.apps.googleusercontent.com";
process.env.APPLE_CLIENT_ID = "com.graniantichi.web";

let app, mongo, User, OAuth2Client, appleSignin, verifyGoogleToken, verifyAppleToken;
let realGoogleVerify, realAppleVerify;

// The libraries are never allowed to hit the network in tests. Google's client
// calls `this.verifyIdToken(...)` on an instance built at module load, so the
// prototype method is the seam; apple-signin-auth exposes a plain object whose
// property we can swap. Both are restored in after().
const mockGoogle = (payload) => {
  OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => payload });
};
const mockGoogleInvalid = () => {
  OAuth2Client.prototype.verifyIdToken = async () => {
    throw new Error("Invalid token signature");
  };
};
const mockApple = (payload) => {
  appleSignin.verifyIdToken = async () => payload;
};
const mockAppleInvalid = () => {
  appleSignin.verifyIdToken = async () => {
    throw new Error("jwt malformed");
  };
};

const googlePayload = (over = {}) => ({
  sub: "google-sub-1",
  email: "Nuovo@Example.com",
  email_verified: true,
  name: "Nuovo Cliente",
  ...over,
});
// Apple sends email_verified as a STRING in most token versions.
const applePayload = (over = {}) => ({
  sub: "apple-sub-1",
  email: "apple-user@privaterelay.appleid.com",
  email_verified: "true",
  ...over,
});

before(async () => {
  const { startTestApp } = await import("./helpers/setup.js");
  ({ app, mongo } = await startTestApp());
  ({ default: User } = await import("../models/userModel.js"));
  ({ OAuth2Client } = await import("google-auth-library"));
  ({ default: appleSignin } = await import("apple-signin-auth"));
  ({ verifyGoogleToken, verifyAppleToken } =
    await import("../services/oauth.service.js"));
  realGoogleVerify = OAuth2Client.prototype.verifyIdToken;
  realAppleVerify = appleSignin.verifyIdToken;
});

after(async () => {
  OAuth2Client.prototype.verifyIdToken = realGoogleVerify;
  appleSignin.verifyIdToken = realAppleVerify;
  const { stopTestApp } = await import("./helpers/setup.js");
  await stopTestApp(mongo);
});

describe("oauth.service — Google token verification", () => {
  test("rejects an invalid token with 401", async () => {
    mockGoogleInvalid();
    await assert.rejects(verifyGoogleToken("bad"), (e) => e.statusCode === 401);
  });

  test("rejects a token with no email with 401", async () => {
    mockGoogle(googlePayload({ email: undefined }));
    await assert.rejects(verifyGoogleToken("t"), (e) => e.statusCode === 401);
  });

  test("rejects an unverified email with 401", async () => {
    mockGoogle(googlePayload({ email_verified: false }));
    await assert.rejects(verifyGoogleToken("t"), (e) => e.statusCode === 401);
  });

  test("normalizes a valid token (lowercased email, sub as providerId)", async () => {
    mockGoogle(googlePayload());
    assert.deepEqual(await verifyGoogleToken("t"), {
      provider: "google",
      providerId: "google-sub-1",
      email: "nuovo@example.com",
      name: "Nuovo Cliente",
    });
  });

  test("falls back to the email local-part when the payload has no name", async () => {
    mockGoogle(googlePayload({ name: undefined }));
    const id = await verifyGoogleToken("t");
    // The email is normalized to lowercase for lookup, but the display name
    // keeps the address's original capitalization.
    assert.equal(id.name, "Nuovo");
    assert.equal(id.email, "nuovo@example.com");
  });
});

describe("oauth.service — Apple token verification", () => {
  test("rejects an invalid token with 401", async () => {
    mockAppleInvalid();
    await assert.rejects(verifyAppleToken("bad"), (e) => e.statusCode === 401);
  });

  test("rejects a token with no email with 401", async () => {
    mockApple(applePayload({ email: undefined }));
    await assert.rejects(verifyAppleToken("t"), (e) => e.statusCode === 401);
  });

  // Regression test for the gap this task closed: Apple's verification used to
  // check only that an email was present, unlike Google's.
  test('rejects an unverified email — string "false" — with 401', async () => {
    mockApple(applePayload({ email_verified: "false" }));
    await assert.rejects(verifyAppleToken("t"), (e) => e.statusCode === 401);
  });

  test("rejects an unverified email — boolean false — with 401", async () => {
    mockApple(applePayload({ email_verified: false }));
    await assert.rejects(verifyAppleToken("t"), (e) => e.statusCode === 401);
  });

  test("rejects a token with the claim absent entirely with 401", async () => {
    mockApple(applePayload({ email_verified: undefined }));
    await assert.rejects(verifyAppleToken("t"), (e) => e.statusCode === 401);
  });

  test("accepts both the string and boolean forms of a verified email", async () => {
    mockApple(applePayload({ email_verified: "true" }));
    assert.equal((await verifyAppleToken("t")).provider, "apple");
    mockApple(applePayload({ email_verified: true }));
    assert.equal((await verifyAppleToken("t")).provider, "apple");
  });

  test("uses fallbackName on first authorization, email local-part afterwards", async () => {
    mockApple(applePayload());
    assert.equal((await verifyAppleToken("t", "Prima Volta")).name, "Prima Volta");
    // Apple omits the name on every subsequent authorization.
    assert.equal((await verifyAppleToken("t")).name, "apple-user");
  });
});

describe("POST /api/users/google + /apple — input validation", () => {
  test("missing credential → 400", async () => {
    const res = await request(app).post("/api/users/google").send({});
    assert.equal(res.status, 400);
  });

  test("missing identityToken → 400", async () => {
    const res = await request(app).post("/api/users/apple").send({});
    assert.equal(res.status, 400);
  });

  test("an invalid credential surfaces as 401, not 500", async () => {
    mockGoogleInvalid();
    const res = await request(app)
      .post("/api/users/google")
      .send({ credential: "bad" });
    assert.equal(res.status, 401);
  });
});

describe("social login — account creation, linking and reuse", () => {
  test("a brand-new email creates a user with the provider linked, and sets the refresh cookie", async () => {
    mockGoogle(googlePayload({ sub: "sub-new", email: "brand-new@example.com" }));
    const res = await request(app).post("/api/users/google").send({ credential: "t" });

    assert.equal(res.status, 200);
    assert.ok(res.body.token, "expected an access token");
    assert.equal(res.body.email, "brand-new@example.com");
    // Same session contract as password login (see auth.test.js).
    const cookie = res.headers["set-cookie"]?.[0] || "";
    assert.match(cookie, /refreshToken=/);
    assert.match(cookie, /HttpOnly/i);

    const user = await User.findOne({ email: "brand-new@example.com" });
    assert.equal(user.authProvider, "google");
    assert.deepEqual(
      user.socialAccounts.map((a) => [a.provider, a.providerId]),
      [["google", "sub-new"]]
    );
  });

  test("an existing LOCAL password account is logged into and linked, leaving its password intact", async () => {
    const registered = await request(app)
      .post("/api/users")
      .send({ name: "Locale", email: "locale@example.com", password: "pizza123" });
    assert.equal(registered.status, 201);
    const before = await User.findOne({ email: "locale@example.com" });

    mockGoogle(googlePayload({ sub: "sub-link", email: "locale@example.com" }));
    const res = await request(app).post("/api/users/google").send({ credential: "t" });
    assert.equal(res.status, 200);
    assert.equal(
      String(res.body._id),
      String(before._id),
      "must reuse the existing account"
    );

    const after = await User.findOne({ email: "locale@example.com" });
    assert.deepEqual(
      after.socialAccounts.map((a) => [a.provider, a.providerId]),
      [["google", "sub-link"]],
      "the provider linkage should be recorded, not just silently allowed"
    );
    // Untouched: the local password still works, and the origin marker stands.
    assert.equal(after.password, before.password);
    assert.equal(after.authProvider, "local");
    const stillLocal = await request(app)
      .post("/api/users/login")
      .send({ email: "locale@example.com", password: "pizza123" });
    assert.equal(stillLocal.status, 200);
  });

  test("a second login with the same provider id reuses the account without duplicating it", async () => {
    mockGoogle(googlePayload({ sub: "sub-repeat", email: "repeat@example.com" }));
    const first = await request(app)
      .post("/api/users/google")
      .send({ credential: "t" });
    const second = await request(app)
      .post("/api/users/google")
      .send({ credential: "t" });

    assert.equal(String(first.body._id), String(second.body._id));
    assert.equal(await User.countDocuments({ email: "repeat@example.com" }), 1);
    const user = await User.findOne({ email: "repeat@example.com" });
    assert.equal(user.socialAccounts.length, 1, "linkage must not be appended twice");
  });

  test("the provider id — not the email — identifies the account when the email changes", async () => {
    mockGoogle(googlePayload({ sub: "sub-stable", email: "old-address@example.com" }));
    const first = await request(app)
      .post("/api/users/google")
      .send({ credential: "t" });

    // Same Google account, new email at the provider: must resolve to the same
    // user rather than silently creating a second one.
    mockGoogle(googlePayload({ sub: "sub-stable", email: "new-address@example.com" }));
    const second = await request(app)
      .post("/api/users/google")
      .send({ credential: "t" });

    assert.equal(String(first.body._id), String(second.body._id));
    assert.equal(await User.countDocuments({ email: "new-address@example.com" }), 0);
  });

  test("Apple logins link independently, so one account can carry both providers", async () => {
    mockGoogle(googlePayload({ sub: "sub-both", email: "both@example.com" }));
    await request(app).post("/api/users/google").send({ credential: "t" });

    mockApple(applePayload({ sub: "apple-both", email: "both@example.com" }));
    const res = await request(app)
      .post("/api/users/apple")
      .send({ identityToken: "t", name: "Due Provider" });
    assert.equal(res.status, 200);

    const user = await User.findOne({ email: "both@example.com" });
    assert.deepEqual(user.socialAccounts.map((a) => a.provider).sort(), [
      "apple",
      "google",
    ]);
  });

  test("an account created before socialAccounts existed is backfilled on next login", async () => {
    // Simulate a legacy document: authProvider set, socialAccounts absent.
    await User.collection.insertOne({
      name: "Legacy",
      email: "legacy@example.com",
      password: "unusable",
      isAdmin: false,
      authProvider: "google",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockGoogle(googlePayload({ sub: "sub-legacy", email: "legacy@example.com" }));
    const res = await request(app).post("/api/users/google").send({ credential: "t" });
    assert.equal(res.status, 200);

    const user = await User.findOne({ email: "legacy@example.com" });
    assert.deepEqual(
      user.socialAccounts.map((a) => [a.provider, a.providerId]),
      [["google", "sub-legacy"]],
      "the legacy account should be linked in place, not duplicated"
    );
    assert.equal(await User.countDocuments({ email: "legacy@example.com" }), 1);
  });
});
