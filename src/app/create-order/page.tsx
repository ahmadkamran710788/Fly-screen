'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import DashboardHeader from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Store, OrderItem } from '@/types/order';
import { useToast } from '@/hooks/use-toast';

const storeOptions = {
  '.nl': {
    orientations: ['Verticaal', 'Horizontaal'],
    installations: ['In het kozijn', 'Op het kozijn'],
    thresholds: ['Standaard', 'Plat'],
    meshTypes: ['Standaard', 'Anti-pollen'],
    curtainTypes: ['Semi-transparant', 'Verduisterend'],
    closureTypes: ['Borstel', 'Magneet'],
    mountingTypes: ['Schroefmontage', 'Plakmontage'],
  },
  '.de': {
    orientations: ['Vertical', 'Horizontal'],
    installations: ['In der Fensternische', 'Auf dem Rahmen'],
    thresholds: ['Standard', 'Flaches'],
    meshTypes: ['Standard', 'Pollenschutz'],
    curtainTypes: ['Halbtransparent', 'Verdunkelung'],
    closureTypes: ['Bürste', 'Magnet'],
    mountingTypes: ['Schrauben', 'Klebeband'],
  },
  '.dk': {
    orientations: ['Vertikal', 'Sidelæns'],
    installations: ['Indvendig', 'Udvendig'],
    thresholds: ['Standard', 'Flad'],
    meshTypes: ['Standard', 'Pollenafvisende'],
    curtainTypes: ['Semi-gennemsigtig', 'Mørklægningsgardin'],
    closureTypes: ['Børste', 'Magnet'],
    mountingTypes: ['Skruer', 'Tape'],
  },
  '.fr': {
    orientations: ['Latéral', 'Haut-bas'],
    installations: ['Pose en tunnel', 'Pose en applique'],
    thresholds: ['Standard', 'Plat'],
    meshTypes: ['Standard', 'Pollen'],
    curtainTypes: ['Translucide', 'Blackout'],
    closureTypes: ['Brosse', 'Aimant'],
    mountingTypes: ['Vis', 'Ruban'],
  },
  '.uk': {
    orientations: ['Up-down', 'Sideways'],
    installations: ['Recess fit', 'Face fit'],
    thresholds: ['Standard', 'Flat'],
    meshTypes: ['Standard', 'Pollen'],
    curtainTypes: ['Translucent', 'Blackout'],
    closureTypes: ['Brush', 'Magnet'],
    mountingTypes: ['Screws', 'Tape'],
  },
};

const profileColors = ['White 9016', 'Brown 8014', 'Anthracite 7016', 'Black 9005'];
const fabricColors = ['Grey', 'White', 'Black', 'Beige', 'Blue'];

export default function Page() {
  const { role } = useAuth();
  const { addOrder } = useOrders();
  const router = useRouter();
  const { toast } = useToast();

  const [store, setStore] = useState<Store>('.nl');
  const [itemCount, setItemCount] = useState(1);
  const [items, setItems] = useState<Partial<OrderItem>[]>([{}]);

  useEffect(() => {
    if (role !== 'Admin') {
      router.push('/dashboard');
    }
  }, [role, router]);

  useEffect(() => {
    setItems(Array.from({ length: itemCount }, () => ({})));
  }, [itemCount]);

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleSubmit = () => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.width || !item.height || !item.profileColor || !item.orientation || 
          !item.installationType || !item.thresholdType || !item.meshType || 
          !item.curtainType || !item.fabricColor || !item.closureType || !item.mountingType) {
        toast({
          title: 'Validation Error',
          description: `Please fill in all fields for Item ${i + 1}`,
          variant: 'destructive',
        });
        return;
      }
    }

    const orderNumber = `${Date.now()}`.slice(-4);
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
      frameCuttingStatus: 'Pending',
      meshCuttingStatus: 'Pending',
      qualityStatus: 'Pending',
    }));

    addOrder({
      orderNumber,
      orderDate: new Date(),
      store,
      items: completeItems,
    });

    toast({
      title: 'Success',
      description: 'Order created successfully',
    });

    router.push('/dashboard');
  };

  const options = (storeOptions as any)[store];

  if (role !== 'Admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Select value={store} onValueChange={(value) => setStore(value as Store)}>
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
                <Label htmlFor="itemCount">Number of Items</Label>
                <Select value={itemCount.toString()} onValueChange={(value) => setItemCount(parseInt(value))}>
                  <SelectTrigger id="itemCount">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
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
                  <Label>Width (cm)</Label>
                  <Input
                    type="number"
                    value={item.width || ''}
                    onChange={(e) => updateItem(index, 'width', parseFloat(e.target.value))}
                    placeholder="150"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    value={item.height || ''}
                    onChange={(e) => updateItem(index, 'height', parseFloat(e.target.value))}
                    placeholder="200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profile Color</Label>
                  <Select
                    value={item.profileColor || ''}
                    onValueChange={(value) => updateItem(index, 'profileColor', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profileColors.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <Select
                    value={item.orientation || ''}
                    onValueChange={(value) => updateItem(index, 'orientation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.orientations.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Installation Type</Label>
                  <Select
                    value={item.installationType || ''}
                    onValueChange={(value) => updateItem(index, 'installationType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.installations.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Threshold Type</Label>
                  <Select
                    value={item.thresholdType || ''}
                    onValueChange={(value) => updateItem(index, 'thresholdType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.thresholds.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mesh Type</Label>
                  <Select
                    value={item.meshType || ''}
                    onValueChange={(value) => updateItem(index, 'meshType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.meshTypes.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Curtain Type</Label>
                  <Select
                    value={item.curtainType || ''}
                    onValueChange={(value) => updateItem(index, 'curtainType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.curtainTypes.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fabric Color</Label>
                  <Select
                    value={item.fabricColor || ''}
                    onValueChange={(value) => updateItem(index, 'fabricColor', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fabricColors.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Closure Type</Label>
                  <Select
                    value={item.closureType || ''}
                    onValueChange={(value) => updateItem(index, 'closureType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.closureTypes.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mounting Type</Label>
                  <Select
                    value={item.mountingType || ''}
                    onValueChange={(value) => updateItem(index, 'mountingType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.mountingTypes.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button onClick={handleSubmit} className="flex-1" size="lg">
            Create Order
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')} size="lg">
            Cancel
          </Button>
        </div>
      </main>
    </div>
  );
}


