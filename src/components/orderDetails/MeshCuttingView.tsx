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
  const yon = mapToTurkish(item.orientation, store, 'orientation');
  const isDikey = yon === 'Dikey' || yon === 'DIKEY';
  
  // If YON = DIKEY, switch Width with Height for calculations
  // Calculate Tül boy (Boy from mesh cutting)
  const tulBoy = isDikey ? item.width - 4.2 : item.height - 4.2;
  
  // Calculate Kanat from Frame Cutting (depends on threshold type)
  const esik = mapToTurkish(item.thresholdType, store, 'threshold');
  const isFlat = esik === '9 mm';
  const kanat = isFlat ? item.height - 4.9 : item.height - 7.7;
  
  const calculations = {
    pileSayisi: isDikey ? item.height / 2 : item.width / 2,
    boy: tulBoy,
    ipUzunlugu: item.width + item.height + 20,
    seritKanal: tulBoy - 2, // Tül boy - 2 cm
    seritKanat: kanat - 1, // Kanat - 1 cm
    yon: yon,
    tul: mapToTurkish(item.meshType, store, 'mesh'),
    perdeTuru: mapToTurkish(item.curtainType, store, 'curtain'),
    kumasRenk: item.fabricColor,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Item {itemNumber} - Mesh Cutting</span>
          <Badge variant={item.meshCuttingStatus === 'Complete' ? 'default' : 'secondary'}>
            {item.meshCuttingStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Pile sayisi</p>
            <p className="text-lg font-semibold">{calculations.pileSayisi}</p>
            <p className="text-xs text-muted-foreground">
              {isDikey ? 'Height ÷ 2' : 'Width ÷ 2'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Boy</p>
            <p className="text-lg font-semibold">{calculations.boy} cm</p>
            <p className="text-xs text-muted-foreground">
              {isDikey ? 'Width - 4.2' : 'Height - 4.2'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ip uzunlugu</p>
            <p className="text-lg font-semibold">{calculations.ipUzunlugu} cm</p>
            <p className="text-xs text-muted-foreground">Width + Height + 20</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Serit Kanal</p>
            <p className="text-lg font-semibold">{calculations.seritKanal} cm</p>
            <p className="text-xs text-muted-foreground">Tül boy - 2</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Serit Kanat</p>
            <p className="text-lg font-semibold">{calculations.seritKanat} cm</p>
            <p className="text-xs text-muted-foreground">Kanat - 1</p>
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
        </div>
      </CardContent>
    </Card>
  );
};

export default MeshCuttingView;
