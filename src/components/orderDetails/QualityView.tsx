import { OrderItem, Store } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapField, mapProfileColor } from '@/lib/mappings';
import { useTranslation } from '@/contexts/TranslationContext';

interface QualityViewProps {
  item: OrderItem;
  store: Store;
  itemNumber: number;
}

const QualityView = ({ item, store, itemNumber }: QualityViewProps) => {
  const { t, language } = useTranslation();

  const fields = {
    en: item.width,
    boy: item.height,
    profilRenk: mapProfileColor(item.profileColor, language),
    yon: mapField(item.orientation, store, 'orientation', language),
    kurulum: mapField(item.installationType, store, 'installation', language),
    esik: mapField(item.thresholdType, store, 'threshold', language),
    perdeTuru: mapField(item.curtainType, store, 'curtain', language),
    kumasRenk: item.fabricColor,
    kapanma: mapField(item.closureType, store, 'closure', language),
    tul: mapField(item.meshType, store, 'mesh', language),
    montaj: mapField(item.mountingType, store, 'mounting', language),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('Item')} {itemNumber} - {t('Quality')}</span>
          <div className="flex gap-2">
            <Badge variant={item.frameCuttingStatus === 'Complete' ? 'default' : 'secondary'}>
              {t('Frame')}: {item.frameCuttingStatus}
            </Badge>
            <Badge variant={item.meshCuttingStatus === 'Complete' ? 'default' : 'secondary'}>
              {t('Mesh')}: {item.meshCuttingStatus}
            </Badge>
            <Badge variant={item.qualityStatus === 'Complete' ? 'default' : 'secondary'}>
              {t('Quality')}: {item.qualityStatus}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('En')}</p>
            <p className="text-lg font-semibold">{fields.en} cm</p>
            <p className="text-xs text-muted-foreground">{t('Original width')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Boy')}</p>
            <p className="text-lg font-semibold">{fields.boy} cm</p>
            <p className="text-xs text-muted-foreground">{t('Original height')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Profil renk')}</p>
            <p className="text-lg font-semibold">{fields.profilRenk}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Yon')}</p>
            <p className="text-lg font-semibold">{fields.yon}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Kurulum')}</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{fields.kurulum}</p>
              {(fields.kurulum === "Cerceve ici" || fields.kurulum === "Inside frame") && (
                <Badge variant="destructive" className="animate-pulse">
                  {t('EKSTRA KONTROL')}
                </Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Esik')}</p>
            <p className="text-lg font-semibold">{fields.esik}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Perde türü')}</p>
            <p className="text-lg font-semibold">{fields.perdeTuru}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Kumas renk')}</p>
            <p className="text-lg font-semibold">{fields.kumasRenk}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Kapanma')}</p>
            <p className="text-lg font-semibold">{fields.kapanma}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Tul')}</p>
            <p className="text-lg font-semibold">{fields.tul}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Montaj')}</p>
            <p className="text-lg font-semibold">{fields.montaj}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QualityView;

