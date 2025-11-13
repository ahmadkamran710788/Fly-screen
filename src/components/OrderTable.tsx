// ============================================
// FILE 3: src/components/OrderTable.tsx
// ============================================
"use client";

import { useState } from "react";
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
import { Eye, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

interface OrderTableProps {
  orders: Order[];
}

type SortField = "orderNumber" | "createdAt" | "storeKey" | "status";
type SortDirection = "asc" | "desc";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const OrderTable = ({ orders: initialOrders }: OrderTableProps) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: Math.ceil(initialOrders.length / 10),
    totalCount: initialOrders.length,
    limit: 10,
    hasNextPage: initialOrders.length > 10,
    hasPrevPage: false,
  });

  const fetchOrders = async (
    page: number,
    sort: SortField,
    direction: SortDirection
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/orders?page=${page}&limit=${pagination.limit}&sortField=${sort}&sortDirection=${direction}`
      );
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setPagination(data.pagination);
        setCurrentPage(data.pagination.currentPage);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    const newDirection =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    fetchOrders(1, field, newDirection);
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page, sortField, sortDirection);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDeadline = (orderDate: Date) => {
    const deadline = new Date(orderDate);
    deadline.setDate(deadline.getDate());
    return deadline;
  };

  const getDeadlineStatus = (orderDate: Date) => {
    const deadline = getDeadline(orderDate);
    const today = new Date();
    const daysLeft = differenceInDays(deadline, today);

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const { totalPages } = pagination;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const startIndex = (currentPage - 1) * pagination.limit;
  const endIndex = Math.min(
    startIndex + pagination.limit,
    pagination.totalCount
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Order Date</TableHead>
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
                  colSpan={7}
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
                const deadline = getDeadlineStatus(orderDate);
                const itemCount =
                  order.items?.length ?? (order as any).lineItems?.length ?? 0;

                return (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{format(orderDate, "dd/MM/yyyy")}</TableCell>
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

      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {endIndex} of {pagination.totalCount}{" "}
            orders
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    disabled={loading}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;
