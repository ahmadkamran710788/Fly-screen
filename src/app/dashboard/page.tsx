"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/DashboardHeader";
import OrderFilters, { FilterState } from "@/components/OrderFilters";
import OrderTable from "@/components/OrderTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Order } from "@/types/order";
import { differenceInDays } from "date-fns";
import { FileSpreadsheet, FileText, Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  exportAdminToExcel,
  exportFrameToExcel,
  exportMeshToExcel,
  exportQualityToExcel,
  exportPackingToExcel,
} from "@/lib/exportToExcel";
import {
  exportAdminToPDF,
  exportFrameToPDF,
  exportMeshToPDF,
  exportQualityToPDF,
  exportAllOrdersToPDF,
  exportFrameCuttingOnlyToPDF,
  exportMeshCuttingOnlyToPDF,
  exportPackingToPDF,
} from "@/lib/exportToPDF";
import { mapOrders } from "@/lib/orderMapper";

async function getOrders(
  page: number = 1,
  limit: number = 10,
  filters?: FilterState
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Build query string with filters
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortField: "createdAt",
    sortDirection: "desc",
  });

  // Add filter parameters
  if (filters?.orderNumber) {
    params.append("orderNumber", filters.orderNumber);
  }
  // Only apply store filter if not searching by order number
  if (filters?.stores && filters.stores.length > 0 && !filters?.orderNumber) {
    params.append("stores", filters.stores.join(","));
  }
  if (filters?.statuses && filters.statuses.length > 0) {
    params.append("statuses", filters.statuses.join(","));
  }
  if (filters?.orderDate) {
    params.append("orderDate", filters.orderDate);
  }
  if (filters?.deliveryDate) {
    params.append("deliveryDate", filters.deliveryDate);
  }
  if (filters?.deadlineStatus && filters.deadlineStatus !== "all") {
    params.append("deadlineStatus", filters.deadlineStatus);
  }
  if (filters?.maxWeight) {
    params.append("maxWeight", filters.maxWeight);
  }

  const response = await fetch(`${baseUrl}/api/orders?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
}

export default function Page() {
  const { role } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    orderNumber: "",
    stores: [],
    statuses: [],
    orderDate: "",
    deliveryDate: "",
    deadlineStatus: "all",
    maxWeight: "",
  });

  // Fetch Orders - triggers on page, limit, or filter changes
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await getOrders(page, limit, currentFilters);
        const docs = data.orders || [];

        setTotalPages(data.pagination.totalPages);
        setHasNextPage(data.pagination.hasNextPage);
        setHasPrevPage(data.pagination.hasPrevPage);
        setTotalCount(data.pagination.totalCount);

        const mapped = mapOrders(docs);
        setOrders(mapped);
      } catch (error) {
        console.error("Failed to load orders:", error);
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [page, limit, currentFilters, toast]);

  const handleFilterChange = (filters: FilterState) => {
    // Update filter state and reset to page 1
    setCurrentFilters(filters);
    setPage(1);
  };

  const handleExport = async (
    format: "excel" | "pdf",
    pdfSection?: "all" | "frame" | "mesh"
  ) => {
    try {
      // Show loading toast
      toast({
        title: "Exporting...",
        description: "Fetching all orders from all stores. Please wait...",
      });

      // Fetch ALL orders from ALL stores (no pagination, no filters)
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const params = new URLSearchParams({
        limit: "9999", // Get all orders
        sortField: "createdAt",
        sortDirection: "desc",
      });

      const response = await fetch(
        `${baseUrl}/api/orders?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders for export");
      }

      const data = await response.json();
      const allOrders = data.orders || [];

      if (allOrders.length === 0) {
        toast({
          title: "No Data",
          description: "There are no orders to export.",
          variant: "destructive",
        });
        return;
      }

      // Map orders using the same logic as order detail page
      const mappedOrders = mapOrders(allOrders);

      // Export based on format and role
      if (format === "excel") {
        if (role === "Admin") {
          exportAdminToExcel(mappedOrders);
        } else if (role === "Frame Cutting") {
          exportFrameToExcel(mappedOrders);
        } else if (role === "Mesh Cutting") {
          exportMeshToExcel(mappedOrders);
        } else if (role === "Quality") {
          exportQualityToExcel(mappedOrders);
        } else if (role === "Packaging") {
          exportPackingToExcel(mappedOrders);
        }
      } else if (format === "pdf") {
        if (role === "Admin") {
          // For Admin, check which section to export
          if (pdfSection === "all") {
            exportAllOrdersToPDF(mappedOrders);
          } else if (pdfSection === "frame") {
            exportFrameCuttingOnlyToPDF(mappedOrders);
          } else if (pdfSection === "mesh") {
            exportMeshCuttingOnlyToPDF(mappedOrders);
          } else {
            // Default: export all 3 sections (backward compatibility)
            exportAdminToPDF(mappedOrders);
          }
        } else if (role === "Frame Cutting") {
          exportFrameToPDF(mappedOrders);
        } else if (role === "Mesh Cutting") {
          exportMeshToPDF(mappedOrders);
        } else if (role === "Quality") {
          // For Quality, check which section to export
          if (pdfSection === "frame") {
            exportFrameCuttingOnlyToPDF(mappedOrders);
          } else if (pdfSection === "mesh") {
            exportMeshCuttingOnlyToPDF(mappedOrders);
          } else {
            // Default: export both sections (backward compatibility)
            exportQualityToPDF(mappedOrders);
          }
        } else if (role === "Packaging") {
          exportPackingToPDF(mappedOrders);
        }
      }

      toast({
        title: "Export Successful",
        description: `Exported ${mappedOrders.length
          } orders to ${format.toUpperCase()} successfully.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export orders. Please try again.",
        variant: "destructive",
      });
    }
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

          {role !== "Shipping" && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport("excel")}
                variant="outline"
                className="gap-2 hover:cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </Button>

              {/* For Admin: Show dropdown with PDF export options */}
              {role === "Admin" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 hover:cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      Export PDF
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleExport("pdf", "all")}
                      className="cursor-pointer"
                    >
                      All Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExport("pdf", "frame")}
                      className="cursor-pointer"
                    >
                      Frame Cutting Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExport("pdf", "mesh")}
                      className="cursor-pointer"
                    >
                      Mesh Cutting Detail
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : role === "Quality" ? (
                // For Quality: Show dropdown with 2 PDF export options
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 hover:cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      Export PDF
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleExport("pdf", "frame")}
                      className="cursor-pointer"
                    >
                      Frame Cutting Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExport("pdf", "mesh")}
                      className="cursor-pointer"
                    >
                      Mesh Cutting Detail
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // For Frame Cutting and Mesh Cutting roles: Show regular PDF export button
                <Button
                  onClick={() => handleExport("pdf")}
                  variant="outline"
                  className="gap-2 hover:cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  Export PDF
                </Button>
              )}
            </div>
          )}
        </div>

        <OrderFilters onFilterChange={handleFilterChange} role={role} />

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <OrderTable orders={orders} role={role} />
        </div>

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
