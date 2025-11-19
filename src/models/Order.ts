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

// Middleware to automatically calculate and update order status based on line items
OrderSchema.pre("save", function (next) {
  if (this.lineItems && this.lineItems.length > 0) {
    // Check if all items have qualityStatus === "Packed"
    const allPacked = this.lineItems.every((item) => item.qualityStatus === "Packed");

    // Check if all items are still pending (all 3 statuses are pending)
    const allPending = this.lineItems.every(
      (item) =>
        item.frameCuttingStatus === "Pending" &&
        item.meshCuttingStatus === "Pending" &&
        item.qualityStatus === "Pending"
    );

    // Update the order status accordingly
    if (allPacked) {
      this.status = "Completed";
    } else if (allPending) {
      this.status = "Pending";
    } else {
      this.status = "In Progress";
    }
  }
  next();
});

// Also update status on findOneAndUpdate operations
OrderSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;

  // Only proceed if lineItems are being updated
  if (update && update.lineItems && update.lineItems.length > 0) {
    // Check if all items have qualityStatus === "Packed"
    const allPacked = update.lineItems.every((item: any) => item.qualityStatus === "Packed");

    // Check if all items are still pending (all 3 statuses are pending)
    const allPending = update.lineItems.every(
      (item: any) =>
        item.frameCuttingStatus === "Pending" &&
        item.meshCuttingStatus === "Pending" &&
        item.qualityStatus === "Pending"
    );

    // Update the order status accordingly
    if (allPacked) {
      update.status = "Completed";
    } else if (allPending) {
      update.status = "Pending";
    } else {
      update.status = "In Progress";
    }
  }

  next();
});

// / Compound indexes for common query patterns
OrderSchema.index({ createdAt: -1 }); // For sorting by date (descending)
OrderSchema.index({ status: 1, createdAt: -1 }); // For filtering by status + sorting
OrderSchema.index({ storeKey: 1, createdAt: -1 }); // For filtering by store + sorting

export type Order = InferSchemaType<typeof OrderSchema>;

export const OrderModel: Model<Order> =
  mongoose.models.Order || mongoose.model<Order>("Order", OrderSchema);
