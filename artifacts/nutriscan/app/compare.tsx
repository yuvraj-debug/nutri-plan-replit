import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScoreRing } from "@/components/ScoreRing";
import { ProductAvatar } from "@/components/ProductAvatar";
import { SAMPLE_PRODUCTS } from "@/data/sampleProducts";
import { Product } from "@/types";

interface MetricRow {
  label: string;
  key: string;
  unit: string;
  higherIsBetter: boolean;
  warnAbove?: number;
  goodBelow?: number;
}

const METRICS: MetricRow[] = [
  { label: "Calories",       key: "calories",      unit: "kcal", higherIsBetter: false, warnAbove: 450 },
  { label: "Protein",        key: "protein",       unit: "g",    higherIsBetter: true },
  { label: "Sugar",          key: "sugar",         unit: "g",    higherIsBetter: false, warnAbove: 15 },
  { label: "Sodium",         key: "sodium",        unit: "mg",   higherIsBetter: false, warnAbove: 600 },
  { label: "Total Fat",      key: "fat",           unit: "g",    higherIsBetter: false, warnAbove: 25 },
  { label: "Saturated Fat",  key: "saturatedFat",  unit: "g",    higherIsBetter: false, warnAbove: 8 },
  { label: "Trans Fat",      key: "transFat",      unit: "g",    higherIsBetter: false, warnAbove: 0.2 },
  { label: "Dietary Fiber",  key: "fiber",         unit: "g",    higherIsBetter: true, goodBelow: 3 },
  { label: "Carbohydrates",  key: "carbohydrates", unit: "g",    higherIsBetter: false, warnAbove: 70 },
];

function getScoreColor(score: number) {
  if (score >= 7) return "#2E7D32";
  if (score >= 5) return "#F57F17";
  if (score >= 3) return "#E65100";
  return "#C62828";
}

export default function CompareScreen() {
  const colors = useColors();
  const { compareProducts, removeFromCompare, clearCompare, analyzProduct, setCurrentScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const products: Product[] = compareProducts.length > 0
    ? compareProducts
    : [SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[1]];

  const analysed = products.map(p => ({ product: p, result: analyzProduct(p) }));

  function getValue(idx: number, key: string): number {
    if (key === "score") return analysed[idx].result.score;
    const n = analysed[idx].product.nutritionPer100g as Record<string, number>;
    return n[key] ?? 0;
  }

  function getBestIdx(metric: MetricRow): number {
    const vals = products.map((_, i) => getValue(i, metric.key));
    const best = metric.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    return vals.indexOf(best);
  }

  function getBarWidth(idx: number, key: string): number {
    const vals = products.map((_, i) => getValue(i, key));
    const max = Math.max(...vals);
    if (max === 0) return 0;
    return (getValue(idx, key) / max) * 100;
  }

  function getCellColor(idx: number, metric: MetricRow): string {
    const bestIdx = getBestIdx(metric);
    const val = getValue(idx, metric.key);
    if (products.length === 1) return colors.primary;
    if (idx === bestIdx) return "#2E7D32";
    if (metric.warnAbove && val > metric.warnAbove) return "#E65100";
    return colors.mutedForeground;
  }

  function isBest(idx: number, metric: MetricRow): boolean {
    return getBestIdx(metric) === idx;
  }

  function openProduct(product: Product) {
    const result = analyzProduct(product);
    setCurrentScanResult(result);
    router.push("/result");
  }

  const overallWinner = products.length > 1
    ? analysed.reduce((best, curr) => curr.result.score > best.result.score ? curr : best).product
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Compare</Text>
        {compareProducts.length > 0 ? (
          <TouchableOpacity onPress={clearCompare} style={styles.clearBtn}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 40 }]}
      >
        {/* Demo banner */}
        {compareProducts.length === 0 && (
          <View style={[styles.demoBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.demoBannerText, { color: colors.primary }]}>
              Showing sample comparison. Scan products and tap "Compare" to add your own.
            </Text>
          </View>
        )}

        {/* Product Cards Row */}
        <View style={styles.productsRow}>
          {analysed.map(({ product, result }, idx) => {
            const scoreColor = getScoreColor(result.score);
            return (
              <TouchableOpacity
                key={product.id}
                style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openProduct(product)}
                activeOpacity={0.8}
              >
                {compareProducts.length > 0 && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeFromCompare(product.id)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
                <ProductAvatar category={product.category} size={48} />
                <Text style={[styles.prodName, { color: colors.foreground }]} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={[styles.prodBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
                <View style={[styles.scoreBox, { backgroundColor: scoreColor + "15", borderColor: scoreColor + "40" }]}>
                  <Text style={[styles.scoreNum, { color: scoreColor }]}>{result.score.toFixed(1)}</Text>
                  <Text style={[styles.scoreLabel, { color: scoreColor }]}>/10</Text>
                </View>
                {overallWinner && overallWinner.id === product.id && products.length > 1 && (
                  <View style={[styles.winnerBadge, { backgroundColor: "#2E7D32" }]}>
                    <Feather name="award" size={10} color="#fff" />
                    <Text style={styles.winnerBadgeText}>BETTER</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Add product slot */}
          {products.length < 3 && (
            <TouchableOpacity
              style={[styles.addSlot, { borderColor: colors.primary + "60" }]}
              onPress={() => router.push("/scanner")}
              activeOpacity={0.7}
            >
              <View style={[styles.addSlotCircle, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="plus" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.addSlotText, { color: colors.primary }]}>Add{"\n"}Product</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Diet & Allergen Quick View */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Diet & Labels</Text>
          {[
            { label: "Vegetarian", key: "isVegetarian" },
            { label: "Vegan", key: "isVegan" },
            { label: "Jain Friendly", key: "isJainFriendly" },
            { label: "Halal", key: "isHalal" },
          ].map(d => (
            <View key={d.key} style={[styles.dietRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
              <View style={styles.dietValues}>
                {analysed.map(({ product }) => {
                  const val = (product as any)[d.key] as boolean;
                  return (
                    <View key={product.id} style={styles.dietCell}>
                      <Feather
                        name={val ? "check-circle" : "x-circle"}
                        size={20}
                        color={val ? "#2E7D32" : colors.border}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Additives */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Additives & Processing</Text>
          <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
            <View style={styles.metricLabelCol}>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Additive Count</Text>
              <Text style={[styles.metricHint, { color: colors.border }]}>fewer is better</Text>
            </View>
            <View style={styles.valuesCol}>
              {analysed.map(({ product }, idx) => {
                const count = product.additives.length;
                const allCounts = analysed.map(a => a.product.additives.length);
                const isBest = count === Math.min(...allCounts);
                const barPct = allCounts[0] === 0 && allCounts[1] === 0 ? 0 : (count / (Math.max(...allCounts) || 1)) * 100;
                return (
                  <View key={product.id} style={styles.valCell}>
                    <Text style={[styles.valNum, { color: isBest && products.length > 1 ? "#2E7D32" : count > 3 ? "#E65100" : colors.foreground, fontFamily: isBest && products.length > 1 ? "Inter_700Bold" : "Inter_400Regular" }]}>
                      {count}{isBest && products.length > 1 ? " ✓" : ""}
                    </Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                      <View style={[styles.barFill, { width: `${barPct}%` as any, backgroundColor: isBest && products.length > 1 ? "#2E7D32" : "#E65100" }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Nutrition Comparison */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nutrition per 100g</Text>

          {METRICS.map((metric, fi) => {
            const bestIdx = getBestIdx(metric);
            const vals = products.map((_, i) => getValue(i, metric.key));
            const maxVal = Math.max(...vals);

            return (
              <View
                key={metric.key}
                style={[styles.metricRow, { borderBottomColor: colors.border }]}
              >
                <View style={styles.metricLabelCol}>
                  <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{metric.label}</Text>
                  <Text style={[styles.metricHint, { color: colors.border }]}>
                    {metric.higherIsBetter ? "↑ higher better" : "↓ lower better"}
                  </Text>
                </View>
                <View style={styles.valuesCol}>
                  {analysed.map(({ product }, idx) => {
                    const val = getValue(idx, metric.key);
                    const best = isBest(idx, metric);
                    const barPct = maxVal === 0 ? 0 : (val / maxVal) * 100;
                    const cellColor = getCellColor(idx, metric);
                    return (
                      <View key={product.id} style={styles.valCell}>
                        <View style={styles.valRow}>
                          <Text style={[styles.valNum, { color: cellColor, fontFamily: best && products.length > 1 ? "Inter_700Bold" : "Inter_400Regular" }]}>
                            {val}
                            <Text style={[styles.valUnit, { color: colors.mutedForeground }]}> {metric.unit}</Text>
                          </Text>
                          {best && products.length > 1 && (
                            <Feather name="check" size={12} color="#2E7D32" />
                          )}
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                          <View style={[
                            styles.barFill,
                            {
                              width: `${barPct}%` as any,
                              backgroundColor: metric.warnAbove && val > metric.warnAbove
                                ? "#E65100"
                                : best && products.length > 1
                                ? "#2E7D32"
                                : colors.primary + "80",
                            }
                          ]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        {/* Overall verdict */}
        {products.length > 1 && overallWinner && (
          <View style={[styles.verdictCard, { backgroundColor: "#2E7D3212", borderColor: "#2E7D3240" }]}>
            <Feather name="award" size={20} color="#2E7D32" />
            <View style={styles.verdictText}>
              <Text style={[styles.verdictTitle, { color: "#2E7D32" }]}>Overall Better Choice</Text>
              <Text style={[styles.verdictSub, { color: colors.foreground }]}>{overallWinner.name}</Text>
              <Text style={[styles.verdictDesc, { color: colors.mutedForeground }]}>
                Higher health score and better nutritional profile
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backBtn: { padding: 6 },
  clearBtn: { padding: 6 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  scrollContent: { paddingHorizontal: 20 },

  demoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  demoBannerText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 18 },

  productsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  productCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  prodName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  prodBrand: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
  scoreBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    marginTop: 4,
  },
  scoreNum: { fontFamily: "Inter_700Bold", fontSize: 18 },
  scoreLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  winnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  winnerBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#fff" },

  addSlot: {
    flex: 0.55,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addSlotCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  addSlotText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
  },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    marginBottom: 12,
  },

  dietRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dietValues: {
    flex: 1,
    flexDirection: "row",
  },
  dietCell: {
    flex: 1,
    alignItems: "center",
  },

  metricRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  metricLabelCol: {
    width: 110,
    paddingRight: 8,
    justifyContent: "center",
  },
  metricLabel: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 17 },
  metricHint: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 },
  valuesCol: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  valCell: {
    flex: 1,
    gap: 4,
  },
  valRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  valNum: { fontFamily: "Inter_400Regular", fontSize: 14 },
  valUnit: { fontFamily: "Inter_400Regular", fontSize: 11 },
  barTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    minWidth: 4,
  },

  verdictCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 4,
    marginBottom: 8,
  },
  verdictText: { flex: 1 },
  verdictTitle: { fontFamily: "Inter_700Bold", fontSize: 13, marginBottom: 3 },
  verdictSub: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 3 },
  verdictDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
});
