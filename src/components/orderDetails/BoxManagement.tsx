import { useState } from "react";
import { useOrders } from "@/contexts/OrderContext";
import { Order, Box } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Package, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mapField } from "@/lib/mappings";
import { useTranslation } from "@/contexts/TranslationContext";

interface BoxManagementProps {
  order: Order;
  onAddBox?: (box: Omit<Box, "id">) => Promise<void>;
  onDeleteBox?: (boxId: string) => Promise<void>;
  readOnly?: boolean;
}

const BoxManagement = ({
  order,
  onAddBox,
  onDeleteBox,
  readOnly = false,
}: BoxManagementProps) => {
  const { t, language } = useTranslation();
  const { addBox: contextAddBox, deleteBox: contextDeleteBox } = useOrders();

  // Use provided handlers or fall back to context
  const addBox =
    onAddBox || ((box: Omit<Box, "id">) => contextAddBox(order.id, box));
  const deleteBox =
    onDeleteBox || ((boxId: string) => contextDeleteBox(order.id, boxId));
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boxToDelete, setBoxToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    length: "",
    width: "",
    height: "",
    weight: "",
    items: [] as string[],
  });
  const [errors, setErrors] = useState({
    length: "",
    width: "",
    height: "",
    weight: "",
    items: "",
  });

  const validateField = (
    field: "length" | "width" | "height" | "weight",
    value: string
  ): string => {
    // Check if empty
    if (!value || value.trim() === "") {
      return "required ";
    }

    const numValue = parseFloat(value);

    // Check if valid number
    if (isNaN(numValue)) {
      return "Please enter a valid number";
    }

    // Check if positive
    if (numValue <= 0) {
      return "Value must be greater than 0";
    }

    // Field-specific validations
    if (field === "length" || field === "width" || field === "height") {
      // Maximum dimension: 1000cm (10 meters)
      if (numValue > 1000) {
        return "Maximum value is 1000cm";
      }
      // Minimum dimension: 1cm
      if (numValue < 1) {
        return "Minimum value is 1cm";
      }
    }

    if (field === "weight") {
      // Maximum weight: 10000kg
      if (numValue > 10000) {
        return "Maximum weight is 10000kg";
      }
      // Minimum weight: 0.1kg
      if (numValue < 0.1) {
        return "Minimum weight is 0.1kg";
      }
    }

    return "";
  };

  const handleSubmit = () => {
    // Validate all fields
    const newErrors = {
      length: validateField("length", formData.length),
      width: validateField("width", formData.width),
      height: validateField("height", formData.height),
      weight: validateField("weight", formData.weight),
      items:
        formData.items.length === 0
          ? "Please select at least one item for the box"
          : "",
    };

    setErrors(newErrors);

    // Check if any errors exist
    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    addBox({
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      items: formData.items,
    });

    toast({
      title: "Success",
      description: "Box added successfully",
    });

    setFormData({
      length: "",
      width: "",
      height: "",
      weight: "",
      items: [],
    });
    setErrors({
      length: "",
      width: "",
      height: "",
      weight: "",
      items: "",
    });
    setOpen(false);
  };

  const handleDeleteClick = (boxId: string, boxName: string) => {
    setBoxToDelete({ id: boxId, name: boxName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!boxToDelete) return;

    try {
      await deleteBox(boxToDelete.id);
      toast({
        title: "Success",
        description: "Box deleted successfully",
      });
      setDeleteDialogOpen(false);
      setBoxToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete box",
        variant: "destructive",
      });
    }
  };

  const handleFieldChange = (
    field: "length" | "width" | "height" | "weight",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFieldBlur = (field: "length" | "width" | "height" | "weight") => {
    // Validate on blur (when user leaves the field)
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const toggleItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.includes(itemId)
        ? prev.items.filter((id) => id !== itemId)
        : [...prev.items, itemId],
    }));
    // Clear items error when user selects an item
    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: "" }));
    }
  };

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('Delete')} {boxToDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('This action cannot be undone. This will permanently delete the box and its contents from this order.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('Box Details')}</span>
            {!readOnly && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('Add Box')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-width-md">
                  <DialogHeader>
                    <DialogTitle>{t('Add New Box')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="length">{t('Length')} (cm)*</Label>
                        <Input
                          id="length"
                          type="number"
                          min="1"
                          max="1000"
                          step="1"
                          value={formData.length}
                          onChange={(e) =>
                            handleFieldChange("length", e.target.value)
                          }
                          onBlur={() => handleFieldBlur("length")}
                          placeholder="120"
                          className={
                            errors.length
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                        {errors.length && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.length}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="width">{t('Width')} (cm)*</Label>
                        <Input
                          id="width"
                          type="number"
                          min="1"
                          max="1000"
                          step="1"
                          value={formData.width}
                          onChange={(e) =>
                            handleFieldChange("width", e.target.value)
                          }
                          onBlur={() => handleFieldBlur("width")}
                          placeholder="80"
                          className={
                            errors.width
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                        {errors.width && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.width}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">{t('Height')} (cm)*</Label>
                        <Input
                          id="height"
                          type="number"
                          min="1"
                          max="1000"
                          step="1"
                          value={formData.height}
                          onChange={(e) =>
                            handleFieldChange("height", e.target.value)
                          }
                          onBlur={() => handleFieldBlur("height")}
                          placeholder="10"
                          className={
                            errors.height
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                        {errors.height && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.height}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">{t('Weight')} (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          min="0.1"
                          max="10000"
                          step="0.1"
                          value={formData.weight}
                          onChange={(e) =>
                            handleFieldChange("weight", e.target.value)
                          }
                          onBlur={() => handleFieldBlur("weight")}
                          placeholder="5"
                          className={
                            errors.weight
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                        {errors.weight && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.weight}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="montaj">{t('Montaj')}</Label>
                      <Input
                        id="montaj"
                        value={order.items[0] ? mapField(order.items[0].mountingType, order.store, "mounting", language) : ""}
                        disabled
                        className="bg-muted opacity-100 cursor-not-allowed border-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={errors.items ? "text-red-500" : ""}>
                        {t('Items in this box')}
                      </Label>
                      <div
                        className={`space-y-2 ${errors.items ? "border border-red-500 rounded-md p-3" : ""
                          }`}
                      >
                        {order.items.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`item-${item.id}`}
                              checked={formData.items.includes(item.id)}
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                            <label
                              htmlFor={`item-${item.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {t('Item')} {index + 1} ({item.width}cm x {item.height}cm)
                            </label>
                          </div>
                        ))}
                      </div>
                      {errors.items && (
                        <p className="text-xs text-red-500 mt-1">{errors.items}</p>
                      )}
                    </div>

                    <Button onClick={handleSubmit} className="w-full">
                      {t('Save Box')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {order.boxes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('No boxes added yet')}</p>
              {!readOnly && (
                <p className="text-sm">{t('Click "Add Box" to create a package')}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {order.boxes.map((box, index) => {
                const itemsInBox = order.items.filter((item) =>
                  box.items.includes(item.id)
                );
                const montajValue = itemsInBox.length > 0
                  ? mapField(itemsInBox[0].mountingType, order.store, "mounting", language)
                  : "-";

                const itemNames = box.items
                  .map((itemId) => {
                    const itemIndex = order.items.findIndex(
                      (item) => item.id === itemId
                    );
                    return `${t('Item')} ${itemIndex + 1}`;
                  })
                  .join(", ");

                return (
                  <div
                    key={box.id}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{t('Box')} {index + 1}</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              {t('Dimensions')}:
                            </span>{" "}
                            {box.length}cm x {box.width}cm x {box.height}cm
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('Weight')}:</span>{" "}
                            {box.weight}kg
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('Montaj')}:</span>{" "}
                            <span className="font-medium text-foreground">{montajValue}</span>
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <span className="text-muted-foreground">
                              {t('Contains')}:
                            </span>{" "}
                            {itemNames}
                          </div>
                        </div>
                      </div>
                      {!readOnly && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDeleteClick(box.id, `${t('Box')} ${index + 1}`)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default BoxManagement;

