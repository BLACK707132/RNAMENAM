export type HelmetId =
  | 'mx_start'
  | 'mx_red'
  | 'mx_lime'
  | 'mx_arctic'
  | 'mx_inferno'
  | 'mx_cyber'
  | 'mx_gold';

export type HelmetRarity = 'starter' | 'common' | 'rare' | 'epic' | 'legendary';

export interface MotocrossHelmet {
  id: HelmetId;
  name: string;
  rarity: HelmetRarity;
  rarityLabel: string;
  rarityColor: string;
  weight: number; // Шанс выпадения в рулетке (0 для начального)
  shell: string;
  visor: string;
  chin: string;
  stripe: string;
  goggles: string;
  strap: string;
}

export const HELMET_SPIN_COST = 5000;
export const HELMET_DUPLICATE_REFUND = 2500;

export const HELMETS: MotocrossHelmet[] = [
  {
    id: 'mx_start',
    name: 'MX База',
    rarity: 'starter',
    rarityLabel: 'Начальный',
    rarityColor: '#94a3b8',
    weight: 0,
    shell: '#252b34',
    visor: '#171b22',
    chin: '#1c2129',
    stripe: '#e2e8f0',
    goggles: '#38bdf8',
    strap: '#11151c',
  },
  {
    id: 'mx_red',
    name: 'MX Шторм',
    rarity: 'common',
    rarityLabel: 'Обычный',
    rarityColor: '#cbd5e1',
    weight: 30,
    shell: '#dc2626',
    visor: '#18181b',
    chin: '#991b1b',
    stripe: '#ffffff',
    goggles: '#fb923c',
    strap: '#111111',
  },
  {
    id: 'mx_lime',
    name: 'MX Кислота',
    rarity: 'common',
    rarityLabel: 'Обычный',
    rarityColor: '#cbd5e1',
    weight: 28,
    shell: '#18181b',
    visor: '#84cc16',
    chin: '#27272a',
    stripe: '#a3e635',
    goggles: '#bef264',
    strap: '#365314',
  },
  {
    id: 'mx_arctic',
    name: 'MX Арктика',
    rarity: 'rare',
    rarityLabel: 'Редкий',
    rarityColor: '#38bdf8',
    weight: 18,
    shell: '#f1f5f9',
    visor: '#0284c7',
    chin: '#cbd5e1',
    stripe: '#0ea5e9',
    goggles: '#22d3ee',
    strap: '#0f172a',
  },
  {
    id: 'mx_inferno',
    name: 'MX Инферно',
    rarity: 'rare',
    rarityLabel: 'Редкий',
    rarityColor: '#38bdf8',
    weight: 14,
    shell: '#1f242d',
    visor: '#ff6a1a',
    chin: '#c2410c',
    stripe: '#ff8a1a',
    goggles: '#fbbf24',
    strap: '#111318',
  },
  {
    id: 'mx_cyber',
    name: 'MX Неон',
    rarity: 'epic',
    rarityLabel: 'Эпический',
    rarityColor: '#c084fc',
    weight: 7,
    shell: '#1e1b4b',
    visor: '#06b6d4',
    chin: '#312e81',
    stripe: '#22d3ee',
    goggles: '#f472b6',
    strap: '#0f172a',
  },
  {
    id: 'mx_gold',
    name: 'MX Чемпион',
    rarity: 'legendary',
    rarityLabel: 'Легендарный',
    rarityColor: '#fbbf24',
    weight: 3,
    shell: '#f59e0b',
    visor: '#18181b',
    chin: '#b45309',
    stripe: '#fef08a',
    goggles: '#fde047',
    strap: '#111111',
  },
];

export const ROULETTE_HELMETS = HELMETS.filter((h) => h.weight > 0);

export function getHelmet(id: HelmetId): MotocrossHelmet {
  return HELMETS.find((h) => h.id === id) ?? HELMETS[0];
}

export function rollRandomHelmet(): MotocrossHelmet {
  const total = ROULETTE_HELMETS.reduce((sum, h) => sum + h.weight, 0);
  let r = Math.random() * total;
  for (const h of ROULETTE_HELMETS) {
    r -= h.weight;
    if (r <= 0) return h;
  }
  return ROULETTE_HELMETS[0];
}

/**
 * Draws a detailed side-profile motocross helmet (facing RIGHT) on Canvas 2D.
 * Centered on head center (cx, cy), scaled by `r` (~15 units on rider).
 */
export function drawMotocrossHelmet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  h: MotocrossHelmet
) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = r / 15;
  ctx.scale(s, s);

  // Main rounded MX shell dome
  ctx.fillStyle = h.shell;
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.bezierCurveTo(-17, -9, -8, -17, 4, -15.5);
  ctx.bezierCurveTo(11, -14.5, 14.5, -9, 14, -2);
  ctx.lineTo(10, 10);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();

  // Sharp forward-extending MX chin guard (защита подбородка)
  ctx.fillStyle = h.chin;
  ctx.beginPath();
  ctx.moveTo(4, 3);
  ctx.lineTo(22.5, 6.2);
  ctx.lineTo(20.5, 12.2);
  ctx.lineTo(3, 12);
  ctx.lineTo(-4, 9.5);
  ctx.closePath();
  ctx.fill();

  // Chin vent detail
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.moveTo(15.5, 6.8);
  ctx.lineTo(20.6, 7.6);
  ctx.lineTo(19.6, 10.6);
  ctx.lineTo(14.8, 10);
  ctx.closePath();
  ctx.fill();

  // Racing side graphic stripe
  ctx.fillStyle = h.stripe;
  ctx.beginPath();
  ctx.moveTo(-13.5, -2);
  ctx.lineTo(-2, -10.5);
  ctx.lineTo(6, -10);
  ctx.lineTo(-4.5, -1);
  ctx.closePath();
  ctx.fill();

  // Aggressive extended MX peak / visor (козырёк)
  ctx.fillStyle = h.visor;
  ctx.beginPath();
  ctx.moveTo(-2, -14.2);
  ctx.quadraticCurveTo(11, -17.5, 25, -12.2);
  ctx.lineTo(23.5, -9.2);
  ctx.quadraticCurveTo(12, -12.2, 4, -10);
  ctx.closePath();
  ctx.fill();

  // Goggle strap wrapping around rear shell
  ctx.fillStyle = h.strap;
  ctx.beginPath();
  ctx.moveTo(-15.5, -4);
  ctx.lineTo(5, -5.5);
  ctx.lineTo(5, 1);
  ctx.lineTo(-14.8, 2.2);
  ctx.closePath();
  ctx.fill();

  // MX goggles frame + mirrored lens (compatible with all mobile browsers)
  const drawRRect = (x: number, y: number, w: number, hh: number, rad: number) => {
    const r0 = Math.min(rad, w / 2, hh / 2);
    ctx.beginPath();
    ctx.moveTo(x + r0, y);
    ctx.lineTo(x + w - r0, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r0);
    ctx.lineTo(x + w, y + hh - r0);
    ctx.quadraticCurveTo(x + w, y + hh, x + w - r0, y + hh);
    ctx.lineTo(x + r0, y + hh);
    ctx.quadraticCurveTo(x, y + hh, x, y + hh - r0);
    ctx.lineTo(x, y + r0);
    ctx.quadraticCurveTo(x, y, x + r0, y);
    ctx.closePath();
  };

  ctx.fillStyle = '#0f131a';
  drawRRect(4.5, -7.8, 11.5, 10.2, 2.8);
  ctx.fill();

  ctx.fillStyle = h.goggles;
  drawRRect(6.2, -6.2, 8.8, 7.2, 2);
  ctx.fill();

  // Specular highlight on goggles
  ctx.fillStyle = 'rgba(255,255,255,0.48)';
  ctx.beginPath();
  ctx.moveTo(7.4, -5.2);
  ctx.lineTo(11.4, -5.2);
  ctx.lineTo(9.2, 0.2);
  ctx.lineTo(7.2, 0.2);
  ctx.closePath();
  ctx.fill();

  // Subtle rim outline for crisp contrast against sky
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.bezierCurveTo(-17, -9, -8, -17, 4, -15.5);
  ctx.stroke();

  ctx.restore();
}
