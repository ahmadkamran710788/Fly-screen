import { Store } from '@/types/order';

// Orientation mapping
export const orientationMap: Record<Store, Record<string, { tr: string, en: string }>> = {
  '.nl': {
    'Verticaal': { tr: 'Dikey', en: 'Vertical' },
    'Horizontaal': { tr: 'Yatay', en: 'Horizontal' }
  },
  '.de': {
    'Vertical': { tr: 'Dikey', en: 'Vertical' },
    'Horizontal': { tr: 'Yatay', en: 'Horizontal' }
  },
  '.dk': {
    'Vertikal': { tr: 'Dikey', en: 'Vertical' },
    'Sidelæns': { tr: 'Yatay', en: 'Horizontal' }
  },
  '.fr': {
    'Latéral': { tr: 'Dikey', en: 'Vertical' },
    'Haut-bas': { tr: 'Yatay', en: 'Horizontal' }
  },
  '.uk': {
    'Up-down': { tr: 'Dikey', en: 'Vertical' },
    'Sideways': { tr: 'Yatay', en: 'Horizontal' }
  },
};

// Installation mapping
export const installationMap: Record<Store, Record<string, { tr: string, en: string }>> = {
  '.nl': { 'In het kozijn': { tr: 'Cerceve ici', en: 'Inside frame' }, 'Op het kozijn': { tr: 'Cerceve uzeri', en: 'On frame' } },
  '.de': { 'In der Fensternische': { tr: 'Cerceve ici', en: 'Inside frame' }, 'Auf dem Rahmen': { tr: 'Cerceve uzeri', en: 'On frame' } },
  '.dk': { 'Indvendig': { tr: 'Cerceve ici', en: 'Inside frame' }, 'Udvendig': { tr: 'Cerceve uzeri', en: 'On frame' } },
  '.fr': { 'Pose en tunnel': { tr: 'Cerceve ici', en: 'Inside frame' }, 'Pose en applique': { tr: 'Cerceve uzeri', en: 'On frame' } },
  '.uk': { 'Recess fit': { tr: 'Cerceve ici', en: 'Inside frame' }, 'Face fit': { tr: 'Cerceve uzeri', en: 'On frame' } },
};

// Threshold mapping
export const thresholdMap: Record<Store, Record<string, { tr: string, en: string }>> = {
  '.nl': { 'Standaard': { tr: '35 mm', en: 'Standard threshold' }, 'Plat': { tr: '9 mm', en: 'Flat threshold' } },
  '.de': { 'Standard': { tr: '35 mm', en: 'Standard threshold' }, 'Flaches': { tr: '9 mm', en: 'Flat threshold' } },
  '.dk': { 'Standard': { tr: '35 mm', en: 'Standard threshold' }, 'Flad': { tr: '9 mm', en: 'Flat threshold' } },
  '.fr': { 'Standard': { tr: '35 mm', en: 'Standard threshold' }, 'Plat': { tr: '9 mm', en: 'Flat threshold' } },
  '.uk': { 'Standard': { tr: '35 mm', en: 'Standard threshold' }, 'Flat': { tr: '9 mm', en: 'Flat threshold' } },
};

// Mesh type mapping
export const meshTypeMap: Record<Store, Record<string, { tr: string, en: string }>> = {
  '.nl': { 'Standaard': { tr: 'Standart', en: 'Standard' }, 'Anti-pollen': { tr: 'Polen', en: 'Pollen' } },
  '.de': { 'Standard': { tr: 'Standart', en: 'Standard' }, 'Pollenschutz': { tr: 'Polen', en: 'Pollen' } },
  '.dk': { 'Standard': { tr: 'Standart', en: 'Standard' }, 'Pollenafvisende': { tr: 'Polen', en: 'Pollen' } },
  '.fr': { 'Standard': { tr: 'Standart', en: 'Standard' }, 'Pollen': { tr: 'Polen', en: 'Pollen' } },
  '.uk': { 'Standard': { tr: 'Standart', en: 'Standard' }, 'Pollen': { tr: 'Polen', en: 'Pollen' } },
};

// Curtain type mapping
export const curtainTypeMap: Record<Store, Record<string, { tr: string, en: string }>> = {
  '.nl': { 'Semi-transparant': { tr: 'Transparan', en: 'Semi-transparent' }, 'Verduisterend': { tr: 'Karartma', en: 'Blackout' } },
  '.de': { 'Halbtransparent': { tr: 'Transparan', en: 'Semi-transparent' }, 'Verdunkelung': { tr: 'Karartma', en: 'Blackout' } },
  '.dk': { 'Semi-gennemsigtig': { tr: 'Transparan', en: 'Semi-transparent' }, 'Mørklægningsgardin': { tr: 'Karartma', en: 'Blackout' } },
  '.fr': { 'Translucide': { tr: 'Transparan', en: 'Semi-transparent' }, 'Blackout': { tr: 'Karartma', en: 'Blackout' } },
  '.uk': { 'Translucent': { tr: 'Transparan', en: 'Semi-transparent' }, 'Blackout': { tr: 'Karartma', en: 'Blackout' } },
};

// Closure type mapping
export const closureTypeMap: Record<Store, Record<string, { tr: string, en: string }>> = {
  '.nl': { 'Borstel': { tr: 'Firca', en: 'Brush' }, 'Magneet': { tr: 'Miknatis', en: 'Magnet' } },
  '.de': { 'Bürste': { tr: 'Firca', en: 'Brush' }, 'Magnet': { tr: 'Miknatis', en: 'Magnet' } },
  '.dk': { 'Børste': { tr: 'Firca', en: 'Brush' }, 'Magnet': { tr: 'Miknatis', en: 'Magnet' } },
  '.fr': { 'Brosse': { tr: 'Firca', en: 'Brush' }, 'Aimant': { tr: 'Miknatis', en: 'Magnet' } },
  '.uk': { 'Brush': { tr: 'Firca', en: 'Brush' }, 'Magnet': { tr: 'Miknatis', en: 'Magnet' } },
};

// Mounting type mapping
export const mountingTypeMap: Record<Store, Record<string, { tr: string, en: string }>> = {
  '.nl': { 'Schroefmontage': { tr: 'Vida', en: 'Screw' }, 'Plakmontage': { tr: 'Bant', en: 'Tape' } },
  '.de': { 'Schrauben': { tr: 'Vida', en: 'Screw' }, 'Klebeband': { tr: 'Bant', en: 'Tape' } },
  '.dk': { 'Skruer': { tr: 'Vida', en: 'Screw' }, 'Tape': { tr: 'Bant', en: 'Tape' } },
  '.fr': { 'Vis': { tr: 'Vida', en: 'Screw' }, 'Ruban': { tr: 'Bant', en: 'Tape' } },
  '.uk': { 'Screws': { tr: 'Vida', en: 'Screw' }, 'Tape': { tr: 'Bant', en: 'Tape' } },
};

// Helper function to extract color code from profile color
export const extractColorCode = (profileColor: string): string => {
  const match = profileColor.match(/\d{4}/);
  return match ? match[0] : profileColor;
};

// Helper function to map profile color code
export const mapProfileColor = (profileColor: string, lang: 'tr' | 'en' = 'tr'): string => {
  const code = extractColorCode(profileColor);
  const colorMap: Record<string, { tr: string, en: string }> = {
    '9016': { tr: 'Beyaz', en: 'White' },
    '7016': { tr: 'Antrasit', en: 'Anthracite' },
    '9005': { tr: 'Siyah', en: 'Black' },
    '8014': { tr: 'Kahve', en: 'Brown' },
  };
  return colorMap[code] ? colorMap[code][lang] : profileColor;
};

// Helper function to map any field
export const mapField = (
  value: string,
  store: Store,
  mapType: 'orientation' | 'installation' | 'threshold' | 'mesh' | 'curtain' | 'closure' | 'mounting',
  lang: 'tr' | 'en' = 'tr'
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

  const result = maps[mapType][store]?.[value];
  return result ? result[lang] : value;
};

// Backward compatibility
export const mapToTurkish = (value: string, store: Store, mapType: any) => mapField(value, store, mapType, 'tr');
