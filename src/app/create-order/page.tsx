"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrderContext";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Store, OrderItem } from "@/types/order";
import { useToast } from "@/hooks/use-toast";

const storeOptions = {
  ".nl": {
    orientations: ["Verticaal", "Horizontaal"],
    installations: ["In het kozijn", "Op het kozijn"],
    thresholds: ["Standaard", "Plat"],
    meshTypes: ["Standaard", "Anti-pollen"],
    curtainTypes: ["Semi-transparant", "Verduisterend"],
    closureTypes: ["Borstel", "Magneet"],
    mountingTypes: ["Schroefmontage", "Plakmontage"],
  },
  ".de": {
    orientations: ["Vertical", "Horizontal"],
    installations: ["In der Fensternische", "Auf dem Rahmen"],
    thresholds: ["Standard", "Flaches"],
    meshTypes: ["Standard", "Pollenschutz"],
    curtainTypes: ["Halbtransparent", "Verdunkelung"],
    closureTypes: ["Bürste", "Magnet"],
    mountingTypes: ["Schrauben", "Klebeband"],
  },
  ".dk": {
    orientations: ["Vertikal", "Sidelæns"],
    installations: ["Indvendig", "Udvendig"],
    thresholds: ["Standard", "Flad"],
    meshTypes: ["Standard", "Pollenafvisende"],
    curtainTypes: ["Semi-gennemsigtig", "Mørklægningsgardin"],
    closureTypes: ["Børste", "Magnet"],
    mountingTypes: ["Skruer", "Tape"],
  },
  ".fr": {
    orientations: ["Latéral", "Haut-bas"],
    installations: ["Pose en tunnel", "Pose en applique"],
    thresholds: ["Standard", "Plat"],
    meshTypes: ["Standard", "Pollen"],
    curtainTypes: ["Translucide", "Blackout"],
    closureTypes: ["Brosse", "Aimant"],
    mountingTypes: ["Vis", "Ruban"],
  },
  ".uk": {
    orientations: ["Up-down", "Sideways"],
    installations: ["Recess fit", "Face fit"],
    thresholds: ["Standard", "Flat"],
    meshTypes: ["Standard", "Pollen"],
    curtainTypes: ["Translucent", "Blackout"],
    closureTypes: ["Brush", "Magnet"],
    mountingTypes: ["Screws", "Tape"],
  },
};

const profileColors = [
  "White 9016",
  "Brown 8014",
  "Anthracite 7016",
  "Black 9005",
];
const fabricColors = ["Grey", "White", "Black", "Beige", "Blue"];

export default function Page() {
  const { role } = useAuth();
  const { addOrder } = useOrders();
  const router = useRouter();
  const { toast } = useToast();

  const [store, setStore] = useState<Store>(".nl");
  const [itemCount, setItemCount] = useState(1);
  const [orderDate, setOrderDate] = useState<string>("");
  const [items, setItems] = useState<Partial<OrderItem>[]>([{}]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate delivery date (order date + 3 days)
  const calculateDeliveryDate = (orderDateStr: string): string => {
    if (!orderDateStr) return "";
    const date = new Date(orderDateStr);
    date.setDate(date.getDate() + 3);
    return date.toISOString().split("T")[0];
  };

  const deliveryDate = calculateDeliveryDate(orderDate);

  useEffect(() => {
    if (role !== "Admin") {
      router.push("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    setItems(Array.from({ length: itemCount }, () => ({})));
  }, [itemCount]);

  const validateDimension = (value: any, fieldName: string): string => {
    if (!value && value !== 0) {
      return `${fieldName} is required`;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return "Please enter a valid number";
    }
    if (numValue <= 0) {
      return "Value must be greater than 0";
    }
    if (numValue > 500) {
      return "Maximum value is 500cm";
    }
    if (numValue < 10) {
      return "Minimum value is 10cm";
    }
    return "";
  };

  const validateSelectField = (value: any, fieldName: string): string => {
    if (!value || value === "") {
      return `${fieldName} is required`;
    }
    return "";
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });

    // Clear error when user changes field
    if (errors[index]?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: "",
        },
      }));
    }
  };

  const validateItem = (
    item: Partial<OrderItem>,
    index: number
  ): Record<string, string> => {
    const itemErrors: Record<string, string> = {};

    itemErrors.width = validateDimension(item.width, "Width");
    itemErrors.height = validateDimension(item.height, "Height");
    itemErrors.profileColor = validateSelectField(
      item.profileColor,
      "Profile Color"
    );
    itemErrors.orientation = validateSelectField(
      item.orientation,
      "Orientation"
    );
    itemErrors.installationType = validateSelectField(
      item.installationType,
      "Installation Type"
    );
    itemErrors.thresholdType = validateSelectField(
      item.thresholdType,
      "Threshold Type"
    );
    itemErrors.meshType = validateSelectField(item.meshType, "Mesh Type");
    itemErrors.curtainType = validateSelectField(
      item.curtainType,
      "Curtain Type"
    );
    itemErrors.fabricColor = validateSelectField(
      item.fabricColor,
      "Fabric Color"
    );
    itemErrors.closureType = validateSelectField(
      item.closureType,
      "Closure Type"
    );
    itemErrors.mountingType = validateSelectField(
      item.mountingType,
      "Mounting Type"
    );

    // Remove empty errors
    Object.keys(itemErrors).forEach((key) => {
      if (itemErrors[key] === "") delete itemErrors[key];
    });

    return itemErrors;
  };

  const handleSubmit = async () => {
    // Validate all items
    const allErrors: Record<number, Record<string, string>> = {};
    let hasErrors = false;

    for (let i = 0; i < items.length; i++) {
      const itemErrors = validateItem(items[i], i);
      if (Object.keys(itemErrors).length > 0) {
        allErrors[i] = itemErrors;
        hasErrors = true;
      }
    }

    setErrors(allErrors);

    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number based on store: UK278-XXXX, NL278-XXXX, DE278-XXXX, etc.
      const storePrefix = store.replace(".", "").toUpperCase(); // .nl -> NL, .uk -> UK
      const timestamp = Date.now().toString().slice(-4);
      const orderNumber = `${storePrefix}M278-${timestamp}`;
      const completeItems: OrderItem[] = items.map((item, i) => ({
        id: `${orderNumber}-${i + 1}`,
        width: item.width!,
        height: item.height!,
        profileColor: item.profileColor!,
        orientation: item.orientation!,
        installationType: item.installationType!,
        thresholdType: item.thresholdType!,
        meshType: item.meshType!,
        curtainType: item.curtainType!,
        fabricColor: item.fabricColor!,
        closureType: item.closureType!,
        mountingType: item.mountingType!,
        frameCuttingStatus: "Pending",
        meshCuttingStatus: "Pending",
        qualityStatus: "Pending",
      }));

      await addOrder({
        orderNumber,
        orderDate: new Date(orderDate),
        store,
        items: completeItems,
      });

      toast({
        title: "Success",
        description: "Order created successfully",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const options = (storeOptions as any)[store];

  if (role !== "Admin") {
    return null;
  }

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
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Select
                  value={store}
                  onValueChange={(value) => setStore(value as Store)}
                >
                  <SelectTrigger id="store">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=".nl">Netherlands (.nl)</SelectItem>
                    <SelectItem value=".de">Germany (.de)</SelectItem>
                    <SelectItem value=".dk">Denmark (.dk)</SelectItem>
                    <SelectItem value=".fr">France (.fr)</SelectItem>
                    <SelectItem value=".uk">United Kingdom (.uk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemCount">Number of Items</Label>
                <Select
                  value={itemCount.toString()}
                  onValueChange={(value) => setItemCount(parseInt(value))}
                >
                  <SelectTrigger id="itemCount">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {items.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Item {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Width (cm)*</Label>
                  <Input
                    type="number"
                    min="10"
                    max="500"
                    step="1"
                    value={item.width || ""}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "width",
                        e.target.value ? parseFloat(e.target.value) : ""
                      )
                    }
                    placeholder="150"
                    className={
                      errors[index]?.width
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {errors[index]?.width && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].width}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Height (cm)*</Label>
                  <Input
                    type="number"
                    min="10"
                    max="500"
                    step="1"
                    value={item.height || ""}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "height",
                        e.target.value ? parseFloat(e.target.value) : ""
                      )
                    }
                    placeholder="200"
                    className={
                      errors[index]?.height
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {errors[index]?.height && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].height}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Profile Color*</Label>
                  <Select
                    value={item.profileColor || ""}
                    onValueChange={(value) =>
                      updateItem(index, "profileColor", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[index]?.profileColor ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profileColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[index]?.profileColor && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].profileColor}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Orientation*</Label>
                  <Select
                    value={item.orientation || ""}
                    onValueChange={(value) =>
                      updateItem(index, "orientation", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[index]?.orientation ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.orientations.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[index]?.orientation && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].orientation}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Installation Type*</Label>
                  <Select
                    value={item.installationType || ""}
                    onValueChange={(value) =>
                      updateItem(index, "installationType", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[index]?.installationType ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.installations.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[index]?.installationType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].installationType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Threshold Type*</Label>
                  <Select
                    value={item.thresholdType || ""}
                    onValueChange={(value) =>
                      updateItem(index, "thresholdType", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[index]?.thresholdType ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.thresholds.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[index]?.thresholdType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].thresholdType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Mesh Type*</Label>
                  <Select
                    value={item.meshType || ""}
                    onValueChange={(value) =>
                      updateItem(index, "meshType", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[index]?.meshType ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.meshTypes.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[index]?.meshType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].meshType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Curtain Type*</Label>
                  <Select
                    value={item.curtainType || ""}
                    onValueChange={(value) =>
                      updateItem(index, "curtainType", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[index]?.curtainType ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.curtainTypes.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[index]?.curtainType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].curtainType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fabric Color*</Label>
                  <Select
                    value={item.fabricColor || ""}
                    onValueChange={(value) =>
                      updateItem(index, "fabricColor", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[index]?.fabricColor ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fabricColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[index]?.fabricColor && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].fabricColor}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Closure Type*</Label>
                  <Select
                    value={item.closureType || ""}
                    onValueChange={(value) =>
                      updateItem(index, "closureType", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[index]?.closureType ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.closureTypes.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[index]?.closureType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].closureType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Mounting Type*</Label>
                  <Select
                    value={item.mountingType || ""}
                    onValueChange={(value) =>
                      updateItem(index, "mountingType", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[index]?.mountingType ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.mountingTypes.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[index]?.mountingType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[index].mountingType}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            className="flex-1"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Order..." : "Create Order"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            size="lg"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </main>
    </div>
  );
}
