import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Image, ActivityIndicator, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../../services/api";
import { colors, fonts, fontSize, radii } from "../../config/theme";

const { width: W } = Dimensions.get("window");

interface VillageProfile {
  level: number;
  stars: number;
  shieldCount: number;
  attackCharges: number;
  currentVillageId: string;
}

interface Building {
  id: string;
  name: string;
  position: number;
  currentStars: number;
  maxStars: number;
  upgradeCost: number;
}

export default function VillageScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VillageProfile | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/village/profile").catch(() => null),
      apiFetch("/village/all").catch(() => null),
    ]).then(([pData, vData]: any[]) => {
      if (pData?.success) setProfile(pData.profile);
      if (vData?.success && vData.villages?.length > 0) {
        const currentVillage = vData.villages[0];
        setBuildings(currentVillage.buildings || []);
      }
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async (buildingId: string) => {
    setUpgrading(buildingId);
    try {
      const res = await apiFetch("/village/upgrade-building", {
        method: "POST",
        body: JSON.stringify({ buildingId }),
      });
      if (res.success) {
        setBuildings((prev) =>
          prev.map((b) =>
            b.id === buildingId ? { ...b, currentStars: b.currentStars + 1 } : b
          )
        );
        if (profile) {
          setProfile({ ...profile, stars: profile.stars - (buildings.find(b => b.id === buildingId)?.upgradeCost || 0) });
        }
      }
    } catch {}
    setUpgrading(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>{"\u10E1\u10DD\u10E4\u10D4\u10DA\u10D8"}</Text>

        {/* Stats bar */}
        {profile && (
          <View style={styles.statsBar}>
            <StatPill emoji="⭐" value={String(profile.stars)} label="Stars" />
            <StatPill emoji="🛡️" value={String(profile.shieldCount)} label="Shields" />
            <StatPill emoji="⚔️" value={`${profile.attackCharges}/3`} label="Attacks" />
            <StatPill emoji="🏆" value={`Lv ${profile.level}`} label="Level" />
          </View>
        )}

        {/* Buildings */}
        <Text style={styles.sectionTitle}>Buildings</Text>
        <View style={styles.buildingsGrid}>
          {buildings.map((b) => (
            <View key={b.id} style={styles.buildingCard}>
              <Text style={styles.buildingEmoji}>🏠</Text>
              <Text style={styles.buildingName}>{b.name}</Text>
              <View style={styles.starsRow}>
                {Array.from({ length: b.maxStars }).map((_, i) => (
                  <Text key={i} style={{ fontSize: 14, opacity: i < b.currentStars ? 1 : 0.3 }}>⭐</Text>
                ))}
              </View>
              {b.currentStars < b.maxStars && (
                <Pressable
                  onPress={() => handleUpgrade(b.id)}
                  disabled={upgrading === b.id || !profile || profile.stars < b.upgradeCost}
                  style={[
                    styles.upgradeBtn,
                    (!profile || profile.stars < b.upgradeCost) && styles.upgradeBtnDisabled,
                  ]}
                >
                  {upgrading === b.id ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.upgradeBtnText}>
                      Upgrade ({b.upgradeCost} ⭐)
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function StatPill({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={{ fontSize: 16 }}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  headerTitle: {
    color: colors.white, fontSize: 28, fontFamily: fonts.outfit.bold,
    paddingTop: 16, paddingBottom: 12,
  },
  statsBar: {
    flexDirection: "row", gap: 8, marginBottom: 24,
  },
  statPill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, backgroundColor: "#1C1C1E", borderRadius: 12, paddingVertical: 10,
  },
  statValue: { color: colors.white, fontSize: 14, fontFamily: fonts.outfit.bold },
  sectionTitle: {
    color: colors.white, fontSize: 20, fontFamily: fonts.outfit.bold,
    marginBottom: 12,
  },
  buildingsGrid: { gap: 12 },
  buildingCard: {
    backgroundColor: "#1C1C1E", borderRadius: radii.lg, padding: 16,
    alignItems: "center",
  },
  buildingEmoji: { fontSize: 36, marginBottom: 8 },
  buildingName: { color: colors.white, fontSize: 16, fontFamily: fonts.outfit.semiBold, marginBottom: 4 },
  starsRow: { flexDirection: "row", gap: 2, marginBottom: 8 },
  upgradeBtn: {
    backgroundColor: colors.accent, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  upgradeBtnDisabled: { opacity: 0.4 },
  upgradeBtnText: { color: "#000", fontSize: 14, fontFamily: fonts.outfit.bold },
});
