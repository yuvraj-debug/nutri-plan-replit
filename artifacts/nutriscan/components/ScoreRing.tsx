import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ScoreRingProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

function getScoreColor(score: number, colors: ReturnType<typeof useColors>): string {
  if (score >= 8) return colors.scoreExcellent;
  if (score >= 6.5) return colors.scoreGood;
  if (score >= 5) return colors.scoreFair;
  if (score >= 3) return colors.scorePoor;
  return colors.scoreBad;
}

function getScoreLabel(score: number): string {
  if (score >= 8) return "Excellent";
  if (score >= 6.5) return "Good";
  if (score >= 5) return "Fair";
  if (score >= 3) return "Poor";
  return "Avoid";
}

export function ScoreRing({ score, size = 80, showLabel = true }: ScoreRingProps) {
  const colors = useColors();
  const color = getScoreColor(score, colors);
  const label = getScoreLabel(score);
  const fontSize = size * 0.35;
  const labelFontSize = size * 0.14;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: size * 0.08,
            borderColor: color,
            backgroundColor: color + "18",
          },
        ]}
      >
        <Text style={[styles.score, { fontSize, color }]}>{score.toFixed(1)}</Text>
        <Text style={[styles.outOf, { fontSize: labelFontSize, color: colors.mutedForeground }]}>/10</Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { color, fontSize: labelFontSize + 2 }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  ring: {
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontFamily: "Inter_700Bold",
    lineHeight: undefined,
  },
  outOf: {
    fontFamily: "Inter_400Regular",
    marginTop: -2,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    marginTop: 6,
  },
});
