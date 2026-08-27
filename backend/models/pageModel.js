import mongoose from "mongoose";

// CMS page authored in the admin Pages module (block-based page builder).
// `blocks` is an ordered, heterogeneous list — each block carries its own
// `type` plus a free-form `data` payload, so the schema stays open to the
// block registry evolving on the frontend without migrations.
const blockSchema = mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const seoSchema = mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    keywords: { type: String, default: "" },
    canonical: { type: String, default: "" },
    ogImage: { type: String, default: "" },
  },
  { _id: false }
);

const pageSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, default: "Pagina senza titolo" },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    visibility: {
      type: String,
      enum: ["public", "private", "scheduled"],
      default: "public",
    },
    publishDate: { type: Date, default: null },
    featuredImage: { type: String, default: "" },
    blocks: { type: [blockSchema], default: [] },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true }
);

pageSchema.index({ status: 1, updatedAt: -1 });

const Page = mongoose.model("Page", pageSchema);

export default Page;
