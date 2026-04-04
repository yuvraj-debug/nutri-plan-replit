import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Platform, StyleSheet, View, useColorScheme,
  TouchableOpacity, Text,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function TabLayout() {
  const { isOnboarded, isLoading } = useApp();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (!isLoading && !isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isLoading, isOnboarded]);

  const tabBarHeight = isWeb ? 84 : 68;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: isWeb ? 20 : 10,
          paddingTop: 6,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size ?? 22} color={color} />
          ),
        }}
      />

      {/* Scan — custom big center button */}
      <Tabs.Screen
        name="scan"
        options={{
          title: "",
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.scanTabBtn}
              onPress={() => router.push("/scanner")}
              activeOpacity={0.85}
            >
              <View style={[styles.scanTabCircle, { backgroundColor: colors.primary }]}>
                <Feather name="camera" size={26} color="#fff" />
              </View>
              <Text style={[styles.scanTabLabel, { color: colors.primary }]}>Scan</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Discover */}
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={size ?? 22} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size ?? 22} color={color} />
          ),
        }}
      />

      {/* Hidden screens — accessible via drawer */}
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 0,
    marginTop: -18,
  },
  scanTabCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00897B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  scanTabLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    marginTop: 4,
  },
});
