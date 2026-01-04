"use client";

import Link from "next/link";
import { Order } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { formatDateGMT1 } from "@/lib/timezone";

interface OrderTableProps {
  orders: Order[];
  role: string | null;
}

// Using centralized formatDateGMT1 from timezone utility
// Date is already in GMT+1 from the dashboard mapping (isAlreadyGMT1 = true)

const OrderTable = ({ orders, role }: OrderTableProps) => {
  const getDeadline = (orderDate: Date) => {
    const deadline = new Date(orderDate);
    deadline.setDate(deadline.getDate() + 3); // Add 3 days to order date
    return deadline;
  };

  const getETA = (orderDate: Date) => {
    const eta = new Date(orderDate);
    eta.setDate(eta.getDate() + 9); // Order Date + 3 (Delivery) + 6 = 9 days
    return eta;
  };

  const getDeadlineStatus = (orderDate: Date) => {
    // Use UTC to avoid timezone issues - extract date parts in UTC
    const orderYear = orderDate.getUTCFullYear();
    const orderMonth = orderDate.getUTCMonth();
    const orderDay = orderDate.getUTCDate();

    // Create order date at UTC midnight
    const orderDateOnly = new Date(
      Date.UTC(orderYear, orderMonth, orderDay, 0, 0, 0, 0)
    );

    // Calculate delivery date (order date + 3 days) at UTC midnight
    const deliveryDateOnly = new Date(
      Date.UTC(orderYear, orderMonth, orderDay + 3, 0, 0, 0, 0)
    );

    // Calculate the difference between delivery and order date (always 3 days)

    // Get today in UTC at midnight
    const now = new Date();
    const today = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );
    const totalDays = Math.round(
      (deliveryDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    // Check status based on today
    if (deliveryDateOnly.getTime() < today.getTime()) {
      const daysOverdue = Math.round(
        (today.getTime() - deliveryDateOnly.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        text: `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`,
        variant: "destructive" as const,
      };
    } else if (deliveryDateOnly.getTime() === today.getTime()) {
      return {
        text: "Due today",
        variant: "outline" as const,
      };
    } else {
      return {
        text: `Upcoming ${totalDays} day${totalDays !== 1 ? "s" : ""}`,
        variant: "secondary" as const,
      };
    }
  };

  const getOverallStatus = (order: Order) => {
    // Check if all items are completely finished (all 5 stages are Complete)
    const allPacked = order.items?.every(
      (item) =>
        item.frameCuttingStatus === "Complete" &&
        item.meshCuttingStatus === "Complete" &&
        item.qualityStatus === "Complete" &&
        item.assemblyStatus === "Complete" &&
        item.packagingStatus === "Complete"
    );

    // Check if all items are still pending (all 5 statuses are pending)
    const allPending = order.items?.every(
      (item) =>
        item.frameCuttingStatus === "Pending" &&
        item.meshCuttingStatus === "Pending" &&
        item.qualityStatus === "Pending" &&
        item.assemblyStatus === "Pending" &&
        item.packagingStatus === "Pending"
    );

    if (allPacked) {
      if (order.shippingStatus === "In Transit") {
        return { text: "Completed", variant: "default" as const };
      }
      return { text: "In Progress", variant: "outline" as const };
    }
    if (allPending) return { text: "Pending", variant: "secondary" as const };
    return { text: "In Progress", variant: "outline" as const };
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Delivery Date</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Boxes</TableHead>
            {(role === "Admin" || role === "Shipping") && (
              <TableHead>Total Weight (kg)</TableHead>
            )}
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={role === "Admin" || role === "Shipping" ? 12 : 11}
                className="text-center py-8 text-muted-foreground"
              >
                No orders found
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => {
              const status = getOverallStatus(order);
              const orderDate = new Date(
                (order as any).orderDate ??
                (order as any).createdAt ??
                Date.now()
              );
              const deliveryDate = getDeadline(orderDate);
              const eta = getETA(orderDate);
              const deadline = getDeadlineStatus(orderDate);
              const itemCount =
                order.items?.length ?? (order as any).lineItems?.length ?? 0;
              const customerName = [order.firstName, order.lastName].filter(Boolean).join(" ") || String((order as any).customer?.firstName || (order as any).customer?.first_name || (order as any).shippingAddress?.first_name || "-") + " " + String((order as any).customer?.lastName || (order as any).customer?.last_name || (order as any).shippingAddress?.last_name || "");

              return (
                <TableRow key={order.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    {customerName.trim() === "-" ? "-" : customerName}
                  </TableCell>
                  <TableCell>{formatDateGMT1(orderDate)}</TableCell>
                  <TableCell>{formatDateGMT1(deliveryDate)}</TableCell>
                  <TableCell>{formatDateGMT1(eta)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {order.store || (order as any).storeKey}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </TableCell>
                  <TableCell>
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={deadline.variant}>{deadline.text}</Badge>
                  </TableCell>
                  <TableCell>
                    {order.boxes && order.boxes.length > 0 ? (
                      <Badge variant="outline">{order.boxes.length} Box{order.boxes.length !== 1 ? 'es' : ''}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {(role === "Admin" || role === "Shipping") && (
                    <TableCell className="font-medium">
                      {order.boxes && order.boxes.length > 0
                        ? order.boxes
                          .reduce((acc, box) => acc + (box.weight || 0), 0)
                          .toFixed(2)
                        : "0.00"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      asChild
                    >
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderTable;
