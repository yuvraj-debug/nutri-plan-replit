import { HealthProfile, NutritionInfo, Product, ScoreBreakdown, PersonalizedWarning, ProductCategory } from "@/types";

interface CategoryWeights {
  sugar: number;
  sodium: number;
  fat: number;
  saturatedFat: number;
  transFat: number;
  fiber: number;
  protein: number;
  calories: number;
}

const CATEGORY_WEIGHTS: Record<ProductCategory, CategoryWeights> = {
  beverages: { sugar: 2.5, sodium: 1.0, fat: 1.0, saturatedFat: 1.0, transFat: 3.0, fiber: 0.5, protein: 0.5, calories: 1.5 },
  biscuits: { sugar: 1.8, sodium: 1.2, fat: 1.5, saturatedFat: 1.5, transFat: 3.0, fiber: 1.5, protein: 1.0, calories: 1.2 },
  chips: { sugar: 1.0, sodium: 2.0, fat: 2.0, saturatedFat: 1.5, transFat: 3.0, fiber: 1.0, protein: 0.8, calories: 1.5 },
  noodles: { sugar: 1.0, sodium: 2.5, fat: 1.5, saturatedFat: 1.2, transFat: 3.0, fiber: 1.5, protein: 1.5, calories: 1.0 },
  dairy: { sugar: 1.5, sodium: 1.0, fat: 1.5, saturatedFat: 2.0, transFat: 2.0, fiber: 0.5, protein: 2.0, calories: 1.0 },
  protein: { sugar: 1.5, sodium: 1.0, fat: 1.0, saturatedFat: 1.0, transFat: 2.5, fiber: 1.0, protein: 2.5, calories: 1.0 },
  cereals: { sugar: 2.0, sodium: 1.0, fat: 1.0, saturatedFat: 1.0, transFat: 3.0, fiber: 2.0, protein: 1.5, calories: 1.0 },
  sweets: { sugar: 2.0, sodium: 0.8, fat: 1.5, saturatedFat: 1.5, transFat: 3.0, fiber: 0.5, protein: 0.5, calories: 1.5 },
  condiments: { sugar: 1.0, sodium: 3.0, fat: 1.0, saturatedFat: 1.0, transFat: 2.0, fiber: 0.5, protein: 0.5, calories: 0.5 },
  bakery: { sugar: 1.8, sodium: 1.2, fat: 1.8, saturatedFat: 1.8, transFat: 3.0, fiber: 1.5, protein: 1.0, calories: 1.2 },
  frozen: { sugar: 1.0, sodium: 1.5, fat: 1.5, saturatedFat: 1.2, transFat: 2.5, fiber: 1.0, protein: 1.0, calories: 1.0 },
  nutritionDrinks: { sugar: 1.8, sodium: 0.8, fat: 1.0, saturatedFat: 1.0, transFat: 2.0, fiber: 0.5, protein: 2.0, calories: 1.0 },
  other: { sugar: 1.5, sodium: 1.5, fat: 1.5, saturatedFat: 1.5, transFat: 3.0, fiber: 1.0, protein: 1.0, calories: 1.0 },
};

function calcNutritionScore(nutrition: NutritionInfo, weights: CategoryWeights): number {
  let score = 10;
  const { sugar, sodium, fat, saturatedFat, transFat, fiber, protein, calories } = nutrition;

  // Penalize high sugar
  if (sugar > 20) score -= weights.sugar * 3;
  else if (sugar > 12) score -= weights.sugar * 2;
  else if (sugar > 6) score -= weights.sugar * 1;

  // Penalize high sodium (per 100g)
  if (sodium > 800) score -= weights.sodium * 2.5;
  else if (sodium > 500) score -= weights.sodium * 1.5;
  else if (sodium > 300) score -= weights.sodium * 0.8;

  // Penalize saturated fat
  if (saturatedFat > 10) score -= weights.saturatedFat * 2;
  else if (saturatedFat > 6) score -= weights.saturatedFat * 1;
  else if (saturatedFat > 3) score -= weights.saturatedFat * 0.5;

  // Penalize trans fat heavily
  if (transFat > 1) score -= weights.transFat * 3;
  else if (transFat > 0.2) score -= weights.transFat * 1.5;

  // Penalize high fat overall
  if (fat > 25) score -= weights.fat * 1.5;
  else if (fat > 15) score -= weights.fat * 0.8;

  // Penalize high calories (per 100g)
  if (calories > 450) score -= weights.calories * 1.2;
  else if (calories > 350) score -= weights.calories * 0.8;

  // Reward fiber
  if (fiber > 6) score += weights.fiber * 2;
  else if (fiber > 3) score += weights.fiber * 1;
  else if (fiber < 1) score -= weights.fiber * 0.5;

  // Reward protein
  if (protein > 15) score += weights.protein * 2;
  else if (protein > 8) score += weights.protein * 1;

  return score;
}

function calcIngredientScore(ingredients: Product["ingredients"]): number {
  let score = 0;
  const avoidCount = ingredients.filter(i => i.risk === "avoid").length;
  const cautionCount = ingredients.filter(i => i.risk === "caution").length;
  const additiveCount = ingredients.filter(i => i.isAdditive).length;

  score -= avoidCount * 1.5;
  score -= cautionCount * 0.3;
  score -= Math.max(0, additiveCount - 3) * 0.3;

  if (avoidCount === 0 && additiveCount <= 2) score += 1;
  if (ingredients.every(i => i.risk === "safe")) score += 1.5;

  return score;
}

function calcAdditiveScore(additives: string[]): number {
  if (additives.length === 0) return 0.5;
  if (additives.length <= 2) return 0;
  if (additives.length <= 5) return -0.5;
  return -1.5;
}

function isUltraProcessed(product: Product): boolean {
  const upcMarkers = ["maltodextrin", "hydrogenated", "E621", "E631", "E635", "artificial", "flavour enhancer"];
  const rawLower = product.rawIngredients.toLowerCase();
  const matches = upcMarkers.filter(m => rawLower.includes(m.toLowerCase()));
  return matches.length >= 2 || product.additives.length > 5;
}

export function calculateScore(product: Product, profile: HealthProfile): ScoreBreakdown {
  const weights = CATEGORY_WEIGHTS[product.category];
  const baseNutritionScore = calcNutritionScore(product.nutritionPer100g, weights);
  const ingredientQualityScore = calcIngredientScore(product.ingredients);
  const additiveScore = calcAdditiveScore(product.additives);
  const ultraProcessedPenalty = isUltraProcessed(product) ? -0.8 : 0;
  const missingDataPenalty = product.confidence < 0.7 ? -0.5 : 0;

  let personalizationAdjustment = 0;
  const { conditions, allergens, preferences } = profile;

  if (conditions.includes("diabetes")) {
    if (product.nutritionPer100g.sugar > 15) personalizationAdjustment -= 1.5;
    else if (product.nutritionPer100g.sugar > 8) personalizationAdjustment -= 0.8;
  }
  if (conditions.includes("hypertension")) {
    if (product.nutritionPer100g.sodium > 600) personalizationAdjustment -= 1.5;
    else if (product.nutritionPer100g.sodium > 300) personalizationAdjustment -= 0.8;
  }
  if (conditions.includes("heartDisease")) {
    if (product.nutritionPer100g.transFat > 0.2) personalizationAdjustment -= 2;
    if (product.nutritionPer100g.saturatedFat > 8) personalizationAdjustment -= 1;
  }
  if (conditions.includes("celiacDisease")) {
    const hasGluten = product.allergens.some(a => a === "wheat" || a === "gluten");
    if (hasGluten) personalizationAdjustment -= 3;
  }
  if (conditions.includes("lactoseIntolerance")) {
    if (product.allergens.includes("dairy")) personalizationAdjustment -= 2;
  }
  if (preferences.includes("lowSugar") && product.nutritionPer100g.sugar > 10) {
    personalizationAdjustment -= 0.5;
  }
  if (preferences.includes("lowSodium") && product.nutritionPer100g.sodium > 400) {
    personalizationAdjustment -= 0.5;
  }
  if (preferences.includes("noAdditives") && product.additives.length > 2) {
    personalizationAdjustment -= 0.5;
  }

  const allergenMatch = allergens.some(a => product.allergens.includes(a));
  if (allergenMatch) personalizationAdjustment -= 3;

  const rawFinal = baseNutritionScore + ingredientQualityScore + additiveScore + personalizationAdjustment - missingDataPenalty - Math.abs(ultraProcessedPenalty);
  const finalScore = Math.round(Math.max(0, Math.min(10, rawFinal)) * 10) / 10;

  const positives: string[] = [];
  const negatives: string[] = [];

  if (product.nutritionPer100g.protein > 10) positives.push("Good protein content");
  if (product.nutritionPer100g.fiber > 3) positives.push("Good source of fiber");
  if (product.nutritionPer100g.transFat === 0) positives.push("Zero trans fat");
  if (product.additives.length === 0) positives.push("No artificial additives");
  if (product.nutritionPer100g.sodium < 200) positives.push("Low sodium");
  if (product.nutritionPer100g.sugar < 5) positives.push("Low sugar");

  if (product.nutritionPer100g.sugar > 15) negatives.push(`High sugar (${product.nutritionPer100g.sugar}g per 100g)`);
  if (product.nutritionPer100g.sodium > 500) negatives.push(`High sodium (${product.nutritionPer100g.sodium}mg per 100g)`);
  if (product.nutritionPer100g.transFat > 0.2) negatives.push("Contains trans fat");
  if (product.nutritionPer100g.saturatedFat > 8) negatives.push("High in saturated fat");
  if (product.additives.length > 3) negatives.push(`${product.additives.length} artificial additives`);
  if (product.nutritionPer100g.calories > 400) negatives.push("High calorie density");

  return {
    baseNutritionScore: Math.round(baseNutritionScore * 10) / 10,
    ingredientQualityScore: Math.round(ingredientQualityScore * 10) / 10,
    additiveScore: Math.round(additiveScore * 10) / 10,
    personalizationAdjustment: Math.round(personalizationAdjustment * 10) / 10,
    missingDataPenalty,
    ultraProcessedPenalty,
    finalScore,
    positives,
    negatives,
  };
}

export function generateWarnings(product: Product, profile: HealthProfile): PersonalizedWarning[] {
  const warnings: PersonalizedWarning[] = [];

  const allergenMatches = profile.allergens.filter(a => product.allergens.includes(a));
  allergenMatches.forEach(a => {
    warnings.push({
      level: "red",
      title: `Allergen Alert: ${a.charAt(0).toUpperCase() + a.slice(1)}`,
      message: `This product contains ${a} which you are allergic to. Do not consume.`,
      relatedTo: a,
    });
  });

  const { conditions } = profile;

  if (conditions.includes("diabetes") && product.nutritionPer100g.sugar > 12) {
    warnings.push({
      level: product.nutritionPer100g.sugar > 20 ? "red" : "orange",
      title: "High Sugar - Diabetes Risk",
      message: `Contains ${product.nutritionPer100g.sugar}g sugar per 100g. This may cause blood sugar spikes.`,
      relatedTo: "diabetes",
    });
  }
  if (conditions.includes("hypertension") && product.nutritionPer100g.sodium > 400) {
    warnings.push({
      level: product.nutritionPer100g.sodium > 700 ? "red" : "orange",
      title: "High Sodium - BP Risk",
      message: `Contains ${product.nutritionPer100g.sodium}mg sodium per 100g. May affect blood pressure.`,
      relatedTo: "hypertension",
    });
  }
  if (conditions.includes("heartDisease") && product.nutritionPer100g.transFat > 0) {
    warnings.push({
      level: "red",
      title: "Trans Fat - Heart Risk",
      message: "Contains trans fat which increases risk of heart disease.",
      relatedTo: "heartDisease",
    });
  }
  if (conditions.includes("celiacDisease") && product.allergens.some(a => a === "wheat" || a === "gluten")) {
    warnings.push({
      level: "red",
      title: "Contains Gluten - Celiac Risk",
      message: "This product contains gluten and is NOT safe for celiac disease.",
      relatedTo: "celiacDisease",
    });
  }
  if (conditions.includes("lactoseIntolerance") && product.allergens.includes("dairy")) {
    warnings.push({
      level: "orange",
      title: "Contains Dairy",
      message: "May cause digestive discomfort if you are lactose intolerant.",
      relatedTo: "lactoseIntolerance",
    });
  }

  if (profile.dietType === "vegan" && !product.isVegan) {
    warnings.push({
      level: "orange",
      title: "Not Vegan",
      message: "This product contains animal-derived ingredients.",
      relatedTo: "vegan",
    });
  }
  if (profile.dietType === "vegetarian" && !product.isVegetarian) {
    warnings.push({
      level: "red",
      title: "Not Vegetarian",
      message: "This product contains non-vegetarian ingredients.",
      relatedTo: "vegetarian",
    });
  }

  if (product.ingredients.some(i => i.risk === "avoid")) {
    const avoidList = product.ingredients.filter(i => i.risk === "avoid").map(i => i.name).join(", ");
    warnings.push({
      level: "orange",
      title: "Ingredients to Avoid",
      message: `Contains: ${avoidList}`,
      relatedTo: "ingredients",
    });
  }

  return warnings;
}

export function generateVerdict(score: number, profile: HealthProfile, product: Product): string {
  const hasAllergen = profile.allergens.some(a => product.allergens.includes(a));
  if (hasAllergen) return "Do not consume — contains allergens you are sensitive to.";

  if (score >= 8) return "An excellent choice! This product scores well on nutrition and ingredient quality.";
  if (score >= 7) return "A good option overall. Enjoy as part of a balanced diet.";
  if (score >= 5.5) return "A decent choice but has some concerns. Fine for occasional consumption.";
  if (score >= 4) return "Consume in moderation. This product has notable nutritional drawbacks.";
  if (score >= 2.5) return "Not a great choice. Try to limit how often you eat this.";
  return "Avoid if possible. This product has several serious nutritional or ingredient concerns.";
}

export function getSuitabilityLabel(product: Product, profile: HealthProfile): string {
  const hasAllergen = profile.allergens.some(a => product.allergens.includes(a));
  if (hasAllergen) return "Not suitable for you";

  const hasConditionIssue = profile.conditions.some(c => {
    if (c === "celiacDisease" && product.allergens.some(a => a === "wheat" || a === "gluten")) return true;
    if (c === "diabetes" && product.nutritionPer100g.sugar > 20) return true;
    if (c === "hypertension" && product.nutritionPer100g.sodium > 700) return true;
    if (c === "heartDisease" && product.nutritionPer100g.transFat > 0.2) return true;
    return false;
  });

  if (hasConditionIssue) return "Caution advised for you";

  if (profile.dietType === "vegan" && !product.isVegan) return "Not suitable (not vegan)";
  if (profile.dietType === "vegetarian" && !product.isVegetarian) return "Not suitable (not vegetarian)";

  return "Generally suitable for you";
}
