import { OrderItem, Store } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapToTurkish, extractColorCode } from '@/lib/mappings';

interface QualityViewProps {
  item: OrderItem;
  store: Store;
  itemNumber: number;
}

const QualityView = ({ item, store, itemNumber }: QualityViewProps) => {
  const fields = {
    en: item.width, // NO deduction
    boy: item.height, // NO deduction
    profilRenk: extractColorCode(item.profileColor),
    yon: mapToTurkish(item.orientation, store, 'orientation'),
    kurulum: mapToTurkish(item.installationType, store, 'installation'),
    esik: mapToTurkish(item.thresholdType, store, 'threshold'),
    perdeTuru: mapToTurkish(item.curtainType, store, 'curtain'),
    kumasRenk: item.fabricColor,
    kapanma: mapToTurkish(item.closureType, store, 'closure'),
    tul: mapToTurkish(item.meshType, store, 'mesh'),
    montaj: mapToTurkish(item.mountingType, store, 'mounting'),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Item {itemNumber} - Quality & Packaging</span>
          <div className="flex gap-2">
            <Badge variant={item.frameCutComplete ? 'default' : 'secondary'}>
              Frame: {item.frameCutComplete ? 'Complete' : 'Pending'}
            </Badge>
            <Badge variant={item.meshCutComplete ? 'default' : 'secondary'}>
              Mesh: {item.meshCutComplete ? 'Complete' : 'Pending'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">En</p>
            <p className="text-lg font-semibold">{fields.en} cm</p>
            <p className="text-xs text-muted-foreground">Original width</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Boy</p>
            <p className="text-lg font-semibold">{fields.boy} cm</p>
            <p className="text-xs text-muted-foreground">Original height</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profil renk</p>
            <p className="text-lg font-semibold">{fields.profilRenk}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Yon</p>
            <p className="text-lg font-semibold">{fields.yon}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kurulum</p>
            <p className="text-lg font-semibold">{fields.kurulum}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Esik</p>
            <p className="text-lg font-semibold">{fields.esik}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Perde türü</p>
            <p className="text-lg font-semibold">{fields.perdeTuru}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kumas renk</p>
            <p className="text-lg font-semibold">{fields.kumasRenk}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kapanma</p>
            <p className="text-lg font-semibold">{fields.kapanma}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tul</p>
            <p className="text-lg font-semibold">{fields.tul}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Montaj</p>
            <p className="text-lg font-semibold">{fields.montaj}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QualityView;
