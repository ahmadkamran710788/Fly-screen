'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/types/order';
import { format, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, ChevronUp, ChevronDown } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
}

type SortField = 'orderNumber' | 'orderDate' | 'store' | 'itemsCount' | 'deadline';
type SortDirection = 'asc' | 'desc';

const OrderTable = ({ orders }: OrderTableProps) => {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('orderNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getDeadline = (orderDate: Date) => {
    const deadline = new Date(orderDate);
    deadline.setDate(deadline.getDate() + 3);
    return deadline;
  };

  const getDeadlineStatus = (orderDate: Date) => {
    const deadline = getDeadline(orderDate);
    const today = new Date();
    const daysLeft = differenceInDays(deadline, today);

    if (daysLeft < 0) {
      return {
        text: `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}`,
        variant: 'destructive' as const,
      };
    } else if (daysLeft === 0) {
      return {
        text: 'Due today',
        variant: 'outline' as const,
      };
    } else {
      return {
        text: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`,
        variant: 'secondary' as const,
      };
    }
  };

  const getOverallStatus = (order: Order) => {
    const allShipped = order.items.every(item => item.status === 'Shipped');
    const allPacked = order.items.every(item => item.status === 'Packed' || item.status === 'Shipped');
    const allReady = order.items.every(item => 
      item.status === 'Ready for Packaging' || item.status === 'Packed' || item.status === 'Shipped'
    );

    if (allShipped) return { text: 'Shipped', variant: 'default' as const };
    if (allPacked) return { text: 'Packed', variant: 'default' as const };
    if (allReady) return { text: 'Ready for Packaging', variant: 'secondary' as const };
    return { text: 'In Progress', variant: 'outline' as const };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'orderNumber':
        comparison = a.orderNumber.localeCompare(b.orderNumber);
        break;
      case 'orderDate':
        comparison = a.orderDate.getTime() - b.orderDate.getTime();
        break;
      case 'store':
        comparison = a.store.localeCompare(b.store);
        break;
      case 'itemsCount':
        comparison = a.items.length - b.items.length;
        break;
      case 'deadline':
        comparison = getDeadline(a.orderDate).getTime() - getDeadline(b.orderDate).getTime();
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline ml-1" /> : 
      <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('orderNumber')}
              >
                Order Number <SortIcon field="orderNumber" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('orderDate')}
              >
                Order Date <SortIcon field="orderDate" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('store')}
              >
                Store <SortIcon field="store" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('itemsCount')}
              >
                Items <SortIcon field="itemsCount" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('deadline')}
              >
                Deadline <SortIcon field="deadline" />
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => {
              const status = getOverallStatus(order);
              const deadline = getDeadlineStatus(order.orderDate);

              return (
                <TableRow key={order.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{format(order.orderDate, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.store}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </TableCell>
                  <TableCell>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</TableCell>
                  <TableCell>
                    <Badge variant={deadline.variant}>{deadline.text}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="gap-2" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedOrders.length)} of {sortedOrders.length} orders
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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
