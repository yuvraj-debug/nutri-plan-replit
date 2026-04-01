import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SAMPLE_PRODUCTS } from "@/data/sampleProducts";

const COMPARE_FIELDS = [
  { label: "Health Score", key: "score" },
  { label: "Calories (per 100g)", key: "calories" },
  { label: "Sugar (g)", key: "sugar" },
  { label: "Sodium (mg)", key: "sodium" },
  { label: "Fat (g)", key: "fat" },
  { label: "Sat. Fat (g)", key: "saturatedFat" },
  { label: "Trans Fat (g)", key: "transFat" },
  { label: "Fiber (g)", key: "fiber" },
  { label: "Protein (g)", key: "protein" },
];

type HigherBetter = "score" | "fiber" | "protein";
const HIGHER_IS_BETTER: string[] = ["score", "fiber", "protein"];

export default function CompareScreen() {
  const colors = useColors();
  const { compareProducts, removeFromCompare, clearCompare, analyzProduct, setCurrentScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // If no compare products, show sample products to compare
  const products = compareProducts.length > 0 ? compareProducts : SAMPLE_PRODUCTS.slice(0, 2);

  const analysed = products.map(p => ({ product: p, result: analyzProduct(p) }));

  function getVal(idx: number, field: string): number {
    const { product, result } = analysed[idx];
    if (field === "score") return result.score;
    const n = product.nutritionPer100g as Record<string, number>;
    return n[field] ?? 0;
  }

  function getBest(field: string): number {
    const vals = products.map((_, i) => getVal(i, field));
    return HIGHER_IS_BETTER.includes(field) ? Math.max(...vals) : Math.min(...vals);
  }

  function isBest(idx: number, field: string): boolean {
    return getVal(idx, field) === getBest(field);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Compare</Text>
        {compareProducts.length > 0 && (
          <TouchableOpacity onPress={clearCompare}>
            <Text style={[styles.clearText, { color: colors.destructive }]}>Clear</Text>
          </TouchableOpacity>
        )}
        {compareProducts.length === 0 && <View style={{ width: 40 }} />}
      </View>

      {compareProducts.length === 0 && (
        <View style={[styles.noteBanner, { backgroundColor: colors.muted }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            Showing sample comparison. Add products from scan results.
          </Text>
        </View>
      )}

      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 32 }]}
      >
        {/* Product headers */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.productsHeader}>
              <View style={styles.fieldCol} />
              {analysed.map(({ product, result }, i) => (
                <View key={product.id} style={[styles.productCol, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.prodName, { color: colors.foreground }]} numberOfLines={2}>{product.name}</Text>
                  <Text style={[styles.prodBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
                  <View style={[styles.scoreCircle, { borderColor: colors.primary + "60", backgroundColor: colors.primary + "12" }]}>
                    <Text style={[styles.scoreVal, { color: colors.primary }]}>{result.score.toFixed(1)}</Text>
                    <Text style={[styles.scoreOut, { color: colors.mutedForeground }]}>/10</Text>
                  </View>
                  {compareProducts.length > 0 && (
                    <TouchableOpacity onPress={() => removeFromCompare(product.id)} style={styles.removeBtn}>
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Comparison rows */}
            {COMPARE_FIELDS.map((field, fi) => (
              <View key={field.key} style={[styles.compRow, { backgroundColor: fi % 2 === 0 ? colors.background : colors.muted }]}>
                <View style={styles.fieldCol}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                </View>
                {analysed.map(({ product }, i) => {
                  const val = getVal(i, field.key);
                  const best = isBest(i, field.key);
                  return (
                    <View key={product.id} style={styles.productCol}>
                      <Text style={[
                        styles.compVal,
                        {
                          color: best ? colors.scoreGood : colors.foreground,
                          fontFamily: best ? "Inter_700Bold" : "Inter_400Regular",
                        }
                      ]}>
                        {val}
                        {best && " ✓"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Additives row */}
            <View style={[styles.compRow, { backgroundColor: colors.background }]}>
              <View style={styles.fieldCol}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Additives</Text>
              </View>
              {analysed.map(({ product }, i) => {
                const count = product.additives.length;
                const best = count === Math.min(...analysed.map(a => a.product.additives.length));
                return (
                  <View key={product.id} style={styles.productCol}>
                    <Text style={[styles.compVal, { color: best ? colors.scoreGood : count > 3 ? colors.warningOrange : colors.foreground, fontFamily: best ? "Inter_700Bold" : "Inter_400Regular" }]}>
                      {count}{best ? " ✓" : ""}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Vegetarian */}
            <View style={[styles.compRow, { backgroundColor: colors.muted }]}>
              <View style={styles.fieldCol}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Vegetarian</Text>
              </View>
              {analysed.map(({ product }) => (
                <View key={product.id} style={styles.productCol}>
                  <Feather
                    name={product.isVegetarian ? "check-circle" : "x-circle"}
                    size={18}
                    color={product.isVegetarian ? colors.warningGreen : colors.border}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Add to compare button */}
        {products.length < 3 && (
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: colors.primary }]}
            onPress={() => router.push("/scanner")}
          >
            <Feather name="plus" size={20} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Add product to compare</Text>
          </TouchableOpacity>
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
    paddingBottom: 12,
  },
  backBtn: { padding: 6 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  clearText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  noteBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 8,
  },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  productsHeader: { flexDirection: "row", marginBottom: 4 },
  fieldCol: { width: 130, justifyContent: "center" },
  productCol: {
    width: 130,
    padding: 10,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  prodName: { fontFamily: "Inter_600SemiBold", fontSize: 12, textAlign: "center", marginBottom: 2 },
  prodBrand: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", marginBottom: 8 },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreVal: { fontFamily: "Inter_700Bold", fontSize: 16 },
  scoreOut: { fontFamily: "Inter_400Regular", fontSize: 10 },
  removeBtn: { marginTop: 6 },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  fieldLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  compVal: { fontSize: 14, textAlign: "center" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 16,
  },
  addBtnText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
