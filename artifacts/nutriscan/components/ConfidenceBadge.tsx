import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ConfidenceBadgeProps {
  confidence: number;
  small?: boolean;
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.95) return "High confidence";
  if (confidence >= 0.80) return "Good confidence";
  if (confidence >= 0.65) return "Moderate confidence";
  if (confidence >= 0.5) return "Low confidence";
  return "Very low confidence";
}

export function ConfidenceBadge({ confidence, small = false }: ConfidenceBadgeProps) {
  const colors = useColors();

  let bgColor = colors.scoreGood + "20";
  let textColor = colors.scoreGood;

  if (confidence < 0.65) {
    bgColor = colors.scorePoor + "20";
    textColor = colors.scorePoor;
  } else if (confidence < 0.80) {
    bgColor = colors.scoreFair + "20";
    textColor = colors.scoreFair;
  }

  const pct = Math.round(confidence * 100);

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, paddingHorizontal: small ? 8 : 12, paddingVertical: small ? 3 : 5 }]}>
      <View style={[styles.dot, { backgroundColor: textColor, width: small ? 5 : 7, height: small ? 5 : 7 }]} />
      <Text style={[styles.text, { color: textColor, fontSize: small ? 11 : 12 }]}>
        {pct}% · {getConfidenceLabel(confidence)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    gap: 5,
  },
  dot: {
    borderRadius: 10,
  },
  text: {
    fontFamily: "Inter_500Medium",
  },
});
