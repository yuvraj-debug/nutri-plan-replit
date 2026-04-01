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
import { ScoreRing } from "@/components/ScoreRing";
import { SAMPLE_PRODUCTS, DISCOVER_CATEGORIES } from "@/data/sampleProducts";

export default function HomeScreen() {
  const colors = useColors();
  const { history, analyzProduct } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const recentItems = history.slice(0, 3);
  const avgScore = history.length > 0
    ? Math.round((history.reduce((s, h) => s + h.score, 0) / history.length) * 10) / 10
    : null;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good day!</Text>
          <Text style={[styles.appName, { color: colors.foreground }]}>NutriScan AI</Text>
        </View>
        <TouchableOpacity
          style={[styles.profileBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Feather name="user" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Hero Scan Button */}
      <TouchableOpacity
        style={[styles.scanHero, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/scanner")}
        activeOpacity={0.87}
      >
        <View style={styles.scanHeroInner}>
          <View style={styles.scanIconWrap}>
            <Feather name="camera" size={32} color="#fff" />
          </View>
          <View>
            <Text style={styles.scanHeroTitle}>Scan a Product</Text>
            <Text style={styles.scanHeroSub}>Barcode · OCR · Manual search</Text>
          </View>
        </View>
        <View style={[styles.scanCorner, { borderColor: "rgba(255,255,255,0.3)" }]} />
      </TouchableOpacity>

      {/* Stats Row */}
      {history.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{history.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Scans</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{avgScore ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg Score</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.accent }]}>
              {history.filter(h => h.warnings.some(w => w.level === "red")).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Alerts</Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={[styles.section, { color: colors.foreground }]}>Quick Actions</Text>
      <View style={styles.quickRow}>
        {[
          { icon: "clock", label: "History", route: "/(tabs)/history" },
          { icon: "heart", label: "Pantry", route: "/(tabs)/pantry" },
          { icon: "bar-chart-2", label: "Compare", route: "/compare" },
          { icon: "compass", label: "Discover", route: "/(tabs)/discover" },
        ].map(qa => (
          <TouchableOpacity
            key={qa.label}
            style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(qa.route as any)}
            activeOpacity={0.75}
          >
            <Feather name={qa.icon as any} size={22} color={colors.primary} />
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>{qa.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Scans */}
      {recentItems.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={[styles.section, { color: colors.foreground }]}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                const result = analyzProduct(item.product);
                router.push({ pathname: "/result", params: { productId: item.product.id } });
              }}
              activeOpacity={0.75}
            >
              <View style={styles.recentLeft}>
                <Text style={[styles.recentName, { color: colors.foreground }]} numberOfLines={1}>{item.product.name}</Text>
                <Text style={[styles.recentBrand, { color: colors.mutedForeground }]}>{item.product.brand}</Text>
              </View>
              <ScoreRing score={item.score} size={48} showLabel={false} />
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Discover */}
      <Text style={[styles.section, { color: colors.foreground }]}>Browse by Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {DISCOVER_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/discover")}
            activeOpacity={0.75}
          >
            <Feather name={cat.icon as any} size={16} color={colors.primary} />
            <Text style={[styles.catLabel, { color: colors.primary }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Products */}
      <View style={styles.sectionRow}>
        <Text style={[styles.section, { color: colors.foreground }]}>Featured Products</Text>
      </View>
      {SAMPLE_PRODUCTS.slice(0, 3).map(product => {
        const sr = analyzProduct(product);
        return (
          <TouchableOpacity
            key={product.id}
            style={[styles.featCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/result", params: { productId: product.id } })}
            activeOpacity={0.75}
          >
            <View style={styles.featLeft}>
              <View style={[styles.categoryPill, { backgroundColor: colors.muted }]}>
                <Text style={[styles.categoryPillText, { color: colors.mutedForeground }]}>{product.category}</Text>
              </View>
              <Text style={[styles.featName, { color: colors.foreground }]}>{product.name}</Text>
              <Text style={[styles.featBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
              {product.isVegetarian && (
                <Text style={[styles.vegTag, { color: colors.warningGreen }]}>VEG</Text>
              )}
            </View>
            <ScoreRing score={sr.score} size={56} showLabel />
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 100 + (Platform.OS === "web" ? 34 : insets.bottom) }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  scanHero: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  scanHeroInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  scanIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanHeroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#fff",
  },
  scanHeroSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 3,
  },
  scanCorner: {
    position: "absolute",
    right: -20,
    bottom: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 14,
    marginTop: 8,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  quickBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  quickLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  recentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  recentLeft: { flex: 1, marginRight: 12 },
  recentName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 2,
  },
  recentBrand: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  categoryScroll: { marginBottom: 24 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  catLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  featCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  featLeft: { flex: 1, marginRight: 12 },
  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  categoryPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    textTransform: "capitalize",
  },
  featName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 2,
  },
  featBrand: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  vegTag: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    marginTop: 4,
  },
});
