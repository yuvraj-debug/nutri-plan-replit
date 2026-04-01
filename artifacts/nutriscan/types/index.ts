export type DietType = "none" | "vegetarian" | "vegan";

export type HealthCondition =
  | "diabetes"
  | "hypertension"
  | "heartDisease"
  | "celiacDisease"
  | "lactoseIntolerance"
  | "kidneyDisease";

export type Allergen =
  | "peanuts"
  | "treeNuts"
  | "dairy"
  | "eggs"
  | "wheat"
  | "soy"
  | "fish"
  | "shellfish"
  | "sesame";

export type Preference = "lowSugar" | "noAdditives" | "lowSodium";

export interface HealthProfile {
  dietType: DietType;
  conditions: HealthCondition[];
  allergens: Allergen[];
  preferences: Preference[];
}

export type IngredientRisk = "safe" | "caution" | "avoid";

export interface Ingredient {
  name: string;
  function: string;
  risk: IngredientRisk;
  isAdditive: boolean;
  isSynthetic?: boolean;
  why: string;
  suitabilityNote?: string;
  regulatoryNote?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  sugar: number;
  fat: number;
  saturatedFat: number;
  transFat: number;
  fiber: number;
  sodium: number;
  [key: string]: number;
}

export type ProductCategory =
  | "beverages"
  | "biscuits"
  | "chips"
  | "noodles"
  | "dairy"
  | "protein"
  | "cereals"
  | "sweets"
  | "condiments"
  | "bakery"
  | "frozen"
  | "nutritionDrinks"
  | "other";

export type ScanSource = "barcode" | "ocr" | "manual" | "database" | "userSubmitted";

export interface Product {
  id: string;
  name: string;
  brand: string;
  barcode?: string;
  referenceCode?: string;
  category: ProductCategory;
  packageSize?: string;
  servingSize?: string;
  nutritionPer100g: NutritionInfo;
  nutritionPerServing?: NutritionInfo;
  ingredients: Ingredient[];
  rawIngredients: string;
  allergens: string[];
  additives: string[];
  warnings: string[];
  imageUrl?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isJainFriendly?: boolean;
  isHalal?: boolean;
  modStatus?: "approved" | "pending" | "rejected";
  source: ScanSource;
  confidence: number;
  lastUpdated: string;
  country?: string;
}

export interface ScoreBreakdown {
  baseNutritionScore: number;
  ingredientQualityScore: number;
  additiveScore: number;
  personalizationAdjustment: number;
  missingDataPenalty: number;
  ultraProcessedPenalty: number;
  finalScore: number;
  positives: string[];
  negatives: string[];
}

export interface ScanResult {
  product: Product;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  confidence: number;
  verdict: string;
  suitabilityLabel: string;
  warnings: PersonalizedWarning[];
  scanSource: ScanSource;
  isOcrUsed: boolean;
  timestamp: string;
}

export interface PersonalizedWarning {
  level: "red" | "orange" | "yellow" | "green";
  title: string;
  message: string;
  relatedTo: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  product: Product;
  score: number;
  confidence: number;
  warnings: PersonalizedWarning[];
  scanSource: ScanSource;
  isOcrUsed: boolean;
  isFavorited: boolean;
  isInPantry: boolean;
  nutritionSummary: NutritionInfo;
}

export interface CompareItem {
  product: Product;
  score: number;
  confidence: number;
}
