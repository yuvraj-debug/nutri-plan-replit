import React from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScoreRing } from "@/components/ScoreRing";
import { SAMPLE_PRODUCTS } from "@/data/sampleProducts";
import { HistoryItem } from "@/types";

export default function PantryScreen() {
  const colors = useColors();
  const { history, favoriteIds, pantryIds, toggleProductFavorite, toggleProductPantry, analyzProduct, setCurrentScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Get pantry items - from history or sample products
  const pantryProducts = [
    ...history.filter(h => h.isInPantry),
    ...SAMPLE_PRODUCTS
      .filter(p => pantryIds.includes(p.id) && !history.some(h => h.product.id === p.id && h.isInPantry))
      .map(p => {
        const result = analyzProduct(p);
        return { id: `pantry_${p.id}`, product: p, score: result.score, confidence: p.confidence, warnings: result.warnings, scanSource: p.source, isOcrUsed: false, isFavorited: favoriteIds.includes(p.id), isInPantry: true, nutritionSummary: p.nutritionPer100g, timestamp: new Date().toISOString() } as HistoryItem;
      }),
  ];

  const favoriteProducts = history.filter(h => h.isFavorited);

  function openResult(item: HistoryItem) {
    const result = analyzProduct(item.product);
    setCurrentScanResult(result);
    router.push("/result");
  }

  function renderPantryItem({ item }: { item: HistoryItem }) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => openResult(item)}
        activeOpacity={0.75}
      >
        <View style={styles.left}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{item.product.name}</Text>
          <Text style={[styles.brand, { color: colors.mutedForeground }]}>{item.product.brand}</Text>
          <View style={styles.tagsRow}>
            {item.product.isVegetarian && (
              <Text style={[styles.vegTag, { color: colors.warningGreen }]}>VEG</Text>
            )}
            <Text style={[styles.category, { color: colors.mutedForeground }]}>{item.product.category}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <ScoreRing score={item.score} size={52} showLabel={false} />
          <TouchableOpacity onPress={() => toggleProductPantry(item.product.id)}>
            <Feather name="minus-circle" size={20} color={colors.warningRed} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Pantry</Text>
      </View>

      {/* Pantry Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="package" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Products</Text>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>({pantryProducts.length})</Text>
        </View>
      </View>

      <FlatList
        data={pantryProducts}
        keyExtractor={item => item.id}
        renderItem={renderPantryItem}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 90 }]}
        scrollEnabled={!!pantryProducts.length}
        ListHeaderComponent={
          favoriteProducts.length > 0 ? (
            <View style={styles.favSection}>
              <View style={styles.sectionHeader}>
                <Feather name="heart" size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Favorites</Text>
                <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>({favoriteProducts.length})</Text>
              </View>
              {favoriteProducts.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => openResult(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.left}>
                    <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={[styles.brand, { color: colors.mutedForeground }]}>{item.product.brand}</Text>
                  </View>
                  <View style={styles.right}>
                    <ScoreRing score={item.score} size={52} showLabel={false} />
                    <TouchableOpacity onPress={() => toggleProductFavorite(item.product.id)}>
                      <Feather name="heart" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="package" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your pantry is empty</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Save products from scan results to quickly access them here.
            </Text>
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/scanner")}
            >
              <Text style={styles.scanBtnText}>Scan a Product</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  section: { paddingHorizontal: 20, marginBottom: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  sectionCount: { fontFamily: "Inter_400Regular", fontSize: 14 },
  list: { paddingHorizontal: 20 },
  card: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: "center",
  },
  left: { flex: 1, marginRight: 12 },
  right: { alignItems: "center", gap: 8 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  brand: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 },
  tagsRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  vegTag: { fontFamily: "Inter_700Bold", fontSize: 10 },
  category: { fontFamily: "Inter_400Regular", fontSize: 11, textTransform: "capitalize" },
  favSection: { marginBottom: 8 },
  divider: { height: 1, marginBottom: 16, marginTop: 8 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
  scanBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  scanBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});
