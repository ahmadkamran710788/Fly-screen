import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface OrderFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  orderNumber: string;
  stores: string[]; // Changed from Store[] to string[]
  statuses: string[]; // Overall order statuses
  orderDate: string;
  deliveryDate: string;
  deadlineStatus: string;
}

const OrderFilters = ({ onFilterChange }: OrderFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    orderNumber: "",
    stores: [],
    statuses: [],
    orderDate: "",
    deliveryDate: "",
    deadlineStatus: "all",
  });

  // Debounce timeout ref for text input
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const stores = [".nl", ".de", ".dk", ".fr", ".uk"];
  // New overall order statuses
  const statuses = ["Pending", "In Progress", "Completed"];

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const handleReset = () => {
    const resetFilters: FilterState = {
      orderNumber: "",
      stores: [],
      statuses: [],
      orderDate: "",
      deliveryDate: "",
      deadlineStatus: "all",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Debounced update for text input
  const updateFiltersDebounced = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout - only trigger API call after 500ms of no typing
    debounceTimeout.current = setTimeout(() => {
      onFilterChange(newFilters);
    }, 500);
  };

  // Immediate update for non-text inputs (buttons, selects, dates)
  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleStore = (store: string) => {
    const isCurrentlySelected = filters.stores.includes(store);
    const newStores = isCurrentlySelected
      ? filters.stores.filter((s) => s !== store)
      : [...filters.stores, store];

    const newFilters = { ...filters, stores: newStores };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleStatus = (status: string) => {
    const isCurrentlySelected = filters.statuses.includes(status);
    const newStatuses = isCurrentlySelected
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];

    const newFilters = { ...filters, statuses: newStatuses };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="orderNumber"
                placeholder="Search..."
                value={filters.orderNumber}
                onChange={(e) =>
                  updateFiltersDebounced({ orderNumber: e.target.value })
                }
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stores</Label>
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => {
                const isSelected = filters.stores.includes(store);
                return (
                  <Button
                    key={store}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStore(store)}
                    className={
                      isSelected
                        ? "bg-primary hover:cursor-pointer text-primary-foreground shadow-md"
                        : " hover:cursor-pointer"
                    }
                  >
                    {store}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant={
                  filters.stores.length === stores.length
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => {
                  updateFilters({
                    stores:
                      filters.stores.length === stores.length
                        ? []
                        : [...stores],
                  });
                }}
                className={
                  filters.stores.length === stores.length
                    ? "bg-primary hover:cursor-pointer text-primary-foreground shadow-md"
                    : "hover:cursor-pointer"
                }
              >
                All
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderDate">Order Date</Label>
            <Input
              id="orderDate"
              type="date"
              className="hover:cursor-pointer"
              value={filters.orderDate}
              onChange={(e) => updateFilters({ orderDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryDate">Delivery Date</Label>
            <Input
              id="deliveryDate"
              type="date"
              className="hover:cursor-pointer"
              value={filters.deliveryDate}
              onChange={(e) => updateFilters({ deliveryDate: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => {
                const isSelected = filters.statuses.includes(status);
                return (
                  <Button
                    key={status}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStatus(status)}
                    className={
                      isSelected
                        ? "bg-primary hover:cursor-pointer text-primary-foreground shadow-md"
                        : "hover:cursor-pointer"
                    }
                  >
                    {status}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadlineStatus">Deadline</Label>
            <Select
              value={filters.deadlineStatus}
              onValueChange={(value) =>
                updateFilters({ deadlineStatus: value })
              }
            >
              <SelectTrigger id="deadlineStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="today">Due Today</SelectItem>
                <SelectItem value="week">Due This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              className="w-full gap-2"
            >
              <X className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderFilters;
