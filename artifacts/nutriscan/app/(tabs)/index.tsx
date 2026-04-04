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
import { DrawerMenu } from "@/components/DrawerMenu";
import { SAMPLE_PRODUCTS, DISCOVER_CATEGORIES } from "@/data/sampleProducts";

export default function HomeScreen() {
  const colors = useColors();
  const { history, analyzProduct } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const recentItems = history.slice(0, 3);
  const avgScore = history.length > 0
    ? Math.round((history.reduce((s, h) => s + h.score, 0) / history.length) * 10) / 10
    : null;

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Hamburger / Menu button */}
          <TouchableOpacity
            style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setDrawerOpen(true)}
            activeOpacity={0.75}
          >
            <Feather name="menu" size={20} color={colors.foreground} />
          </TouchableOpacity>

          {/* Logo / name center */}
          <View style={styles.headerCenter}>
            <Text style={[styles.appName, { color: colors.foreground }]}>NutriScan AI</Text>
            <View style={[styles.indiaPill, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.indiaText, { color: colors.primary }]}>🇮🇳 Made for India</Text>
            </View>
          </View>

          {/* Profile */}
          <TouchableOpacity
            style={[styles.profileBtn, { backgroundColor: colors.secondary }]}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Feather name="user" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero Scan Banner */}
        <TouchableOpacity
          style={[styles.scanHero, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/scanner")}
          activeOpacity={0.87}
        >
          <View style={styles.scanHeroInner}>
            <View style={styles.scanIconWrap}>
              <Feather name="camera" size={30} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scanHeroTitle}>Scan a Product</Text>
              <Text style={styles.scanHeroSub}>Barcode · Reference code · Manual entry</Text>
            </View>
            <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={[styles.scanCorner, { borderColor: "rgba(255,255,255,0.2)" }]} />
        </TouchableOpacity>

        {/* Stats Row */}
        {history.length > 0 ? (
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
        ) : (
          <View style={[styles.welcomeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 28 }}>👋</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>Welcome to NutriScan!</Text>
              <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>
                Scan any packaged food product and get an instant health score.
              </Text>
            </View>
          </View>
        )}

        {/* Recent Scans */}
        {recentItems.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.section, { color: colors.foreground }]}>Recent Scans</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentItems.map(item => {
              const result = analyzProduct(item.product);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/result", params: { productId: item.product.id } })}
                  activeOpacity={0.75}
                >
                  <ProductAvatar category={item.product.category} size={44} />
                  <View style={styles.recentMid}>
                    <Text style={[styles.recentName, { color: colors.foreground }]} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={[styles.recentBrand, { color: colors.mutedForeground }]}>{item.product.brand}</Text>
                  </View>
                  <ScoreRing score={item.score} size={48} showLabel={false} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Browse by Category */}
        <Text style={[styles.section, { color: colors.foreground }]}>Browse by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {DISCOVER_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/discover")}
              activeOpacity={0.75}
            >
              <Feather name={cat.icon as any} size={15} color={colors.primary} />
              <Text style={[styles.catLabel, { color: colors.primary }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Products */}
        <View style={styles.sectionRow}>
          <Text style={[styles.section, { color: colors.foreground }]}>Popular Products</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/discover")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        {SAMPLE_PRODUCTS.slice(0, 4).map(product => {
          const sr = analyzProduct(product);
          return (
            <TouchableOpacity
              key={product.id}
              style={[styles.featCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/result", params: { productId: product.id } })}
              activeOpacity={0.75}
            >
              <ProductAvatar category={product.category} size={46} />
              <View style={styles.featMid}>
                <View style={[styles.categoryPill, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.categoryPillText, { color: colors.mutedForeground }]}>{product.category}</Text>
                </View>
                <Text style={[styles.featName, { color: colors.foreground }]} numberOfLines={1}>{product.name}</Text>
                <Text style={[styles.featBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
                {product.isVegetarian && (
                  <Text style={[styles.vegTag, { color: colors.warningGreen }]}>● VEG</Text>
                )}
              </View>
              <ScoreRing score={sr.score} size={52} showLabel />
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 + (Platform.OS === "web" ? 34 : insets.bottom) }} />
      </ScrollView>

      {/* Left Drawer */}
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerCenter: { alignItems: "center", gap: 4 },
  appName: { fontFamily: "Inter_700Bold", fontSize: 20 },
  indiaPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  indiaText: { fontFamily: "Inter_500Medium", fontSize: 11 },
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
    marginBottom: 18,
    overflow: "hidden",
    position: "relative",
  },
  scanHeroInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  scanIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanHeroTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" },
  scanHeroSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 3 },
  scanCorner: {
    position: "absolute",
    right: -30,
    bottom: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },

  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 22,
  },
  welcomeTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 4 },
  welcomeSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },

  section: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12, marginTop: 6 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAll: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 12, marginTop: 6 },

  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  recentMid: { flex: 1 },
  recentName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  recentBrand: { fontFamily: "Inter_400Regular", fontSize: 12 },

  categoryScroll: { marginBottom: 22 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  catLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },

  featCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  featMid: { flex: 1 },
  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  categoryPillText: { fontFamily: "Inter_500Medium", fontSize: 10, textTransform: "capitalize" },
  featName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  featBrand: { fontFamily: "Inter_400Regular", fontSize: 12 },
  vegTag: { fontFamily: "Inter_700Bold", fontSize: 10, marginTop: 3 },
});
