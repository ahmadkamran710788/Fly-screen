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
          enum: ["Pending", "Complete"],
          default: "Pending",
        },
        meshCuttingStatus: {
          type: String,
          enum: ["Pending", "Complete"],
          default: "Pending",
        },
        qualityStatus: {
          type: String,
          enum: ["Pending", "Complete"],
          default: "Pending",
        },
        packagingStatus: {
          type: String,
          enum: ["Pending", "Complete"],
          default: "Pending",
        },
        assemblyStatus: {
          type: String,
          enum: ["Pending", "Complete"],
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
    shippingStatus: {
      type: String,
      enum: ["Pending", "Packed", "In Transit"],
      default: "Pending",
    },
    totalWeight: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Middleware to automatically calculate and update order status based on line items
OrderSchema.pre("save", function (next) {
  if (this.lineItems && this.lineItems.length > 0) {
    // Check if all items are completely finished (all statuses are Complete)
    const allPacked = this.lineItems.every(
      (item) =>
        item.frameCuttingStatus === "Complete" &&
        item.meshCuttingStatus === "Complete" &&
        item.qualityStatus === "Complete" &&
        item.assemblyStatus === "Complete" &&
        item.packagingStatus === "Complete"
    );

    // Check if all items are still pending (all statuses are pending)
    const allPending = this.lineItems.every(
      (item) =>
        item.frameCuttingStatus === "Pending" &&
        item.meshCuttingStatus === "Pending" &&
        item.qualityStatus === "Pending" &&
        item.assemblyStatus === "Pending" &&
        item.packagingStatus === "Pending"
    );

    // Update the order status accordingly
    if (allPacked) {
      // Auto-update shipping status to Packed if it is currently Pending
      if (this.shippingStatus === "Pending") {
        this.shippingStatus = "Packed";
      }

      // Overall status is only Completed if Shipping is In Transit
      if (this.shippingStatus === "In Transit") {
        this.status = "Completed";
      } else {
        this.status = "In Progress";
      }
    } else if (allPending) {
      this.status = "Pending";
    } else {
      this.status = "In Progress";
    }

    // Calculate total weight
    if (this.boxes && this.boxes.length > 0) {
      this.totalWeight = this.boxes.reduce(
        (acc: number, box: any) => acc + (box.weight || 0),
        0
      );
    } else {
      this.totalWeight = 0;
    }
  }
  next();
});

// Also update status on findOneAndUpdate operations
OrderSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;

  // We can't easily check 'allPacked' here without fetching the doc, 
  // but if we are updating shippingStatus to 'In Transit', we should set status to Completed.

  if (update) {
    // Handle shipping status updates
    if (update.$set && update.$set.shippingStatus) {
      if (update.$set.shippingStatus === "In Transit") {
        update.$set.status = "Completed";
      } else if (update.$set.shippingStatus === "Packed" || update.$set.shippingStatus === "Pending") {
        // If reverting from In Transit, usually revert to In Progress (unless we check items, which is hard here)
        // Ideally we trust the save hook logic more, which is why api/orders/[id] should use save().
        // But valid effort:
        if (update.$set.status === "Completed") {
          update.$set.status = "In Progress";
        }
      }
    }

    // Logic for item updates is complex here without full document context. 
    // We will rely on route handlers using save() or findOne() which triggers save() middleware 
    // for complex state transitions.
  }

  next();
});

// / Compound indexes for common query patterns
OrderSchema.index({ createdAt: -1 }); // For sorting by date (descending)
OrderSchema.index({ status: 1, createdAt: -1 }); // For filtering by status + sorting
OrderSchema.index({ storeKey: 1, createdAt: -1 }); // For filtering by store + sorting

export type Order = InferSchemaType<typeof OrderSchema>;

// In development, delete the model from cache to ensure schema changes are picked up
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Order;
}

export const OrderModel: Model<Order> =
  mongoose.models.Order || mongoose.model<Order>("Order", OrderSchema);
