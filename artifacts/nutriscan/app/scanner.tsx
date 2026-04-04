import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform, ScrollView, Modal,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lookupByBarcode, lookupByReferenceCode } from "@/utils/productSearch";
import { SAMPLE_PRODUCTS } from "@/data/sampleProducts";
import { Product } from "@/types";
import { ProductAvatar } from "@/components/ProductAvatar";
import { ScoreRing } from "@/components/ScoreRing";

type ScanMode = "barcode" | "reference";

export default function ScannerScreen() {
  const colors = useColors();
  const { analyzProduct, setCurrentScanResult, addScanToHistory } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [mode, setMode] = useState<ScanMode>("barcode");
  const [isLoading, setIsLoading] = useState(false);
  const [refQuery, setRefQuery] = useState("");
  const [refResults, setRefResults] = useState<Product[]>([]);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

  async function handleBarcodeManual() {
    if (!barcodeInput.trim()) return;
    setIsLoading(true);
    setShowBarcodeModal(false);
    try {
      const product =
        (await lookupByBarcode(barcodeInput.trim())) ||
        (await lookupByReferenceCode(barcodeInput.trim()));
      if (product) {
        openResult(product);
      } else {
        Alert.alert(
          "Product Not Found",
          "We couldn't find this barcode. Try searching by name in the Discover tab.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReferenceSearch() {
    if (!refQuery.trim()) return;
    setIsLoading(true);
    setRefResults([]);
    try {
      const product = await lookupByReferenceCode(refQuery.trim());
      if (product) {
        setRefResults([product]);
      } else {
        const matches = SAMPLE_PRODUCTS.filter(
          p =>
            p.name.toLowerCase().includes(refQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(refQuery.toLowerCase())
        );
        setRefResults(matches);
      }
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

  async function simulateScan(barcode: string) {
    setIsLoading(true);
    try {
      const product = await lookupByBarcode(barcode);
      if (product) {
        openResult(product);
      } else {
        Alert.alert("Not found", "No product found for this barcode.");
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
          { id: "barcode" as ScanMode, icon: "camera", label: "Barcode" },
          { id: "reference" as ScanMode, icon: "hash", label: "Reference Code" },
        ]).map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.modeTab, mode === m.id && { backgroundColor: colors.card }]}
            onPress={() => { setMode(m.id); setRefResults([]); setRefQuery(""); }}
          >
            <Feather name={m.icon as any} size={16} color={mode === m.id ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.modeLabel, { color: mode === m.id ? colors.primary : colors.mutedForeground }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 110 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* BARCODE MODE */}
        {mode === "barcode" && (
          <View>
            {/* Camera viewfinder */}
            <View style={[styles.viewfinder, { borderColor: colors.primary }]}>
              <View style={[styles.corner, { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3 }]} />
              <View style={[styles.corner, { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3 }]} />
              <View style={[styles.corner, { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
              <View style={[styles.corner, { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3 }]} />
              <View style={[styles.scanLine, { backgroundColor: colors.primary }]} />
              <View style={styles.viewfinderContent}>
                <Feather name="camera" size={32} color="rgba(255,255,255,0.5)" />
                <Text style={styles.viewfinderHint}>Point camera at a barcode</Text>
                <Text style={styles.viewfinderSub}>or tap a product below to try</Text>
              </View>
            </View>

            {isLoading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Looking up product...</Text>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Popular Indian products — tap to scan
            </Text>

            {SAMPLE_PRODUCTS.slice(0, 10).map(p => {
              const sr = analyzProduct(p);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.sampleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => simulateScan(p.barcode || "")}
                  activeOpacity={0.75}
                >
                  <ProductAvatar category={p.category} size={44} />
                  <View style={styles.sampleMid}>
                    <Text style={[styles.sampleName, { color: colors.foreground }]} numberOfLines={1}>{p.name}</Text>
                    <Text style={[styles.sampleBrand, { color: colors.mutedForeground }]}>
                      {p.brand} · {p.barcode}
                    </Text>
                    {p.isVegetarian && (
                      <Text style={[styles.vegTag, { color: colors.warningGreen }]}>● VEG</Text>
                    )}
                  </View>
                  <ScoreRing score={sr.score} size={44} showLabel={false} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* REFERENCE MODE */}
        {mode === "reference" && (
          <View>
            <View style={[styles.refBanner, { backgroundColor: colors.muted }]}>
              <Feather name="hash" size={16} color={colors.mutedForeground} />
              <Text style={[styles.refBannerText, { color: colors.mutedForeground }]}>
                Enter a barcode number, EAN, UPC, SKU, or any reference code to look up a product.
              </Text>
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="e.g. 8901058851336 or product name..."
                placeholderTextColor={colors.mutedForeground}
                value={refQuery}
                onChangeText={setRefQuery}
                onSubmitEditing={handleReferenceSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              {refQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setRefQuery(""); setRefResults([]); }}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.lookupBtn, { backgroundColor: colors.primary }]}
              onPress={handleReferenceSearch}
              activeOpacity={0.85}
            >
              <Feather name="search" size={18} color="#fff" />
              <Text style={styles.lookupBtnText}>Look Up</Text>
            </TouchableOpacity>

            {isLoading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Searching...</Text>
              </View>
            )}

            {refResults.length > 0 && (
              <>
                <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                  {refResults.length} result{refResults.length !== 1 ? "s" : ""} found
                </Text>
                {refResults.map(product => {
                  const result = analyzProduct(product);
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => openResult(product)}
                      activeOpacity={0.75}
                    >
                      <ProductAvatar category={product.category} size={48} />
                      <View style={styles.resultMid}>
                        <Text style={[styles.resultName, { color: colors.foreground }]}>{product.name}</Text>
                        <Text style={[styles.resultBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
                        {product.barcode && (
                          <Text style={[styles.resultBarcode, { color: colors.mutedForeground }]}>
                            {product.barcode}
                          </Text>
                        )}
                      </View>
                      <ScoreRing score={result.score} size={48} showLabel={false} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {!isLoading && refResults.length === 0 && refQuery.length > 0 && (
              <View style={styles.emptyState}>
                <Feather name="search" size={40} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No products found</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Try a different code or use Discover to search by name
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom: Enter barcode manually */}
      <View style={[styles.fixedBottom, { paddingBottom: botPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.barcodeBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowBarcodeModal(true)}
          activeOpacity={0.87}
        >
          <Feather name="edit-3" size={18} color="#fff" />
          <Text style={styles.barcodeBtnText}>Enter Barcode Manually</Text>
        </TouchableOpacity>
      </View>

      {/* Barcode input modal */}
      <Modal visible={showBarcodeModal} transparent animationType="slide" onRequestClose={() => setShowBarcodeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Enter Barcode</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Type the barcode number printed on the product packaging
            </Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              placeholder="e.g. 8901058851336"
              placeholderTextColor={colors.mutedForeground}
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              keyboardType="numeric"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleBarcodeManual}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: colors.border }]}
                onPress={() => setShowBarcodeModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm, { backgroundColor: colors.primary }]}
                onPress={handleBarcodeManual}
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
    paddingBottom: 14,
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
    paddingVertical: 9,
    borderRadius: 10,
  },
  modeLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  viewfinder: {
    height: 210,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: "#00000099",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#fff",
    borderRadius: 3,
  },
  scanLine: {
    position: "absolute",
    height: 2.5,
    width: "65%",
    borderRadius: 2,
    opacity: 0.85,
  },
  viewfinderContent: { alignItems: "center", gap: 8 },
  viewfinderHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
  },
  viewfinderSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },

  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 13 },

  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  sampleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  sampleMid: { flex: 1 },
  sampleName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  sampleBrand: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 2 },
  vegTag: { fontFamily: "Inter_700Bold", fontSize: 10 },

  refBanner: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  refBannerText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    padding: 0,
  },
  lookupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  lookupBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
  resultCount: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 10 },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  resultMid: { flex: 1 },
  resultName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  resultBrand: { fontFamily: "Inter_400Regular", fontSize: 12 },
  resultBarcode: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  emptyState: { alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },

  fixedBottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  barcodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  barcodeBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#0003",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 6 },
  modalSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    marginBottom: 20,
    letterSpacing: 1,
  },
  modalBtns: { flexDirection: "row", gap: 12 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnCancel: { borderWidth: 1 },
  modalBtnConfirm: {},
  modalBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
