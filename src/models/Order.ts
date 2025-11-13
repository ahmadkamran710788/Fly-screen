import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const OrderSchema = new Schema(
  {
    storeKey: { type: String, required: true, index: true },
    shopifyId: { type: String, required: true, unique: true },
    name: { type: String, index: true }, // e.g. #1001
    email: String,
    phone: String,
    note: String,
    financialStatus: String,
    fulfillmentStatus: String,
    currency: String,
    totalPrice: String,
    subtotalPrice: String,
    totalDiscounts: String,
    totalTax: String,
    customer: {
      id: String,
      email: String,
      firstName: String,
      lastName: String,
      phone: String,
      tags: [String],
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    lineItems: [
      {
        id: String,
        productId: String,
        variantId: String,
        title: String,
        variantTitle: String,
        quantity: Number,
        price: String,
        sku: String,
        // Three separate statuses per item
        frameCuttingStatus: {
          type: String,
          enum: ["Pending", "Ready to Package"],
          default: "Pending",
        },
        meshCuttingStatus: {
          type: String,
          enum: ["Pending", "Ready to Package"],
          default: "Pending",
        },
        qualityStatus: {
          type: String,
          enum: ["Pending", "Ready to Package", "Packed"],
          default: "Pending",
        },
      },
    ],
    boxes: [
      {
        id: String,
        length: Number,
        width: Number,
        height: Number,
        weight: Number,
        items: [String], // Array of item IDs in this box
        createdAt: { type: Date, default: Date.now },
      },
    ],
    shippingAddress: Schema.Types.Mixed,
    billingAddress: Schema.Types.Mixed,
    raw: { type: Schema.Types.Mixed },
    processedAt: Date,
    cancelledAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

// / Compound indexes for common query patterns
OrderSchema.index({ createdAt: -1 }); // For sorting by date (descending)
OrderSchema.index({ status: 1, createdAt: -1 }); // For filtering by status + sorting
OrderSchema.index({ storeKey: 1, createdAt: -1 }); // For filtering by store + sorting

export type Order = InferSchemaType<typeof OrderSchema>;

export const OrderModel: Model<Order> =
  mongoose.models.Order || mongoose.model<Order>("Order", OrderSchema);
