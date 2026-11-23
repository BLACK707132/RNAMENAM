export interface GameFeature {
  id: string;
  index: string;
  title: string;
  description: string;
}

export const GAME_PWA_URL = 'https://blackstant-red.vercel.app';

export const GAME_SCREENSHOT = {
  src: '/assets/aistudio/______________2026-11-18_210746_2c7974fd.png',
  alt: 'Скриншот BLACK STANT: райдер в зелёном шлеме делает вилли на электросамокате на городской дороге',
};

export const GAME_FEATURES: GameFeature[] = [
  {
    id: 'wheelie',
    index: '01.',
    title: 'Уличные трюки на самокате',
    description:
      'Поднимай электросамокат на заднее колесо, катайся по городским улицам и набирай серию очков.',
  },
  {
    id: 'pwa',
    index: '02.',
    title: 'Только лёгкий PWA-формат',
    description:
      'Никаких тяжёлых установочных файлов и архивов — игра открывается как приложение прямо на экране телефона и ПК.',
  },
  {
    id: 'account',
    index: '03.',
    title: 'Ник и пароль игрока',
    description:
      'Создай личный никнейм и пароль в шапке сайта для быстрого входа в профиль.',
  },
];

export interface PwaPlatformGuide {
  id: 'android' | 'ios' | 'desktop';
  label: string;
  browser: string;
  steps: string[];
}

export const PWA_GUIDES: PwaPlatformGuide[] = [
  {
    id: 'android',
    label: 'Android',
    browser: 'Google Chrome',
    steps: [
      'Откройте PWA-приложение BLACK STANT в браузере Chrome.',
      'Нажмите меню «⋮» в правом верхнем углу экрана.',
      'Выберите «Добавить на главный экран» или «Установить приложение».',
    ],
  },
  {
    id: 'ios',
    label: 'iPhone / iPad',
    browser: 'Safari',
    steps: [
      'Откройте PWA-приложение BLACK STANT в браузере Safari.',
      'Нажмите кнопку «Поделиться» в нижней панели экрана.',
      'Выберите пункт «На экран «Домой»» и подтвердите добавление.',
    ],
  },
  {
    id: 'desktop',
    label: 'ПК (Windows / Mac)',
    browser: 'Chrome / Edge',
    steps: [
      'Откройте PWA-приложение BLACK STANT в браузере.',
      'Нажмите на значок установки приложения в адресной строке справа.',
      'Подтвердите установку — ярлык игры появится на рабочем столе.',
    ],
  },
];
