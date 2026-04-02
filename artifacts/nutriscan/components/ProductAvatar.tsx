import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProductCategory } from "@/types";
import { CATEGORY_VISUALS } from "@/data/sampleProducts";

interface ProductAvatarProps {
  category: ProductCategory;
  size?: number;
}

export function ProductAvatar({ category, size = 56 }: ProductAvatarProps) {
  const visuals = CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.other;
  const borderRadius = size * 0.22;
  const fontSize = size * 0.46;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: visuals.color + "22",
          borderColor: visuals.color + "44",
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize }]}>{visuals.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emoji: {
    lineHeight: undefined,
    textAlign: "center",
  },
});
