import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, Share,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScoreRing } from "@/components/ScoreRing";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { NutritionBar } from "@/components/NutritionBar";
import { WarningCard } from "@/components/WarningCard";
import { ProductAvatar } from "@/components/ProductAvatar";
import { SAMPLE_PRODUCTS } from "@/data/sampleProducts";
import { ScanResult, NutritionInfo } from "@/types";

type NutritionBasis = "per100g" | "perServing" | "fullPack";

function multiplyNutrition(n: NutritionInfo, factor: number): NutritionInfo {
  const result: NutritionInfo = {} as NutritionInfo;
  for (const key of Object.keys(n)) {
    result[key] = Math.round(n[key] * factor * 10) / 10;
  }
  return result;
}

function parseGrams(sizeStr?: string): number | null {
  if (!sizeStr) return null;
  const match = sizeStr.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

export default function ResultScreen() {
  const colors = useColors();
  const {
    currentScanResult, setCurrentScanResult, analyzProduct,
    favoriteIds, pantryIds, toggleProductFavorite, toggleProductPantry, addToCompare,
  } = useApp();
  const insets = useSafeAreaInsets();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [result, setResult] = useState<ScanResult | null>(currentScanResult);
  const [activeTab, setActiveTab] = useState<"overview" | "nutrition" | "ingredients">("overview");
  const [nutritionBasis, setNutritionBasis] = useState<NutritionBasis>("per100g");

  useEffect(() => {
    if (!result && productId) {
      const product = SAMPLE_PRODUCTS.find(p => p.id === productId);
      if (product) setResult(analyzProduct(product));
    }
  }, [productId]);

  if (!result) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={48} color={colors.border} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No scan result</Text>
        <TouchableOpacity onPress={() => router.replace("/scanner")}>
          <Text style={[styles.emptyLink, { color: colors.primary }]}>Scan a product</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { product, score, scoreBreakdown, confidence, verdict, suitabilityLabel, warnings } = result;
  const isFavorited = favoriteIds.includes(product.id);
  const isInPantry = pantryIds.includes(product.id);

  const servingGrams = parseGrams(product.servingSize);
  const packGrams = parseGrams(product.packageSize);
  const servingFactor = servingGrams ? servingGrams / 100 : null;
  const packFactor = packGrams ? packGrams / 100 : null;

  function getNutritionData(): { data: NutritionInfo; label: string } {
    const base = product.nutritionPer100g;
    if (nutritionBasis === "perServing" && servingFactor) {
      return { data: multiplyNutrition(base, servingFactor), label: `per serving (${product.servingSize})` };
    }
    if (nutritionBasis === "fullPack" && packFactor) {
      return { data: multiplyNutrition(base, packFactor), label: `per full pack (${product.packageSize})` };
    }
    return { data: base, label: "per 100g" };
  }

  const { data: n, label: nLabel } = getNutritionData();

  function getSuitabilityColor() {
    if (suitabilityLabel.includes("Not suitable")) return colors.warningRed;
    if (suitabilityLabel.includes("Caution")) return colors.warningOrange;
    return colors.warningGreen;
  }

  async function handleShare() {
    const message =
      `🔍 NutriScan AI — ${product.name}\n` +
      `Brand: ${product.brand}\n` +
      `Health Score: ${score.toFixed(1)}/10\n` +
      `${verdict}\n\n` +
      `Key nutrition (per 100g):\n` +
      `• Calories: ${product.nutritionPer100g.calories} kcal\n` +
      `• Sugar: ${product.nutritionPer100g.sugar}g\n` +
      `• Sodium: ${product.nutritionPer100g.sodium}mg\n` +
      `• Protein: ${product.nutritionPer100g.protein}g`;
    try {
      await Share.share({ message, title: `NutriScan: ${product.name}` });
    } catch {
      Alert.alert("Share", message);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setCurrentScanResult(null); router.back(); }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground }]} numberOfLines={1}>Result</Text>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={handleShare}>
            <Feather name="share-2" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleProductFavorite(product.id)}>
            <Feather name="heart" size={20} color={isFavorited ? colors.accent : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { addToCompare(product); Alert.alert("Added to Compare", `${product.name} added. Go to Compare to view.`); }}>
            <Feather name="bar-chart-2" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 32 }}>
        {/* Product Hero */}
        <View style={[styles.heroSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <ProductAvatar category={product.category} size={72} />
          <View style={styles.heroMid}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.categoryBadgeText, { color: colors.mutedForeground }]}>{product.category}</Text>
            </View>
            <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>{product.name}</Text>
            <Text style={[styles.brandName, { color: colors.mutedForeground }]}>{product.brand}</Text>
            <View style={styles.metaRow}>
              {product.servingSize && (
                <Text style={[styles.metaChip, { color: colors.mutedForeground }]}>
                  <Feather name="layers" size={10} /> {product.servingSize}
                </Text>
              )}
              {product.packageSize && (
                <Text style={[styles.metaChip, { color: colors.mutedForeground }]}>
                  <Feather name="package" size={10} /> {product.packageSize}
                </Text>
              )}
            </View>
          </View>
          <ScoreRing score={score} size={80} />
        </View>

        <View style={styles.body}>
          {/* Confidence + Suitability */}
          <View style={styles.confidenceRow}>
            <ConfidenceBadge confidence={confidence} />
            <View style={[styles.suitabilityBadge, { backgroundColor: getSuitabilityColor() + "20" }]}>
              <Text style={[styles.suitabilityText, { color: getSuitabilityColor() }]}>{suitabilityLabel}</Text>
            </View>
          </View>

          {/* Verdict */}
          <View style={[styles.verdictCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.verdictTitle, { color: colors.foreground }]}>Summary</Text>
            <Text style={[styles.verdictText, { color: colors.mutedForeground }]}>{verdict}</Text>
          </View>

          {/* Warnings */}
          {warnings.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Warnings for You ({warnings.length})
              </Text>
              {warnings.map((w, i) => <WarningCard key={i} warning={w} />)}
            </>
          )}

          {/* Diet Tags */}
          <View style={styles.tagsRow}>
            {product.isVegetarian && (
              <View style={[styles.tag, { backgroundColor: "#2E7D3215", borderColor: colors.warningGreen }]}>
                <Text style={[styles.tagText, { color: colors.warningGreen }]}>● VEG</Text>
              </View>
            )}
            {product.isVegan && (
              <View style={[styles.tag, { backgroundColor: "#1565C015" }]}>
                <Text style={[styles.tagText, { color: "#1565C0" }]}>VEGAN</Text>
              </View>
            )}
            {product.isJainFriendly && (
              <View style={[styles.tag, { backgroundColor: "#6A1B9A15" }]}>
                <Text style={[styles.tagText, { color: "#6A1B9A" }]}>JAIN</Text>
              </View>
            )}
            {product.isHalal && (
              <View style={[styles.tag, { backgroundColor: "#004D4015" }]}>
                <Text style={[styles.tagText, { color: "#00695C" }]}>HALAL</Text>
              </View>
            )}
          </View>

          {/* Tab Navigation */}
          <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
            {(["overview", "nutrition", "ingredients"] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, activeTab === t && { backgroundColor: colors.card }]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabLabel, { color: activeTab === t ? colors.primary : colors.mutedForeground }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <View>
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Why This Score?</Text>
                {scoreBreakdown.positives.map((pos, i) => (
                  <View key={i} style={styles.scoreRow}>
                    <Feather name="check-circle" size={15} color={colors.scoreGood} />
                    <Text style={[styles.scoreText, { color: colors.foreground }]}>{pos}</Text>
                  </View>
                ))}
                {scoreBreakdown.negatives.map((neg, i) => (
                  <View key={i} style={styles.scoreRow}>
                    <Feather name="x-circle" size={15} color={colors.scorePoor} />
                    <Text style={[styles.scoreText, { color: colors.foreground }]}>{neg}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Nutrition (per 100g)</Text>
                <View style={styles.macroGrid}>
                  {[
                    { label: "Calories", value: product.nutritionPer100g.calories, unit: "kcal" },
                    { label: "Protein",  value: product.nutritionPer100g.protein,  unit: "g" },
                    { label: "Carbs",    value: product.nutritionPer100g.carbohydrates, unit: "g" },
                    { label: "Fat",      value: product.nutritionPer100g.fat,      unit: "g" },
                    { label: "Sugar",    value: product.nutritionPer100g.sugar,    unit: "g" },
                    { label: "Sodium",   value: product.nutritionPer100g.sodium,   unit: "mg" },
                  ].map(m => (
                    <View key={m.label} style={[styles.macroCell, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.macroVal, { color: colors.primary }]}>{m.value}{m.unit}</Text>
                      <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* NUTRITION TAB */}
          {activeTab === "nutrition" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Basis Toggle */}
              <View style={[styles.basisToggle, { backgroundColor: colors.muted }]}>
                {([
                  { key: "per100g", label: "per 100g" },
                  { key: "perServing", label: `per serving${servingFactor ? "" : " (N/A)"}` },
                  { key: "fullPack", label: `full pack${packFactor ? "" : " (N/A)"}` },
                ] as const).map(b => {
                  const disabled = (b.key === "perServing" && !servingFactor) || (b.key === "fullPack" && !packFactor);
                  return (
                    <TouchableOpacity
                      key={b.key}
                      style={[
                        styles.basisBtn,
                        nutritionBasis === b.key && !disabled && { backgroundColor: colors.card },
                      ]}
                      onPress={() => !disabled && setNutritionBasis(b.key)}
                      disabled={disabled}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.basisBtnText,
                        { color: nutritionBasis === b.key && !disabled ? colors.primary : colors.mutedForeground },
                        disabled && { opacity: 0.4 },
                      ]}>
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.cardTitle, { color: colors.foreground, marginTop: 16 }]}>
                Full Nutrition — {nLabel}
              </Text>
              <NutritionBar label="Calories" value={n.calories} unit="kcal" max={nutritionBasis === "per100g" ? 600 : 800} warnAbove={nutritionBasis === "per100g" ? 450 : 600} />
              <NutritionBar label="Protein" value={n.protein} unit="g" max={nutritionBasis === "per100g" ? 30 : 40} goodBelow={5} />
              <NutritionBar label="Total Carbohydrates" value={n.carbohydrates} unit="g" max={nutritionBasis === "per100g" ? 100 : 130} warnAbove={nutritionBasis === "per100g" ? 70 : 90} />
              <NutritionBar label="Sugar" value={n.sugar} unit="g" max={nutritionBasis === "per100g" ? 50 : 65} warnAbove={nutritionBasis === "per100g" ? 15 : 20} />
              <NutritionBar label="Total Fat" value={n.fat} unit="g" max={nutritionBasis === "per100g" ? 50 : 65} warnAbove={nutritionBasis === "per100g" ? 25 : 33} />
              <NutritionBar label="Saturated Fat" value={n.saturatedFat} unit="g" max={nutritionBasis === "per100g" ? 20 : 26} warnAbove={nutritionBasis === "per100g" ? 8 : 10} />
              <NutritionBar label="Trans Fat" value={n.transFat} unit="g" max={5} warnAbove={0.2} />
              <NutritionBar label="Dietary Fiber" value={n.fiber} unit="g" max={nutritionBasis === "per100g" ? 15 : 20} goodBelow={3} />
              <NutritionBar label="Sodium" value={n.sodium} unit="mg" max={nutritionBasis === "per100g" ? 1200 : 1500} warnAbove={nutritionBasis === "per100g" ? 600 : 800} />

              <View style={[styles.noteBox, { backgroundColor: colors.muted }]}>
                <Feather name="info" size={14} color={colors.mutedForeground} />
                <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                  Showing nutrition {nLabel}. {
                    product.servingSize ? `Serving: ${product.servingSize}.` : ""
                  } {
                    product.packageSize ? `Package: ${product.packageSize}.` : ""
                  }
                </Text>
              </View>
            </View>
          )}

          {/* INGREDIENTS TAB */}
          {activeTab === "ingredients" && (
            <View>
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Full Ingredient List</Text>
                <Text style={[styles.rawIngredients, { color: colors.mutedForeground }]}>
                  {product.rawIngredients}
                </Text>
              </View>

              {product.ingredients.length > 0 && (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ingredient Analysis</Text>
                  {product.ingredients.map((ing, i) => {
                    const riskColor = ing.risk === "avoid"
                      ? colors.warningRed
                      : ing.risk === "caution"
                      ? colors.warningOrange
                      : colors.warningGreen;
                    return (
                      <View key={i} style={[styles.ingRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.ingHeader}>
                          <Text style={[styles.ingName, { color: colors.foreground }]}>{ing.name}</Text>
                          <View style={[styles.riskBadge, { backgroundColor: riskColor + "20" }]}>
                            <Text style={[styles.riskText, { color: riskColor }]}>{ing.risk}</Text>
                          </View>
                        </View>
                        <Text style={[styles.ingFunction, { color: colors.mutedForeground }]}>{ing.function}</Text>
                        <Text style={[styles.ingWhy, { color: colors.mutedForeground }]}>{ing.why}</Text>
                        {ing.regulatoryNote && (
                          <Text style={[styles.ingReg, { color: colors.info }]}>{ing.regulatoryNote}</Text>
                        )}
                        {ing.isAdditive && (
                          <View style={styles.additiveBadgeRow}>
                            <Feather name="alert-circle" size={11} color={colors.warningOrange} />
                            <Text style={[styles.additiveMark, { color: colors.warningOrange }]}>Food Additive</Text>
                            {ing.isSynthetic && <Text style={[styles.syntheticMark, { color: colors.mutedForeground }]}>· Synthetic</Text>}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {product.allergens.length > 0 && (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>Allergen Information</Text>
                  {product.allergens.map((a, i) => (
                    <View key={i} style={styles.allergenRow}>
                      <Feather name="alert-triangle" size={15} color={colors.warningOrange} />
                      <Text style={[styles.allergenText, { color: colors.foreground }]}>
                        {a.charAt(0).toUpperCase() + a.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {product.additives.length > 0 && (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>Additives & Preservatives</Text>
                  {product.additives.map((a, i) => (
                    <View key={i} style={styles.additiveRow}>
                      <Feather name="circle" size={8} color={colors.warningOrange} />
                      <Text style={[styles.additiveText, { color: colors.mutedForeground }]}>{a}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isInPantry ? colors.primary : colors.card, borderColor: colors.border }]}
              onPress={() => toggleProductPantry(product.id)}
            >
              <Feather name="package" size={17} color={isInPantry ? "#fff" : colors.primary} />
              <Text style={[styles.actionBtnText, { color: isInPantry ? "#fff" : colors.primary }]}>
                {isInPantry ? "In Pantry" : "Add to Pantry"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/compare")}
            >
              <Feather name="bar-chart-2" size={17} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Compare</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={17} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  emptyLink: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6 },
  topTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, flex: 1, textAlign: "center" },
  topActions: { flexDirection: "row", gap: 12, alignItems: "center" },
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    borderBottomWidth: 1,
  },
  heroMid: { flex: 1 },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  categoryBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11, textTransform: "capitalize" },
  productName: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 3, lineHeight: 22 },
  brandName: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 4 },
  metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  metaChip: { fontFamily: "Inter_400Regular", fontSize: 11 },
  body: { padding: 20 },
  confidenceRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  suitabilityBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  suitabilityText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  verdictCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  verdictTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 6 },
  verdictText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 10 },
  tagsRow: { flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: "transparent" },
  tagText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  tabs: { flexDirection: "row", borderRadius: 10, padding: 3, marginBottom: 16 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8 },
  tabLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 12 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  scoreText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  macroCell: {
    width: "30.5%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  macroVal: { fontFamily: "Inter_700Bold", fontSize: 15 },
  macroLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  basisToggle: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  basisBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 8,
  },
  basisBtnText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  noteBox: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 8, marginTop: 12, alignItems: "flex-start" },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 17 },
  rawIngredients: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  ingRow: { paddingVertical: 12, borderBottomWidth: 1 },
  ingHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  ingName: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  riskText: { fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "capitalize" },
  ingFunction: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 2 },
  ingWhy: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  ingReg: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 3, fontStyle: "italic" },
  additiveBadgeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  additiveMark: { fontFamily: "Inter_500Medium", fontSize: 11 },
  syntheticMark: { fontFamily: "Inter_400Regular", fontSize: 11 },
  allergenRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#0001" },
  allergenText: { fontFamily: "Inter_600SemiBold", fontSize: 13, textTransform: "capitalize" },
  additiveRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  additiveText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  actions: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  shareBtn: {
    width: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
});
