"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/DashboardHeader";
import SawingView from "@/components/orderDetails/SawingView";
import MeshCuttingView from "@/components/orderDetails/MeshCuttingView";
import QualityView from "@/components/orderDetails/QualityView";
import BoxManagement from "@/components/orderDetails/BoxManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ItemStatus } from "@/types/order";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { role } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("role", role);
    // if (!role) router.push('/');
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${params?.id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load order: ${res.status}`);
        }

        const o = await res.json();
        console.log("Fetched order data:", o);

        // Helper to get property value from line item
        const getProp = (properties: any[], name: string) => {
          if (!Array.isArray(properties)) return "";
          const prop = properties.find((p: any) => p?.name === name);
          return prop?.value || "";
        };

        // Map API order to UI-friendly shape
        const mapped = {
          id: String(o._id || o.shopifyId || ""),
          orderNumber: String(o.name || o.shopifyId || "").replace(/^#/, ""),
          orderDate: o.processedAt
            ? new Date(o.processedAt)
            : o.createdAt
            ? new Date(o.createdAt)
            : new Date(),
          store: `.${o.storeKey || "nl"}` as any,
          items: (o.lineItems || []).map((li: any, idx: number) => {
            // Try to get properties from lineItem first, then from raw
            let props = li.properties || [];

            // If no properties in lineItem, try raw
            if (props.length === 0 && o.raw?.line_items?.[idx]?.properties) {
              props = o.raw.line_items[idx].properties;
            }

            console.log(`Item ${idx + 1} properties:`, props);
            console.log(`Item ${idx + 1} full lineItem:`, li);

            return {
              id: String(li.id || li._id || `${o.shopifyId}-${idx + 1}`),
              width: parseFloat(
                getProp(props, "Breedte in cm") || getProp(props, "En") || "0"
              ),
              height: parseFloat(
                getProp(props, "Hoogte in cm") || getProp(props, "Boy") || "0"
              ),
              profileColor:
                getProp(props, "Profielkleur:") ||
                getProp(props, "Profil renk") ||
                getProp(props, "Profielkleur") ||
                "",
              orientation:
                getProp(props, "Schuifrichting") || getProp(props, "Yon") || "",
              installationType:
                getProp(props, "Plaatsing") || getProp(props, "Kurulum") || "",
              thresholdType:
                getProp(props, "Dorpeltype") || getProp(props, "Esik") || "",
              meshType:
                getProp(props, "Soort gaas") || getProp(props, "Tul") || "",
              curtainType:
                getProp(props, "Type plissé gordijn") ||
                getProp(props, "Kanat") ||
                "",
              fabricColor:
                getProp(props, "Kleur plissé gordijn") ||
                getProp(props, "Kumas renk") ||
                "",
              closureType:
                getProp(props, "Sluiting") ||
                getProp(props, "Perde türü") ||
                getProp(props, "Kapatma") ||
                "",
              mountingType:
                getProp(props, "Montagewijze") ||
                getProp(props, "Montaj") ||
                "",
              frameCutComplete: li.frameCutComplete || false,
              meshCutComplete: li.meshCutComplete || false,
              status: (li.status || "Pending") as ItemStatus,
              // Include product title and other useful info
              productTitle: li.title || li.name || "",
              quantity: li.quantity || 1,
              price: li.price || "0.00",
            };
          }),
          boxes: o.boxes || [],
          raw: o,
        };

        console.log("Mapped order:", mapped);
        setOrder(mapped);
      } catch (e: any) {
        console.error("Error loading order:", e);
        toast({
          title: "Failed to load order",
          description: e?.message || "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params?.id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading order details...</p>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <p className="text-destructive">Order not found</p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
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
                  newStatus === "Frame Cut Complete" ||
                  newStatus === "Packed" ||
                  newStatus === "Shipped" ||
                  it.frameCutComplete,
                meshCutComplete:
                  newStatus === "Mesh Cut Complete" ||
                  newStatus === "Packed" ||
                  newStatus === "Shipped" ||
                  it.meshCutComplete,
              }
            : it
        ),
      };
    });
    toast({
      title: "Status Updated",
      description: `Item status changed to ${newStatus}`,
    });
  };

  const handleDeleteOrder = () => {
    if (confirm("Are you sure you want to delete this order?")) {
      fetch(`/api/orders/${params?.id}`, { method: "DELETE" })
        .then(() => {
          toast({
            title: "Order Deleted",
            description: "The order has been deleted successfully",
          });
          router.push("/dashboard");
        })
        .catch(() =>
          toast({
            title: "Delete failed",
            description: "Please try again",
            variant: "destructive",
          })
        );
    }
  };

  const canEditStatus = (status: ItemStatus): boolean => {
    if (role === "Admin") return true;
    if (
      role === "Frame Cutting" &&
      (status === "Frame Cut Complete" || status === "Pending")
    )
      return true;
    if (
      role === "Mesh Cutting" &&
      (status === "Mesh Cut Complete" || status === "Pending")
    )
      return true;
    if (role === "Quality") return true;
    return false;
  };

  const getAvailableStatuses = (): ItemStatus[] => {
    if (role === "Frame Cutting") return ["Pending", "Frame Cut Complete"];
    if (role === "Mesh Cutting") return ["Pending", "Mesh Cut Complete"];
    if (role === "Quality" || role === "Admin") {
      return [
        "Pending",
        "Frame Cut Complete",
        "Mesh Cut Complete",
        "Ready for Packaging",
        "Packed",
        "Shipped",
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
          {role === "Admin" && (
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              className="gap-2"
            >
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
                <p className="text-lg font-semibold">
                  {format(order.orderDate, "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Store</p>
                <Badge variant="outline" className="text-lg">
                  {order.store}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="text-lg font-semibold">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-xl font-bold">Order Items</h3>

          {order.items.map((item: any, index: number) => (
            <div key={item.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">
                  Item {index + 1}
                  {item.productTitle && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      - {item.productTitle}
                    </span>
                  )}
                </h4>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select
                    value={item.status}
                    onValueChange={(value) =>
                      handleStatusChange(item.id, value as ItemStatus)
                    }
                    disabled={!canEditStatus(item.status)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStatuses().map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {role === "Frame Cutting" && (
                <SawingView
                  item={item}
                  store={order.store}
                  itemNumber={index + 1}
                />
              )}

              {role === "Mesh Cutting" && (
                <MeshCuttingView
                  item={item}
                  store={order.store}
                  itemNumber={index + 1}
                />
              )}

              {role === "Quality" && (
                <QualityView
                  item={item}
                  store={order.store}
                  itemNumber={index + 1}
                />
              )}

              {role === "Admin" && (
                <>
                  <SawingView
                    item={item}
                    store={order.store}
                    itemNumber={index + 1}
                  />
                  <MeshCuttingView
                    item={item}
                    store={order.store}
                    itemNumber={index + 1}
                  />
                  <QualityView
                    item={item}
                    store={order.store}
                    itemNumber={index + 1}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        {(role === "Quality" || role === "Admin") && (
          <BoxManagement order={order} />
        )}
      </main>
    </div>
  );
}
