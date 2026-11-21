import { drawMotocrossHelmet, type HelmetId, type MotocrossHelmet } from './helmets';

export type OutfitId =
  | 'black_stant'
  | 'street_white'
  | 'tech_camo'
  | 'denim_street'
  | 'neon_cyber'
  | 'winter_puffer'
  | 'crimson_mx'
  | 'track_sport'
  | 'arctic_ice'
  | 'enduro_fox'
  | 'toxic_lime'
  | 'purple_drip'
  | 'biker_skull'
  | 'cobalt_gp'
  | 'sand_tactical'
  | 'sakura_drift'
  | 'samurai_vest'
  | 'lava_flame'
  | 'gold_pro'
  | 'carbon_stealth';

export type GarmentStyle =
  | 'hoodie'
  | 'puffer'
  | 'mx_jersey'
  | 'leather_biker'
  | 'windbreaker'
  | 'tactical_vest'
  | 'denim_street';

export type PantsStyle = 'cargo' | 'track' | 'mx_pants' | 'ripped_jeans';
export type ShoeStyle = 'hightop' | 'mx_boot' | 'runner';

export interface RiderOutfit {
  id: OutfitId;
  name: string;
  subtitle: string;
  price: number;
  garmentStyle?: GarmentStyle;
  pantsStyle?: PantsStyle;
  shoeStyle?: ShoeStyle;
  raceNum?: string;
  // Torso / Jacket / Jersey
  hoodie: string;
  hoodieShade: string;
  hoodieOutline: string;
  hood: string;
  sleeve: string;
  sleeveBack: string;
  stripe: string; // 'auto' -> matches scooter accent color
  cuff: string;
  // Pants
  pants: string;
  pantsBack: string;
  pantsPocket: string;
  kneePad: string;
  // Footwear
  shoeUpper: string;
  shoeSole: string;
  shoeAccent: string;
  // Gloves
  glove: string;
  gloveKnuckle: string;
}

export interface RiderGearSet {
  id: string;
  name: string;
  subtitle: string;
  outfitId: OutfitId;
  helmetId: HelmetId;
  bundlePrice: number;
  tag: string;
  accentColor: string;
}

export const OUTFITS: RiderOutfit[] = [
  {
    id: 'black_stant',
    name: 'BLACK STANT',
    subtitle: 'Оверсайз худи · карго',
    price: 0,
    garmentStyle: 'hoodie',
    pantsStyle: 'cargo',
    shoeStyle: 'hightop',
    hoodie: '#1a1f27',
    hoodieShade: '#11151b',
    hoodieOutline: '#090c10',
    hood: '#13171e',
    sleeve: '#1e242e',
    sleeveBack: '#13171e',
    stripe: 'auto',
    cuff: '#0e1116',
    pants: '#252b35',
    pantsBack: '#181c23',
    pantsPocket: '#1b2028',
    kneePad: '#13171e',
    shoeUpper: '#14181f',
    shoeSole: '#f1f5f9',
    shoeAccent: 'auto',
    glove: '#11141a',
    gloveKnuckle: '#94a3b8',
  },
  {
    id: 'street_white',
    name: 'Белый Стант',
    subtitle: 'Оверсайз · рваные джинсы',
    price: 0,
    garmentStyle: 'hoodie',
    pantsStyle: 'ripped_jeans',
    shoeStyle: 'hightop',
    hoodie: '#edf1f6',
    hoodieShade: '#cfd8e3',
    hoodieOutline: '#334155',
    hood: '#dce3ec',
    sleeve: '#e6ecf3',
    sleeveBack: '#c4ceda',
    stripe: '#181c23',
    cuff: '#181c23',
    pants: '#1a1f27',
    pantsBack: '#11141a',
    pantsPocket: '#262d38',
    kneePad: '#0f1318',
    shoeUpper: '#181c23',
    shoeSole: '#ffffff',
    shoeAccent: '#e2e8f0',
    glove: '#14181f',
    gloveKnuckle: '#e2e8f0',
  },
  {
    id: 'tech_camo',
    name: 'Урбан Разгрузка',
    subtitle: 'Тактик жилет · карго',
    price: 4000,
    garmentStyle: 'tactical_vest',
    pantsStyle: 'cargo',
    shoeStyle: 'hightop',
    hoodie: '#3f4f3a',
    hoodieShade: '#232d20',
    hoodieOutline: '#151b13',
    hood: '#2c3828',
    sleeve: '#465740',
    sleeveBack: '#313e2d',
    stripe: '#ff7a1a',
    cuff: '#181c19',
    pants: '#23272e',
    pantsBack: '#171a1f',
    pantsPocket: '#343b45',
    kneePad: '#15181d',
    shoeUpper: '#2a2f28',
    shoeSole: '#e7e5d8',
    shoeAccent: '#ff7a1a',
    glove: '#1a1e1a',
    gloveKnuckle: '#d97706',
  },
  {
    id: 'denim_street',
    name: 'Джинсовка Улица',
    subtitle: 'Деним-куртка · джинсы',
    price: 5500,
    garmentStyle: 'denim_street',
    pantsStyle: 'ripped_jeans',
    shoeStyle: 'hightop',
    hoodie: '#2d4b73',
    hoodieShade: '#1d324f',
    hoodieOutline: '#0f1b2d',
    hood: '#e2e8f0',
    sleeve: '#335582',
    sleeveBack: '#213857',
    stripe: '#f59e0b',
    cuff: '#1d324f',
    pants: '#1a202c',
    pantsBack: '#10141c',
    pantsPocket: '#2d3748',
    kneePad: '#cbd5e1',
    shoeUpper: '#1e242d',
    shoeSole: '#ffffff',
    shoeAccent: '#38bdf8',
    glove: '#1a202c',
    gloveKnuckle: '#94a3b8',
  },
  {
    id: 'neon_cyber',
    name: 'Неон Ветровка',
    subtitle: 'Ветровка · кроссовки',
    price: 6000,
    garmentStyle: 'windbreaker',
    pantsStyle: 'track',
    shoeStyle: 'runner',
    hoodie: '#111827',
    hoodieShade: '#0b101b',
    hoodieOutline: '#04070d',
    hood: '#0f172a',
    sleeve: '#162033',
    sleeveBack: '#0d1422',
    stripe: '#06b6d4',
    cuff: '#0891b2',
    pants: '#17202e',
    pantsBack: '#0e1520',
    pantsPocket: '#233044',
    kneePad: '#06b6d4',
    shoeUpper: '#0f172a',
    shoeSole: '#ecfeff',
    shoeAccent: '#22d3ee',
    glove: '#0f172a',
    gloveKnuckle: '#22d3ee',
  },
  {
    id: 'winter_puffer',
    name: 'Белый Пуховик',
    subtitle: 'Объёмный пуховик · карго',
    price: 7500,
    garmentStyle: 'puffer',
    pantsStyle: 'cargo',
    shoeStyle: 'hightop',
    hoodie: '#e5e9f0',
    hoodieShade: '#bcc6d4',
    hoodieOutline: '#334155',
    hood: '#1e293b',
    sleeve: '#edf1f7',
    sleeveBack: '#c7d0dc',
    stripe: '#111827',
    cuff: '#0f172a',
    pants: '#1c222b',
    pantsBack: '#12161d',
    pantsPocket: '#2b3340',
    kneePad: '#0f131a',
    shoeUpper: '#141920',
    shoeSole: '#ffffff',
    shoeAccent: '#ff6a1a',
    glove: '#11151c',
    gloveKnuckle: '#e2e8f0',
  },
  {
    id: 'crimson_mx',
    name: 'Красный Мотокросс',
    subtitle: 'Мото-джерси #77 · мотоботы',
    price: 8000,
    garmentStyle: 'mx_jersey',
    pantsStyle: 'mx_pants',
    shoeStyle: 'mx_boot',
    raceNum: '77',
    hoodie: '#dc2626',
    hoodieShade: '#991b1b',
    hoodieOutline: '#450a0a',
    hood: '#b91c1c',
    sleeve: '#181c23',
    sleeveBack: '#101318',
    stripe: '#ffffff',
    cuff: '#991b1b',
    pants: '#181b22',
    pantsBack: '#101217',
    pantsPocket: '#252932',
    kneePad: '#dc2626',
    shoeUpper: '#b91c1c',
    shoeSole: '#ffffff',
    shoeAccent: '#ffffff',
    glove: '#181b22',
    gloveKnuckle: '#ef4444',
  },
  {
    id: 'track_sport',
    name: 'Олимпийка Спорт',
    subtitle: 'Спортивка с лампасами',
    price: 8500,
    garmentStyle: 'windbreaker',
    pantsStyle: 'track',
    shoeStyle: 'runner',
    hoodie: '#171920',
    hoodieShade: '#0d0f14',
    hoodieOutline: '#050608',
    hood: '#262934',
    sleeve: '#1f222b',
    sleeveBack: '#12141a',
    stripe: '#f8fafc',
    cuff: '#f8fafc',
    pants: '#15171d',
    pantsBack: '#0c0d11',
    pantsPocket: '#262933',
    kneePad: '#e2e8f0',
    shoeUpper: '#14171f',
    shoeSole: '#ffffff',
    shoeAccent: '#f8fafc',
    glove: '#12141b',
    gloveKnuckle: '#f8fafc',
  },
  {
    id: 'arctic_ice',
    name: 'Арктик Пуховик',
    subtitle: 'Зимний пуховик · ледяной',
    price: 9500,
    garmentStyle: 'puffer',
    pantsStyle: 'cargo',
    shoeStyle: 'runner',
    hoodie: '#dbeafe',
    hoodieShade: '#93c5fd',
    hoodieOutline: '#1e3a8a',
    hood: '#bfdbfe',
    sleeve: '#e0f2fe',
    sleeveBack: '#bae6fd',
    stripe: '#0284c7',
    cuff: '#0f172a',
    pants: '#1e293b',
    pantsBack: '#0f172a',
    pantsPocket: '#334155',
    kneePad: '#38bdf8',
    shoeUpper: '#0f172a',
    shoeSole: '#f8fafc',
    shoeAccent: '#38bdf8',
    glove: '#1e293b',
    gloveKnuckle: '#7dd3fc',
  },
  {
    id: 'enduro_fox',
    name: 'Эндуро Джерси',
    subtitle: 'Пит-джерси #52 · панцирь',
    price: 10500,
    garmentStyle: 'mx_jersey',
    pantsStyle: 'mx_pants',
    shoeStyle: 'mx_boot',
    raceNum: '52',
    hoodie: '#ff6a1a',
    hoodieShade: '#c2410c',
    hoodieOutline: '#431407',
    hood: '#ea580c',
    sleeve: '#181c23',
    sleeveBack: '#101318',
    stripe: '#f8fafc',
    cuff: '#ea580c',
    pants: '#181b22',
    pantsBack: '#0f1217',
    pantsPocket: '#2d323e',
    kneePad: '#ff6a1a',
    shoeUpper: '#161920',
    shoeSole: '#e2e8f0',
    shoeAccent: '#ff6a1a',
    glove: '#14171d',
    gloveKnuckle: '#ff8b4a',
  },
  {
    id: 'toxic_lime',
    name: 'Токсик Броня',
    subtitle: 'Жилет · лампасы · неон',
    price: 11000,
    garmentStyle: 'tactical_vest',
    pantsStyle: 'track',
    shoeStyle: 'runner',
    hoodie: '#181b1e',
    hoodieShade: '#101214',
    hoodieOutline: '#060708',
    hood: '#1f2428',
    sleeve: '#20262b',
    sleeveBack: '#131619',
    stripe: '#84cc16',
    cuff: '#65a30d',
    pants: '#1c2024',
    pantsBack: '#111417',
    pantsPocket: '#2a3036',
    kneePad: '#84cc16',
    shoeUpper: '#14181b',
    shoeSole: '#ecfccb',
    shoeAccent: '#a3e635',
    glove: '#14171a',
    gloveKnuckle: '#a3e635',
  },
  {
    id: 'purple_drip',
    name: 'Фиолет 95',
    subtitle: 'Сет-худи под G2 Pro 95',
    price: 12000,
    garmentStyle: 'hoodie',
    pantsStyle: 'cargo',
    shoeStyle: 'hightop',
    hoodie: '#6d28d9',
    hoodieShade: '#4c1d95',
    hoodieOutline: '#2e1065',
    hood: '#5b21b6',
    sleeve: '#1a1726',
    sleeveBack: '#110f1a',
    stripe: '#e879f9',
    cuff: '#4c1d95',
    pants: '#272935',
    pantsBack: '#1a1b24',
    pantsPocket: '#353848',
    kneePad: '#181922',
    shoeUpper: '#1d1829',
    shoeSole: '#f8fafc',
    shoeAccent: '#d946ef',
    glove: '#161321',
    gloveKnuckle: '#e879f9',
  },
  {
    id: 'biker_skull',
    name: 'Косуха Мото',
    subtitle: 'Кожаная косуха · боты',
    price: 13000,
    garmentStyle: 'leather_biker',
    pantsStyle: 'ripped_jeans',
    shoeStyle: 'mx_boot',
    hoodie: '#16161a',
    hoodieShade: '#0b0b0e',
    hoodieOutline: '#030305',
    hood: '#991b1b',
    sleeve: '#1b1b20',
    sleeveBack: '#0e0e12',
    stripe: '#ef4444',
    cuff: '#cbd5e1',
    pants: '#1a1c22',
    pantsBack: '#0f1014',
    pantsPocket: '#282b34',
    kneePad: '#dc2626',
    shoeUpper: '#131317',
    shoeSole: '#e2e8f0',
    shoeAccent: '#ef4444',
    glove: '#121216',
    gloveKnuckle: '#ef4444',
  },
  {
    id: 'cobalt_gp',
    name: 'Кобальт GP',
    subtitle: 'Рейс-джерси #01 · мотоботы',
    price: 14000,
    garmentStyle: 'mx_jersey',
    pantsStyle: 'mx_pants',
    shoeStyle: 'mx_boot',
    raceNum: '01',
    hoodie: '#1d4ed8',
    hoodieShade: '#1e3a8a',
    hoodieOutline: '#172554',
    hood: '#1e40af',
    sleeve: '#1e293b',
    sleeveBack: '#0f172a',
    stripe: '#f8fafc',
    cuff: '#1d4ed8',
    pants: '#171d29',
    pantsBack: '#0e131c',
    pantsPocket: '#263042',
    kneePad: '#2563eb',
    shoeUpper: '#1e3a8a',
    shoeSole: '#ffffff',
    shoeAccent: '#60a5fa',
    glove: '#111827',
    gloveKnuckle: '#3b82f6',
  },
  {
    id: 'sand_tactical',
    name: 'Пустынный Тактик',
    subtitle: 'Плитоноска · тактик-боты',
    price: 15000,
    garmentStyle: 'tactical_vest',
    pantsStyle: 'cargo',
    shoeStyle: 'mx_boot',
    hoodie: '#a68b67',
    hoodieShade: '#69553b',
    hoodieOutline: '#423320',
    hood: '#8c7250',
    sleeve: '#9b805c',
    sleeveBack: '#725c3e',
    stripe: '#f59e0b',
    cuff: '#292d23',
    pants: '#343b2c',
    pantsBack: '#23281d',
    pantsPocket: '#454e3b',
    kneePad: '#1f2419',
    shoeUpper: '#574631',
    shoeSole: '#e7e2d3',
    shoeAccent: '#f59e0b',
    glove: '#282c21',
    gloveKnuckle: '#f59e0b',
  },
  {
    id: 'sakura_drift',
    name: 'Сакура Дрифт',
    subtitle: 'Дрифт-ветровка · розовый',
    price: 16500,
    garmentStyle: 'windbreaker',
    pantsStyle: 'track',
    shoeStyle: 'runner',
    hoodie: '#ec4899',
    hoodieShade: '#be185d',
    hoodieOutline: '#500724',
    hood: '#db2777',
    sleeve: '#1b1821',
    sleeveBack: '#110e16',
    stripe: '#fbcfe8',
    cuff: '#be185d',
    pants: '#19171f',
    pantsBack: '#100e14',
    pantsPocket: '#2a2634',
    kneePad: '#f472b6',
    shoeUpper: '#18141c',
    shoeSole: '#fdf2f8',
    shoeAccent: '#f472b6',
    glove: '#16131b',
    gloveKnuckle: '#f472b6',
  },
  {
    id: 'samurai_vest',
    name: 'Самурай Броня',
    subtitle: 'Бронежилет · мотоштаны',
    price: 17500,
    garmentStyle: 'tactical_vest',
    pantsStyle: 'mx_pants',
    shoeStyle: 'runner',
    hoodie: '#18181b',
    hoodieShade: '#0c0c0f',
    hoodieOutline: '#040406',
    hood: '#27272a',
    sleeve: '#27272a',
    sleeveBack: '#16161a',
    stripe: '#e11d48',
    cuff: '#e11d48',
    pants: '#18181c',
    pantsBack: '#0d0d10',
    pantsPocket: '#2d2d35',
    kneePad: '#e11d48',
    shoeUpper: '#141418',
    shoeSole: '#ffe4e6',
    shoeAccent: '#fb7185',
    glove: '#141418',
    gloveKnuckle: '#fb7185',
  },
  {
    id: 'lava_flame',
    name: 'Лава Пуховик',
    subtitle: 'Огненный пуховик · мотоботы',
    price: 18000,
    garmentStyle: 'puffer',
    pantsStyle: 'mx_pants',
    shoeStyle: 'mx_boot',
    hoodie: '#ea580c',
    hoodieShade: '#9a3412',
    hoodieOutline: '#431407',
    hood: '#c2410c',
    sleeve: '#1c1917',
    sleeveBack: '#0c0a09',
    stripe: '#facc15',
    cuff: '#9a3412',
    pants: '#1c1917',
    pantsBack: '#0c0a09',
    pantsPocket: '#292524',
    kneePad: '#f97316',
    shoeUpper: '#1c1917',
    shoeSole: '#fef08a',
    shoeAccent: '#fb923c',
    glove: '#141210',
    gloveKnuckle: '#facc15',
  },
  {
    id: 'gold_pro',
    name: 'Золотой Байкер',
    subtitle: 'Про-косуха · золото · боты',
    price: 20000,
    garmentStyle: 'leather_biker',
    pantsStyle: 'mx_pants',
    shoeStyle: 'mx_boot',
    hoodie: '#13161c',
    hoodieShade: '#0b0d11',
    hoodieOutline: '#050608',
    hood: '#191d26',
    sleeve: '#171b23',
    sleeveBack: '#0e1116',
    stripe: '#f59e0b',
    cuff: '#f59e0b',
    pants: '#151820',
    pantsBack: '#0d0f14',
    pantsPocket: '#222733',
    kneePad: '#f59e0b',
    shoeUpper: '#12151b',
    shoeSole: '#fef3c7',
    shoeAccent: '#f59e0b',
    glove: '#111318',
    gloveKnuckle: '#fbbf24',
  },
  {
    id: 'carbon_stealth',
    name: 'Карбон Косуха',
    subtitle: 'Тотал блэк · косуха · титан',
    price: 25000,
    garmentStyle: 'leather_biker',
    pantsStyle: 'ripped_jeans',
    shoeStyle: 'hightop',
    hoodie: '#0d1015',
    hoodieShade: '#06080b',
    hoodieOutline: '#020305',
    hood: '#11151d',
    sleeve: '#10141b',
    sleeveBack: '#07090d',
    stripe: '#94a3b8',
    cuff: '#cbd5e1',
    pants: '#0e1117',
    pantsBack: '#06080b',
    pantsPocket: '#1b202b',
    kneePad: '#475569',
    shoeUpper: '#0b0e13',
    shoeSole: '#334155',
    shoeAccent: '#cbd5e1',
    glove: '#090b0f',
    gloveKnuckle: '#cbd5e1',
  },
];

export const STUNT_SETS: RiderGearSet[] = [
  {
    id: 'set_urban_street',
    name: 'Сет «Уличный Ски»',
    subtitle: 'Джинсовка + Рваные джинсы + Шлем «Уличный Ски»',
    outfitId: 'denim_street',
    helmetId: 'mx_urban',
    bundlePrice: 8500,
    tag: 'УЛИЦА',
    accentColor: '#38bdf8',
  },
  {
    id: 'set_enduro_pit',
    name: 'Сет «Эндуро Пит»',
    subtitle: 'Пит-джерси #52 + Мотоботы + MX Шторм',
    outfitId: 'enduro_fox',
    helmetId: 'mx_red',
    bundlePrice: 13500,
    tag: 'ПИТБАЙК',
    accentColor: '#ff6a1a',
  },
  {
    id: 'set_arctic_puffer',
    name: 'Сет «Арктик Дрифт»',
    subtitle: 'Арктик Пуховик + Шлем «Арктика Аэро»',
    outfitId: 'arctic_ice',
    helmetId: 'mx_arctic',
    bundlePrice: 13000,
    tag: 'ЗИМА · АЭРО',
    accentColor: '#38bdf8',
  },
  {
    id: 'set_cyber_wind',
    name: 'Сет «Кибер Ветровка»',
    subtitle: 'Неон Ветровка + Лампасы + Шлем «Неон Визор»',
    outfitId: 'neon_cyber',
    helmetId: 'mx_cyber',
    bundlePrice: 11500,
    tag: 'НЕОН · СПОРТ',
    accentColor: '#22d3ee',
  },
  {
    id: 'set_toxic_armored',
    name: 'Сет «Токсик Броня»',
    subtitle: 'Тактический жилет + Лампасы + MX Кислота',
    outfitId: 'toxic_lime',
    helmetId: 'mx_lime',
    bundlePrice: 13800,
    tag: 'ТАКТИК',
    accentColor: '#a3e635',
  },
  {
    id: 'set_cobalt_gp',
    name: 'Сет «Кобальт GP»',
    subtitle: 'Рейс-джерси #01 + Мотоботы + Шлем «Спойлер GP»',
    outfitId: 'cobalt_gp',
    helmetId: 'mx_track_gp',
    bundlePrice: 19500,
    tag: 'ТРЕК · ЭПИК',
    accentColor: '#60a5fa',
  },
  {
    id: 'set_night_biker',
    name: 'Сет «Ночной Байкер»',
    subtitle: 'Кожаная косуха + Мотоботы + «Дьявол Карбон»',
    outfitId: 'biker_skull',
    helmetId: 'mx_devil',
    bundlePrice: 21000,
    tag: 'ЛЕГЕНДА',
    accentColor: '#fb7185',
  },
  {
    id: 'set_gold_champ',
    name: 'Сет «Чемпион Золото»',
    subtitle: 'Золотой Байкер + Мотоботы + MX Чемпион',
    outfitId: 'gold_pro',
    helmetId: 'mx_gold',
    bundlePrice: 26500,
    tag: 'ЧЕМПИОН',
    accentColor: '#fbbf24',
  },
];

export function getOutfit(id: OutfitId): RiderOutfit {
  return OUTFITS.find((o) => o.id === id) ?? OUTFITS[0];
}

export interface RiderDrawPt {
  x: number;
  y: number;
}

export interface StyledRiderPose {
  hip: RiderDrawPt;
  shoulder: RiderDrawPt;
  head: RiderDrawPt;
  backKnee: RiderDrawPt;
  backFoot: RiderDrawPt;
  frontKnee: RiderDrawPt;
  frontFoot: RiderDrawPt;
  backElbow: RiderDrawPt;
  backHand: RiderDrawPt;
  frontElbow: RiderDrawPt;
  frontHand: RiderDrawPt;
  headAngle?: number;
  flatFeet?: boolean;
  kneeling?: number;
  frontFootAngle?: number;
  backFootAngle?: number;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.max(0, Math.min(r, Math.abs(w) * 0.5, Math.abs(h) * 0.5));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawCapsule(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  wStart: number,
  wEnd: number,
  fill: string,
  outline?: string,
  outlineW = 1.4
) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 0.01) return;
  const ang = Math.atan2(dy, dx);
  const r1 = wStart * 0.5;
  const r2 = wEnd * 0.5;

  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -r1);
  ctx.lineTo(len, -r2);
  ctx.arc(len, 0, r2, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(0, r1);
  ctx.arc(0, 0, r1, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = outlineW;
    ctx.stroke();
  }
  ctx.restore();
}

function drawRiderFootwear(
  ctx: CanvasRenderingContext2D,
  knee: RiderDrawPt,
  foot: RiderDrawPt,
  u: number,
  outfit: RiderOutfit,
  accent: string,
  flatFoot: boolean,
  isBack: boolean,
  kneeling = 0,
  footAngleOverride?: number
) {
  ctx.save();
  ctx.translate(foot.x, foot.y);
  let rot = 0;
  if (!flatFoot) {
    rot = Math.atan2(foot.y - knee.y, foot.x - knee.x) - Math.PI / 2;
  } else if (footAngleOverride !== undefined && Math.abs(footAngleOverride) > 0.005) {
    rot = footAngleOverride;
  } else if (!isBack && kneeling > 0.02) {
    const shinRot = Math.atan2(foot.y - knee.y, foot.x - knee.x) - Math.PI / 2;
    rot = shinRot * kneeling;
  }
  ctx.rotate(rot);

  const s = u;
  ctx.globalAlpha = isBack ? 0.94 : 1;
  const shoeStyle: ShoeStyle = outfit.shoeStyle ?? 'hightop';

  if (shoeStyle === 'mx_boot') {
    // Tall armored motocross boot with shin guard & metal buckles
    ctx.beginPath();
    ctx.moveTo(-6.8 * s, -15.5 * s);
    ctx.lineTo(4.2 * s, -15.0 * s);
    ctx.lineTo(6.8 * s, -3.5 * s);
    ctx.quadraticCurveTo(14.5 * s, -2.2 * s, 14.8 * s, 1.8 * s);
    ctx.lineTo(-7.2 * s, 1.8 * s);
    ctx.closePath();
    ctx.fillStyle = isBack ? '#0d1016' : outfit.shoeUpper;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 1.2 * s;
    ctx.stroke();

    // Shin plate
    ctx.fillStyle = accent;
    roundedRectPath(ctx, -1.2 * s, -14.0 * s, 5.2 * s, 10.5 * s, 1.4 * s);
    ctx.fill();

    // 3 Silver MX boot buckles
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-5.6 * s, -12.5 * s, 5.0 * s, 1.6 * s);
    ctx.fillRect(-5.6 * s, -8.5 * s, 5.0 * s, 1.6 * s);
    ctx.fillRect(-5.4 * s, -4.5 * s, 5.0 * s, 1.6 * s);

    // Thick lugged sole
    ctx.fillStyle = outfit.shoeSole;
    roundedRectPath(ctx, -7.6 * s, 1.0 * s, 22.8 * s, 3.8 * s, 1.2 * s);
    ctx.fill();
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(-7.0 * s, 3.6 * s, 21.6 * s, 1.4 * s);

    ctx.restore();
    return;
  }

  if (shoeStyle === 'runner') {
    // Low-cut chunky tech sneaker with sculpted air sole
    ctx.beginPath();
    ctx.moveTo(-6.6 * s, -5.2 * s);
    ctx.lineTo(3.2 * s, -5.6 * s);
    ctx.lineTo(8.2 * s, -2.0 * s);
    ctx.quadraticCurveTo(14.5 * s, -1.4 * s, 14.8 * s, 1.2 * s);
    ctx.lineTo(-7.4 * s, 1.2 * s);
    ctx.closePath();
    ctx.fillStyle = isBack ? '#0d1016' : outfit.shoeUpper;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.0 * s;
    ctx.stroke();

    // Tech heel tab & side cage
    ctx.fillStyle = accent;
    roundedRectPath(ctx, -6.5 * s, -4.6 * s, 4.2 * s, 5.0 * s, 1.2 * s);
    ctx.fill();

    // Sculpted chunky midsole + air bubble
    ctx.fillStyle = outfit.shoeSole;
    roundedRectPath(ctx, -8.0 * s, 0.2 * s, 23.2 * s, 4.2 * s, 2.0 * s);
    ctx.fill();
    ctx.fillStyle = accent;
    roundedRectPath(ctx, -4.5 * s, 1.4 * s, 5.5 * s, 1.8 * s, 0.9 * s);
    ctx.fill();

    ctx.restore();
    return;
  }

  // Default: High-top street skate sneaker
  ctx.beginPath();
  ctx.moveTo(-6.2 * s, -7.5 * s);
  ctx.lineTo(2.8 * s, -7.2 * s);
  ctx.lineTo(7.4 * s, -2.5 * s);
  ctx.quadraticCurveTo(13.8 * s, -2.0 * s, 14.2 * s, 1.4 * s);
  ctx.lineTo(-6.8 * s, 1.4 * s);
  ctx.quadraticCurveTo(-7.8 * s, -2.2 * s, -6.2 * s, -7.5 * s);
  ctx.closePath();
  ctx.fillStyle = isBack ? '#0d1016' : outfit.shoeUpper;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.lineWidth = 1.1 * s;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-5.8 * s, -4.4 * s);
  ctx.lineTo(4.2 * s, -1.6 * s);
  ctx.lineTo(1.5 * s, 0.2 * s);
  ctx.lineTo(-6.2 * s, -1.8 * s);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = outfit.shoeSole;
  roundedRectPath(ctx, -7.2 * s, 0.2 * s, 21.8 * s, 3.6 * s, 1.6 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.9 * s;
  ctx.stroke();

  ctx.fillStyle = '#0f1318';
  ctx.fillRect(-6.8 * s, 3.1 * s, 20.6 * s, 1.0 * s);

  ctx.restore();
}

function drawStuntGlove(
  ctx: CanvasRenderingContext2D,
  elbow: RiderDrawPt,
  hand: RiderDrawPt,
  u: number,
  outfit: RiderOutfit,
  isBack: boolean
) {
  const ang = Math.atan2(hand.y - elbow.y, hand.x - elbow.x);
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(ang);

  ctx.fillStyle = outfit.cuff;
  roundedRectPath(ctx, -7.5 * u, -4.3 * u, 4.5 * u, 8.6 * u, 1.8 * u);
  ctx.fill();

  ctx.fillStyle = isBack ? '#0d1016' : outfit.glove;
  ctx.beginPath();
  ctx.arc(0.5 * u, 0, 5.4 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.0 * u;
  ctx.stroke();

  if (!isBack) {
    ctx.fillStyle = outfit.gloveKnuckle;
    roundedRectPath(ctx, -1.2 * u, -4.8 * u, 4.6 * u, 2.2 * u, 1.0 * u);
    ctx.fill();
  }

  ctx.restore();
}

function drawLegGarment(
  ctx: CanvasRenderingContext2D,
  hip: RiderDrawPt,
  knee: RiderDrawPt,
  foot: RiderDrawPt,
  u: number,
  outfit: RiderOutfit,
  accent: string,
  stripeColor: string,
  flatFoot: boolean,
  isBack: boolean,
  kneeling = 0,
  footAngleOverride?: number
) {
  const pantFill = isBack ? outfit.pantsBack : outfit.pants;
  const outline = 'rgba(5, 8, 13, 0.58)';
  const pantsStyle: PantsStyle = outfit.pantsStyle ?? 'cargo';

  const thighW = pantsStyle === 'ripped_jeans' ? 13.6 * u : 15.8 * u;
  const kneeW = pantsStyle === 'ripped_jeans' ? 11.4 * u : 13.6 * u;
  const shinTopW = pantsStyle === 'ripped_jeans' ? 10.8 * u : 13.0 * u;
  const shinBotW = pantsStyle === 'ripped_jeans' ? 8.8 * u : 10.2 * u;

  drawCapsule(ctx, hip.x, hip.y, knee.x, knee.y, thighW, kneeW, pantFill, outline, 1.2 * u);

  const dx = foot.x - knee.x;
  const dy = foot.y - knee.y;
  const len = Math.hypot(dx, dy) || 1;
  const ankleX = foot.x - (dx / len) * 4.5 * u;
  const ankleY = foot.y - (dy / len) * 4.5 * u;
  drawCapsule(ctx, knee.x, knee.y, ankleX, ankleY, shinTopW, shinBotW, pantFill, outline, 1.2 * u);

  if (!isBack) {
    if (pantsStyle === 'track') {
      // Twin sport stripes down thigh & shin
      ctx.save();
      ctx.strokeStyle = stripeColor;
      ctx.lineWidth = 2.1 * u;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hip.x - 1.5 * u, hip.y);
      ctx.lineTo(knee.x - 1.2 * u, knee.y);
      ctx.lineTo(ankleX - 1.0 * u, ankleY);
      ctx.stroke();

      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.2 * u;
      ctx.beginPath();
      ctx.moveTo(hip.x + 1.8 * u, hip.y);
      ctx.lineTo(knee.x + 1.8 * u, knee.y);
      ctx.lineTo(ankleX + 1.5 * u, ankleY);
      ctx.stroke();
      ctx.restore();
    } else if (pantsStyle === 'mx_pants') {
      // Motocross racing thigh stripe & armored knee brace
      const thighAng = Math.atan2(knee.y - hip.y, knee.x - hip.x);
      ctx.save();
      ctx.translate(hip.x + (knee.x - hip.x) * 0.45, hip.y + (knee.y - hip.y) * 0.45);
      ctx.rotate(thighAng);
      ctx.fillStyle = stripeColor;
      roundedRectPath(ctx, -9 * u, -2.5 * u, 18 * u, 3.8 * u, 1.6 * u);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = outfit.kneePad;
      roundedRectPath(ctx, knee.x - 4.2 * u, knee.y - 5.2 * u, 9.6 * u, 10.4 * u, 3.2 * u);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 0.9 * u;
      ctx.stroke();
    } else if (pantsStyle === 'ripped_jeans') {
      // Distressed knee rips exposing dark/skin slash bars + subtle denim seam
      ctx.fillStyle = 'rgba(226, 232, 240, 0.42)';
      roundedRectPath(ctx, knee.x - 2.0 * u, knee.y - 3.2 * u, 6.2 * u, 1.8 * u, 0.8 * u);
      ctx.fill();
      roundedRectPath(ctx, knee.x - 1.2 * u, knee.y + 0.4 * u, 5.0 * u, 1.6 * u, 0.7 * u);
      ctx.fill();
    } else {
      // Cargo pocket & knee patch
      const thighAng = Math.atan2(knee.y - hip.y, knee.x - hip.x);
      const midX = hip.x + (knee.x - hip.x) * 0.52;
      const midY = hip.y + (knee.y - hip.y) * 0.52;
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(thighAng);
      ctx.fillStyle = outfit.pantsPocket;
      roundedRectPath(ctx, -5.8 * u, -5.2 * u, 11.2 * u, 7.2 * u, 2.2 * u);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 0.9 * u;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-5.2 * u, -4.6 * u, 10.0 * u, 1.8 * u);
      ctx.restore();

      ctx.fillStyle = outfit.kneePad;
      ctx.beginPath();
      ctx.arc(knee.x + 1.5 * u, knee.y, 4.6 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ankle cuff (hidden under tall MX boots)
  if (outfit.shoeStyle !== 'mx_boot') {
    const shinAng = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(ankleX, ankleY);
    ctx.rotate(shinAng);
    ctx.fillStyle = outfit.cuff;
    roundedRectPath(ctx, -2.5 * u, -4.8 * u, 4.5 * u, 9.6 * u, 1.5 * u);
    ctx.fill();
    ctx.restore();
  }

  drawRiderFootwear(
    ctx,
    knee,
    foot,
    u,
    outfit,
    accent,
    flatFoot,
    isBack,
    kneeling,
    footAngleOverride
  );
}

function drawSleeveArm(
  ctx: CanvasRenderingContext2D,
  shoulder: RiderDrawPt,
  elbow: RiderDrawPt,
  hand: RiderDrawPt,
  u: number,
  outfit: RiderOutfit,
  stripeColor: string,
  isBack: boolean
) {
  const fill = isBack ? outfit.sleeveBack : outfit.sleeve;
  const outline = 'rgba(5, 8, 13, 0.55)';
  const gStyle: GarmentStyle = outfit.garmentStyle ?? 'hoodie';

  const wShoulder = gStyle === 'puffer' ? 14.8 * u : gStyle === 'mx_jersey' ? 11.2 * u : 12.6 * u;
  const wElbow = gStyle === 'puffer' ? 12.6 * u : gStyle === 'mx_jersey' ? 9.4 * u : 10.4 * u;
  const wWrist = gStyle === 'puffer' ? 10.0 * u : 8.2 * u;

  drawCapsule(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, wShoulder, wElbow, fill, outline, 1.2 * u);
  drawCapsule(ctx, elbow.x, elbow.y, hand.x, hand.y, wElbow, wWrist, fill, outline, 1.2 * u);

  if (!isBack) {
    if (gStyle === 'puffer') {
      // Puffer baffle bands on sleeve
      const ang1 = Math.atan2(elbow.y - shoulder.y, elbow.x - shoulder.x);
      ctx.save();
      ctx.translate(
        shoulder.x + (elbow.x - shoulder.x) * 0.5,
        shoulder.y + (elbow.y - shoulder.y) * 0.5
      );
      ctx.rotate(ang1);
      ctx.strokeStyle = outfit.hoodieOutline;
      ctx.lineWidth = 1.1 * u;
      ctx.beginPath();
      ctx.moveTo(0, -wShoulder * 0.42);
      ctx.lineTo(0, wShoulder * 0.42);
      ctx.stroke();
      ctx.restore();
    } else if (gStyle === 'leather_biker') {
      // Metallic silver zipper & elbow pad patch
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(elbow.x, elbow.y, 3.2 * u, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.strokeStyle = stripeColor;
      ctx.lineWidth = gStyle === 'windbreaker' ? 2.8 * u : 2.2 * u;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(
        shoulder.x + (elbow.x - shoulder.x) * 0.18,
        shoulder.y + (elbow.y - shoulder.y) * 0.18 - 1.2 * u
      );
      ctx.lineTo(elbow.x, elbow.y - 1.0 * u);
      ctx.lineTo(elbow.x + (hand.x - elbow.x) * 0.72, elbow.y + (hand.y - elbow.y) * 0.72 - 0.8 * u);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawStuntGlove(ctx, elbow, hand, u, outfit, isBack);
}

function drawTorsoGarment(
  ctx: CanvasRenderingContext2D,
  hip: RiderDrawPt,
  shoulder: RiderDrawPt,
  u: number,
  outfit: RiderOutfit,
  stripeColor: string
) {
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;
  const len = Math.hypot(dx, dy) || 1;
  const ang = Math.atan2(hip.y - shoulder.y, hip.x - shoulder.x) - Math.PI / 2;
  const gStyle: GarmentStyle = outfit.garmentStyle ?? 'hoodie';

  ctx.save();
  ctx.translate(shoulder.x, shoulder.y);
  ctx.rotate(ang);

  const bodyLen = len + 6 * u;

  if (gStyle === 'puffer') {
    // Bulky horizontal quilted winter/street puffer jacket + tall collar
    ctx.fillStyle = outfit.hood;
    roundedRectPath(ctx, -8 * u, -13.5 * u, 16 * u, 11 * u, 4 * u);
    ctx.fill();
    ctx.strokeStyle = outfit.hoodieOutline;
    ctx.lineWidth = 1.2 * u;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-14.5 * u, -2 * u);
    ctx.quadraticCurveTo(0, -10 * u, 15.5 * u, -2 * u);
    ctx.quadraticCurveTo(18.5 * u, bodyLen * 0.48, 15.5 * u, bodyLen - 4 * u);
    ctx.quadraticCurveTo(0, bodyLen + 4 * u, -15.5 * u, bodyLen - 3 * u);
    ctx.quadraticCurveTo(-18 * u, bodyLen * 0.45, -14.5 * u, -2 * u);
    ctx.closePath();
    ctx.fillStyle = outfit.hoodie;
    ctx.fill();
    ctx.strokeStyle = outfit.hoodieOutline;
    ctx.lineWidth = 1.5 * u;
    ctx.stroke();

    // Horizontal quilted baffle stitches
    ctx.strokeStyle = outfit.hoodieShade;
    ctx.lineWidth = 1.8 * u;
    for (let row = 0.22; row <= 0.78; row += 0.24) {
      const yRow = bodyLen * row;
      ctx.beginPath();
      ctx.moveTo(-14.5 * u, yRow);
      ctx.quadraticCurveTo(0, yRow + 3 * u, 14.5 * u, yRow);
      ctx.stroke();
    }

    // Center zipper + brand chest badge
    ctx.fillStyle = outfit.stripe === 'auto' ? stripeColor : outfit.stripe;
    roundedRectPath(ctx, 4.5 * u, 5 * u, 6.2 * u, 5.2 * u, 1.5 * u);
    ctx.fill();

    ctx.fillStyle = outfit.cuff;
    roundedRectPath(ctx, -15.5 * u, bodyLen - 6 * u, 31 * u, 6 * u, 2.5 * u);
    ctx.fill();

    ctx.restore();
    return;
  }

  if (gStyle === 'mx_jersey') {
    // Athletic slim-cut MX motocross jersey + chest armor plate & race number
    ctx.fillStyle = outfit.hoodieShade;
    roundedRectPath(ctx, -6 * u, -10.5 * u, 12 * u, 7.5 * u, 3 * u);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-11.5 * u, -2 * u);
    ctx.quadraticCurveTo(0, -9 * u, 12.2 * u, -2 * u);
    ctx.lineTo(11.6 * u, bodyLen - 2 * u);
    ctx.quadraticCurveTo(0, bodyLen + 2 * u, -11.6 * u, bodyLen - 2 * u);
    ctx.closePath();
    ctx.fillStyle = outfit.hoodie;
    ctx.fill();
    ctx.strokeStyle = outfit.hoodieOutline;
    ctx.lineWidth = 1.4 * u;
    ctx.stroke();

    // V-neck collar trim
    ctx.fillStyle = stripeColor;
    ctx.beginPath();
    ctx.moveTo(-5.5 * u, -6 * u);
    ctx.lineTo(5.5 * u, -6 * u);
    ctx.lineTo(0.8 * u, 3 * u);
    ctx.closePath();
    ctx.fill();

    // Diagonal racing graphic & race number
    ctx.fillStyle = stripeColor;
    ctx.beginPath();
    ctx.moveTo(-11 * u, bodyLen * 0.35);
    ctx.lineTo(11.5 * u, bodyLen * 0.14);
    ctx.lineTo(11.5 * u, bodyLen * 0.3);
    ctx.lineTo(-11 * u, bodyLen * 0.52);
    ctx.closePath();
    ctx.fill();

    if (outfit.raceNum) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = 2.2 * u;
      ctx.font = `900 ${11.5 * u}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(outfit.raceNum, 1.5 * u, bodyLen * 0.62);
      ctx.fillText(outfit.raceNum, 1.5 * u, bodyLen * 0.62);
    }

    ctx.restore();
    return;
  }

  if (gStyle === 'leather_biker') {
    // Motorcycle leather jacket (косуха) with folded lapel, diagonal metal zipper & belt
    ctx.fillStyle = outfit.hoodieShade;
    roundedRectPath(ctx, -6.5 * u, -10.5 * u, 13 * u, 8 * u, 3 * u);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-12.5 * u, -2 * u);
    ctx.quadraticCurveTo(0, -9.5 * u, 13 * u, -2 * u);
    ctx.lineTo(12.2 * u, bodyLen - 3 * u);
    ctx.quadraticCurveTo(0, bodyLen + 2 * u, -12.2 * u, bodyLen - 3 * u);
    ctx.closePath();
    ctx.fillStyle = outfit.hoodie;
    ctx.fill();
    ctx.strokeStyle = outfit.hoodieOutline;
    ctx.lineWidth = 1.5 * u;
    ctx.stroke();

    // Folded biker lapel + diagonal silver zip
    ctx.fillStyle = outfit.hoodieShade;
    ctx.beginPath();
    ctx.moveTo(0, -5 * u);
    ctx.lineTo(9.5 * u, -1 * u);
    ctx.lineTo(4 * u, 14 * u);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.7 * u;
    ctx.beginPath();
    ctx.moveTo(6.5 * u, -1 * u);
    ctx.lineTo(1.5 * u, bodyLen - 6 * u);
    ctx.stroke();

    // Accent racing band + silver waist belt buckle
    ctx.fillStyle = stripeColor;
    ctx.fillRect(-12 * u, 10 * u, 6.5 * u, bodyLen * 0.45);

    ctx.fillStyle = '#090a0d';
    ctx.fillRect(-12.5 * u, bodyLen - 8 * u, 25 * u, 5.2 * u);
    ctx.fillStyle = outfit.cuff;
    roundedRectPath(ctx, 1.5 * u, bodyLen - 8.5 * u, 5.5 * u, 6.2 * u, 1 * u);
    ctx.fill();

    ctx.restore();
    return;
  }

  if (gStyle === 'windbreaker') {
    // Sporty color-block zip windbreaker / tracksuit top with high stand collar & V-chevron
    ctx.fillStyle = outfit.hoodieShade;
    roundedRectPath(ctx, -6.8 * u, -12 * u, 13.6 * u, 9.5 * u, 3.2 * u);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-12.5 * u, -2 * u);
    ctx.quadraticCurveTo(0, -9.5 * u, 13.2 * u, -2 * u);
    ctx.lineTo(12.5 * u, bodyLen - 3 * u);
    ctx.quadraticCurveTo(0, bodyLen + 2.5 * u, -12.5 * u, bodyLen - 3 * u);
    ctx.closePath();
    ctx.fillStyle = outfit.hoodie;
    ctx.fill();
    ctx.strokeStyle = outfit.hoodieOutline;
    ctx.lineWidth = 1.4 * u;
    ctx.stroke();

    // Sharp chest color-block chevron
    ctx.fillStyle = stripeColor;
    ctx.beginPath();
    ctx.moveTo(-12.2 * u, 6 * u);
    ctx.lineTo(0.8 * u, 16 * u);
    ctx.lineTo(12.8 * u, 6 * u);
    ctx.lineTo(12.8 * u, 11.5 * u);
    ctx.lineTo(0.8 * u, 21.5 * u);
    ctx.lineTo(-12.2 * u, 11.5 * u);
    ctx.closePath();
    ctx.fill();

    // Vertical center zip
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.2 * u;
    ctx.beginPath();
    ctx.moveTo(1 * u, -9 * u);
    ctx.lineTo(1 * u, bodyLen - 4 * u);
    ctx.stroke();

    ctx.fillStyle = outfit.cuff;
    roundedRectPath(ctx, -12.6 * u, bodyLen - 5.5 * u, 25.2 * u, 5.2 * u, 2 * u);
    ctx.fill();

    ctx.restore();
    return;
  }

  if (gStyle === 'tactical_vest') {
    // Street longsleeve/hoodie UNDER an armored tactical plate carrier vest with pouches & straps
    ctx.fillStyle = outfit.hoodieShade;
    roundedRectPath(ctx, -6.5 * u, -11 * u, 13 * u, 8.5 * u, 3.5 * u);
    ctx.fill();

    // Base under-layer shirt
    ctx.beginPath();
    ctx.moveTo(-12.2 * u, -2 * u);
    ctx.quadraticCurveTo(0, -9 * u, 12.8 * u, -2 * u);
    ctx.lineTo(12.4 * u, bodyLen - 3 * u);
    ctx.quadraticCurveTo(0, bodyLen + 2.5 * u, -12.4 * u, bodyLen - 3 * u);
    ctx.closePath();
    ctx.fillStyle = outfit.hoodie;
    ctx.fill();
    ctx.strokeStyle = outfit.hoodieOutline;
    ctx.lineWidth = 1.4 * u;
    ctx.stroke();

    // Armored plate carrier body over chest & ribs
    ctx.fillStyle = '#14171c';
    roundedRectPath(ctx, -10.5 * u, 4 * u, 22 * u, bodyLen - 12 * u, 3.2 * u);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1 * u;
    ctx.stroke();

    // Shoulder harness straps
    ctx.fillStyle = '#0e1014';
    ctx.fillRect(-7.5 * u, -5 * u, 4.5 * u, 11 * u);
    ctx.fillRect(4 * u, -5 * u, 4.5 * u, 11 * u);

    // Accent MOLLE pouches + buckle strip
    ctx.fillStyle = stripeColor;
    roundedRectPath(ctx, -6 * u, bodyLen - 21 * u, 6.2 * u, 8.5 * u, 1.5 * u);
    ctx.fill();
    roundedRectPath(ctx, 2.2 * u, bodyLen - 21 * u, 7.2 * u, 8.5 * u, 1.5 * u);
    ctx.fill();

    ctx.restore();
    return;
  }

  if (gStyle === 'denim_street') {
    // Classic street denim trucker jacket with sherpa collar, chest flap pockets & buttons
    ctx.fillStyle = outfit.hood; // Sherpa fleece collar
    roundedRectPath(ctx, -8 * u, -11.5 * u, 16 * u, 9.5 * u, 3.8 * u);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-12.5 * u, -2 * u);
    ctx.quadraticCurveTo(0, -9 * u, 13.2 * u, -2 * u);
    ctx.lineTo(12.8 * u, bodyLen - 3 * u);
    ctx.quadraticCurveTo(0, bodyLen + 2 * u, -12.8 * u, bodyLen - 3 * u);
    ctx.closePath();
    ctx.fillStyle = outfit.hoodie;
    ctx.fill();
    ctx.strokeStyle = outfit.hoodieOutline;
    ctx.lineWidth = 1.4 * u;
    ctx.stroke();

    // Contrast denim seam vertical lines + chest flap pocket
    ctx.strokeStyle = outfit.stripe;
    ctx.lineWidth = 1.2 * u;
    ctx.beginPath();
    ctx.moveTo(-3 * u, 0);
    ctx.lineTo(-3 * u, bodyLen - 4 * u);
    ctx.moveTo(6 * u, 0);
    ctx.lineTo(6 * u, bodyLen - 4 * u);
    ctx.stroke();

    ctx.fillStyle = outfit.hoodieShade;
    roundedRectPath(ctx, 0.5 * u, 8 * u, 9.5 * u, 10.5 * u, 1.8 * u);
    ctx.fill();
    ctx.strokeStyle = outfit.stripe;
    ctx.lineWidth = 0.9 * u;
    ctx.stroke();

    ctx.restore();
    return;
  }

  // Classic oversized street hoodie ('hoodie')
  ctx.fillStyle = outfit.hood;
  ctx.strokeStyle = outfit.hoodieOutline;
  ctx.lineWidth = 1.3 * u;
  ctx.beginPath();
  ctx.moveTo(-4 * u, -6 * u);
  ctx.quadraticCurveTo(-19 * u, -4 * u, -17 * u, 9 * u);
  ctx.quadraticCurveTo(-15 * u, 16 * u, -7 * u, 14 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = outfit.hoodieShade;
  roundedRectPath(ctx, -6.5 * u, -11.5 * u, 13 * u, 9 * u, 4 * u);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-12.5 * u, -2 * u);
  ctx.quadraticCurveTo(0, -10 * u, 13.5 * u, -2 * u);
  ctx.quadraticCurveTo(16.2 * u, bodyLen * 0.48, 13.8 * u, bodyLen - 4 * u);
  ctx.quadraticCurveTo(0, bodyLen + 3 * u, -13.8 * u, bodyLen - 3 * u);
  ctx.quadraticCurveTo(-15.5 * u, bodyLen * 0.45, -12.5 * u, -2 * u);
  ctx.closePath();
  ctx.fillStyle = outfit.hoodie;
  ctx.fill();
  ctx.strokeStyle = outfit.hoodieOutline;
  ctx.lineWidth = 1.5 * u;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-12.0 * u, 0);
  ctx.quadraticCurveTo(-14.2 * u, bodyLen * 0.45, -13.0 * u, bodyLen - 4 * u);
  ctx.lineTo(-4.5 * u, bodyLen - 2 * u);
  ctx.quadraticCurveTo(-6.2 * u, bodyLen * 0.45, -4.0 * u, -3 * u);
  ctx.closePath();
  ctx.fillStyle = outfit.hoodieShade;
  ctx.fill();

  ctx.fillStyle = stripeColor;
  roundedRectPath(ctx, 2.5 * u, 8 * u, 5.2 * u, bodyLen * 0.56, 2.5 * u);
  ctx.fill();

  ctx.globalAlpha = 0.72;
  roundedRectPath(ctx, 9.2 * u, 12 * u, 2.2 * u, bodyLen * 0.36, 1.1 * u);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = outfit.hoodieShade;
  roundedRectPath(ctx, -2 * u, bodyLen - 20 * u, 14 * u, 12.5 * u, 3.2 * u);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.9 * u;
  ctx.stroke();

  ctx.fillStyle = outfit.cuff;
  roundedRectPath(ctx, -13.8 * u, bodyLen - 6.5 * u, 27.6 * u, 6.2 * u, 2.5 * u);
  ctx.fill();

  ctx.restore();
}

export function drawStyledRider(
  ctx: CanvasRenderingContext2D,
  pose: StyledRiderPose,
  scale: number,
  outfit: RiderOutfit,
  scooterAccent: string,
  helmet: MotocrossHelmet
) {
  const stripeColor = outfit.stripe === 'auto' ? scooterAccent : outfit.stripe;
  const shoeAccent = outfit.shoeAccent === 'auto' ? scooterAccent : outfit.shoeAccent;
  const flatFeet = pose.flatFeet ?? true;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  drawSleeveArm(
    ctx,
    { x: pose.shoulder.x + 2 * scale, y: pose.shoulder.y + 2 * scale },
    pose.backElbow,
    pose.backHand,
    scale,
    outfit,
    stripeColor,
    true
  );

  drawLegGarment(
    ctx,
    { x: pose.hip.x - 1.5 * scale, y: pose.hip.y },
    pose.backKnee,
    pose.backFoot,
    scale,
    outfit,
    shoeAccent,
    stripeColor,
    flatFeet,
    true,
    0,
    pose.backFootAngle
  );

  drawLegGarment(
    ctx,
    pose.hip,
    pose.frontKnee,
    pose.frontFoot,
    scale,
    outfit,
    shoeAccent,
    stripeColor,
    flatFeet,
    false,
    pose.kneeling ?? 0,
    pose.frontFootAngle
  );

  drawTorsoGarment(ctx, pose.hip, pose.shoulder, scale, outfit, stripeColor);

  drawSleeveArm(
    ctx,
    { x: pose.shoulder.x + 1 * scale, y: pose.shoulder.y + 3 * scale },
    pose.frontElbow,
    pose.frontHand,
    scale,
    outfit,
    stripeColor,
    false
  );

  ctx.save();
  ctx.translate(pose.head.x, pose.head.y);
  if (pose.headAngle !== undefined) {
    ctx.rotate(pose.headAngle);
  }
  drawMotocrossHelmet(ctx, 0, 0, 15.8 * scale, helmet);
  ctx.restore();

  ctx.restore();
}
