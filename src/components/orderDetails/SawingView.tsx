import { OrderItem, Store } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapField, extractColorCode, mapProfileColor } from '@/lib/mappings';
import { useTranslation } from '@/contexts/TranslationContext';

interface SawingViewProps {
  item: OrderItem;
  store: Store;
  itemNumber: number;
}

const SawingView = ({ item, store, itemNumber }: SawingViewProps) => {
  const { t, language } = useTranslation();

  const yon = mapField(item.orientation, store, 'orientation', language);
  const isDikey = item.orientation.toLowerCase().includes('vertical') ||
    item.orientation.toLowerCase().includes('verticaal') ||
    item.orientation.toLowerCase().includes('up-down') ||
    item.orientation.toLowerCase().includes('latéral') ||
    item.orientation.toLowerCase().includes('vertikal') ||
    yon.toLowerCase() === 'dikey' || yon.toLowerCase() === 'vertical';

  const esik = mapField(item.thresholdType, store, 'threshold', language);
  const isFlat = item.thresholdType.toLowerCase().includes('plat') ||
    item.thresholdType.toLowerCase().includes('flat') ||
    item.thresholdType.toLowerCase().includes('flad') ||
    item.thresholdType.toLowerCase().includes('flaches');

  const calculations = {
    en: isDikey ? item.height - 7 : item.width - 7,
    boy: isDikey ? item.width - 7 : item.height - 7,
    kanat: isFlat ? item.height - 4.9 : item.height - 7.7,
    flatValue: isFlat ? item.width - 3.4 : null,
    profilRenk: mapProfileColor(item.profileColor, language),
    yon: yon,
    kurulum: mapField(item.installationType, store, 'installation', language),
    esik: esik,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('Item')} {itemNumber} - {t('Sawing (Frame Cutting)')}</span>
          <Badge variant={item.frameCuttingStatus === 'Complete' ? 'default' : 'secondary'}>
            {item.frameCuttingStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('En')}</p>
            <p className="text-lg font-semibold">{calculations.en} cm</p>
            <p className="text-xs text-muted-foreground">
              {t(isDikey ? 'Height - 7' : 'Width - 7')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Boy')}</p>
            <p className="text-lg font-semibold">{calculations.boy} cm</p>
            <p className="text-xs text-muted-foreground">
              {t(isDikey ? 'Width - 7' : 'Height - 7')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Kanat')}</p>
            <p className="text-lg font-semibold">{calculations.kanat} cm</p>
            <p className="text-xs text-muted-foreground">
              {t('Height')} - {isFlat ? '4.9' : '7.7'}
            </p>
          </div>
          {isFlat && calculations.flatValue !== null && (
            <div>
              <p className="text-sm text-muted-foreground">{t('Esik')}</p>
              <p className="text-lg font-semibold">{calculations.flatValue.toFixed(1)} cm</p>
              <p className="text-xs text-muted-foreground">{t('Width - 3.4')}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">{t('Profil renk')}</p>
            <p className="text-lg font-semibold">{calculations.profilRenk}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Yon')}</p>
            <p className="text-lg font-semibold">{calculations.yon}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Kurulum')}</p>
            <p className="text-lg font-semibold">{calculations.kurulum}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Esik')}</p>
            {isFlat ? (
              <>
                <p className="text-lg font-semibold">{calculations.flatValue?.toFixed(1)} cm</p>
                <p className="text-xs text-muted-foreground">{t('Width - 3.4')}</p>
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

