import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// One linked OAuth identity. Separate sub-schema (no _id) so a user can carry
// several — e.g. a password login PLUS Google PLUS Apple on one account.
const socialAccountSchema = mongoose.Schema(
  {
    provider: { type: String, enum: ["google", "apple"], required: true },
    providerId: { type: String, required: true },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    // How the account was ORIGINALLY created. "local" = email+password;
    // "google"/"apple" = created via OAuth (with a random unusable password).
    //
    // ⚠ This is NOT the source of truth for "which providers can log into this
    // account" — that's `socialAccounts` below. An account can have both a
    // password and one or more linked providers; a single enum can't express
    // that. Kept as-is for back-compat with existing documents.
    authProvider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },
    // Linked OAuth identities. `providerId` is the provider's own stable
    // subject id (`sub`), which — unlike email — survives the user changing
    // their address with Google/Apple, so it's the primary lookup key.
    //
    // Migration: documents created before this field existed simply have an
    // empty array. They're matched by email on their next social login, at
    // which point the linkage is backfilled (see findOrCreateOAuthUser in
    // controllers/userController.js) — no migration script needed, and the
    // user sees no difference.
    socialAccounts: { type: [socialAccountSchema], default: [] },
    // sha256 of the user's current refresh token — enables rotation & revocation.
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function () {
  // Only (re)hash when the password actually changed. The original callback-style
  // hook both (a) missed a `return` after next() — re-hashing an already-hashed
  // password on profile updates — and (b) is incompatible with Mongoose 9, which
  // drives async hooks by the returned promise and passes no `next`.
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
