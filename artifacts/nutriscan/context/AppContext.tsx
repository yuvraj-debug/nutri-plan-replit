import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { HealthProfile, HistoryItem, Product, ScanResult } from "@/types";
import {
  getHealthProfile,
  saveHealthProfile,
  getHistory,
  addToHistory,
  removeFromHistory,
  getFavorites,
  toggleFavorite,
  getPantry,
  togglePantry,
  getOnboarded,
  setOnboarded,
  DEFAULT_HEALTH_PROFILE,
  updateHistoryFavorite,
  updateHistoryPantry,
} from "@/utils/storage";
import { calculateScore, generateWarnings, generateVerdict, getSuitabilityLabel } from "@/utils/scoring";

interface AppContextType {
  isLoading: boolean;
  isOnboarded: boolean;
  completeOnboarding: () => Promise<void>;

  healthProfile: HealthProfile;
  updateHealthProfile: (profile: HealthProfile) => Promise<void>;

  history: HistoryItem[];
  addScanToHistory: (result: ScanResult) => Promise<void>;
  deleteFromHistory: (id: string) => Promise<void>;

  favoriteIds: string[];
  pantryIds: string[];
  toggleProductFavorite: (productId: string) => Promise<void>;
  toggleProductPantry: (productId: string) => Promise<void>;

  currentScanResult: ScanResult | null;
  setCurrentScanResult: (result: ScanResult | null) => void;

  analyzProduct: (product: Product) => ScanResult;

  compareProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(DEFAULT_HEALTH_PROFILE);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [pantryIds, setPantryIds] = useState<string[]>([]);
  const [currentScanResult, setCurrentScanResult] = useState<ScanResult | null>(null);
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const [onboarded, profile, hist, favs, pantry] = await Promise.all([
          getOnboarded(),
          getHealthProfile(),
          getHistory(),
          getFavorites(),
          getPantry(),
        ]);
        setIsOnboarded(onboarded);
        setHealthProfile(profile);
        setHistory(hist);
        setFavoriteIds(favs);
        setPantryIds(pantry);
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await setOnboarded();
    setIsOnboarded(true);
  }, []);

  const updateHealthProfile = useCallback(async (profile: HealthProfile) => {
    await saveHealthProfile(profile);
    setHealthProfile(profile);
  }, []);

  const analyzProduct = useCallback((product: Product): ScanResult => {
    const scoreBreakdown = calculateScore(product, healthProfile);
    const warnings = generateWarnings(product, healthProfile);
    const verdict = generateVerdict(scoreBreakdown.finalScore, healthProfile, product);
    const suitabilityLabel = getSuitabilityLabel(product, healthProfile);

    return {
      product,
      score: scoreBreakdown.finalScore,
      scoreBreakdown,
      confidence: product.confidence,
      verdict,
      suitabilityLabel,
      warnings,
      scanSource: product.source,
      isOcrUsed: product.source === "ocr",
      timestamp: new Date().toISOString(),
    };
  }, [healthProfile]);

  const addScanToHistory = useCallback(async (result: ScanResult) => {
    const item: HistoryItem = {
      id: `hist_${Date.now()}`,
      timestamp: result.timestamp,
      product: result.product,
      score: result.score,
      confidence: result.confidence,
      warnings: result.warnings,
      scanSource: result.scanSource,
      isOcrUsed: result.isOcrUsed,
      isFavorited: favoriteIds.includes(result.product.id),
      isInPantry: pantryIds.includes(result.product.id),
      nutritionSummary: result.product.nutritionPer100g,
    };
    await addToHistory(item);
    setHistory(prev => {
      const filtered = prev.filter(h => h.product.id !== result.product.id);
      return [item, ...filtered].slice(0, 200);
    });
  }, [favoriteIds, pantryIds]);

  const deleteFromHistory = useCallback(async (id: string) => {
    await removeFromHistory(id);
    setHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  const toggleProductFavorite = useCallback(async (productId: string) => {
    const newState = await toggleFavorite(productId);
    setFavoriteIds(prev => newState ? [...prev, productId] : prev.filter(id => id !== productId));
    await updateHistoryFavorite(productId, newState);
    setHistory(prev => prev.map(h => h.product.id === productId ? { ...h, isFavorited: newState } : h));
  }, []);

  const toggleProductPantry = useCallback(async (productId: string) => {
    const newState = await togglePantry(productId);
    setPantryIds(prev => newState ? [...prev, productId] : prev.filter(id => id !== productId));
    await updateHistoryPantry(productId, newState);
    setHistory(prev => prev.map(h => h.product.id === productId ? { ...h, isInPantry: newState } : h));
  }, []);

  const addToCompare = useCallback((product: Product) => {
    setCompareProducts(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= 3) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareProducts([]);
  }, []);

  return (
    <AppContext.Provider value={{
      isLoading,
      isOnboarded,
      completeOnboarding,
      healthProfile,
      updateHealthProfile,
      history,
      addScanToHistory,
      deleteFromHistory,
      favoriteIds,
      pantryIds,
      toggleProductFavorite,
      toggleProductPantry,
      currentScanResult,
      setCurrentScanResult,
      analyzProduct,
      compareProducts,
      addToCompare,
      removeFromCompare,
      clearCompare,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
