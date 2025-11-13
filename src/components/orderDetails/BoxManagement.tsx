import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Order, Box } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BoxManagementProps {
  order: Order;
  onAddBox?: (box: Omit<Box, 'id'>) => Promise<void>;
  onDeleteBox?: (boxId: string) => Promise<void>;
}

const BoxManagement = ({ order, onAddBox, onDeleteBox }: BoxManagementProps) => {
  const { addBox: contextAddBox, deleteBox: contextDeleteBox } = useOrders();

  // Use provided handlers or fall back to context
  const addBox = onAddBox || ((box: Omit<Box, 'id'>) => contextAddBox(order.id, box));
  const deleteBox = onDeleteBox || ((boxId: string) => contextDeleteBox(order.id, boxId));
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    length: '',
    width: '',
    height: '',
    weight: '',
    items: [] as string[],
  });

  const handleSubmit = () => {
    if (!formData.length || !formData.width || !formData.height || !formData.weight) {
      toast({
        title: 'Error',
        description: 'Please fill in all box dimensions',
        variant: 'destructive',
      });
      return;
    }

    if (formData.items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one item for the box',
        variant: 'destructive',
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
      title: 'Success',
      description: 'Box added successfully',
    });

    setFormData({
      length: '',
      width: '',
      height: '',
      weight: '',
      items: [],
    });
    setOpen(false);
  };

  const handleDelete = async (boxId: string) => {
    try {
      await deleteBox(boxId);
      toast({
        title: 'Success',
        description: 'Box deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete box',
        variant: 'destructive',
      });
    }
  };

  const toggleItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.includes(itemId)
        ? prev.items.filter(id => id !== itemId)
        : [...prev.items, itemId],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Paket Bilgileri (Package Information)</span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Box
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Box</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="length">Length (cm)</Label>
                    <Input
                      id="length"
                      type="number"
                      value={formData.length}
                      onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                      placeholder="120"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (cm)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={formData.width}
                      onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                      placeholder="80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Items in this box</Label>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={formData.items.includes(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <label
                          htmlFor={`item-${item.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Item {index + 1} ({item.width}cm x {item.height}cm)
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  Save Box
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {order.boxes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No boxes added yet</p>
            <p className="text-sm">Click "Add Box" to create a package</p>
          </div>
        ) : (
          <div className="space-y-4">
            {order.boxes.map((box, index) => {
              const itemNames = box.items.map(itemId => {
                const itemIndex = order.items.findIndex(item => item.id === itemId);
                return `Item ${itemIndex + 1}`;
              }).join(', ');

              return (
                <div key={box.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Box {index + 1}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Dimensions:</span>{' '}
                          {box.length}cm x {box.width}cm x {box.height}cm
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight:</span> {box.weight}kg
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Contains:</span> {itemNames}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(box.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoxManagement;
