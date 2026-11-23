export type ScooterId =
  | 'c3'
  | 'gm'
  | 'm2'
  | 'g77'
  | 'wish01'
  | 'wish02pro'
  | 'surron'
  | 'starkvarg'
  | 'g2'
  | 'f3'
  | 'g2max'
  | 'teverun'
  | 'g2ultra'
  | 'g2pro'
  | 'thunder3'
  | 'g4max';

export interface ScooterSpec {
  id: ScooterId;
  name: string;
  subtitle: string;
  price: number;
  caseOnly?: boolean; // Выпадает только из кейса
  power: number;      // pw — мощность газа
  multiplier: number; // m — множитель монет
  maxKmh: number;     // реальная максимальная скорость (км/ч)
  accent: string;
  underglow?: string;
  seated?: boolean;   // Сидячая посадка (M2, Wish 01)
  seatX?: number;
  seatY?: number;
  /** Координаты заднего крыла или бугеля (0..1) для реального чирка об асфальт */
  fenderX?: number;
  fenderY?: number;
  scrapeKind?: 'fender' | 'bugel';
  scrapePadPx?: number;
  /** Режим покраски: 'single' (1 цвет, например G2 Pro) или 'dual' (2 окраса: корпус + акцент) */
  paintMode?: 'single' | 'dual';
  /** Двухтонный монохромный транспорт (чёрный + серебристый/белый без цветных вставок) */
  twoToneMono?: boolean;
  /** Сохранить бирюзовую подсветку деки при перекраске акцента (F3) */
  skipCyanLed?: boolean;
  spriteSrc: string;      // Быстрый прозрачный WebP (развёрнут направо)
  originalSrc: string;    // Прозрачный PNG (fallback)
  // Калибровка спрайта в нормализованных координатах (0..1)
  spriteH: number;
  aspect: number;
  rearX: number;
  rearY: number;
  frontX: number;
  frontY: number;
  bottomY: number;
  deckY: number;
  backFootX: number;
  frontFootX: number;
  gripX: number;
  gripY: number;
  baseTiltDeg: number;
}

export interface ScooterPaint {
  primary?: string;
  secondary?: string;
}

export type ScooterPaintMap = Partial<Record<ScooterId, ScooterPaint>>;

export interface PaintSwatch {
  id: string;
  name: string;
  hex: string;
}

export type LightId =
  | 'stock'
  | 'amber'
  | 'xenon'
  | 'cyan'
  | 'lime'
  | 'purple'
  | 'red'
  | 'pink'
  | 'gold';

export interface ScooterLightSpec {
  id: LightId;
  name: string;
  subtitle: string;
  price: number;
  beamHex: string;
  coreHex: string;
}

export const SCOOTER_LIGHTS: ScooterLightSpec[] = [
  {
    id: 'stock',
    name: 'Белый сток',
    subtitle: 'Заводской галоген',
    price: 0,
    beamHex: '#dff0ff',
    coreHex: '#ffffff',
  },
  {
    id: 'amber',
    name: 'Жёлтый JDM',
    subtitle: 'Тёплый противотуманный свет',
    price: 1500,
    beamHex: '#fbbf24',
    coreHex: '#fef3c7',
  },
  {
    id: 'xenon',
    name: 'Ледяной ксенон',
    subtitle: 'Яркий 6500K ксенон',
    price: 3000,
    beamHex: '#38bdf8',
    coreHex: '#e0f2fe',
  },
  {
    id: 'cyan',
    name: 'Бирюзовый неон',
    subtitle: 'Холодный бирюзовый LED',
    price: 4500,
    beamHex: '#06b6d4',
    coreHex: '#cffafe',
  },
  {
    id: 'lime',
    name: 'Токсик лайм',
    subtitle: 'Кислотно-зелёный луч',
    price: 6000,
    beamHex: '#4ade80',
    coreHex: '#dcfce7',
  },
  {
    id: 'purple',
    name: 'Ультрафиолет',
    subtitle: 'Фиолетовый кастом-LED',
    price: 8000,
    beamHex: '#a855f7',
    coreHex: '#f3e8ff',
  },
  {
    id: 'red',
    name: 'Красный демон',
    subtitle: 'Агрессивная красная оптика',
    price: 10000,
    beamHex: '#ef4444',
    coreHex: '#fee2e2',
  },
  {
    id: 'pink',
    name: 'Розовый неон',
    subtitle: 'Яркий стрит-неон',
    price: 12000,
    beamHex: '#ec4899',
    coreHex: '#fce7f3',
  },
  {
    id: 'gold',
    name: 'Золотой ксенон',
    subtitle: 'Люкс золотая линза',
    price: 15000,
    beamHex: '#f59e0b',
    coreHex: '#fef9c3',
  },
];

export const VALID_LIGHT_IDS: LightId[] = SCOOTER_LIGHTS.map((l) => l.id);

export function getScooterLight(id?: string): ScooterLightSpec {
  return SCOOTER_LIGHTS.find((l) => l.id === id) ?? SCOOTER_LIGHTS[0];
}

export function getVescPrice(s: ScooterSpec): number {
  return s.price > 0 ? Math.round((s.price * 0.3) / 100) * 100 : 1500;
}

export function getSecondMotorPrice(s: ScooterSpec): number {
  return s.price > 0 ? Math.round((s.price * 0.3) / 100) * 100 : 1500;
}

export function getVescMaxKmh(s: ScooterSpec): number {
  return Math.round(s.maxKmh * 1.35);
}

export function getSecondMotorPower(s: ScooterSpec): number {
  return Number((s.power * 1.72).toFixed(2));
}

export function getEffectiveScooterStats(
  s: ScooterSpec,
  hasVesc = false,
  hasSecondMotor = false
): { maxKmh: number; power: number } {
  const speedMult =
    hasVesc && hasSecondMotor ? 1.58 : hasVesc ? 1.35 : hasSecondMotor ? 1.18 : 1.0;
  const basePower = hasSecondMotor ? getSecondMotorPower(s) : s.power;
  const power = hasVesc ? Number((basePower * 1.12).toFixed(2)) : basePower;
  return {
    maxKmh: Math.round(s.maxKmh * speedMult),
    power,
  };
}

export const SCOOTER_PAINT_SWATCHES: PaintSwatch[] = [
  { id: 'black', name: 'Чёрный', hex: '#181c24' },
  { id: 'graphite', name: 'Графит', hex: '#475569' },
  { id: 'white', name: 'Белый', hex: '#f1f5f9' },
  { id: 'orange', name: 'Оранжевый', hex: '#ff6a1a' },
  { id: 'red', name: 'Красный', hex: '#ef4444' },
  { id: 'yellow', name: 'Жёлтый', hex: '#facc15' },
  { id: 'lime', name: 'Лайм', hex: '#4ade80' },
  { id: 'cyan', name: 'Бирюза', hex: '#06b6d4' },
  { id: 'blue', name: 'Синий', hex: '#3b82f6' },
  { id: 'purple', name: 'Фиолет', hex: '#a855f7' },
  { id: 'pink', name: 'Розовый', hex: '#ec4899' },
  { id: 'gold', name: 'Золотой', hex: '#f59e0b' },
];

export const SCOOTERS: ScooterSpec[] = [
  {
    id: 'c3',
    name: 'С3',
    subtitle: 'Начальный · 350W',
    price: 0,
    power: 1,
    multiplier: 1,
    maxKmh: 30,
    accent: '#e0372c',
    twoToneMono: true,
    spriteSrc: '/assets/scooters/c3.webp?v=6',
    originalSrc: '/assets/scooters/c3.png?v=2',
    spriteH: 186,
    aspect: 429 / 447,
    rearX: 0.1098,
    rearY: 0.8767,
    frontX: 0.8972,
    frontY: 0.9090,
    bottomY: 0.972,
    deckY: 0.855,
    backFootX: 0.31,
    frontFootX: 0.56,
    gripX: 0.77,
    gripY: 0.045,
    baseTiltDeg: -2.45,
  },
  {
    id: 'g2',
    name: 'Kugoo G2',
    subtitle: 'Уличный хит · 800W',
    price: 10000,
    power: 1.38,
    multiplier: 2.5,
    maxKmh: 45,
    accent: '#ff6a1a',
    spriteSrc: '/assets/scooters/g2.webp?v=9',
    originalSrc: '/assets/scooters/g2.png?v=9',
    spriteH: 198,
    aspect: 510 / 522,
    rearX: 0.1216,
    rearY: 0.8915,
    frontX: 0.8922,
    frontY: 0.8905,
    bottomY: 0.9962,
    deckY: 0.7854,
    backFootX: 0.34,
    frontFootX: 0.58,
    gripX: 0.7167,
    gripY: 0.056,
    baseTiltDeg: 0,
  },
  {
    id: 'gm',
    name: 'G2 Master',
    subtitle: 'Двухмоторный · 2000W',
    price: 15000,
    power: 1.5,
    multiplier: 3.2,
    maxKmh: 60,
    accent: '#ff8a1a',
    spriteSrc: '/assets/scooters/gm.webp?v=9',
    originalSrc: '/assets/scooters/gm.png?v=9',
    spriteH: 200,
    aspect: 518 / 538,
    rearX: 0.112,
    rearY: 0.9005,
    frontX: 0.8967,
    frontY: 0.9009,
    bottomY: 0.9981,
    deckY: 0.7955,
    backFootX: 0.33,
    frontFootX: 0.57,
    gripX: 0.7172,
    gripY: 0.045,
    baseTiltDeg: 0,
  },
  {
    id: 'm2',
    name: 'Kugoo M2',
    subtitle: 'Городской · 350W',
    price: 25000,
    power: 1.55,
    multiplier: 3.8,
    maxKmh: 35,
    accent: '#eab308',
    spriteSrc: '/assets/scooters/m2.webp?v=7',
    originalSrc: '/assets/scooters/m2.png?v=7',
    spriteH: 204,
    aspect: 471 / 522,
    rearX: 0.1038,
    rearY: 0.9068,
    frontX: 0.8972,
    frontY: 0.9082,
    bottomY: 0.985,
    deckY: 0.8542,
    backFootX: 0.33,
    frontFootX: 0.58,
    gripX: 0.74,
    gripY: 0.0742,
    baseTiltDeg: 0,
  },
  {
    id: 'g77',
    name: 'Bootfor G77',
    subtitle: 'Городской · 560W',
    price: 35000,
    power: 1.62,
    multiplier: 4.4,
    maxKmh: 30,
    accent: '#0ea5e9',
    spriteSrc: '/assets/scooters/g77.webp?v=6',
    originalSrc: '/assets/scooters/g77.png?v=5',
    spriteH: 196,
    aspect: 532 / 540,
    rearX: 0.132,
    rearY: 0.895,
    frontX: 0.892,
    frontY: 0.895,
    bottomY: 0.997,
    deckY: 0.852,
    backFootX: 0.34,
    frontFootX: 0.59,
    gripX: 0.737,
    gripY: 0.045,
    baseTiltDeg: 0,
  },
  {
    id: 'wish01',
    name: 'Kugoo Wish 01',
    subtitle: 'Электропитбайк · 1500W',
    price: 45000,
    power: 1.72,
    multiplier: 5,
    maxKmh: 55,
    accent: '#f97316',
    seated: true,
    seatX: 0.41,
    seatY: 0.36,
    fenderX: 0.059,
    fenderY: 0.378,
    scrapeKind: 'fender',
    scrapePadPx: 5,
    spriteSrc: '/assets/scooters/wish01.webp?v=6',
    originalSrc: '/assets/scooters/wish01.png?v=4',
    spriteH: 186,
    aspect: 729 / 540,
    rearX: 0.155,
    rearY: 0.790,
    frontX: 0.8435,
    frontY: 0.7815,
    bottomY: 0.996,
    deckY: 0.755,
    backFootX: 0.43,
    frontFootX: 0.46,
    gripX: 0.655,
    gripY: 0.042,
    baseTiltDeg: 0,
  },
  {
    id: 'f3',
    name: 'Kugoo F3',
    subtitle: 'Полный привод · 2400W',
    price: 50000,
    power: 1.82,
    multiplier: 5.8,
    maxKmh: 70,
    accent: '#ff7a00',
    underglow: '#2bd4ff',
    skipCyanLed: true,
    spriteSrc: '/assets/scooters/f3.webp?v=9',
    originalSrc: '/assets/scooters/f3.png?v=9',
    spriteH: 204,
    aspect: 513 / 538,
    rearX: 0.1111,
    rearY: 0.8966,
    frontX: 0.8947,
    frontY: 0.8966,
    bottomY: 0.9963,
    deckY: 0.7881,
    backFootX: 0.33,
    frontFootX: 0.57,
    gripX: 0.73,
    gripY: 0.0799,
    baseTiltDeg: 0,
  },
  {
    id: 'g2max',
    name: 'Kugoo G2 Max',
    subtitle: 'Флагман Max · 1000W',
    price: 60000,
    power: 1.9,
    multiplier: 6.5,
    maxKmh: 55,
    accent: '#a855f7',
    spriteSrc: '/assets/scooters/g2max.webp?v=9',
    originalSrc: '/assets/scooters/g2max.png?v=9',
    spriteH: 204,
    aspect: 505 / 538,
    rearX: 0.105,
    rearY: 0.9002,
    frontX: 0.8931,
    frontY: 0.8989,
    bottomY: 0.9981,
    deckY: 0.7918,
    backFootX: 0.33,
    frontFootX: 0.57,
    gripX: 0.7079,
    gripY: 0.0669,
    baseTiltDeg: 0,
  },
  {
    id: 'teverun',
    name: 'Teverun Blade Mini',
    subtitle: 'Двухмоторный · 1600W',
    price: 70000,
    power: 1.95,
    multiplier: 7.2,
    maxKmh: 60,
    accent: '#facc15',
    spriteSrc: '/assets/scooters/teverun.webp?v=6',
    originalSrc: '/assets/scooters/teverun.png?v=1',
    spriteH: 206,
    aspect: 506 / 540,
    rearX: 0.110,
    rearY: 0.90,
    frontX: 0.895,
    frontY: 0.90,
    bottomY: 0.997,
    deckY: 0.820,
    backFootX: 0.34,
    frontFootX: 0.59,
    gripX: 0.765,
    gripY: 0.032,
    baseTiltDeg: 0,
  },
  {
    id: 'g2ultra',
    name: 'Kukirin G2 Ultra',
    subtitle: 'Двухмоторный · 1600W',
    price: 70000,
    power: 1.98,
    multiplier: 7.6,
    maxKmh: 65,
    accent: '#f97316',
    spriteSrc: '/assets/scooters/g2ultra.webp?v=9',
    originalSrc: '/assets/scooters/g2ultra.png?v=9',
    spriteH: 206,
    aspect: 497 / 536,
    rearX: 0.1207,
    rearY: 0.8994,
    frontX: 0.8944,
    frontY: 0.9037,
    bottomY: 0.9963,
    deckY: 0.8022,
    backFootX: 0.34,
    frontFootX: 0.58,
    gripX: 0.718,
    gripY: 0.056,
    baseTiltDeg: 0,
  },
  {
    id: 'g2pro',
    name: 'Kugoo G2 Pro',
    subtitle: 'Стант кастом 95',
    price: 100000,
    power: 2.05,
    multiplier: 8.5,
    maxKmh: 100,
    accent: '#d946ef',
    paintMode: 'single',
    fenderX: 0.008,
    fenderY: 0.561,
    scrapeKind: 'bugel',
    scrapePadPx: 5,
    spriteSrc: '/assets/scooters/g2pro.webp?v=6',
    originalSrc: '/assets/scooters/g2pro.png?v=2',
    spriteH: 214,
    aspect: 514 / 540,
    rearX: 0.170,
    rearY: 0.895,
    frontX: 0.888,
    frontY: 0.895,
    bottomY: 0.997,
    deckY: 0.760,
    backFootX: 0.38,
    frontFootX: 0.61,
    gripX: 0.635,
    gripY: 0.025,
    baseTiltDeg: 0,
  },
  {
    id: 'g4max',
    name: 'Kugoo G4 Max',
    subtitle: 'Полный привод · 4800W',
    price: 120000,
    power: 2.15,
    multiplier: 10,
    maxKmh: 95,
    accent: '#ff5500',
    underglow: '#ff6a1a',
    spriteSrc: '/assets/scooters/g4max.webp?v=9',
    originalSrc: '/assets/scooters/g4max.png?v=9',
    spriteH: 212,
    aspect: 622 / 618,
    rearX: 0.1158,
    rearY: 0.8916,
    frontX: 0.8537,
    frontY: 0.8932,
    bottomY: 0.997,
    deckY: 0.8252,
    backFootX: 0.3291,
    frontFootX: 0.571,
    gripX: 0.7556,
    gripY: 0.085,
    baseTiltDeg: 0,
  },
  {
    id: 'thunder3',
    name: 'Dualtron Thunder 3',
    subtitle: 'Гиперсамокат · 10800W',
    price: 500000,
    power: 2.32,
    multiplier: 6,
    maxKmh: 135,
    accent: '#06b6d4',
    underglow: '#06b6d4',
    spriteSrc: '/assets/scooters/thunder3.webp?v=6',
    originalSrc: '/assets/scooters/thunder3.png?v=2',
    spriteH: 214,
    aspect: 485 / 540,
    rearX: 0.132,
    rearY: 0.905,
    frontX: 0.884,
    frontY: 0.905,
    bottomY: 0.992,
    deckY: 0.759,
    backFootX: 0.34,
    frontFootX: 0.58,
    gripX: 0.707,
    gripY: 0.047,
    baseTiltDeg: 0,
  },
  {
    id: 'wish02pro',
    name: 'Kugoo Wish 02 Pro',
    subtitle: 'Электропитбайк · 2500W',
    price: 85000,
    power: 1.92,
    multiplier: 6.4,
    maxKmh: 70,
    accent: '#f97316',
    seated: true,
    seatX: 0.38,
    seatY: 0.33,
    spriteSrc: '/assets/scooters/wish02pro.webp?v=6',
    originalSrc: '/assets/scooters/wish02pro.png?v=1',
    spriteH: 194,
    aspect: 698 / 490,
    rearX: 0.173,
    rearY: 0.7515,
    frontX: 0.8257,
    frontY: 0.734,
    bottomY: 0.991,
    deckY: 0.76,
    backFootX: 0.44,
    frontFootX: 0.47,
    gripX: 0.642,
    gripY: 0.11,
    baseTiltDeg: 0,
  },
  {
    id: 'surron',
    name: 'Sur-Ron Light Bee X',
    subtitle: 'Электропитбайк · 6000W',
    price: 160000,
    power: 2.14,
    multiplier: 8.8,
    maxKmh: 75,
    accent: '#cbd5e1',
    seated: true,
    twoToneMono: true,
    seatX: 0.38,
    seatY: 0.31,
    spriteSrc: '/assets/scooters/surron.webp?v=6',
    originalSrc: '/assets/scooters/surron.png?v=1',
    spriteH: 196,
    aspect: 883 / 532,
    rearX: 0.171,
    rearY: 0.7302,
    frontX: 0.8283,
    frontY: 0.7299,
    bottomY: 0.9985,
    deckY: 0.69,
    backFootX: 0.425,
    frontFootX: 0.455,
    gripX: 0.662,
    gripY: 0.075,
    baseTiltDeg: 0,
  },
  {
    id: 'starkvarg',
    name: 'Stark VARG',
    subtitle: 'Электрокросс · 80 л.с.',
    price: 650000,
    caseOnly: true,
    power: 2.48,
    multiplier: 11.5,
    maxKmh: 140,
    accent: '#94a3b8',
    seated: true,
    twoToneMono: true,
    seatX: 0.39,
    seatY: 0.27,
    fenderX: 0.022,
    fenderY: 0.21,
    scrapeKind: 'fender',
    scrapePadPx: 6,
    spriteSrc: '/assets/scooters/starkvarg.webp?v=6',
    originalSrc: '/assets/scooters/starkvarg.png?v=1',
    spriteH: 198,
    aspect: 460 / 273,
    rearX: 0.1595,
    rearY: 0.7385,
    frontX: 0.8366,
    frontY: 0.7311,
    bottomY: 0.997,
    deckY: 0.64,
    backFootX: 0.415,
    frontFootX: 0.445,
    gripX: 0.602,
    gripY: 0.045,
    baseTiltDeg: 0,
  },
];

export function getScooter(id: ScooterId): ScooterSpec {
  return SCOOTERS.find((s) => s.id === id) ?? SCOOTERS[0];
}
