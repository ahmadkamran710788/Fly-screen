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
    status: { type: String, default: "Pending" },
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

export type Order = InferSchemaType<typeof OrderSchema>;

export const OrderModel: Model<Order> =
  mongoose.models.Order || mongoose.model<Order>("Order", OrderSchema);
