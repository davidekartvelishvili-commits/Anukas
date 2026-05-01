import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, fontSize } from "../../config/theme";

/**
 * Temporary placeholder for screens not yet implemented.
 * Shows the screen name centered on the dark background.
 */
export default function PlaceholderScreen({ name }: { name: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontFamily: fonts.outfit.bold,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontFamily: fonts.dmSans.regular,
  },
});
