import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Pressable, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { icon: "clock", label: "Scan History", desc: "All your past scans", route: "/(tabs)/history" },
  { icon: "package", label: "My Pantry", desc: "Saved favourite products", route: "/(tabs)/pantry" },
  { icon: "bar-chart-2", label: "Compare", desc: "Side-by-side comparison", route: "/compare" },
  { icon: "sliders", label: "Health Profile", desc: "Allergies, diet, conditions", route: "/(tabs)/profile" },
];

const SECONDARY_ITEMS = [
  { icon: "info", label: "About NutriScan AI", route: null },
  { icon: "shield", label: "Privacy Policy", route: null },
  { icon: "star", label: "Rate the App", route: null },
];

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const colors = useColors();
  const { user, isAuthenticated, login, logout, isLoading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  function navigate(route: string | null) {
    onClose();
    if (route) {
      setTimeout(() => router.push(route as any), 150);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Drawer Panel */}
        <View style={[styles.drawer, { backgroundColor: colors.background, paddingTop: topPad + 8, paddingBottom: botPad + 16 }]}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={[styles.logoWrap, { backgroundColor: colors.primary + "15" }]}>
              <Text style={styles.logoEmoji}>🌿</Text>
            </View>
            <View style={styles.drawerHeaderText}>
              <Text style={[styles.appName, { color: colors.foreground }]}>NutriScan AI</Text>
              <Text style={[styles.tagline, { color: colors.mutedForeground }]}>India's food intelligence app</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Auth card */}
          <View style={[styles.authCard, { backgroundColor: isAuthenticated ? colors.primary + "12" : colors.card, borderColor: isAuthenticated ? colors.primary + "40" : colors.border }]}>
            {authLoading ? (
              <Text style={[styles.authLoading, { color: colors.mutedForeground }]}>Loading...</Text>
            ) : isAuthenticated && user ? (
              <View style={styles.authRow}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() ?? "U"}</Text>
                </View>
                <View style={styles.authInfo}>
                  <Text style={[styles.authName, { color: colors.foreground }]}>{user.name}</Text>
                  <Text style={[styles.authEmail, { color: colors.mutedForeground }]} numberOfLines={1}>{user.email}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { borderColor: colors.border }]}>
                  <Feather name="log-out" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loginPrompt}>
                <View>
                  <Text style={[styles.loginTitle, { color: colors.foreground }]}>Sign in to sync</Text>
                  <Text style={[styles.loginSubtitle, { color: colors.mutedForeground }]}>Save history across devices</Text>
                </View>
                <TouchableOpacity
                  style={[styles.loginBtn, { backgroundColor: colors.primary }]}
                  onPress={login}
                >
                  <Text style={styles.loginBtnText}>Log in</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Menu items */}
          <Text style={[styles.menuGroupLabel, { color: colors.mutedForeground }]}>MY TOOLS</Text>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={item.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={styles.menuItemText}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.border} />
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Secondary */}
          <Text style={[styles.menuGroupLabel, { color: colors.mutedForeground }]}>MORE</Text>
          {SECONDARY_ITEMS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.secondaryItem}
              onPress={() => navigate(item.route)}
              activeOpacity={0.7}
            >
              <Feather name={item.icon as any} size={16} color={colors.mutedForeground} />
              <Text style={[styles.secondaryLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drawer: {
    width: 300,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    paddingHorizontal: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 22 },
  drawerHeaderText: { flex: 1 },
  appName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 11 },
  closeBtn: { padding: 4 },

  authCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  authLoading: { fontFamily: "Inter_400Regular", fontSize: 14 },
  authRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  authInfo: { flex: 1 },
  authName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  authEmail: { fontFamily: "Inter_400Regular", fontSize: 12 },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  loginPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  loginTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  loginSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12 },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },

  divider: { height: 1, marginVertical: 12 },
  menuGroupLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: { flex: 1 },
  menuLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  menuDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },

  secondaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  secondaryLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
