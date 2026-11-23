export type HelmetId =
  | 'mx_start'
  | 'mx_red'
  | 'mx_lime'
  | 'mx_urban'
  | 'mx_arctic'
  | 'mx_inferno'
  | 'mx_stealth'
  | 'mx_cyber'
  | 'mx_track_gp'
  | 'mx_gold'
  | 'mx_devil';

export type HelmetRarity = 'starter' | 'common' | 'rare' | 'epic' | 'legendary';

export type HelmetStyle = 'mx_peak' | 'street_full' | 'aero_track' | 'open_ski' | 'horned_mx';

export interface MotocrossHelmet {
  id: HelmetId;
  name: string;
  style: HelmetStyle;
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
    style: 'mx_peak',
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
    style: 'mx_peak',
    rarity: 'common',
    rarityLabel: 'Обычный',
    rarityColor: '#cbd5e1',
    weight: 22,
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
    style: 'mx_peak',
    rarity: 'common',
    rarityLabel: 'Обычный',
    rarityColor: '#cbd5e1',
    weight: 20,
    shell: '#18181b',
    visor: '#84cc16',
    chin: '#27272a',
    stripe: '#a3e635',
    goggles: '#bef264',
    strap: '#365314',
  },
  {
    id: 'mx_urban',
    name: 'Уличный Ски',
    style: 'open_ski',
    rarity: 'common',
    rarityLabel: 'Обычный',
    rarityColor: '#cbd5e1',
    weight: 18,
    shell: '#1f2937',
    visor: '#0f172a',
    chin: '#111827',
    stripe: '#38bdf8',
    goggles: '#38bdf8',
    strap: '#0f172a',
  },
  {
    id: 'mx_arctic',
    name: 'Арктика Аэро',
    style: 'aero_track',
    rarity: 'rare',
    rarityLabel: 'Редкий',
    rarityColor: '#38bdf8',
    weight: 12,
    shell: '#f1f5f9',
    visor: '#0284c7',
    chin: '#cbd5e1',
    stripe: '#0ea5e9',
    goggles: '#22d3ee',
    strap: '#0f172a',
  },
  {
    id: 'mx_stealth',
    name: 'Стелс Фулл-Фейс',
    style: 'street_full',
    rarity: 'rare',
    rarityLabel: 'Редкий',
    rarityColor: '#38bdf8',
    weight: 11,
    shell: '#11151d',
    visor: '#334155',
    chin: '#090c10',
    stripe: '#64748b',
    goggles: '#94a3b8',
    strap: '#090c10',
  },
  {
    id: 'mx_inferno',
    name: 'MX Инферно',
    style: 'horned_mx',
    rarity: 'rare',
    rarityLabel: 'Редкий',
    rarityColor: '#38bdf8',
    weight: 8,
    shell: '#1f242d',
    visor: '#ff6a1a',
    chin: '#c2410c',
    stripe: '#ff8a1a',
    goggles: '#fbbf24',
    strap: '#111318',
  },
  {
    id: 'mx_cyber',
    name: 'Неон Визор',
    style: 'street_full',
    rarity: 'epic',
    rarityLabel: 'Эпический',
    rarityColor: '#c084fc',
    weight: 4,
    shell: '#1e1b4b',
    visor: '#06b6d4',
    chin: '#312e81',
    stripe: '#22d3ee',
    goggles: '#f472b6',
    strap: '#0f172a',
  },
  {
    id: 'mx_track_gp',
    name: 'Спойлер GP',
    style: 'aero_track',
    rarity: 'epic',
    rarityLabel: 'Эпический',
    rarityColor: '#c084fc',
    weight: 3,
    shell: '#1d4ed8',
    visor: '#ef4444',
    chin: '#0f172a',
    stripe: '#ffffff',
    goggles: '#facc15',
    strap: '#0f172a',
  },
  {
    id: 'mx_gold',
    name: 'MX Чемпион',
    style: 'mx_peak',
    rarity: 'legendary',
    rarityLabel: 'Легендарный',
    rarityColor: '#fbbf24',
    weight: 1,
    shell: '#f59e0b',
    visor: '#18181b',
    chin: '#b45309',
    stripe: '#fef08a',
    goggles: '#fde047',
    strap: '#111111',
  },
  {
    id: 'mx_devil',
    name: 'Дьявол Карбон',
    style: 'horned_mx',
    rarity: 'legendary',
    rarityLabel: 'Легендарный',
    rarityColor: '#fbbf24',
    weight: 1,
    shell: '#141118',
    visor: '#e11d48',
    chin: '#881337',
    stripe: '#fb7185',
    goggles: '#fda4af',
    strap: '#09070c',
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

function drawRRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  hh: number,
  rad: number
) {
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
}

/**
 * Draws a detailed side-profile helmet (facing RIGHT) on Canvas 2D with distinct styles:
 * - mx_peak: Motocross helmet with peak & goggles
 * - street_full: Sleek street full-face sport helmet with wraparound mirror visor
 * - aero_track: MotoGP racing helmet with rear aero spoiler & vents
 * - open_ski: Open-face stunt half-shell with oversized goggles & lower buff mask
 * - horned_mx: Aggressive horned motocross stunt helmet
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

  const style: HelmetStyle = h.style ?? 'mx_peak';

  if (style === 'street_full') {
    // Sleek aerodynamic full-face sport helmet (rounded nose, zero upper dirtbike peak)
    ctx.fillStyle = h.shell;
    ctx.beginPath();
    ctx.moveTo(-14.5, 4.5);
    ctx.bezierCurveTo(-17.5, -10, -7, -17, 5.5, -15);
    ctx.bezierCurveTo(14.5, -13.5, 19, -5.5, 19, 3.5);
    ctx.bezierCurveTo(18.8, 10, 13.5, 12.2, 4, 12);
    ctx.lineTo(-10.5, 11);
    ctx.closePath();
    ctx.fill();

    // Chin piece wrap
    ctx.fillStyle = h.chin;
    ctx.beginPath();
    ctx.moveTo(4, 3.5);
    ctx.lineTo(18.6, 4.2);
    ctx.quadraticCurveTo(17.6, 11.5, 11, 12);
    ctx.lineTo(-4, 10.5);
    ctx.closePath();
    ctx.fill();

    // Speed racing stripe along side
    ctx.fillStyle = h.stripe;
    ctx.beginPath();
    ctx.moveTo(-14.5, -2.5);
    ctx.quadraticCurveTo(-4, -10, 8, -11.5);
    ctx.lineTo(6.5, -7.8);
    ctx.quadraticCurveTo(-4, -6.2, -13.5, 1.5);
    ctx.closePath();
    ctx.fill();

    // Tinted wide wraparound sport visor
    ctx.fillStyle = '#0b0e14';
    ctx.beginPath();
    ctx.moveTo(2.5, -8.5);
    ctx.quadraticCurveTo(15.5, -9, 18.6, -1.8);
    ctx.lineTo(18.2, 3.2);
    ctx.quadraticCurveTo(9, 4.2, 1.5, 1.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = h.goggles;
    ctx.beginPath();
    ctx.moveTo(4, -7);
    ctx.quadraticCurveTo(14.5, -7.5, 17.4, -1.4);
    ctx.lineTo(17.1, 2.0);
    ctx.quadraticCurveTo(9.5, 2.8, 3.2, 0.5);
    ctx.closePath();
    ctx.fill();

    // Visor glare slash
    ctx.fillStyle = 'rgba(255,255,255,0.48)';
    ctx.beginPath();
    ctx.moveTo(7.2, -5.8);
    ctx.lineTo(11.4, -5.4);
    ctx.lineTo(8.8, 1.4);
    ctx.lineTo(6.2, 1.0);
    ctx.closePath();
    ctx.fill();

    // Subtle rim outline
    ctx.strokeStyle = 'rgba(0,0,0,0.42)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-14.5, 4.5);
    ctx.bezierCurveTo(-17.5, -10, -7, -17, 5.5, -15);
    ctx.stroke();

    ctx.restore();
    return;
  }

  if (style === 'aero_track') {
    // MotoGP aero track helmet with aggressive rear wing spoiler
    ctx.fillStyle = h.visor;
    ctx.beginPath();
    ctx.moveTo(-12, -11);
    ctx.lineTo(-22.5, -15.5);
    ctx.lineTo(-19.5, -7.5);
    ctx.lineTo(-13.5, -3);
    ctx.closePath();
    ctx.fill();

    // Main track shell
    ctx.fillStyle = h.shell;
    ctx.beginPath();
    ctx.moveTo(-14.5, 4.5);
    ctx.bezierCurveTo(-17, -10, -7, -17, 5.5, -15.2);
    ctx.bezierCurveTo(15, -13.2, 19.5, -4, 19.5, 4.2);
    ctx.lineTo(14.5, 12);
    ctx.lineTo(-10, 11);
    ctx.closePath();
    ctx.fill();

    // Chin diffuser
    ctx.fillStyle = h.chin;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(19.2, 5.2);
    ctx.lineTo(16.8, 12);
    ctx.lineTo(-3, 11);
    ctx.closePath();
    ctx.fill();

    // Dual racing stripe
    ctx.fillStyle = h.stripe;
    ctx.beginPath();
    ctx.moveTo(-15, -1.5);
    ctx.lineTo(5, -12.2);
    ctx.lineTo(9, -11);
    ctx.lineTo(-12, 2);
    ctx.closePath();
    ctx.fill();

    // Mirrored GP race visor
    ctx.fillStyle = '#090d14';
    ctx.beginPath();
    ctx.moveTo(3, -8.5);
    ctx.quadraticCurveTo(16, -9, 19, -1.2);
    ctx.lineTo(18.5, 3.6);
    ctx.lineTo(2, 1.8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = h.goggles;
    ctx.beginPath();
    ctx.moveTo(4.5, -7.0);
    ctx.quadraticCurveTo(14.8, -7.4, 17.8, -0.8);
    ctx.lineTo(17.4, 2.2);
    ctx.lineTo(3.8, 0.8);
    ctx.closePath();
    ctx.fill();

    // Visor tear-off tab & glare
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(7.5, -5.8);
    ctx.lineTo(12, -5.2);
    ctx.lineTo(9.4, 1.4);
    ctx.lineTo(6.6, 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-14.5, 4.5);
    ctx.bezierCurveTo(-17, -10, -7, -17, 5.5, -15.2);
    ctx.stroke();

    ctx.restore();
    return;
  }

  if (style === 'open_ski') {
    // Open-face street skate/stunt shell + lower face buff + big ski goggles
    // Lower face buff / mask
    ctx.fillStyle = h.chin;
    ctx.beginPath();
    ctx.moveTo(-6, 1.5);
    ctx.lineTo(14.5, 1.5);
    ctx.quadraticCurveTo(15.5, 11, 10, 12.2);
    ctx.lineTo(-8, 11.2);
    ctx.closePath();
    ctx.fill();

    // Half-shell helmet bowl (no chin guard, short brim)
    ctx.fillStyle = h.shell;
    ctx.beginPath();
    ctx.moveTo(-15.5, 3);
    ctx.bezierCurveTo(-17.5, -10.5, -7, -17, 5, -15.5);
    ctx.bezierCurveTo(12.5, -14.5, 15.5, -9.5, 15.5, -5.5);
    ctx.lineTo(6, -5.5);
    ctx.lineTo(-7, 4.5);
    ctx.closePath();
    ctx.fill();

    // Short urban brim
    ctx.fillStyle = h.visor;
    ctx.beginPath();
    ctx.moveTo(8, -10.5);
    ctx.quadraticCurveTo(15, -10.8, 18.5, -8.2);
    ctx.lineTo(17.5, -6.2);
    ctx.lineTo(7, -7.2);
    ctx.closePath();
    ctx.fill();

    // Accent stripe on bowl
    ctx.fillStyle = h.stripe;
    ctx.beginPath();
    ctx.moveTo(-14, -3);
    ctx.lineTo(-1, -11.5);
    ctx.lineTo(4, -11);
    ctx.lineTo(-9, -1);
    ctx.closePath();
    ctx.fill();

    // Goggle strap + large ski goggles
    ctx.fillStyle = h.strap;
    ctx.fillRect(-15.2, -5.5, 19.5, 5.8);

    ctx.fillStyle = '#0f131a';
    drawRRect(ctx, 2.5, -8.5, 13.8, 11.2, 3.2);
    ctx.fill();

    ctx.fillStyle = h.goggles;
    drawRRect(ctx, 4.2, -6.8, 10.6, 8.0, 2.2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.52)';
    ctx.beginPath();
    ctx.moveTo(6.2, -5.8);
    ctx.lineTo(10.5, -5.8);
    ctx.lineTo(8.0, 0.4);
    ctx.lineTo(5.6, 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    return;
  }

  // Classic MX ('mx_peak') or Aggressive Horned MX ('horned_mx')
  if (style === 'horned_mx') {
    // Sharp aero devil fins on top of the shell
    ctx.fillStyle = h.visor;
    ctx.beginPath();
    ctx.moveTo(-7, -13);
    ctx.quadraticCurveTo(-13, -23.5, -17.5, -21);
    ctx.quadraticCurveTo(-13, -15, -11.5, -10.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = h.stripe;
    ctx.beginPath();
    ctx.moveTo(1, -14.5);
    ctx.quadraticCurveTo(-3, -21.5, -8, -19.5);
    ctx.quadraticCurveTo(-4, -14.5, -3, -13);
    ctx.closePath();
    ctx.fill();
  }

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

  // MX goggles frame + mirrored lens
  ctx.fillStyle = '#0f131a';
  drawRRect(ctx, 4.5, -7.8, 11.5, 10.2, 2.8);
  ctx.fill();

  ctx.fillStyle = h.goggles;
  drawRRect(ctx, 6.2, -6.2, 8.8, 7.2, 2);
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
