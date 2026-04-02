import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScoreRing } from "@/components/ScoreRing";
import { ProductAvatar } from "@/components/ProductAvatar";
import { SAMPLE_PRODUCTS, DISCOVER_CATEGORIES } from "@/data/sampleProducts";

const COLLECTIONS = [
  { id: "highProtein", label: "High Protein",  icon: "zap",     filter: (p: typeof SAMPLE_PRODUCTS[0]) => p.nutritionPer100g.protein > 8 },
  { id: "lowSugar",   label: "Low Sugar",     icon: "droplet", filter: (p: typeof SAMPLE_PRODUCTS[0]) => p.nutritionPer100g.sugar < 5 },
  { id: "lowSodium",  label: "Low Sodium",    icon: "wind",    filter: (p: typeof SAMPLE_PRODUCTS[0]) => p.nutritionPer100g.sodium < 200 },
  { id: "veg",        label: "Vegetarian",    icon: "leaf",    filter: (p: typeof SAMPLE_PRODUCTS[0]) => !!p.isVegetarian },
  { id: "vegan",      label: "Vegan",         icon: "sun",     filter: (p: typeof SAMPLE_PRODUCTS[0]) => !!p.isVegan },
  { id: "jain",       label: "Jain Friendly", icon: "star",    filter: (p: typeof SAMPLE_PRODUCTS[0]) => !!p.isJainFriendly },
];

export default function DiscoverScreen() {
  const colors = useColors();
  const { analyzProduct, setCurrentScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const displayProducts = useMemo(() => {
    let list = SAMPLE_PRODUCTS;

    if (activeCategory !== "all") {
      list = list.filter(p => p.category === activeCategory);
    }

    if (activeCollection) {
      const col = COLLECTIONS.find(c => c.id === activeCollection);
      if (col) list = list.filter(col.filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery, activeCategory, activeCollection]);

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
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Discover</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Browse and search {SAMPLE_PRODUCTS.length} Indian packaged foods
      </Text>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search by name, brand, or barcode..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow} contentContainerStyle={{ paddingRight: 20 }}>
        {DISCOVER_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, { color: isActive ? "#fff" : colors.foreground }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Collections */}
      {!searchQuery && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Collections</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionsRow} contentContainerStyle={{ paddingRight: 20 }}>
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
                <Feather name={c.icon as any} size={14} color={activeCollection === c.id ? "#fff" : colors.primary} />
                <Text style={[styles.collectionLabel, { color: activeCollection === c.id ? "#fff" : colors.primary }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Results header */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {searchQuery
            ? `Results for "${searchQuery}"`
            : activeCollection
            ? COLLECTIONS.find(c => c.id === activeCollection)?.label
            : activeCategory !== "all"
            ? DISCOVER_CATEGORIES.find(c => c.id === activeCategory)?.label
            : "All Products"}
        </Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{displayProducts.length} items</Text>
      </View>

      {/* Product Cards */}
      {displayProducts.map(product => {
        const result = analyzProduct(product);
        return (
          <TouchableOpacity
            key={product.id}
            style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => openProduct(product.id)}
            activeOpacity={0.75}
          >
            <ProductAvatar category={product.category} size={56} />

            <View style={styles.productInfo}>
              <View style={styles.productTopRow}>
                <View style={[styles.catPill, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.catPillText, { color: colors.mutedForeground }]}>{product.category}</Text>
                </View>
                {product.confidence >= 0.97 && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name="check-circle" size={11} color={colors.primary} />
                    <Text style={[styles.verifiedText, { color: colors.primary }]}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>{product.name}</Text>
              <Text style={[styles.productBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>

              <View style={styles.productBottomRow}>
                <View style={styles.nutritionRow}>
                  <Text style={[styles.nutritionChip, { color: colors.mutedForeground }]}>
                    {product.nutritionPer100g.calories} kcal
                  </Text>
                  <Text style={[styles.nutritionDot, { color: colors.border }]}>·</Text>
                  <Text style={[styles.nutritionChip, { color: colors.mutedForeground }]}>
                    P {product.nutritionPer100g.protein}g
                  </Text>
                  <Text style={[styles.nutritionDot, { color: colors.border }]}>·</Text>
                  <Text style={[styles.nutritionChip, { color: colors.mutedForeground }]}>
                    S {product.nutritionPer100g.sugar}g
                  </Text>
                </View>
                <View style={styles.dietRow}>
                  {product.isVegetarian && <Text style={[styles.dietTag, { color: colors.warningGreen }]}>VEG</Text>}
                  {product.isVegan && <Text style={[styles.dietTag, { color: "#1565C0" }]}>VEGAN</Text>}
                </View>
              </View>
            </View>

            <ScoreRing score={result.score} size={52} />
          </TouchableOpacity>
        );
      })}

      {displayProducts.length === 0 && (
        <View style={styles.empty}>
          <Feather name="search" size={44} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No products found</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Try a different search term or category
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 16 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    padding: 0,
  },

  categoryRow: { marginBottom: 20 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  catEmoji: { fontSize: 15 },
  catLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },

  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 12 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  count: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 12 },
  collectionsRow: { marginBottom: 20 },
  collectionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  collectionLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  productInfo: { flex: 1 },
  productTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  catPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catPillText: { fontFamily: "Inter_500Medium", fontSize: 10, textTransform: "capitalize" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  productName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2, lineHeight: 20 },
  productBrand: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 6 },
  productBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nutritionRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  nutritionChip: { fontFamily: "Inter_400Regular", fontSize: 11 },
  nutritionDot: { fontFamily: "Inter_400Regular", fontSize: 11 },
  dietRow: { flexDirection: "row", gap: 6 },
  dietTag: { fontFamily: "Inter_700Bold", fontSize: 10 },

  empty: { alignItems: "center", padding: 48, gap: 10 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
});
