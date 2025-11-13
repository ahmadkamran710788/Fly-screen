"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/DashboardHeader";
import OrderFilters, { FilterState } from "@/components/OrderFilters";
import OrderTable from "@/components/OrderTable";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import { differenceInDays } from "date-fns";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function getOrders(page: number = 1, limit: number = 10) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const response = await fetch(
    `${baseUrl}/api/orders?page=${page}&limit=${limit}&sortField=createdAt&sortDirection=desc`,
    { cache: "no-store" }
  );

  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
}

export default function Page() {
  const { role } = useAuth();
  const { toast } = useToast();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch Orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await getOrders(page, limit);
        const docs = data.orders || [];

        setTotalPages(data.pagination.totalPages);
        setHasNextPage(data.pagination.hasNextPage);
        setHasPrevPage(data.pagination.hasPrevPage);
        setTotalCount(data.pagination.totalCount);

        const mapped: Order[] = docs.map((o: any) => ({
          id:
            (o?._id &&
              (typeof o._id === "string" ? o._id : o._id.toString())) ||
            String(o.shopifyId),
          orderNumber: String(o.name || o.shopifyId || "").replace(/^#/, ""),
          orderDate: o.processedAt
            ? new Date(o.processedAt)
            : new Date(o.createdAt || Date.now()),
          store: `.${o.storeKey || "nl"}` as any,
          items: (o.lineItems || []).map((li: any, idx: number) => ({
            id: String(li.id || `${o.shopifyId}-${idx + 1}`),
            width: 0,
            height: 0,
            profileColor: "",
            orientation: "",
            installationType: "",
            thresholdType: "",
            meshType: "",
            curtainType: "",
            fabricColor: "",
            closureType: "",
            mountingType: "",
            frameCutComplete: false,
            meshCutComplete: false,
            status: "Pending",
          })),
          boxes: [],
        }));

        setAllOrders(mapped);
        setFilteredOrders(mapped);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [page, limit]);

  const getDeadline = (orderDate: Date) => {
    const deadline = new Date(orderDate);
    deadline.setDate(deadline.getDate() + 3);
    return deadline;
  };

  const handleFilterChange = (filters: FilterState) => {
    let filtered = [...allOrders];

    if (filters.orderNumber) {
      filtered = filtered.filter((order) =>
        order.orderNumber
          .toLowerCase()
          .includes(filters.orderNumber.toLowerCase())
      );
    }

    if (filters.stores.length > 0) {
      filtered = filtered.filter((order) =>
        filters.stores.includes(order.store)
      );
    }

    if (filters.statuses.length > 0) {
      filtered = filtered.filter((order) =>
        order.items.some((item) => filters.statuses.includes(item.status))
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((order) => order.orderDate >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => order.orderDate <= toDate);
    }

    if (filters.deadlineStatus !== "all") {
      const today = new Date();
      filtered = filtered.filter((order) => {
        const deadline = getDeadline(order.orderDate);
        const daysLeft = differenceInDays(deadline, today);

        switch (filters.deadlineStatus) {
          case "overdue":
            return daysLeft < 0;
          case "today":
            return daysLeft === 0;
          case "week":
            return daysLeft >= 0 && daysLeft <= 7;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  };

  const handleExport = (format: "excel" | "pdf") => {
    toast({
      title: "Coming Soon",
      description: `Export functionality for ${format.toUpperCase()} format will be available soon.`,
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1); // reset to first page when changing limit
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Orders Overview
            </h2>
            <p className="text-muted-foreground">
              Manage and track all manufacturing orders
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("excel")}
              variant="outline"
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button
              onClick={() => handleExport("pdf")}
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <OrderFilters onFilterChange={handleFilterChange} />

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <OrderTable orders={filteredOrders} />
          </div>
        </Suspense>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <select
              value={limit}
              onChange={handleLimitChange}
              className="border rounded-md px-2 py-1 text-sm bg-background"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={!hasPrevPage || loading}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({totalCount} orders)
            </span>

            <Button
              variant="outline"
              disabled={!hasNextPage || loading}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
