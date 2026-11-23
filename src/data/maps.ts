export type MapId = 'city' | 'highway' | 'industrial';
export type TimeOfDay = 'day' | 'night';
export type WeatherId = 'clear' | 'rain' | 'fog' | 'snow';

export interface MapSpec {
  id: MapId;
  name: string;
  subtitle: string;
}

export interface WeatherSpec {
  id: WeatherId;
  name: string;
  subtitle: string;
}

export const MAPS: MapSpec[] = [
  { id: 'city', name: 'Город', subtitle: 'Проспект' },
  { id: 'highway', name: 'Набережная', subtitle: 'Мост и шоссе' },
  { id: 'industrial', name: 'Промзона', subtitle: 'Стант-спот' },
];

export const WEATHERS: WeatherSpec[] = [
  { id: 'clear', name: 'Ясно', subtitle: 'Чистое небо' },
  { id: 'rain', name: 'Дождь', subtitle: 'Ливень и лужи' },
  { id: 'fog', name: 'Туман', subtitle: 'Плотная дымка' },
  { id: 'snow', name: 'Снег', subtitle: 'Снегопад' },
];

const MAP_STORAGE_KEY = 'bs_map_v1';
const TIME_STORAGE_KEY = 'bs_time_v1';
const WEATHER_STORAGE_KEY = 'bs_weather_v1';

export function loadMapId(): MapId {
  try {
    const raw = localStorage.getItem(MAP_STORAGE_KEY);
    if (raw === 'city' || raw === 'highway' || raw === 'industrial') return raw;
  } catch {
    // Ignore storage read errors
  }
  return 'city';
}

export function saveMapId(id: MapId) {
  try {
    localStorage.setItem(MAP_STORAGE_KEY, id);
  } catch {
    // Ignore storage write errors
  }
}

export function loadTimeOfDay(): TimeOfDay {
  try {
    const raw = localStorage.getItem(TIME_STORAGE_KEY);
    if (raw === 'day' || raw === 'night') return raw;
  } catch {
    // Ignore storage read errors
  }
  return 'day';
}

export function saveTimeOfDay(time: TimeOfDay) {
  try {
    localStorage.setItem(TIME_STORAGE_KEY, time);
  } catch {
    // Ignore storage write errors
  }
}

export function loadWeatherId(): WeatherId {
  try {
    const raw = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (raw === 'clear' || raw === 'rain' || raw === 'fog' || raw === 'snow') return raw;
  } catch {
    // Ignore storage read errors
  }
  return 'clear';
}

export function saveWeatherId(weather: WeatherId) {
  try {
    localStorage.setItem(WEATHER_STORAGE_KEY, weather);
  } catch {
    // Ignore storage write errors
  }
}
