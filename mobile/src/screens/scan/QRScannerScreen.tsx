import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { scanQR } from "../../services/wallet";
import { colors, fonts, fontSize } from "../../config/theme";

export default function QRScannerScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      const result = await scanQR(data);
      if (result.success) {
        if ((result as any).type === "payment") {
          Alert.alert(
            "Payment",
            `${(result as any).merchant?.name || "Merchant"}\nAmount: ₾${(result as any).amount}`,
            [
              { text: "Cancel", onPress: () => { setScanned(false); setProcessing(false); } },
              { text: "Confirm", onPress: () => { setScanned(false); setProcessing(false); } },
            ]
          );
        } else {
          Alert.alert("Success", result.message || "QR processed", [
            { text: "OK", onPress: () => { setScanned(false); setProcessing(false); } },
          ]);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Invalid QR code", [
        { text: "OK", onPress: () => { setScanned(false); setProcessing(false); } },
      ]);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.permissionText}>Camera permission is required to scan QR codes</Text>
        <Pressable onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay frame */}
      <View style={[styles.overlay, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.scanTitle}>{"\u10E1\u10D9\u10D0\u10DC\u10D8\u10E0\u10D4\u10D1\u10D0"}</Text>
        <Text style={styles.scanSubtitle}>Point camera at merchant QR code</Text>

        <View style={styles.frame}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {processing && <Text style={styles.processingText}>Processing...</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  permissionText: {
    color: colors.textSecondary, fontSize: 16, fontFamily: fonts.dmSans.regular,
    textAlign: "center", marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  permissionBtnText: { color: "#000", fontSize: 16, fontFamily: fonts.outfit.bold },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  scanTitle: {
    color: colors.white, fontSize: 24, fontFamily: fonts.outfit.bold, marginBottom: 4,
  },
  scanSubtitle: {
    color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: fonts.dmSans.regular,
    marginBottom: 40,
  },
  frame: {
    width: 260, height: 260, position: "relative",
  },
  corner: {
    position: "absolute", width: 40, height: 40,
    borderColor: colors.accent, borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  processingText: {
    color: colors.accent, fontSize: 16, fontFamily: fonts.outfit.semiBold, marginTop: 24,
  },
});
