// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/DashboardHeader";
import OrderFilters, { FilterState } from "@/components/OrderFilters";
import OrderTable from "@/components/OrderTable";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import { differenceInDays } from "date-fns";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Page() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  // NO redirect logic - middleware handles it

  useEffect(() => {
    // Load orders from API (Mongo) and adapt to UI Order shape
    const load = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = await res.json();

        // Handle API response structure { success: true, orders: [...] }
        const docs = data.orders || [];

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
      } catch (e) {
        console.error("Failed to load orders:", e);
      }
    };
    load();
  }, []);

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

        <OrderTable orders={filteredOrders} />
      </main>
    </div>
  );
}
