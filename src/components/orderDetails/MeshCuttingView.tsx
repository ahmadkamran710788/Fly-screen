import { OrderItem, Store } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapField } from '@/lib/mappings';
import { useTranslation } from '@/contexts/TranslationContext';

interface MeshCuttingViewProps {
  item: OrderItem;
  store: Store;
  itemNumber: number;
}

const MeshCuttingView = ({ item, store, itemNumber }: MeshCuttingViewProps) => {
  const { t, language } = useTranslation();

  const yon = mapField(item.orientation, store, 'orientation', language);
  const isDikey = item.orientation.toLowerCase().includes('vertical') ||
    item.orientation.toLowerCase().includes('verticaal') ||
    item.orientation.toLowerCase().includes('up-down') ||
    item.orientation.toLowerCase().includes('latéral') ||
    item.orientation.toLowerCase().includes('vertikal') ||
    yon.toLowerCase() === 'dikey' || yon.toLowerCase() === 'vertical';

  // If YON = DIKEY, switch Width with Height for calculations
  // Calculate Tül boy (Boy from mesh cutting)
  const tulBoy = isDikey ? item.width - 4.2 : item.height - 4.2;

  // Calculate Kanat from Frame Cutting (depends on threshold type)
  const esikValue = mapField(item.thresholdType, store, 'threshold', language);
  const isFlat = item.thresholdType.toLowerCase().includes('plat') ||
    item.thresholdType.toLowerCase().includes('flat') ||
    item.thresholdType.toLowerCase().includes('flad') ||
    item.thresholdType.toLowerCase().includes('flaches');

  const kanat = isFlat ? item.height - 4.9 : item.height - 7.7;

  const calculations = {
    pileSayisi: isDikey ? item.height / 2 : item.width / 2,
    boy: tulBoy,
    ipUzunlugu: item.width + item.height + 20,
    seritKanal: tulBoy - 2,
    seritKanat: kanat - 1,
    yon: yon,
    tul: mapField(item.meshType, store, 'mesh', language),
    perdeTuru: mapField(item.curtainType, store, 'curtain', language),
    kumasRenk: item.fabricColor,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('Item')} {itemNumber} - {t('Mesh Cutting')}</span>
          <Badge variant={item.meshCuttingStatus === 'Complete' ? 'default' : 'secondary'}>
            {item.meshCuttingStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('Pile sayisi')}</p>
            <p className="text-lg font-semibold">{calculations.pileSayisi}</p>
            <p className="text-xs text-muted-foreground">
              {t(isDikey ? 'Height ÷ 2' : 'Width ÷ 2')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Boy')}</p>
            <p className="text-lg font-semibold">{calculations.boy} cm</p>
            <p className="text-xs text-muted-foreground">
              {t(isDikey ? 'Width - 4.2' : 'Height - 4.2')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Ip uzunlugu')}</p>
            <p className="text-lg font-semibold">{calculations.ipUzunlugu} cm</p>
            <p className="text-xs text-muted-foreground">{t('Width + Height + 20')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Serit Kanal')}</p>
            <p className="text-lg font-semibold">{calculations.seritKanal} cm</p>
            <p className="text-xs text-muted-foreground">{t('Tül boy - 2')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Serit Kanat')}</p>
            <p className="text-lg font-semibold">{calculations.seritKanat} cm</p>
            <p className="text-xs text-muted-foreground">{t('Kanat - 1')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Yon')}</p>
            <p className="text-lg font-semibold">{calculations.yon}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Tul')}</p>
            <p className="text-lg font-semibold">{calculations.tul}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Perde türü')}</p>
            <p className="text-lg font-semibold">{calculations.perdeTuru}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Kumas renk')}</p>
            <p className="text-lg font-semibold">{calculations.kumasRenk}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeshCuttingView;

