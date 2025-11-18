"use client";

import Link from "next/link";
import { Order } from "@/types/order";
import { format, differenceInDays } from "date-fns";
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

interface OrderTableProps {
  orders: Order[];
}

const OrderTable = ({ orders }: OrderTableProps) => {
  const getDeadline = (orderDate: Date) => {
    const deadline = new Date(orderDate);
    deadline.setDate(deadline.getDate() + 3); // Add 3 days to order date
    return deadline;
  };

  const getDeadlineStatus = (orderDate: Date) => {
    const deadline = getDeadline(orderDate);
    // Normalize both dates to midnight for accurate calendar day comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineNormalized = new Date(deadline);
    deadlineNormalized.setHours(0, 0, 0, 0);
    const daysLeft = differenceInDays(deadlineNormalized, today);

    if (daysLeft < 0) {
      return {
        text: `Overdue by ${Math.abs(daysLeft)} day${
          Math.abs(daysLeft) !== 1 ? "s" : ""
        }`,
        variant: "destructive" as const,
      };
    } else if (daysLeft === 0) {
      return {
        text: "Due today",
        variant: "outline" as const,
      };
    } else {
      return {
        text: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`,
        variant: "secondary" as const,
      };
    }
  };

  const getOverallStatus = (order: Order) => {
    // Check if all items have qualityStatus === "Packed"
    const allPacked = order.items?.every((item) => item.qualityStatus === "Packed");

    // Check if all items are still pending (all 3 statuses are pending)
    const allPending = order.items?.every(
      (item) =>
        item.frameCuttingStatus === "Pending" &&
        item.meshCuttingStatus === "Pending" &&
        item.qualityStatus === "Pending"
    );

    if (allPacked) return { text: "Completed", variant: "default" as const };
    if (allPending) return { text: "Pending", variant: "secondary" as const };
    return { text: "In Progress", variant: "outline" as const };
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Delivery Date</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
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
              const deadline = getDeadlineStatus(orderDate);
              const itemCount =
                order.items?.length ?? (order as any).lineItems?.length ?? 0;

              return (
                <TableRow key={order.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>{format(orderDate, "dd/MM/yyyy")}</TableCell>
                  <TableCell>{format(deliveryDate, "dd/MM/yyyy")}</TableCell>
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
