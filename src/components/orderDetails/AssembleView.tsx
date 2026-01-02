import { OrderItem, Store } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mapToTurkish, extractColorCode, mapProfileColor } from '@/lib/mappings';

interface AssembleViewProps {
    item: OrderItem;
    store: Store;
    itemNumber: number;
    showReferences?: boolean;
}

const AssembleView = ({ item, store, itemNumber, showReferences = true }: AssembleViewProps) => {
    const yon = mapToTurkish(item.orientation, store, 'orientation');
    const isDikey = yon === 'Dikey' || yon === 'DIKEY';
    const esik = mapToTurkish(item.thresholdType, store, 'threshold');
    const isFlat = esik === '9 mm';
    const profilRenk = extractColorCode(item.profileColor);

    // Sawing Calculations
    const sawing = {
        en: isDikey ? item.height - 7 : item.width - 7,
        boy: isDikey ? item.width - 7 : item.height - 7,
        kanat: isFlat ? item.height - 4.9 : item.height - 7.7,
        flatValue: isFlat ? item.width - 3.4 : null,
        kurulum: mapToTurkish(item.installationType, store, 'installation'),
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
    const takozVeKapak = mapProfileColor(item.profileColor);
    const tul = mapToTurkish(item.meshType, store, 'mesh');
    const kapanma = mapToTurkish(item.closureType, store, 'closure');

    return (
        <div className="space-y-4">
            {showReferences && (
                <>
                    {/* Card 1: Sawing Reference */}
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
                                    <p className="text-lg font-semibold">{sawing.en} cm</p>
                                    <p className="text-xs text-muted-foreground">{isDikey ? 'Height - 7' : 'Width - 7'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Boy</p>
                                    <p className="text-lg font-semibold">{sawing.boy} cm</p>
                                    <p className="text-xs text-muted-foreground">{isDikey ? 'Width - 7' : 'Height - 7'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Kanat</p>
                                    <p className="text-lg font-semibold">{sawing.kanat} cm</p>
                                    <p className="text-xs text-muted-foreground">Height - {isFlat ? '4.9' : '7.7'}</p>
                                </div>
                                {isFlat && sawing.flatValue !== null && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">9 mm</p>
                                        <p className="text-lg font-semibold">{sawing.flatValue.toFixed(1)} cm</p>
                                        <p className="text-xs text-muted-foreground">Width - 3.4</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">Profil renk</p>
                                    <p className="text-lg font-semibold">{takozVeKapak}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Yon</p>
                                    <p className="text-lg font-semibold">{yon}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Kurulum</p>
                                    <p className="text-lg font-semibold">{sawing.kurulum}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Mesh Reference */}
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
                                    <p className="text-lg font-semibold">{mesh.pileSayisi}</p>
                                    <p className="text-xs text-muted-foreground">{isDikey ? 'Height ÷ 2' : 'Width ÷ 2'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Boy</p>
                                    <p className="text-lg font-semibold">{mesh.boy} cm</p>
                                    <p className="text-xs text-muted-foreground">{isDikey ? 'Width - 4.2' : 'Height - 4.2'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Ip uzunlugu</p>
                                    <p className="text-lg font-semibold">{mesh.ipUzunlugu} cm</p>
                                    <p className="text-xs text-muted-foreground">Width + Height + 20</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Serit Kanal</p>
                                    <p className="text-lg font-semibold">{mesh.seritKanal} cm</p>
                                    <p className="text-xs text-muted-foreground">Tül boy - 2</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Serit Kanat</p>
                                    <p className="text-lg font-semibold">{mesh.seritKanat} cm</p>
                                    <p className="text-xs text-muted-foreground">Kanat - 1</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tul</p>
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
                        <span>Item {itemNumber} - Assembly</span>
                        <Badge variant={item.assemblyStatus === 'Complete' ? 'default' : 'secondary'}>
                            {item.assemblyStatus}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <p className="text-sm text-muted-foreground">Takoz ve kapak</p>
                            <p className="text-xl font-bold text-primary">{takozVeKapak}</p>
                            <p className="text-xs text-muted-foreground">RAL: {profilRenk}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tul</p>
                            <p className="text-lg font-semibold">{tul}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Kapanma</p>
                            <p className="text-lg font-semibold">{kapanma}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AssembleView;
