import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, Alert, TextInput
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScoreRing } from "@/components/ScoreRing";
import { HistoryItem } from "@/types";

export default function HistoryScreen() {
  const colors = useColors();
  const { history, deleteFromHistory, toggleProductFavorite, analyzProduct, setCurrentScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "good" | "poor" | "alerts">("all");

  const filtered = history.filter(h => {
    const matchesSearch = !search || h.product.name.toLowerCase().includes(search.toLowerCase()) || h.product.brand.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "good") return h.score >= 7;
    if (filter === "poor") return h.score < 5;
    if (filter === "alerts") return h.warnings.some(w => w.level === "red" || w.level === "orange");
    return true;
  });

  function handleOpen(item: HistoryItem) {
    const result = analyzProduct(item.product);
    setCurrentScanResult(result);
    router.push("/result");
  }

  function handleDelete(id: string) {
    Alert.alert("Remove from History", "Remove this scan from your history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteFromHistory(id) },
    ]);
  }

  function formatDate(ts: string): string {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function renderItem({ item }: { item: HistoryItem }) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleOpen(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardLeft}>
          <View style={styles.topRow}>
            <View style={[styles.sourceBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
                {item.scanSource === "database" ? "DB" : item.scanSource === "ocr" ? "OCR" : "manual"}
              </Text>
            </View>
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{formatDate(item.timestamp)}</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{item.product.name}</Text>
          <Text style={[styles.brand, { color: colors.mutedForeground }]}>{item.product.brand}</Text>
          {item.warnings.length > 0 && (
            <View style={styles.warnRow}>
              <Feather name="alert-circle" size={13} color={colors.warningOrange} />
              <Text style={[styles.warnText, { color: colors.warningOrange }]}>
                {item.warnings.length} warning{item.warnings.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardRight}>
          <ScoreRing score={item.score} size={54} showLabel={false} />
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => toggleProductFavorite(item.product.id)}>
              <Feather name="heart" size={17} color={item.isFavorited ? colors.accent : colors.border} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Feather name="trash-2" size={17} color={colors.border} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{history.length} scans</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 20, marginBottom: 12 }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search scans..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(["all", "good", "poor", "alerts"] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, { backgroundColor: filter === f ? colors.primary : colors.muted }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 90 }]}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="clock" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No scan history</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {history.length === 0 ? "Start scanning food products to build your history." : "No scans match your filter."}
            </Text>
            {history.length === 0 && (
              <TouchableOpacity
                style={[styles.scanBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/scanner")}
              >
                <Text style={styles.scanBtnText}>Scan Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  count: { fontFamily: "Inter_400Regular", fontSize: 14 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  card: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  cardRight: { alignItems: "center", gap: 8 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sourceText: { fontFamily: "Inter_500Medium", fontSize: 10, textTransform: "uppercase" },
  dateText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  brand: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 },
  warnRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  warnText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  cardActions: { flexDirection: "row", gap: 10 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
  scanBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  scanBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});
