import { drawMotocrossHelmet, type MotocrossHelmet } from './helmets';

export type OutfitId =
  | 'black_stant'
  | 'street_white'
  | 'tech_camo'
  | 'crimson_mx'
  | 'purple_drip'
  | 'gold_pro';

export interface RiderOutfit {
  id: OutfitId;
  name: string;
  subtitle: string;
  price: number;
  // Hoodie / Tech Jacket
  hoodie: string;
  hoodieShade: string;
  hoodieOutline: string;
  hood: string;
  sleeve: string;
  sleeveBack: string;
  stripe: string; // 'auto' -> matches scooter accent color
  cuff: string;
  // Baggy Cargo / Joggers
  pants: string;
  pantsBack: string;
  pantsPocket: string;
  kneePad: string;
  // High-Top Street Sneakers
  shoeUpper: string;
  shoeSole: string;
  shoeAccent: string;
  // Armored Stunt Gloves
  glove: string;
  gloveKnuckle: string;
}

export const OUTFITS: RiderOutfit[] = [
  {
    id: 'black_stant',
    name: 'BLACK STANT',
    subtitle: 'Чёрное худи · карго',
    price: 0,
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
    subtitle: 'Оверсайз · джоггеры',
    price: 0,
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
    name: 'Урбан Карго',
    subtitle: 'Бомбер хаки · тактик',
    price: 4000,
    hoodie: '#3f4f3a',
    hoodieShade: '#2d3a29',
    hoodieOutline: '#1a2218',
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
    id: 'crimson_mx',
    name: 'Красный Драйв',
    subtitle: 'Мото-джерси · джорданы',
    price: 8000,
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
    shoeAccent: '#11141a',
    glove: '#181b22',
    gloveKnuckle: '#ef4444',
  },
  {
    id: 'purple_drip',
    name: 'Фиолет 95',
    subtitle: 'Сет под G2 Pro 95',
    price: 12000,
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
    id: 'gold_pro',
    name: 'Золотой Про',
    subtitle: 'Про-куртка · золото',
    price: 20000,
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
    kneePad: '#b45309',
    shoeUpper: '#12151b',
    shoeSole: '#fef3c7',
    shoeAccent: '#f59e0b',
    glove: '#111318',
    gloveKnuckle: '#fbbf24',
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
  /** Optional explicit head rotation in radians (used by ragdoll); defaults to slight torso tilt */
  headAngle?: number;
  /** Optional flat-foot override (true when standing/riding on deck, false during ragdoll tumble) */
  flatFeet?: boolean;
  /** Optional 0..1 blend for One-Knee stunt (tucks the kneeling front sneaker back along the shin) */
  kneeling?: number;
  /** Optional explicit rotation (radians) for the front sneaker (e.g. braced against the steering column) */
  frontFootAngle?: number;
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

function drawHighTopSneaker(
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
    // Align sole perpendicular to shin during ragdoll tumble
    rot = Math.atan2(foot.y - knee.y, foot.x - knee.x) - Math.PI / 2;
  } else if (!isBack && footAngleOverride !== undefined && Math.abs(footAngleOverride) > 0.005) {
    rot = footAngleOverride;
  } else if (!isBack && kneeling > 0.02) {
    // Tuck kneeling foot back naturally along the folded shin
    const shinRot = Math.atan2(foot.y - knee.y, foot.x - knee.x) - Math.PI / 2;
    rot = shinRot * kneeling;
  }
  ctx.rotate(rot);

  const s = u;
  ctx.globalAlpha = isBack ? 0.94 : 1;

  // High-top ankle collar & sculpted upper
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

  // Accent heel panel / side swoosh
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-5.8 * s, -4.4 * s);
  ctx.lineTo(4.2 * s, -1.6 * s);
  ctx.lineTo(1.5 * s, 0.2 * s);
  ctx.lineTo(-6.2 * s, -1.8 * s);
  ctx.closePath();
  ctx.fill();

  // Crisp thick street midsole
  ctx.fillStyle = outfit.shoeSole;
  roundedRectPath(ctx, -7.2 * s, 0.2 * s, 21.8 * s, 3.6 * s, 1.6 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.9 * s;
  ctx.stroke();

  // Subtle dark tread bottom line
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

  // Ribbed wrist strap
  ctx.fillStyle = outfit.cuff;
  roundedRectPath(ctx, -7.5 * u, -4.3 * u, 4.5 * u, 8.6 * u, 1.8 * u);
  ctx.fill();

  // Glove palm & fingers gripping bar
  ctx.fillStyle = isBack ? '#0d1016' : outfit.glove;
  ctx.beginPath();
  ctx.arc(0.5 * u, 0, 5.4 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.0 * u;
  ctx.stroke();

  // Armored knuckle protector
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
  flatFoot: boolean,
  isBack: boolean,
  kneeling = 0,
  footAngleOverride?: number
) {
  const pantFill = isBack ? outfit.pantsBack : outfit.pants;
  const outline = 'rgba(5, 8, 13, 0.58)';

  // Baggy upper thigh pant
  drawCapsule(ctx, hip.x, hip.y, knee.x, knee.y, 15.8 * u, 13.6 * u, pantFill, outline, 1.2 * u);

  // Lower cargo leg stopping cleanly at sneaker collar
  const dx = foot.x - knee.x;
  const dy = foot.y - knee.y;
  const len = Math.hypot(dx, dy) || 1;
  const ankleX = foot.x - (dx / len) * 4.5 * u;
  const ankleY = foot.y - (dy / len) * 4.5 * u;
  drawCapsule(ctx, knee.x, knee.y, ankleX, ankleY, 13.0 * u, 10.2 * u, pantFill, outline, 1.2 * u);

  // Articulated knee panel & side cargo pocket on foreground leg
  if (!isBack) {
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
    // Cargo flap line
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-5.2 * u, -4.6 * u, 10.0 * u, 1.8 * u);
    ctx.restore();

    // Reinforced stunt knee patch
    ctx.fillStyle = outfit.kneePad;
    ctx.beginPath();
    ctx.arc(knee.x + 1.5 * u, knee.y, 4.6 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ribbed jogger ankle cuff
  const shinAng = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(ankleX, ankleY);
  ctx.rotate(shinAng);
  ctx.fillStyle = outfit.cuff;
  roundedRectPath(ctx, -2.5 * u, -4.8 * u, 4.5 * u, 9.6 * u, 1.5 * u);
  ctx.fill();
  ctx.restore();

  // High-top sneaker
  drawHighTopSneaker(ctx, knee, foot, u, outfit, accent, flatFoot, isBack, kneeling, footAngleOverride);
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

  // Upper hoodie sleeve
  drawCapsule(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 12.6 * u, 10.4 * u, fill, outline, 1.2 * u);
  // Forearm sleeve
  drawCapsule(ctx, elbow.x, elbow.y, hand.x, hand.y, 10.2 * u, 8.2 * u, fill, outline, 1.2 * u);

  // Subtle racing/streetwear sleeve stripe on foreground arm
  if (!isBack) {
    ctx.save();
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 2.4 * u;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(shoulder.x + (elbow.x - shoulder.x) * 0.18, shoulder.y + (elbow.y - shoulder.y) * 0.18 - 1.2 * u);
    ctx.lineTo(elbow.x, elbow.y - 1.0 * u);
    ctx.lineTo(elbow.x + (hand.x - elbow.x) * 0.72, elbow.y + (hand.y - elbow.y) * 0.72 - 0.8 * u);
    ctx.stroke();
    ctx.restore();
  }

  drawStuntGlove(ctx, elbow, hand, u, outfit, isBack);
}

function drawHoodieTorso(
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
  // Angle where +Y points from shoulder down to hip (so upright torso = 0 rad)
  const ang = Math.atan2(hip.y - shoulder.y, hip.x - shoulder.x) - Math.PI / 2;

  ctx.save();
  ctx.translate(shoulder.x, shoulder.y);
  ctx.rotate(ang);

  // Tucked oversized hood resting behind the neck / upper back
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

  // Neck gaiter / hoodie collar
  ctx.fillStyle = outfit.hoodieShade;
  roundedRectPath(ctx, -6.5 * u, -11.5 * u, 13 * u, 9 * u, 4 * u);
  ctx.fill();

  // Sculpted oversized street hoodie silhouette (wider chest, relaxed hem over waist)
  const bodyLen = len + 6 * u;
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

  // Back-side subtle shadow panel for 3D jacket volume
  ctx.beginPath();
  ctx.moveTo(-12.0 * u, 0);
  ctx.quadraticCurveTo(-14.2 * u, bodyLen * 0.45, -13.0 * u, bodyLen - 4 * u);
  ctx.lineTo(-4.5 * u, bodyLen - 2 * u);
  ctx.quadraticCurveTo(-6.2 * u, bodyLen * 0.45, -4.0 * u, -3 * u);
  ctx.closePath();
  ctx.fillStyle = outfit.hoodieShade;
  ctx.fill();

  // Chest tech stripe / racing graphic
  ctx.fillStyle = stripeColor;
  roundedRectPath(ctx, 2.5 * u, 8 * u, 5.2 * u, bodyLen * 0.56, 2.5 * u);
  ctx.fill();

  // Second thin accent stripe next to main chest bar
  ctx.globalAlpha = 0.72;
  roundedRectPath(ctx, 9.2 * u, 12 * u, 2.2 * u, bodyLen * 0.36, 1.1 * u);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Front kangaroo pocket detail
  ctx.fillStyle = outfit.hoodieShade;
  roundedRectPath(ctx, -2 * u, bodyLen - 20 * u, 14 * u, 12.5 * u, 3.2 * u);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.9 * u;
  ctx.stroke();

  // Ribbed waist hem cuff
  ctx.fillStyle = outfit.cuff;
  roundedRectPath(ctx, -13.8 * u, bodyLen - 6.5 * u, 27.6 * u, 6.2 * u, 2.5 * u);
  ctx.fill();

  ctx.restore();
}

/**
 * Renders the complete street/stunt rider with layered hoodie/jacket, cargo joggers,
 * high-top sneakers, armored gloves, and motocross helmet.
 * Works identically in local scooter coordinates (`scale = 1`) and world ragdoll coordinates (`scale = u`).
 */
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

  // 1) Far / back arm (long sleeve + glove)
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

  // 2) Far / back leg (baggy cargo + high-top sneaker)
  drawLegGarment(
    ctx,
    { x: pose.hip.x - 1.5 * scale, y: pose.hip.y },
    pose.backKnee,
    pose.backFoot,
    scale,
    outfit,
    shoeAccent,
    flatFeet,
    true
  );

  // 3) Near / front leg (baggy cargo + cargo pocket + knee pad + high-top sneaker)
  drawLegGarment(
    ctx,
    pose.hip,
    pose.frontKnee,
    pose.frontFoot,
    scale,
    outfit,
    shoeAccent,
    flatFeet,
    false,
    pose.kneeling ?? 0,
    pose.frontFootAngle
  );

  // 4) Layered oversized street hoodie / stunt jacket
  drawHoodieTorso(ctx, pose.hip, pose.shoulder, scale, outfit, stripeColor);

  // 5) Near / front arm (long sleeve + accent stripe + armored glove)
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

  // 6) Motocross helmet
  ctx.save();
  ctx.translate(pose.head.x, pose.head.y);
  if (pose.headAngle !== undefined) {
    ctx.rotate(pose.headAngle);
  }
  drawMotocrossHelmet(ctx, 0, 0, 15.8 * scale, helmet);
  ctx.restore();

  ctx.restore();
}
