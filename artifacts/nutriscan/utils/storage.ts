import AsyncStorage from "@react-native-async-storage/async-storage";
import { HistoryItem, HealthProfile, Product } from "@/types";

const KEYS = {
  HISTORY: "@nutriscan:history",
  FAVORITES: "@nutriscan:favorites",
  PANTRY: "@nutriscan:pantry",
  HEALTH_PROFILE: "@nutriscan:healthProfile",
  ONBOARDED: "@nutriscan:onboarded",
  CACHED_PRODUCTS: "@nutriscan:cachedProducts",
};

export const DEFAULT_HEALTH_PROFILE: HealthProfile = {
  dietType: "none",
  conditions: [],
  allergens: [],
  preferences: [],
};

export async function getOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === "true";
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, "true");
}

export async function getHealthProfile(): Promise<HealthProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HEALTH_PROFILE);
    if (!raw) return DEFAULT_HEALTH_PROFILE;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_HEALTH_PROFILE;
  }
}

export async function saveHealthProfile(profile: HealthProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.HEALTH_PROFILE, JSON.stringify(profile));
}

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addToHistory(item: HistoryItem): Promise<void> {
  const history = await getHistory();
  const exists = history.findIndex(h => h.product.id === item.product.id);
  if (exists >= 0) {
    history.splice(exists, 1);
  }
  history.unshift(item);
  const limited = history.slice(0, 200);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(limited));
}

export async function removeFromHistory(id: string): Promise<void> {
  const history = await getHistory();
  const updated = history.filter(h => h.id !== id);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.HISTORY);
}

export async function getFavorites(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FAVORITES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function toggleFavorite(productId: string): Promise<boolean> {
  const favorites = await getFavorites();
  const idx = favorites.indexOf(productId);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    return false;
  } else {
    favorites.push(productId);
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    return true;
  }
}

export async function getPantry(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PANTRY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function togglePantry(productId: string): Promise<boolean> {
  const pantry = await getPantry();
  const idx = pantry.indexOf(productId);
  if (idx >= 0) {
    pantry.splice(idx, 1);
    await AsyncStorage.setItem(KEYS.PANTRY, JSON.stringify(pantry));
    return false;
  } else {
    pantry.push(productId);
    await AsyncStorage.setItem(KEYS.PANTRY, JSON.stringify(pantry));
    return true;
  }
}

export async function getCachedProduct(barcode: string): Promise<Product | null> {
  try {
    const raw = await AsyncStorage.getItem(`${KEYS.CACHED_PRODUCTS}:${barcode}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function cacheProduct(product: Product): Promise<void> {
  if (!product.barcode) return;
  await AsyncStorage.setItem(`${KEYS.CACHED_PRODUCTS}:${product.barcode}`, JSON.stringify(product));
}

export async function updateHistoryFavorite(productId: string, isFavorited: boolean): Promise<void> {
  const history = await getHistory();
  const updated = history.map(h => h.product.id === productId ? { ...h, isFavorited } : h);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
}

export async function updateHistoryPantry(productId: string, isInPantry: boolean): Promise<void> {
  const history = await getHistory();
  const updated = history.map(h => h.product.id === productId ? { ...h, isInPantry } : h);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
}
