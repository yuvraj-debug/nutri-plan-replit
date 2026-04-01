import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScoreRing } from "@/components/ScoreRing";
import { SAMPLE_PRODUCTS, DISCOVER_CATEGORIES } from "@/data/sampleProducts";

const COLLECTIONS = [
  { id: "highProtein", label: "High Protein", icon: "zap", filter: (p: typeof SAMPLE_PRODUCTS[0]) => p.nutritionPer100g.protein > 8 },
  { id: "lowSugar", label: "Low Sugar", icon: "droplet", filter: (p: typeof SAMPLE_PRODUCTS[0]) => p.nutritionPer100g.sugar < 5 },
  { id: "lowSodium", label: "Low Sodium", icon: "wind", filter: (p: typeof SAMPLE_PRODUCTS[0]) => p.nutritionPer100g.sodium < 200 },
  { id: "veg", label: "Vegetarian", icon: "leaf", filter: (p: typeof SAMPLE_PRODUCTS[0]) => !!p.isVegetarian },
  { id: "vegan", label: "Vegan", icon: "sun", filter: (p: typeof SAMPLE_PRODUCTS[0]) => !!p.isVegan },
];

export default function DiscoverScreen() {
  const colors = useColors();
  const { analyzProduct, setCurrentScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const collection = COLLECTIONS.find(c => c.id === activeCollection);
  const displayProducts = activeCollection && collection
    ? SAMPLE_PRODUCTS.filter(collection.filter)
    : SAMPLE_PRODUCTS;

  function openProduct(productId: string) {
    const product = SAMPLE_PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const result = analyzProduct(product);
    setCurrentScanResult(result);
    router.push("/result");
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Discover</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Explore Indian packaged foods by category and nutritional profile.
      </Text>

      {/* Collections */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Collections</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionsRow}>
        {COLLECTIONS.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.collectionChip,
              {
                backgroundColor: activeCollection === c.id ? colors.primary : colors.card,
                borderColor: activeCollection === c.id ? colors.primary : colors.border,
              }
            ]}
            onPress={() => setActiveCollection(activeCollection === c.id ? null : c.id)}
            activeOpacity={0.75}
          >
            <Feather name={c.icon as any} size={15} color={activeCollection === c.id ? "#fff" : colors.primary} />
            <Text style={[styles.collectionLabel, { color: activeCollection === c.id ? "#fff" : colors.primary }]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Categories */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
        {DISCOVER_CATEGORIES.map(cat => (
          <View
            key={cat.id}
            style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.catIcon, { backgroundColor: colors.secondary }]}>
              <Feather name={cat.icon as any} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.catLabel, { color: colors.foreground }]}>{cat.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Products */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {activeCollection ? COLLECTIONS.find(c => c.id === activeCollection)?.label : "All Products"}
        </Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{displayProducts.length} items</Text>
      </View>

      {displayProducts.map(product => {
        const result = analyzProduct(product);
        return (
          <TouchableOpacity
            key={product.id}
            style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => openProduct(product.id)}
            activeOpacity={0.75}
          >
            <View style={styles.productLeft}>
              <View style={[styles.catPill, { backgroundColor: colors.muted }]}>
                <Text style={[styles.catPillText, { color: colors.mutedForeground }]}>{product.category}</Text>
              </View>
              <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
              <Text style={[styles.productBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
              <View style={styles.nutritionRow}>
                <Text style={[styles.nutritionChip, { color: colors.mutedForeground }]}>
                  {product.nutritionPer100g.calories} kcal
                </Text>
                <Text style={[styles.nutritionChip, { color: colors.mutedForeground }]}>
                  P: {product.nutritionPer100g.protein}g
                </Text>
                <Text style={[styles.nutritionChip, { color: colors.mutedForeground }]}>
                  S: {product.nutritionPer100g.sugar}g
                </Text>
              </View>
              <View style={styles.dietRow}>
                {product.isVegetarian && <Text style={[styles.dietTag, { color: colors.warningGreen }]}>VEG</Text>}
                {product.isVegan && <Text style={[styles.dietTag, { color: "#1565C0" }]}>VEGAN</Text>}
                {product.isHalal && <Text style={[styles.dietTag, { color: "#00695C" }]}>HALAL</Text>}
              </View>
            </View>
            <ScoreRing score={result.score} size={60} />
          </TouchableOpacity>
        );
      })}

      {displayProducts.length === 0 && (
        <View style={styles.empty}>
          <Feather name="search" size={40} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No products match this filter</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  count: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 12 },
  collectionsRow: { marginBottom: 24 },
  collectionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  collectionLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  categoriesRow: { marginBottom: 24 },
  catCard: {
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    width: 90,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  catLabel: { fontFamily: "Inter_500Medium", fontSize: 11, textAlign: "center" },
  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  productLeft: { flex: 1, marginRight: 12 },
  catPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  catPillText: { fontFamily: "Inter_500Medium", fontSize: 10, textTransform: "capitalize" },
  productName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  productBrand: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 6 },
  nutritionRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  nutritionChip: { fontFamily: "Inter_400Regular", fontSize: 11 },
  dietRow: { flexDirection: "row", gap: 8 },
  dietTag: { fontFamily: "Inter_700Bold", fontSize: 10 },
  empty: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
