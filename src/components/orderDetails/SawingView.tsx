import { OrderItem, Store } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapToTurkish, extractColorCode } from '@/lib/mappings';

interface SawingViewProps {
  item: OrderItem;
  store: Store;
  itemNumber: number;
}

const SawingView = ({ item, store, itemNumber }: SawingViewProps) => {
  const calculations = {
    en: item.width - 5,
    boy: item.height - 5,
    kanat: item.height - 5.5,
    profilRenk: extractColorCode(item.profileColor),
    yon: mapToTurkish(item.orientation, store, 'orientation'),
    kurulum: mapToTurkish(item.installationType, store, 'installation'),
    esik: mapToTurkish(item.thresholdType, store, 'threshold'),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Item {itemNumber} - Sawing (Frame Cutting)</span>
          <Badge variant={item.frameCutComplete ? 'default' : 'secondary'}>
            {item.frameCutComplete ? 'Frame Cut Complete' : 'Pending'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">En</p>
            <p className="text-lg font-semibold">{calculations.en} cm</p>
            <p className="text-xs text-muted-foreground">Width - 5</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Boy</p>
            <p className="text-lg font-semibold">{calculations.boy} cm</p>
            <p className="text-xs text-muted-foreground">Height - 5</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kanat</p>
            <p className="text-lg font-semibold">{calculations.kanat} cm</p>
            <p className="text-xs text-muted-foreground">Height - 5.5</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profil renk</p>
            <p className="text-lg font-semibold">{calculations.profilRenk}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Yon</p>
            <p className="text-lg font-semibold">{calculations.yon}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kurulum</p>
            <p className="text-lg font-semibold">{calculations.kurulum}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Esik</p>
            <p className="text-lg font-semibold">{calculations.esik}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SawingView;
