import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, ItemStatus } from '@/types/order';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

interface OrderFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  orderNumber: string;
  stores: Store[];
  statuses: ItemStatus[];
  dateFrom: string;
  dateTo: string;
  deadlineStatus: string;
}

const OrderFilters = ({ onFilterChange }: OrderFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    orderNumber: '',
    stores: [],
    statuses: [],
    dateFrom: '',
    dateTo: '',
    deadlineStatus: 'all',
  });

  const stores: Store[] = ['.nl', '.de', '.dk', '.fr', '.uk'];
  const statuses: ItemStatus[] = [
    'Pending',
    'Frame Cut Complete',
    'Mesh Cut Complete',
    'Ready for Packaging',
    'Packed',
    'Shipped',
  ];

  const handleReset = () => {
    const resetFilters: FilterState = {
      orderNumber: '',
      stores: [],
      statuses: [],
      dateFrom: '',
      dateTo: '',
      deadlineStatus: 'all',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleStore = (store: Store) => {
    const newStores = filters.stores.includes(store)
      ? filters.stores.filter(s => s !== store)
      : [...filters.stores, store];
    updateFilters({ stores: newStores });
  };

  const toggleStatus = (status: ItemStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    updateFilters({ statuses: newStatuses });
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
                onChange={(e) => updateFilters({ orderNumber: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stores</Label>
            <div className="flex flex-wrap gap-2">
              {stores.map(store => (
                <Button
                  key={store}
                  variant={filters.stores.includes(store) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleStore(store)}
                >
                  {store}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFrom">Date From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilters({ dateFrom: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo">Date To</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilters({ dateTo: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <Button
                  key={status}
                  variant={filters.statuses.includes(status) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadlineStatus">Deadline</Label>
            <Select value={filters.deadlineStatus} onValueChange={(value) => updateFilters({ deadlineStatus: value })}>
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
            <Button onClick={handleReset} variant="outline" className="w-full gap-2">
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
