import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { PersonalizedWarning } from "@/types";

interface WarningCardProps {
  warning: PersonalizedWarning;
}

export function WarningCard({ warning }: WarningCardProps) {
  const colors = useColors();

  const levelColors: Record<string, string> = {
    red: colors.warningRed,
    orange: colors.warningOrange,
    yellow: colors.warningYellow,
    green: colors.warningGreen,
  };

  const levelIcons: Record<string, string> = {
    red: "alert-circle",
    orange: "alert-triangle",
    yellow: "info",
    green: "check-circle",
  };

  const c = levelColors[warning.level] || colors.warningOrange;

  return (
    <View style={[styles.card, { backgroundColor: c + "15", borderLeftColor: c, borderColor: c + "30" }]}>
      <Feather name={levelIcons[warning.level] as any} size={18} color={c} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: c }]}>{warning.title}</Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>{warning.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 2,
  },
  message: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
});
