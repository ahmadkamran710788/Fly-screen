import { OrderItem, Store } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapField, extractColorCode, mapProfileColor } from '@/lib/mappings';
import { useTranslation } from '@/contexts/TranslationContext';

interface AssembleViewProps {
    item: OrderItem;
    store: Store;
    itemNumber: number;
    showReferences?: boolean;
}

const AssembleView = ({ item, store, itemNumber, showReferences = true }: AssembleViewProps) => {
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

    const profilRenk = extractColorCode(item.profileColor);

    // Sawing Calculations
    const sawing = {
        en: isDikey ? item.height - 7 : item.width - 7,
        boy: isDikey ? item.width - 7 : item.height - 7,
        kanat: isFlat ? item.height - 4.9 : item.height - 7.7,
        flatValue: isFlat ? item.width - 3.4 : null,
        kurulum: mapField(item.installationType, store, 'installation', language),
    };

    // Mesh Calculations
    const tulBoy = isDikey ? item.width - 4.2 : item.height - 4.2;
    const mesh = {
        pileSayisi: isDikey ? item.height / 2 : item.width / 2,
        boy: tulBoy,
        ipUzunlugu: item.width + item.height + 20,
        seritKanal: tulBoy - 2,
        seritKanat: sawing.kanat - 1,
    };

    // Assembly Info
    const takozVeKapak = mapProfileColor(item.profileColor, language);
    const tul = mapField(item.meshType, store, 'mesh', language);
    const kapanma = mapField(item.closureType, store, 'closure', language);

    return (
        <div className="space-y-4">
            {showReferences && (
                <>
                    {/* Card 1: Sawing Reference */}
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
                                    <p className="text-lg font-semibold">{sawing.en} cm</p>
                                    <p className="text-xs text-muted-foreground">{t(isDikey ? 'Height - 7' : 'Width - 7')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Boy')}</p>
                                    <p className="text-lg font-semibold">{sawing.boy} cm</p>
                                    <p className="text-xs text-muted-foreground">{t(isDikey ? 'Width - 7' : 'Height - 7')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Kanat')}</p>
                                    <p className="text-lg font-semibold">{sawing.kanat} cm</p>
                                    <p className="text-xs text-muted-foreground">{t('Height')} - {isFlat ? '4.9' : '7.7'}</p>
                                </div>
                                {isFlat && sawing.flatValue !== null && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('Esik')}</p>
                                        <p className="text-lg font-semibold">{sawing.flatValue.toFixed(1)} cm</p>
                                        <p className="text-xs text-muted-foreground">{t('Width - 3.4')}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Profil renk')}</p>
                                    <p className="text-lg font-semibold">{takozVeKapak}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Yon')}</p>
                                    <p className="text-lg font-semibold">{yon}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Kurulum')}</p>
                                    <p className="text-lg font-semibold">{sawing.kurulum}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Mesh Reference */}
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
                                    <p className="text-lg font-semibold">{mesh.pileSayisi}</p>
                                    <p className="text-xs text-muted-foreground">{t(isDikey ? 'Height ÷ 2' : 'Width ÷ 2')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Boy')}</p>
                                    <p className="text-lg font-semibold">{mesh.boy} cm</p>
                                    <p className="text-xs text-muted-foreground">{t(isDikey ? 'Width - 4.2' : 'Height - 4.2')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Ip uzunlugu')}</p>
                                    <p className="text-lg font-semibold">{mesh.ipUzunlugu} cm</p>
                                    <p className="text-xs text-muted-foreground">{t('Width + Height + 20')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Serit Kanal')}</p>
                                    <p className="text-lg font-semibold">{mesh.seritKanal} cm</p>
                                    <p className="text-xs text-muted-foreground">{t('Tül boy - 2')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Serit Kanat')}</p>
                                    <p className="text-lg font-semibold">{mesh.seritKanat} cm</p>
                                    <p className="text-xs text-muted-foreground">{t('Kanat - 1')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Tul')}</p>
                                    <p className="text-lg font-semibold">{tul}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Card 3: Assembly */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{t('Item')} {itemNumber} - {t('Assembly')}</span>
                        <Badge variant={item.assemblyStatus === 'Complete' ? 'default' : 'secondary'}>
                            {item.assemblyStatus}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">{t('Takoz ve kapak')}</p>
                            <p className="text-lg font-semibold">{takozVeKapak}</p>
                            <p className="text-xs text-muted-foreground">RAL: {profilRenk}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t('Tul')}</p>
                            <p className="text-lg font-semibold">{tul}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t('Kapanma')}</p>
                            <p className="text-lg font-semibold">{kapanma}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AssembleView;

