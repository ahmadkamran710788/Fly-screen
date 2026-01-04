"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/DashboardHeader";
import SawingView from "@/components/orderDetails/SawingView";
import MeshCuttingView from "@/components/orderDetails/MeshCuttingView";
import QualityView from "@/components/orderDetails/QualityView";
import PackagingView from "@/components/orderDetails/PackagingView";
import AssembleView from "@/components/orderDetails/AssembleView";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, AlertTriangle, Printer } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  FrameCuttingStatus,
  MeshCuttingStatus,
  QualityStatus,
  PackagingStatus,
  AssemblyStatus,
} from "@/types/order";
import { useOrderSync } from "@/hooks/useOrderSync";
import { exportPackagingOrderToPDF } from "@/lib/exportToPDF";
import { mapProfileColor } from "@/lib/mappings";

import { useTranslation } from "@/contexts/TranslationContext";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { role } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOrderDialogOpen, setDeleteOrderDialogOpen] = useState(false);

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
            status: event.orderStatus ?? prev.status,
            shippingStatus: event.shippingStatus ?? prev.shippingStatus,
            items: prev.items.map((item: any) =>
              item.id === event.itemId
                ? {
                  ...item,
                  frameCuttingStatus:
                    event.frameCuttingStatus ?? item.frameCuttingStatus,
                  meshCuttingStatus:
                    event.meshCuttingStatus ?? item.meshCuttingStatus,
                  qualityStatus: event.qualityStatus ?? item.qualityStatus,
                  packagingStatus:
                    event.packagingStatus ?? item.packagingStatus,
                  assemblyStatus: event.assemblyStatus ?? item.assemblyStatus,
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
        // Keep the date in UTC - formatting functions will handle GMT+1 conversion
        const utcDate = o.processedAt
          ? new Date(o.processedAt)
          : o.createdAt
            ? new Date(o.createdAt)
            : new Date();

        const mapped = {
          id: String(o._id || o.shopifyId || ""),
          orderNumber: String(o.name || o.shopifyId || "").replace(/^#/, ""),
          orderDate: utcDate,
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
              profileColor: mapProfileColor(
                getProp(props, "Profielkleur:") ||
                getProp(props, "Profil renk") ||
                getProp(props, "Profilfarbe") ||
                getProp(props, "Ramme farve") ||
                "-"
              ),
              orientation:
                getProp(props, "Schuifrichting") || getProp(props, "Yon") || "YATAY",
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
              packagingStatus: (li.packagingStatus || "Pending") as PackagingStatus,
              assemblyStatus: (li.assemblyStatus || "Pending") as AssemblyStatus,
              // Include product title and other useful info
              productTitle: li.title || li.name || "",
              quantity: li.quantity || 1,
              price: li.price || "0.00",
            };
          }),
          boxes: o.boxes || [],
          shippingStatus: o.shippingStatus || "Pending",
          raw: o,
          shippingAddress: o.shippingAddress,
          billingAddress: o.billingAddress,
          customer: o.customer,
          firstName:
            o.customer?.firstName ||
            o.customer?.first_name ||
            o.billingAddress?.firstName ||
            o.billingAddress?.first_name ||
            o.shippingAddress?.firstName ||
            o.shippingAddress?.first_name ||
            "",
          lastName:
            o.customer?.lastName ||
            o.customer?.last_name ||
            o.billingAddress?.lastName ||
            o.billingAddress?.last_name ||
            o.shippingAddress?.lastName ||
            o.shippingAddress?.last_name ||
            "",
        };

        console.log("Customer Data Debug:", {
          customer: o.customer,
          billing: o.billingAddress,
          firstNameResolved: mapped.firstName
        });

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

      // Update local state with potentially changed shippingStatus or overall status
      if (result.order) {
        setOrder((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: result.order.status,
            shippingStatus: result.order.shippingStatus,
          };
        });
      }

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

      // Update local state with potentially changed shippingStatus or overall status
      if (result.order) {
        setOrder((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: result.order.status,
            shippingStatus: result.order.shippingStatus,
          };
        });
      }

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

  const handlePackagingStatusChange = async (
    itemId: string,
    newStatus: PackagingStatus
  ) => {
    // Optimistic update - update UI immediately
    const previousStatus = order.items.find(
      (it: any) => it.id === itemId
    )?.packagingStatus;
    setOrder((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it: any) =>
          it.id === itemId ? { ...it, packagingStatus: newStatus } : it
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
            packagingStatus: newStatus,
            role: role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      const result = await response.json();

      // Update local state with potentially changed shippingStatus or overall status
      if (result.order) {
        setOrder((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: result.order.status,
            shippingStatus: result.order.shippingStatus,
          };
        });
      }

      toast({
        title: "Status Updated",
        description: `Packaging status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating packaging status:", error);

      // Revert optimistic update on error
      setOrder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it: any) =>
            it.id === itemId ? { ...it, packagingStatus: previousStatus } : it
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

      // Update local state with potentially changed shippingStatus or overall status
      if (result.order) {
        setOrder((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: result.order.status,
            shippingStatus: result.order.shippingStatus,
          };
        });
      }

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

  const handleAssemblyStatusChange = async (
    itemId: string,
    newStatus: AssemblyStatus
  ) => {
    // Optimistic update - update UI immediately
    const previousStatus = order.items.find(
      (it: any) => it.id === itemId
    )?.assemblyStatus;
    setOrder((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it: any) =>
          it.id === itemId ? { ...it, assemblyStatus: newStatus } : it
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
            assemblyStatus: newStatus,
            role: role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      const result = await response.json();

      // Update local state with potentially changed shippingStatus or overall status
      if (result.order) {
        setOrder((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: result.order.status,
            shippingStatus: result.order.shippingStatus,
          };
        });
      }

      toast({
        title: "Status Updated",
        description: `Assembly status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating assembly status:", error);

      // Revert optimistic update on error
      setOrder((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it: any) =>
            it.id === itemId ? { ...it, assemblyStatus: previousStatus } : it
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

  const handleShippingStatusChange = async (newStatus: "Pending" | "Complete") => {
    // Optimistic update
    const previousStatus = order.shippingStatus;
    setOrder((prev: any) => {
      if (!prev) return prev;
      return { ...prev, shippingStatus: newStatus };
    });

    try {
      const response = await fetch(`/api/orders/${params?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update shipping status");
      }

      toast({
        title: "Shipping Updated",
        description: `Shipping status changed to ${newStatus}`,
      });
    } catch (error: any) {
      setOrder((prev: any) => {
        if (!prev) return prev;
        return { ...prev, shippingStatus: previousStatus };
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrderClick = () => {
    setDeleteOrderDialogOpen(true);
  };

  const confirmDeleteOrder = async () => {
    try {
      await fetch(`/api/orders/${params?.id}`, { method: "DELETE" });
      toast({
        title: "Order Deleted",
        description: "The order has been deleted successfully",
      });
      setDeleteOrderDialogOpen(false);
      router.push("/dashboard");
    } catch {
      toast({
        title: "Delete failed",
        description: "Please try again",
        variant: "destructive",
      });
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
      item.frameCuttingStatus === "Complete" &&
      item.meshCuttingStatus === "Complete"
    )
      return true;
    return false;
  };

  const canEditPackagingStatus = (item: any): boolean => {
    if (role === "Admin") return true;
    if (
      role === "Packaging" &&
      item.assemblyStatus === "Complete"
    )
      return true;
    return false;
  };

  const canEditAssemblyStatus = (item: any): boolean => {
    if (role === "Admin") return true;
    if (
      role === "Assembly" &&
      item.qualityStatus === "Complete"
    )
      return true;
    return false;
  };

  const getFrameCuttingStatuses = (): FrameCuttingStatus[] => {
    return ["Pending", "Complete"];
  };

  const getMeshCuttingStatuses = (): MeshCuttingStatus[] => {
    return ["Pending", "Complete"];
  };

  const getQualityStatuses = (): QualityStatus[] => {
    return ["Pending", "Complete"];
  };

  const getPackagingStatuses = (): PackagingStatus[] => {
    return ["Pending", "Complete"];
  };

  const getAssemblyStatuses = (): AssemblyStatus[] => {
    return ["Pending", "Complete"];
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
            {t('Back to Orders')}
          </Button>
          <div className="flex gap-2 items-center">
            <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tr">Turkish</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            {(role === "Packaging" || role === "Admin" || role === "Shipping") && (
              <Button
                variant="outline"
                onClick={() => exportPackagingOrderToPDF(order)}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                {t('Print Order')}
              </Button>
            )}
            {role === "Admin" && (
              <Button
                variant="destructive"
                onClick={handleDeleteOrderClick}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t('Delete Order')}
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('Order Number')}</p>
                <p className="text-2xl font-bold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('First Name')}</p>
                <p className="text-lg font-semibold">
                  {order.firstName ||
                    order.customer?.firstName ||
                    order.customer?.first_name ||
                    order.billingAddress?.first_name ||
                    order.raw?.customer?.firstName ||
                    "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('Last Name')}</p>
                <p className="text-lg font-semibold">
                  {order.lastName ||
                    order.customer?.lastName ||
                    order.customer?.last_name ||
                    order.billingAddress?.last_name ||
                    order.raw?.customer?.lastName ||
                    "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('Order Date')}</p>
                <p className="text-lg font-semibold">
                  {format(order.orderDate, "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('Store')}</p>
                <Badge variant="outline" className="text-lg">
                  {order.store}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('Items')}</p>
                <p className="text-lg font-semibold">
                  {order.items.length} {t('item')}{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
              {(role === "Admin" || role === "Shipping") && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('Shipping Status')}</p>
                  <Select
                    value={order.shippingStatus || "Pending"}
                    onValueChange={handleShippingStatusChange}
                    disabled={
                      role === "Shipping" &&
                      !order.items.every((item: any) => item.packagingStatus === "Complete")
                    }
                  >
                    <SelectTrigger className="w-[140px] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Packed">Packed</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-xl font-bold">{t('Order Items')}</h3>

          {order.items.map((item: any, index: number) => (
            <div key={item.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">
                  {t('Item')} {index + 1}
                  {item.productTitle && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      - {item.productTitle}
                    </span>
                  )}
                </h4>
                <div className="flex items-center gap-4">
                  {(role === "Frame Cutting" || role === "Admin" || role === "Shipping") && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('Frame')}:
                      </span>
                      <Select
                        value={item.frameCuttingStatus}
                        onValueChange={(value) =>
                          handleFrameCuttingStatusChange(
                            item.id,
                            value as FrameCuttingStatus
                          )
                        }
                        disabled={role === "Shipping" || !canEditFrameCuttingStatus(item)}
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

                  {(role === "Mesh Cutting" || role === "Admin" || role === "Shipping") && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('Mesh')}:
                      </span>
                      <Select
                        value={item.meshCuttingStatus}
                        onValueChange={(value) =>
                          handleMeshCuttingStatusChange(
                            item.id,
                            value as MeshCuttingStatus
                          )
                        }
                        disabled={role === "Shipping" || !canEditMeshCuttingStatus(item)}
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

                  {(role === "Quality" || role === "Admin" || role === "Shipping") && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('Quality')}:
                      </span>
                      <Select
                        value={item.qualityStatus}
                        onValueChange={(value) =>
                          handleQualityStatusChange(
                            item.id,
                            value as QualityStatus
                          )
                        }
                        disabled={role === "Shipping" || !canEditQualityStatus(item)}
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

                  {(role === "Assembly" || role === "Admin" || role === "Shipping") && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('Assembly')}:
                      </span>
                      <Select
                        value={item.assemblyStatus}
                        onValueChange={(value) =>
                          handleAssemblyStatusChange(
                            item.id,
                            value as AssemblyStatus
                          )
                        }
                        disabled={role === "Shipping" || !canEditAssemblyStatus(item)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAssemblyStatuses().map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(role === "Packaging" || role === "Admin" || role === "Shipping") && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('Packaging')}:
                      </span>
                      <Select
                        value={item.packagingStatus}
                        onValueChange={(value) =>
                          handlePackagingStatusChange(
                            item.id,
                            value as PackagingStatus
                          )
                        }
                        disabled={role === "Shipping" || !canEditPackagingStatus(item)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getPackagingStatuses().map((status) => (
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

              {role === "Assembly" && (
                <AssembleView
                  item={item}
                  store={order.store}
                  itemNumber={index + 1}
                />
              )}

              {role === "Packaging" && (
                <PackagingView
                  item={item}
                  store={order.store}
                  itemNumber={index + 1}
                />
              )}

              {(role === "Admin" || role === "Shipping") && (
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
                  <AssembleView
                    item={item}
                    store={order.store}
                    itemNumber={index + 1}
                    showReferences={false}
                  />
                  <PackagingView
                    item={item}
                    store={order.store}
                    itemNumber={index + 1}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        {(role === "Packaging" || role === "Admin" || role === "Shipping") && (
          <BoxManagement
            order={order}
            onAddBox={handleAddBox}
            onDeleteBox={handleDeleteBox}
            readOnly={role === "Shipping"}
          />
        )}
      </main>

      {/* Delete Order Confirmation Dialog */}
      <AlertDialog open={deleteOrderDialogOpen} onOpenChange={setDeleteOrderDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl">{t('Delete Order?')}</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  {t('This action cannot be undone.')}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {t('Are you sure you want to delete order')}{" "}
              <span className="font-semibold text-foreground">#{order?.orderNumber}</span>?
              {t('All associated items and boxes will be permanently removed.')}
            </p>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOrder}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('Delete Order')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
