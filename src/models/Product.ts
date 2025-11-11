import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const ProductSchema = new Schema(
  {
    storeKey: { type: String, required: true, index: true }, // e.g., nl, de, uk, fr, dk
    shopifyId: { type: String, required: true, unique: true },
    handle: { type: String, index: true },
    title: { type: String, required: true },
    status: { type: String },
    productType: { type: String },
    vendor: { type: String },
    tags: [{ type: String }],
    images: [
      {
        id: String,
        src: String,
        alt: String,
      },
    ],
    variants: [
      {
        id: String,
        title: String,
        sku: String,
        price: String,
        compareAtPrice: String,
        available: Boolean,
        inventoryQuantity: Number,
        option1: String,
        option2: String,
        option3: String,
      },
    ],
    options: [
      {
        id: String,
        name: String,
        values: [String],
      },
    ],
    raw: { type: Schema.Types.Mixed }, // full Shopify payload for debugging
  },
  { timestamps: true },
);

export type Product = InferSchemaType<typeof ProductSchema>;

export const ProductModel: Model<Product> =
  mongoose.models.Product || mongoose.model<Product>("Product", ProductSchema);


