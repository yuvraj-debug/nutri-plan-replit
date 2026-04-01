import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform, ScrollView, Modal
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lookupByBarcode, searchProducts, lookupByReferenceCode } from "@/utils/productSearch";
import { SAMPLE_PRODUCTS } from "@/data/sampleProducts";
import { Product } from "@/types";
import { ScoreRing } from "@/components/ScoreRing";

type ScanMode = "barcode" | "search" | "reference";

export default function ScannerScreen() {
  const colors = useColors();
  const { analyzProduct, setCurrentScanResult, addScanToHistory } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [mode, setMode] = useState<ScanMode>("barcode");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showBarcodeManual, setShowBarcodeManual] = useState(false);
  const [scannedCode, setScannedCode] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setIsLoading(true);
    setResults([]);
    try {
      const found = await searchProducts(query.trim());
      setResults(found);
    } catch {
      Alert.alert("Error", "Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBarcodeManual() {
    if (!barcodeInput.trim()) return;
    setIsLoading(true);
    try {
      const product = await lookupByBarcode(barcodeInput.trim()) || await lookupByReferenceCode(barcodeInput.trim());
      if (product) {
        openResult(product);
      } else {
        Alert.alert(
          "Product Not Found",
          "We couldn't find this barcode in our database. Try searching by name or submit as missing product.",
          [
            { text: "Search by Name", onPress: () => { setMode("search"); setShowBarcodeManual(false); } },
            { text: "OK" }
          ]
        );
      }
    } catch {
      Alert.alert("Error", "Lookup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReferenceSearch() {
    if (!query.trim()) return;
    setIsLoading(true);
    setResults([]);
    try {
      const product = await lookupByReferenceCode(query.trim());
      if (product) {
        setResults([product]);
      } else {
        const nameResults = await searchProducts(query.trim());
        setResults(nameResults);
      }
    } catch {
      Alert.alert("Error", "Search failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function openResult(product: Product) {
    const result = analyzProduct(product);
    setCurrentScanResult(result);
    addScanToHistory(result);
    router.push("/result");
  }

  // Simulate barcode scan using sample data
  async function simulateScan(barcode: string) {
    setIsLoading(true);
    try {
      const product = await lookupByBarcode(barcode);
      if (product) {
        openResult(product);
      } else {
        Alert.alert("Not found", "No product found for this barcode. Try entering it manually.");
        setShowBarcodeManual(true);
        setBarcodeInput(barcode);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Scan Product</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Mode Tabs */}
      <View style={[styles.modeTabs, { backgroundColor: colors.muted }]}>
        {([
          { id: "barcode", icon: "camera", label: "Barcode" },
          { id: "search", icon: "search", label: "Search" },
          { id: "reference", icon: "hash", label: "Reference" },
        ] as const).map(m => (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.modeTab,
              mode === m.id && { backgroundColor: colors.card }
            ]}
            onPress={() => { setMode(m.id); setResults([]); setQuery(""); }}
          >
            <Feather name={m.icon} size={16} color={mode === m.id ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.modeLabel, { color: mode === m.id ? colors.primary : colors.mutedForeground }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 80 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* BARCODE MODE */}
        {mode === "barcode" && (
          <View>
            {/* Camera viewfinder simulation */}
            <View style={[styles.viewfinder, { borderColor: colors.primary }]}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <View style={[styles.scanLine, { backgroundColor: colors.primary }]} />
              <Text style={[styles.viewfinderHint, { color: colors.mutedForeground }]}>
                Point at a barcode
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Tap a product below to simulate scanning
            </Text>

            {SAMPLE_PRODUCTS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.sampleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => simulateScan(p.barcode || "")}
                activeOpacity={0.75}
              >
                <View style={styles.sampleLeft}>
                  <Text style={[styles.sampleName, { color: colors.foreground }]}>{p.name}</Text>
                  <Text style={[styles.sampleBrand, { color: colors.mutedForeground }]}>
                    {p.brand} · {p.barcode}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.altBtn, { borderColor: colors.border }]}
              onPress={() => setShowBarcodeManual(true)}
            >
              <Feather name="edit-3" size={16} color={colors.primary} />
              <Text style={[styles.altBtnText, { color: colors.primary }]}>Enter barcode manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SEARCH MODE */}
        {mode === "search" && (
          <View>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search by product name or brand..."
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.searchBtn, { backgroundColor: colors.primary }]}
              onPress={handleSearch}
              activeOpacity={0.85}
            >
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>

            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Try: Maggi, Parle-G, Lay's, Amul, Britannia...
            </Text>
          </View>
        )}

        {/* REFERENCE MODE */}
        {mode === "reference" && (
          <View>
            <Text style={[styles.refDesc, { color: colors.mutedForeground }]}>
              Enter a barcode number, EAN, UPC, SKU, or reference code to look up a product.
            </Text>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="hash" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="e.g. 8901058851336 or SKU-12345"
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleReferenceSearch}
                keyboardType="default"
                returnKeyType="search"
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.searchBtn, { backgroundColor: colors.primary }]}
              onPress={handleReferenceSearch}
              activeOpacity={0.85}
            >
              <Text style={styles.searchBtnText}>Look Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Looking up product...</Text>
          </View>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <>
            <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </Text>
            {results.map(product => {
              const result = analyzProduct(product);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => openResult(product)}
                  activeOpacity={0.75}
                >
                  <View style={styles.resultLeft}>
                    <Text style={[styles.resultName, { color: colors.foreground }]}>{product.name}</Text>
                    <Text style={[styles.resultBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
                    {product.barcode && (
                      <Text style={[styles.resultBarcode, { color: colors.mutedForeground }]}>
                        Barcode: {product.barcode}
                      </Text>
                    )}
                  </View>
                  <ScoreRing score={result.score} size={52} showLabel={false} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* No results */}
        {!isLoading && results.length === 0 && (mode === "search" || mode === "reference") && query.length > 0 && (
          <View style={styles.emptyState}>
            <Feather name="search" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No products found</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Try a different search term or submit this as a missing product.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Manual Barcode Modal */}
      <Modal visible={showBarcodeManual} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Enter Barcode</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              placeholder="e.g. 8901058851336"
              placeholderTextColor={colors.mutedForeground}
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setShowBarcodeManual(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={() => { setShowBarcodeManual(false); handleBarcodeManual(); }}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Look Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 16,
  },
  backBtn: { padding: 6 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  modeTabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  viewfinder: {
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#000a",
  },
  cornerTL: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#fff",
    borderRadius: 3,
  },
  cornerTR: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#fff",
    borderRadius: 3,
  },
  cornerBL: {
    position: "absolute",
    bottom: 16,
    left: 16,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#fff",
    borderRadius: 3,
  },
  cornerBR: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#fff",
    borderRadius: 3,
  },
  scanLine: {
    position: "absolute",
    height: 2,
    width: "70%",
    opacity: 0.8,
  },
  viewfinderHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  sectionLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  sampleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  sampleLeft: { flex: 1 },
  sampleName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  sampleBrand: { fontFamily: "Inter_400Regular", fontSize: 12 },
  altBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  altBtnText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  searchBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  searchBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
  hint: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  refDesc: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  loadingWrap: { alignItems: "center", padding: 32, gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  resultCount: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 10 },
  resultCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  resultLeft: { flex: 1, marginRight: 12 },
  resultName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  resultBrand: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 2 },
  resultBarcode: { fontFamily: "Inter_400Regular", fontSize: 11 },
  emptyState: { alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    marginBottom: 16,
  },
  modalBtns: { flexDirection: "row", gap: 12 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
