import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface NutritionBarProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  warnAbove?: number;
  goodBelow?: number;
}

export function NutritionBar({ label, value, unit, max, warnAbove, goodBelow }: NutritionBarProps) {
  const colors = useColors();
  const pct = Math.min(100, (value / max) * 100);

  let barColor = colors.primary;
  if (warnAbove && value > warnAbove) {
    barColor = value > warnAbove * 1.5 ? colors.warningRed : colors.warningOrange;
  } else if (goodBelow && value < goodBelow) {
    barColor = colors.warningGreen;
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.foreground }]}>
          {value}{unit}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  value: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  track: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});
