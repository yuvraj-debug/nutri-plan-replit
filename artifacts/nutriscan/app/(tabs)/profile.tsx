import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Switch, Alert, Image, ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/lib/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HealthProfile, DietType, HealthCondition, Allergen, Preference } from "@/types";

const DIET_TYPES: { value: DietType; label: string; desc: string }[] = [
  { value: "none", label: "No Restriction", desc: "All food types" },
  { value: "vegetarian", label: "Vegetarian", desc: "No meat or fish" },
  { value: "vegan", label: "Vegan", desc: "No animal products" },
];

const CONDITIONS: { value: HealthCondition; label: string; desc: string }[] = [
  { value: "diabetes", label: "Diabetes", desc: "Sugar & carb sensitive" },
  { value: "hypertension", label: "Hypertension", desc: "Sodium sensitive" },
  { value: "heartDisease", label: "Heart Disease", desc: "Fat & trans fat alert" },
  { value: "celiacDisease", label: "Celiac Disease", desc: "Gluten-free required" },
  { value: "lactoseIntolerance", label: "Lactose Intolerant", desc: "Dairy sensitivity" },
  { value: "kidneyDisease", label: "Kidney Disease", desc: "Protein & potassium care" },
];

const ALLERGENS: { value: Allergen; label: string }[] = [
  { value: "peanuts", label: "Peanuts" },
  { value: "treeNuts", label: "Tree Nuts" },
  { value: "dairy", label: "Dairy / Milk" },
  { value: "eggs", label: "Eggs" },
  { value: "wheat", label: "Wheat / Gluten" },
  { value: "soy", label: "Soy" },
  { value: "fish", label: "Fish" },
  { value: "shellfish", label: "Shellfish" },
  { value: "sesame", label: "Sesame" },
];

const PREFERENCES: { value: Preference; label: string; desc: string }[] = [
  { value: "lowSugar", label: "Prefer Low Sugar", desc: "Warn when sugar is high" },
  { value: "noAdditives", label: "Avoid Additives", desc: "Flag artificial additives" },
  { value: "lowSodium", label: "Prefer Low Sodium", desc: "Warn when sodium is high" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const { healthProfile, updateHealthProfile } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { user, isLoading: authLoading, isAuthenticated, login, logout } = useAuth();
  const [profile, setProfile] = useState<HealthProfile>(healthProfile);
  const [hasChanges, setHasChanges] = useState(false);

  function setDiet(dt: DietType) {
    setProfile(p => ({ ...p, dietType: dt }));
    setHasChanges(true);
  }

  function toggleCondition(c: HealthCondition) {
    setProfile(p => ({
      ...p,
      conditions: p.conditions.includes(c)
        ? p.conditions.filter(x => x !== c)
        : [...p.conditions, c],
    }));
    setHasChanges(true);
  }

  function toggleAllergen(a: Allergen) {
    setProfile(p => ({
      ...p,
      allergens: p.allergens.includes(a)
        ? p.allergens.filter(x => x !== a)
        : [...p.allergens, a],
    }));
    setHasChanges(true);
  }

  function togglePreference(pref: Preference) {
    setProfile(p => ({
      ...p,
      preferences: p.preferences.includes(pref)
        ? p.preferences.filter(x => x !== pref)
        : [...p.preferences, pref],
    }));
    setHasChanges(true);
  }

  async function handleSave() {
    await updateHealthProfile(profile);
    setHasChanges(false);
    Alert.alert("Saved", "Your health profile has been updated.");
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Health Profile</Text>
        {hasChanges && (
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Your profile personalizes warnings and scores for every product scan.
      </Text>

      {/* Account Section */}
      <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {authLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : isAuthenticated && user ? (
          <View style={styles.accountInner}>
            {user.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
                <Feather name="user" size={24} color={colors.primary} />
              </View>
            )}
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: colors.foreground }]}>
                {[user.firstName, user.lastName].filter(Boolean).join(" ") || "User"}
              </Text>
              {user.email && (
                <Text style={[styles.accountEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
              )}
              <View style={[styles.signedInBadge, { backgroundColor: colors.warningGreen + "20" }]}>
                <View style={[styles.signedInDot, { backgroundColor: colors.warningGreen }]} />
                <Text style={[styles.signedInText, { color: colors.warningGreen }]}>Signed in</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.authBtn, { borderColor: colors.border }]}
              onPress={logout}
            >
              <Feather name="log-out" size={16} color={colors.mutedForeground} />
              <Text style={[styles.authBtnText, { color: colors.mutedForeground }]}>Log out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.accountInner}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
              <Feather name="user" size={24} color={colors.mutedForeground} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: colors.foreground }]}>Not signed in</Text>
              <Text style={[styles.accountEmail, { color: colors.mutedForeground }]}>
                Sign in to sync your profile across devices
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.authBtn, { backgroundColor: colors.primary }]}
              onPress={login}
            >
              <Text style={[styles.authBtnText, { color: "#fff" }]}>Log in</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Diet Type */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Diet Type</Text>
      {DIET_TYPES.map(dt => (
        <TouchableOpacity
          key={dt.value}
          style={[
            styles.optionCard,
            {
              backgroundColor: profile.dietType === dt.value ? colors.primary + "18" : colors.card,
              borderColor: profile.dietType === dt.value ? colors.primary : colors.border,
            }
          ]}
          onPress={() => setDiet(dt.value)}
          activeOpacity={0.75}
        >
          <View style={styles.optionLeft}>
            <Text style={[styles.optionLabel, { color: profile.dietType === dt.value ? colors.primary : colors.foreground }]}>
              {dt.label}
            </Text>
            <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{dt.desc}</Text>
          </View>
          {profile.dietType === dt.value && (
            <Feather name="check-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}

      {/* Health Conditions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Health Conditions</Text>
      <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
        These adjust how scores and warnings are calculated for you.
      </Text>
      {CONDITIONS.map(c => (
        <TouchableOpacity
          key={c.value}
          style={[
            styles.optionCard,
            {
              backgroundColor: profile.conditions.includes(c.value) ? colors.info + "12" : colors.card,
              borderColor: profile.conditions.includes(c.value) ? colors.info : colors.border,
            }
          ]}
          onPress={() => toggleCondition(c.value)}
          activeOpacity={0.75}
        >
          <View style={styles.optionLeft}>
            <Text style={[styles.optionLabel, { color: profile.conditions.includes(c.value) ? colors.info : colors.foreground }]}>
              {c.label}
            </Text>
            <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{c.desc}</Text>
          </View>
          {profile.conditions.includes(c.value) && (
            <Feather name="check-circle" size={20} color={colors.info} />
          )}
        </TouchableOpacity>
      ))}

      {/* Allergens */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Allergies</Text>
      <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
        Allergen matches will trigger red-level alerts.
      </Text>
      <View style={styles.grid}>
        {ALLERGENS.map(a => (
          <TouchableOpacity
            key={a.value}
            style={[
              styles.gridChip,
              {
                backgroundColor: profile.allergens.includes(a.value) ? colors.warningRed + "18" : colors.card,
                borderColor: profile.allergens.includes(a.value) ? colors.warningRed : colors.border,
              }
            ]}
            onPress={() => toggleAllergen(a.value)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.chipLabel,
              { color: profile.allergens.includes(a.value) ? colors.warningRed : colors.foreground }
            ]}>
              {a.label}
            </Text>
            {profile.allergens.includes(a.value) && (
              <Feather name="x" size={12} color={colors.warningRed} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Preferences */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
      {PREFERENCES.map(pref => (
        <View
          key={pref.value}
          style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.optionLeft}>
            <Text style={[styles.optionLabel, { color: colors.foreground }]}>{pref.label}</Text>
            <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{pref.desc}</Text>
          </View>
          <Switch
            value={profile.preferences.includes(pref.value)}
            onValueChange={() => togglePreference(pref.value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      ))}

      {/* Save button at bottom */}
      {hasChanges && (
        <TouchableOpacity
          style={[styles.bigSaveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.bigSaveBtnText}>Save Health Profile</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 6, marginTop: 16 },
  sectionDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 12 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionLeft: { flex: 1 },
  optionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  optionDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  gridChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  bigSaveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },
  bigSaveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: "#fff" },
  accountCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  accountInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  accountEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  signedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  signedInDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  signedInText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  authBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  authBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
