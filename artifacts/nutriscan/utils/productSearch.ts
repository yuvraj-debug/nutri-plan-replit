import { Product } from "@/types";
import { SAMPLE_PRODUCTS } from "@/data/sampleProducts";
import { getCachedProduct, cacheProduct } from "@/utils/storage";

// Simulates barcode lookup from database
export async function lookupByBarcode(barcode: string): Promise<Product | null> {
  // First check cache
  const cached = await getCachedProduct(barcode);
  if (cached) return cached;

  // Check sample products DB
  await new Promise(r => setTimeout(r, 600)); // Simulate network
  const product = SAMPLE_PRODUCTS.find(p => p.barcode === barcode);
  if (product) {
    await cacheProduct(product);
    return product;
  }

  // Try Open Food Facts (simulated)
  return null;
}

// Search by name/brand
export async function searchProducts(query: string): Promise<Product[]> {
  await new Promise(r => setTimeout(r, 400));
  const lq = query.toLowerCase();
  return SAMPLE_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(lq) ||
    p.brand.toLowerCase().includes(lq) ||
    (p.barcode && p.barcode.includes(query)) ||
    (p.referenceCode && p.referenceCode.toLowerCase().includes(lq))
  );
}

// Look up by reference code
export async function lookupByReferenceCode(code: string): Promise<Product | null> {
  await new Promise(r => setTimeout(r, 500));
  return SAMPLE_PRODUCTS.find(p =>
    p.referenceCode === code ||
    p.barcode === code
  ) || null;
}

// Parse OCR text into product data (simplified)
export function parseOCRText(ocrText: string): Partial<Product> | null {
  if (!ocrText || ocrText.length < 20) return null;

  const lines = ocrText.split("\n").map(l => l.trim()).filter(Boolean);
  const result: Partial<Product> = {
    source: "ocr",
    confidence: 0.6,
  };

  // Try to extract nutrition info
  const nutritionInfo: Record<string, number> = {};

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Calories
    const calMatch = line.match(/(?:calories?|energy|kcal)[:\s]+(\d+)/i);
    if (calMatch) nutritionInfo["calories"] = parseInt(calMatch[1]);

    // Protein
    const protMatch = line.match(/protein[:\s]+(\d+\.?\d*)\s*g/i);
    if (protMatch) nutritionInfo["protein"] = parseFloat(protMatch[1]);

    // Sugar
    const sugarMatch = line.match(/(?:sugar|sugars)[:\s]+(\d+\.?\d*)\s*g/i);
    if (sugarMatch) nutritionInfo["sugar"] = parseFloat(sugarMatch[1]);

    // Fat
    const fatMatch = line.match(/(?:total fat|fat)[:\s]+(\d+\.?\d*)\s*g/i);
    if (fatMatch) nutritionInfo["fat"] = parseFloat(fatMatch[1]);

    // Sodium
    const sodiumMatch = line.match(/sodium[:\s]+(\d+\.?\d*)\s*mg/i);
    if (sodiumMatch) nutritionInfo["sodium"] = parseFloat(sodiumMatch[1]);

    // Fiber
    const fiberMatch = line.match(/(?:dietary fiber|fiber|fibre)[:\s]+(\d+\.?\d*)\s*g/i);
    if (fiberMatch) nutritionInfo["fiber"] = parseFloat(fiberMatch[1]);

    // Carbohydrates
    const carbMatch = line.match(/(?:carbohydrates?|total carb)[:\s]+(\d+\.?\d*)\s*g/i);
    if (carbMatch) nutritionInfo["carbohydrates"] = parseFloat(carbMatch[1]);
  }

  if (Object.keys(nutritionInfo).length > 2) {
    result.nutritionPer100g = {
      calories: nutritionInfo["calories"] || 0,
      protein: nutritionInfo["protein"] || 0,
      carbohydrates: nutritionInfo["carbohydrates"] || 0,
      sugar: nutritionInfo["sugar"] || 0,
      fat: nutritionInfo["fat"] || 0,
      saturatedFat: nutritionInfo["saturatedFat"] || 0,
      transFat: nutritionInfo["transFat"] || 0,
      fiber: nutritionInfo["fiber"] || 0,
      sodium: nutritionInfo["sodium"] || 0,
    };
    result.confidence = 0.75;
  }

  // Try to extract ingredient list
  const ingredientIdx = lines.findIndex(l => l.toLowerCase().includes("ingredient"));
  if (ingredientIdx >= 0 && ingredientIdx < lines.length - 1) {
    result.rawIngredients = lines.slice(ingredientIdx, ingredientIdx + 3).join(", ");
    result.confidence = Math.min(0.85, (result.confidence || 0) + 0.1);
  }

  return result;
}

export function generateProductId(): string {
  return "scan_" + Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
