import {
  Shield,
  Flame,
  Crown,
  Zap,
  Skull,
  Dog,
  Star,
  Sword,
  Gem,
  Disc,
  Ghost,
  Crosshair,
} from 'lucide-react';

export interface ClanAvatarPreset {
  id: string;
  label: string;
}

export const CLAN_AVATAR_PRESETS: ClanAvatarPreset[] = [
  { id: 'shield', label: 'Щит' },
  { id: 'flame', label: 'Огонь' },
  { id: 'crown', label: 'Корона' },
  { id: 'zap', label: 'Молния' },
  { id: 'skull', label: 'Череп' },
  { id: 'wolf', label: 'Волк' },
  { id: 'star', label: 'Звезда' },
  { id: 'sword', label: 'Меч' },
  { id: 'diamond', label: 'Алмаз' },
  { id: 'wheel', label: 'Колесо' },
  { id: 'ghost', label: 'Призрак' },
  { id: 'target', label: 'Прицел' },
];

export function resizeImageToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Выбери файл картинки (JPG, PNG или WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Не удалось загрузить картинку.'));
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Ошибка обработки картинки.'));
          return;
        }
        // Center-crop square
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 55_000 && quality > 0.35) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUrl.length > 62_000) {
          reject(new Error('Картинка слишком большая. Попробуй другую.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

interface ClanAvatarProps {
  avatar?: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ClanAvatar({ avatar = 'shield', color, size = 'md', className = '' }: ClanAvatarProps) {
  const boxClass =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
        ? 'w-12 h-12 rounded-xl'
        : 'w-10 h-10 rounded-xl';

  const iconClass =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  if (avatar.startsWith('data:image/')) {
    return (
      <div
        className={`${boxClass} overflow-hidden border shrink-0 bg-[#0d1117] ${className}`}
        style={{ borderColor: `${color}77` }}
      >
        <img
          src={avatar}
          alt="Аватар клана"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const renderIcon = () => {
    switch (avatar) {
      case 'flame':
        return <Flame className={iconClass} />;
      case 'crown':
        return <Crown className={iconClass} />;
      case 'zap':
        return <Zap className={iconClass} />;
      case 'skull':
        return <Skull className={iconClass} />;
      case 'wolf':
        return <Dog className={iconClass} />;
      case 'star':
        return <Star className={iconClass} />;
      case 'sword':
        return <Sword className={iconClass} />;
      case 'diamond':
        return <Gem className={iconClass} />;
      case 'wheel':
        return <Disc className={iconClass} />;
      case 'ghost':
        return <Ghost className={iconClass} />;
      case 'target':
        return <Crosshair className={iconClass} />;
      default:
        return <Shield className={iconClass} />;
    }
  };

  return (
    <div
      className={`${boxClass} border flex items-center justify-center shrink-0 ${className}`}
      style={{
        color,
        borderColor: `${color}66`,
        background: `${color}1e`,
      }}
    >
      {renderIcon()}
    </div>
  );
}
