import { OrderItem, Store } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapToTurkish } from '@/lib/mappings';

interface MeshCuttingViewProps {
  item: OrderItem;
  store: Store;
  itemNumber: number;
}

const MeshCuttingView = ({ item, store, itemNumber }: MeshCuttingViewProps) => {
  const calculations = {
    pileSayisi: item.width / 2,
    boy: item.height - 4.2,
    ipUzunlugu: item.width + item.height + 20,
    yon: mapToTurkish(item.orientation, store, 'orientation'),
    tul: mapToTurkish(item.meshType, store, 'mesh'),
    perdeTuru: mapToTurkish(item.curtainType, store, 'curtain'),
    kumasRenk: item.fabricColor,
    kapanma: mapToTurkish(item.closureType, store, 'closure'),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Item {itemNumber} - Mesh Cutting</span>
          <Badge variant={item.meshCuttingStatus === 'Ready to Package' ? 'default' : 'secondary'}>
            {item.meshCuttingStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Pile sayisi</p>
            <p className="text-lg font-semibold">{calculations.pileSayisi}</p>
            <p className="text-xs text-muted-foreground">Width ÷ 2</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Boy</p>
            <p className="text-lg font-semibold">{calculations.boy} cm</p>
            <p className="text-xs text-muted-foreground">Height - 4.2</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ip uzunlugu</p>
            <p className="text-lg font-semibold">{calculations.ipUzunlugu} cm</p>
            <p className="text-xs text-muted-foreground">Width + Height + 20</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Yon</p>
            <p className="text-lg font-semibold">{calculations.yon}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tul</p>
            <p className="text-lg font-semibold">{calculations.tul}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Perde türü</p>
            <p className="text-lg font-semibold">{calculations.perdeTuru}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kumas renk</p>
            <p className="text-lg font-semibold">{calculations.kumasRenk}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kapanma</p>
            <p className="text-lg font-semibold">{calculations.kapanma}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeshCuttingView;
