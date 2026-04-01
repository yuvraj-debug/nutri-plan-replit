import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Platform
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "camera",
    title: "Scan Any Food Product",
    subtitle: "Point your camera at a barcode or food label. Get instant health insights in seconds.",
    color: "#00897B",
  },
  {
    icon: "shield",
    title: "Personalized Safety Scores",
    subtitle: "Set your allergies, diet type, and health conditions. We warn you about what matters to you.",
    color: "#1565C0",
  },
  {
    icon: "star",
    title: "Made for India",
    subtitle: "Maggi, Lay's, Parle-G, Amul — we know Indian brands. Even works offline on slow connections.",
    color: "#6A1B9A",
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const colors = useColors();
  const { completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const slide = SLIDES[page];

  async function handleNext() {
    if (page < SLIDES.length - 1) {
      setPage(page + 1);
    } else {
      await completeOnboarding();
      router.replace("/(tabs)");
    }
  }

  async function handleSkip() {
    await completeOnboarding();
    router.replace("/(tabs)");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad }]}>
      <TouchableOpacity style={styles.skip} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
      </TouchableOpacity>

      <View style={[styles.iconCircle, { backgroundColor: slide.color + "18" }]}>
        <Feather name={slide.icon as any} size={64} color={slide.color} />
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>{slide.title}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{slide.subtitle}</Text>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i === page ? slide.color : colors.border, width: i === page ? 24 : 8 }]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: slide.color }]}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.nextText}>
          {page < SLIDES.length - 1 ? "Continue" : "Get Started"}
        </Text>
        <Feather name="arrow-right" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  skip: {
    position: "absolute",
    top: 60,
    right: 24,
  },
  skipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 48,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    width: "100%",
  },
  nextText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#fff",
  },
});
