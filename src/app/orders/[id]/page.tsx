"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  FrameCuttingStatus,
  MeshCuttingStatus,
  QualityStatus,
} from "@/types/order";
import { useOrderSync } from "@/hooks/useOrderSync";

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

  // Handle real-time updates from other users
  const handleOrderUpdate = useCallback(
    (event: any) => {
      console.log("Real-time update received:", event);

      if (event.type === "itemStatusUpdated") {
        setOrder((prev: any) => {
          if (!prev) return prev;

          return {
            ...prev,
            items: prev.items.map((item: any) =>
              item.id === event.itemId
                ? {
                    ...item,
                    frameCuttingStatus:
                      event.frameCuttingStatus ?? item.frameCuttingStatus,
                    meshCuttingStatus:
                      event.meshCuttingStatus ?? item.meshCuttingStatus,
                    qualityStatus: event.qualityStatus ?? item.qualityStatus,
                  }
                : item
            ),
          };
        });

        toast({
          title: "Order Updated",
          description: "Item status was updated by another user",
        });
      }
    },
    [toast]
  );

  // Subscribe to real-time updates
  useOrderSync(params?.id, handleOrderUpdate);

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
                getProp(props, "Breedte in cm") ||
                  getProp(props, "En") ||
                  getProp(props, "Breite in cm") ||
                  getProp(props, "Bredde i cm") ||
                  getProp(props, "Largeur en cm") ||
                  getProp(props, "Width in cm") ||
                  "0"
              ),
              height: parseFloat(
                getProp(props, "Hoogte in cm") ||
                  getProp(props, "Boy") ||
                  getProp(props, "Höhe in cm") ||
                  getProp(props, "Højde i cm") ||
                  getProp(props, "Hauteur en cm") ||
                  getProp(props, "Height in cm") ||
                  "0"
              ),
              profileColor:
                getProp(props, "Profielkleur:") ||
                getProp(props, "Profil renk") ||
                getProp(props, "Profilfarbe") ||
                getProp(props, "Ramme farve") ||
                "-",
              orientation:
                getProp(props, "Schuifrichting") || getProp(props, "Yon") || "",
              installationType:
                getProp(props, "Plaatsing") ||
                getProp(props, "Kurulum") ||
                getProp(props, "Installation method") ||
                "",
              thresholdType:
                getProp(props, "Dorpeltype") || getProp(props, "Esik") || "",
              meshType:
                getProp(props, "Soort gaas") ||
                getProp(props, "Tul") ||
                getProp(props, "Type of mesh") ||
                "",
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
              frameCuttingStatus: (li.frameCuttingStatus ||
                "Pending") as FrameCuttingStatus,
              meshCuttingStatus: (li.meshCuttingStatus ||
                "Pending") as MeshCuttingStatus,
              qualityStatus: (li.qualityStatus || "Pending") as QualityStatus,
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

  const handleFrameCuttingStatusChange = async (
    itemId: string,
    newStatus: FrameCuttingStatus
  ) => {
    // Optimistic update - update UI immediately
    const previousStatus = order.items.find(
      (it: any) => it.id === itemId
    )?.frameCuttingStatus;
    setOrder((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it: any) =>
          it.id === itemId ? { ...it, frameCuttingStatus: newStatus } : it
        ),
      };
    });

    // Persist to backend
    try {
      const response = await fetch(
        `/api/orders/${params?.id}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frameCuttingStatus: newStatus,
            role: role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      const result = await response.json();
      console.log("Frame cutting status update result:", result);

      toast({
        title: "Status Updated",
        description: `Frame cutting status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating frame cutting status:", error);

      // Revert optimistic update on error
      setOrder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it: any) =>
            it.id === itemId
              ? { ...it, frameCuttingStatus: previousStatus }
              : it
          ),
        };
      });

      toast({
        title: "Failed to update status",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleMeshCuttingStatusChange = async (
    itemId: string,
    newStatus: MeshCuttingStatus
  ) => {
    // Optimistic update - update UI immediately
    const previousStatus = order.items.find(
      (it: any) => it.id === itemId
    )?.meshCuttingStatus;
    setOrder((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it: any) =>
          it.id === itemId ? { ...it, meshCuttingStatus: newStatus } : it
        ),
      };
    });

    // Persist to backend
    try {
      const response = await fetch(
        `/api/orders/${params?.id}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meshCuttingStatus: newStatus,
            role: role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      const result = await response.json();
      console.log("Mesh cutting status update result:", result);

      toast({
        title: "Status Updated",
        description: `Mesh cutting status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating mesh cutting status:", error);

      // Revert optimistic update on error
      setOrder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it: any) =>
            it.id === itemId ? { ...it, meshCuttingStatus: previousStatus } : it
          ),
        };
      });

      toast({
        title: "Failed to update status",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleQualityStatusChange = async (
    itemId: string,
    newStatus: QualityStatus
  ) => {
    // Optimistic update - update UI immediately
    const previousStatus = order.items.find(
      (it: any) => it.id === itemId
    )?.qualityStatus;
    setOrder((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it: any) =>
          it.id === itemId ? { ...it, qualityStatus: newStatus } : it
        ),
      };
    });

    // Persist to backend
    try {
      const response = await fetch(
        `/api/orders/${params?.id}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qualityStatus: newStatus,
            role: role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      const result = await response.json();
      console.log("Quality status update result:", result);

      toast({
        title: "Status Updated",
        description: `Quality status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating quality status:", error);

      // Revert optimistic update on error
      setOrder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it: any) =>
            it.id === itemId ? { ...it, qualityStatus: previousStatus } : it
          ),
        };
      });

      toast({
        title: "Failed to update status",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    }
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

  const handleAddBox = async (box: Omit<any, "id">) => {
    // Optimistic update - add temporary box
    const tempBox = {
      ...box,
      id: `box-${Date.now()}`,
    };

    setOrder((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        boxes: [...(prev.boxes || []), tempBox],
      };
    });

    // Persist to backend
    try {
      const response = await fetch(`/api/orders/${params?.id}/boxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(box),
      });

      if (!response.ok) {
        throw new Error("Failed to add box");
      }

      const result = await response.json();
      console.log("Box added successfully:", result);

      // Update with real box from server
      setOrder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          boxes: prev.boxes.map((b: any) =>
            b.id === tempBox.id ? result.box : b
          ),
        };
      });
    } catch (error: any) {
      console.error("Error adding box:", error);

      // Revert optimistic update on error
      setOrder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          boxes: prev.boxes.filter((b: any) => b.id !== tempBox.id),
        };
      });

      throw error; // Re-throw so BoxManagement can show error toast
    }
  };

  const handleDeleteBox = async (boxId: string) => {
    // Save current boxes for potential revert
    const previousBoxes = order?.boxes || [];

    // Optimistic update - remove box immediately
    setOrder((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        boxes: prev.boxes.filter((b: any) => b.id !== boxId),
      };
    });

    // Persist to backend
    try {
      const response = await fetch(`/api/orders/${params?.id}/boxes/${boxId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete box");
      }

      console.log("Box deleted successfully");
    } catch (error: any) {
      console.error("Error deleting box:", error);

      // Revert optimistic update on error
      setOrder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          boxes: previousBoxes,
        };
      });

      throw error; // Re-throw so BoxManagement can show error toast
    }
  };

  const canEditFrameCuttingStatus = (item: any): boolean => {
    if (role === "Admin") return true;
    if (role === "Frame Cutting" && item.qualityStatus !== "Packed")
      return true;
    return false;
  };

  const canEditMeshCuttingStatus = (item: any): boolean => {
    if (role === "Admin") return true;
    if (role === "Mesh Cutting" && item.qualityStatus !== "Packed") return true;
    return false;
  };

  const canEditQualityStatus = (item: any): boolean => {
    if (role === "Admin") return true;
    if (
      role === "Quality" &&
      item.frameCuttingStatus === "Ready to Package" &&
      item.meshCuttingStatus === "Ready to Package"
    )
      return true;
    return false;
  };

  const getFrameCuttingStatuses = (): FrameCuttingStatus[] => {
    return ["Pending", "Ready to Package"];
  };

  const getMeshCuttingStatuses = (): MeshCuttingStatus[] => {
    return ["Pending", "Ready to Package"];
  };

  const getQualityStatuses = (): QualityStatus[] => {
    return ["Pending", "Ready to Package", "Packed"];
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
                  {(role === "Frame Cutting" || role === "Admin") && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Frame:
                      </span>
                      <Select
                        value={item.frameCuttingStatus}
                        onValueChange={(value) =>
                          handleFrameCuttingStatusChange(
                            item.id,
                            value as FrameCuttingStatus
                          )
                        }
                        disabled={!canEditFrameCuttingStatus(item)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getFrameCuttingStatuses().map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(role === "Mesh Cutting" || role === "Admin") && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Mesh:
                      </span>
                      <Select
                        value={item.meshCuttingStatus}
                        onValueChange={(value) =>
                          handleMeshCuttingStatusChange(
                            item.id,
                            value as MeshCuttingStatus
                          )
                        }
                        disabled={!canEditMeshCuttingStatus(item)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getMeshCuttingStatuses().map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(role === "Quality" || role === "Admin") && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Quality:
                      </span>
                      <Select
                        value={item.qualityStatus}
                        onValueChange={(value) =>
                          handleQualityStatusChange(
                            item.id,
                            value as QualityStatus
                          )
                        }
                        disabled={!canEditQualityStatus(item)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getQualityStatuses().map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
          <BoxManagement
            order={order}
            onAddBox={handleAddBox}
            onDeleteBox={handleDeleteBox}
          />
        )}
      </main>
    </div>
  );
}
