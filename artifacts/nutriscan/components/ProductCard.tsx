import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { HistoryItem, Product } from "@/types";
import { ScoreRing } from "./ScoreRing";

interface ProductCardProps {
  item: HistoryItem;
  onPress: () => void;
  onFavorite?: () => void;
}

export function ProductCard({ item, onPress, onFavorite }: ProductCardProps) {
  const colors = useColors();
  const { product, score, isFavorited } = item;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{product.category}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.brand, { color: colors.mutedForeground }]}>{product.brand}</Text>
        {product.isVegetarian && (
          <View style={[styles.vegDot, { borderColor: colors.warningGreen }]}>
            <View style={[styles.vegDotInner, { backgroundColor: colors.warningGreen }]} />
          </View>
        )}
      </View>
      <View style={styles.right}>
        <ScoreRing score={score} size={56} showLabel={false} />
        {onFavorite && (
          <TouchableOpacity onPress={onFavorite} style={styles.favBtn}>
            <Feather
              name={isFavorited ? "heart" : "heart"}
              size={18}
              color={isFavorited ? colors.accent : colors.mutedForeground}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  right: {
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  categoryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    textTransform: "capitalize",
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 2,
  },
  brand: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  vegDot: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  vegDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  favBtn: {
    padding: 4,
  },
});
