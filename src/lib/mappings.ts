import { Store } from '@/types/order';

// Orientation mapping to Turkish
export const orientationMap: Record<Store, Record<string, string>> = {
  '.nl': { 'Verticaal': 'Dikey', 'Horizontaal': 'Yatay' },
  '.de': { 'Vertical': 'Dikey', 'Horizontal': 'Yatay' },
  '.dk': { 'Vertikal': 'Dikey', 'Sidelæns': 'Yatay' },
  '.fr': { 'Latéral': 'Dikey', 'Haut-bas': 'Yatay' },
  '.uk': { 'Up-down': 'Dikey', 'Sideways': 'Yatay' },
};

// Installation mapping to Turkish
export const installationMap: Record<Store, Record<string, string>> = {
  '.nl': { 'In het kozijn': 'Cerceve ici', 'Op het kozijn': 'Cerceve uzeri' },
  '.de': { 'In der Fensternische': 'Cerceve ici', 'Auf dem Rahmen': 'Cerceve uzeri' },
  '.dk': { 'Indvendig': 'Cerceve ici', 'Udvendig': 'Cerceve uzeri' },
  '.fr': { 'Pose en tunnel': 'Cerceve ici', 'Pose en applique': 'Cerceve uzeri' },
  '.uk': { 'Recess fit': 'Cerceve ici', 'Face fit': 'Cerceve uzeri' },
};

// Threshold mapping to Turkish
export const thresholdMap: Record<Store, Record<string, string>> = {
  '.nl': { 'Standaard': '35 mm', 'Plat': '9 mm' },
  '.de': { 'Standard': '35 mm', 'Flaches': '9 mm' },
  '.dk': { 'Standard': '35 mm', 'Flad': '9 mm' },
  '.fr': { 'Standard': '35 mm', 'Plat': '9 mm' },
  '.uk': { 'Standard': '35 mm', 'Flat': '9 mm' },
};

// Mesh type mapping to Turkish
export const meshTypeMap: Record<Store, Record<string, string>> = {
  '.nl': { 'Standaard': 'Standart', 'Anti-pollen': 'Polen' },
  '.de': { 'Standard': 'Standart', 'Pollenschutz': 'Polen' },
  '.dk': { 'Standard': 'Standart', 'Pollenafvisende': 'Polen' },
  '.fr': { 'Standard': 'Standart', 'Pollen': 'Polen' },
  '.uk': { 'Standard': 'Standart', 'Pollen': 'Polen' },
};

// Curtain type mapping to Turkish
export const curtainTypeMap: Record<Store, Record<string, string>> = {
  '.nl': { 'Semi-transparant': 'Transparan', 'Verduisterend': 'Karartma' },
  '.de': { 'Halbtransparent': 'Transparan', 'Verdunkelung': 'Karartma' },
  '.dk': { 'Semi-gennemsigtig': 'Transparan', 'Mørklægningsgardin': 'Karartma' },
  '.fr': { 'Translucide': 'Transparan', 'Blackout': 'Karartma' },
  '.uk': { 'Translucent': 'Transparan', 'Blackout': 'Karartma' },
};

// Closure type mapping to Turkish
export const closureTypeMap: Record<Store, Record<string, string>> = {
  '.nl': { 'Borstel': 'Firca', 'Magneet': 'Miknatis' },
  '.de': { 'Bürste': 'Firca', 'Magnet': 'Miknatis' },
  '.dk': { 'Børste': 'Firca', 'Magnet': 'Miknatis' },
  '.fr': { 'Brosse': 'Firca', 'Aimant': 'Miknatis' },
  '.uk': { 'Brush': 'Firca', 'Magnet': 'Miknatis' },
};

// Mounting type mapping to Turkish
export const mountingTypeMap: Record<Store, Record<string, string>> = {
  '.nl': { 'Schroefmontage': 'Vida', 'Plakmontage': 'Bant' },
  '.de': { 'Schrauben': 'Vida', 'Klebeband': 'Bant' },
  '.dk': { 'Skruer': 'Vida', 'Tape': 'Bant' },
  '.fr': { 'Vis': 'Vida', 'Ruban': 'Bant' },
  '.uk': { 'Screws': 'Vida', 'Tape': 'Bant' },
};

// Helper function to extract color code from profile color
export const extractColorCode = (profileColor: string): string => {
  const match = profileColor.match(/\d{4}/);
  return match ? match[0] : profileColor;
};

// Helper function to map profile color code to Turkish
export const mapProfileColor = (profileColor: string): string => {
  const code = extractColorCode(profileColor);
  const colorMap: Record<string, string> = {
    '9016': 'Beyaz',
    '7016': 'Antrasit',
    '9005': 'Siyah',
    '8014': 'Kahve',
  };
  return colorMap[code] || profileColor;
};

// Helper function to map any field to Turkish
export const mapToTurkish = (
  value: string,
  store: Store,
  mapType: 'orientation' | 'installation' | 'threshold' | 'mesh' | 'curtain' | 'closure' | 'mounting'
): string => {
  const maps = {
    orientation: orientationMap,
    installation: installationMap,
    threshold: thresholdMap,
    mesh: meshTypeMap,
    curtain: curtainTypeMap,
    closure: closureTypeMap,
    mounting: mountingTypeMap,
  };

  return maps[mapType][store]?.[value] || value;
};
