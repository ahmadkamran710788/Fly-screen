'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/DashboardHeader';
import SawingView from '@/components/orderDetails/SawingView';
import MeshCuttingView from '@/components/orderDetails/MeshCuttingView';
import QualityView from '@/components/orderDetails/QualityView';
import BoxManagement from '@/components/orderDetails/BoxManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ItemStatus } from '@/types/order';

export default function Page() {
  const params = useParams<{ id: string }>();
  const { role } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    console.log('role', role);
    // if (!role) router.push('/');
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return; // wait until the router param is available
      try {
        const res = await fetch(`/api/orders/${params?.id}`, { cache: 'no-store' });
        const o = await res.json();
        if (!res.ok) throw new Error(o?.error || 'Failed to load order');
        // Map API order to UI-friendly shape
        const mapped = {
          id: String(o._id || o.shopifyId),
          orderNumber: String((o.name || o.shopifyId || '')).replace(/^#/, ''),
          orderDate: o.processedAt ? new Date(o.processedAt) : new Date(o.createdAt || Date.now()),
          store: (`.${o.storeKey || 'nl'}`) as any,
          items: (o.lineItems || []).map((li: any, idx: number) => ({
            id: String(li.id || `${o.shopifyId}-${idx + 1}`),
            width: 0,
            height: 0,
            profileColor: '',
            orientation: '',
            installationType: '',
            thresholdType: '',
            meshType: '',
            curtainType: '',
            fabricColor: '',
            closureType: '',
            mountingType: '',
            frameCutComplete: false,
            meshCutComplete: false,
            status: 'Pending' as ItemStatus,
          })),
          boxes: [],
          raw: o,
        };
        setOrder(mapped);
      } catch (e: any) {
        // Don't hard redirect; show a toast and stay on the page to debug the id
        toast({
          title: 'Failed to load order',
          description: e?.message || 'Unknown error',
          variant: 'destructive',
        });
      }
    };
    load();
  }, [params?.id, router, toast]);

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading order details...</p>
        </main>
      </div>
    );
  }

  const handleStatusChange = (itemId: string, newStatus: ItemStatus) => {
    setOrder((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it: any) =>
          it.id === itemId
            ? {
                ...it,
                status: newStatus,
                frameCutComplete:
                  newStatus === 'Frame Cut Complete' || newStatus === 'Packed' || newStatus === 'Shipped',
                meshCutComplete:
                  newStatus === 'Mesh Cut Complete' || newStatus === 'Packed' || newStatus === 'Shipped',
              }
            : it,
        ),
      };
    });
    toast({
      title: 'Status Updated',
      description: `Item status changed to ${newStatus}`,
    });
  };

  const handleDeleteOrder = () => {
    if (confirm('Are you sure you want to delete this order?')) {
      fetch(`/api/orders/${params?.id}`, { method: 'DELETE' })
        .then(() => {
          toast({
            title: 'Order Deleted',
            description: 'The order has been deleted successfully',
          });
          router.push('/dashboard');
        })
        .catch(() =>
          toast({ title: 'Delete failed', description: 'Please try again', variant: 'destructive' }),
        );
    }
  };

  const canEditStatus = (status: ItemStatus): boolean => {
    if (role === 'Admin') return true;
    if (role === 'Frame Cutting' && (status === 'Frame Cut Complete' || status === 'Pending')) return true;
    if (role === 'Mesh Cutting' && (status === 'Mesh Cut Complete' || status === 'Pending')) return true;
    if (role === 'Quality') return true;
    return false;
  };

  const getAvailableStatuses = (): ItemStatus[] => {
    if (role === 'Frame Cutting') return ['Pending', 'Frame Cut Complete'];
    if (role === 'Mesh Cutting') return ['Pending', 'Mesh Cut Complete'];
    if (role === 'Quality' || role === 'Admin') {
      return ['Pending', 'Frame Cut Complete', 'Mesh Cut Complete', 'Ready for Packaging', 'Packed', 'Shipped'];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
          {role === 'Admin' && (
            <Button variant="destructive" onClick={handleDeleteOrder} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Order
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-2xl font-bold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="text-lg font-semibold">{format(order.orderDate, 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Store</p>
                <Badge variant="outline" className="text-lg">{order.store}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="text-lg font-semibold">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-xl font-bold">Order Items</h3>
          
          {order.items.map((item, index) => (
            <div key={item.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Item {index + 1}</h4>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select
                    value={item.status}
                    onValueChange={(value) => handleStatusChange(item.id, value as ItemStatus)}
                    disabled={!canEditStatus(item.status)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStatuses().map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {role === 'Frame Cutting' && (
                <SawingView item={item} store={order.store} itemNumber={index + 1} />
              )}

              {role === 'Mesh Cutting' && (
                <MeshCuttingView item={item} store={order.store} itemNumber={index + 1} />
              )}

              {role === 'Quality' && (
                <QualityView item={item} store={order.store} itemNumber={index + 1} />
              )}

              {role === 'Admin' && (
                <>
                  <SawingView item={item} store={order.store} itemNumber={index + 1} />
                  <MeshCuttingView item={item} store={order.store} itemNumber={index + 1} />
                  <QualityView item={item} store={order.store} itemNumber={index + 1} />
                </>
              )}
            </div>
          ))}
        </div>

        {(role === 'Quality' || role === 'Admin') && (
          <BoxManagement order={order} />
        )}
      </main>
    </div>
  );
}


