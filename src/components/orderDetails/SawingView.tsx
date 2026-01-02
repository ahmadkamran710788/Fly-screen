import { OrderItem, Store } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapToTurkish, extractColorCode, mapProfileColor } from '@/lib/mappings';

interface SawingViewProps {
  item: OrderItem;
  store: Store;
  itemNumber: number;
}

const SawingView = ({ item, store, itemNumber }: SawingViewProps) => {
  const yon = mapToTurkish(item.orientation, store, 'orientation');
  const isDikey = yon === 'Dikey' || yon === 'DIKEY';
  const esik = mapToTurkish(item.thresholdType, store, 'threshold');
  const isFlat = esik === '9 mm'; // Flat threshold maps to '9 mm' in Turkish

  // If YON = DIKEY, switch En with Boy
  // If thresholdType is Flat:
  // - Add separate value: Width - 3.4 cm (not linked to En/Boy)
  // - Kanat = Height - 4.9 cm
  // Otherwise (Standard):
  // - Kanat = Height - 7.7 cm
  const calculations = {
    en: isDikey ? item.height - 7 : item.width - 7,
    boy: isDikey ? item.width - 7 : item.height - 7,
    kanat: isFlat ? item.height - 4.9 : item.height - 7.7,
    flatValue: isFlat ? item.width - 3.4 : null, // Width - 3.4 cm when Flat
    profilRenk: mapProfileColor(item.profileColor),
    yon: yon,
    kurulum: mapToTurkish(item.installationType, store, 'installation'),
    esik: esik,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Item {itemNumber} - Sawing (Frame Cutting)</span>
          <Badge variant={item.frameCuttingStatus === 'Complete' ? 'default' : 'secondary'}>
            {item.frameCuttingStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">En</p>
            <p className="text-lg font-semibold">{calculations.en} cm</p>
            <p className="text-xs text-muted-foreground">
              {isDikey ? 'Height - 7' : 'Width - 7'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Boy</p>
            <p className="text-lg font-semibold">{calculations.boy} cm</p>
            <p className="text-xs text-muted-foreground">
              {isDikey ? 'Width - 7' : 'Height - 7'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kanat</p>
            <p className="text-lg font-semibold">{calculations.kanat} cm</p>
            <p className="text-xs text-muted-foreground">
              Height - {isFlat ? '4.9' : '7.7'}
            </p>
          </div>
          {isFlat && calculations.flatValue !== null && (
            <div>
              <p className="text-sm text-muted-foreground">9 mm</p>
              <p className="text-lg font-semibold">{calculations.flatValue.toFixed(1)} cm</p>
              <p className="text-xs text-muted-foreground">Width - 3.4</p>
            </div>
          )}
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
            {isFlat ? (
              <>
                <p className="text-lg font-semibold">{calculations.flatValue?.toFixed(1)} cm</p>
                <p className="text-xs text-muted-foreground">Width - 3.4</p>
              </>
            ) : (
              <p className="text-lg font-semibold">{calculations.esik}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SawingView;
