import { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";
import { fonts } from "../../config/theme";

/* ───────── ITEM CONFIG ───────── */

interface ItemConfig {
  source: ImageSourcePropType;
  x: number;
  y: number;
  width: number;
  rotation: number;
  depth: number;
  zIndex: number;
}

const ITEMS: ItemConfig[] = [
  { source: require("../../../assets/onboarding/sushi.png"),       x: -5,  y: 2,   width: 150, rotation: -15, depth: 1.8, zIndex: 5 },
  { source: require("../../../assets/onboarding/airplane.png"),    x: 20,  y: -5,  width: 160, rotation: -10, depth: 1.2, zIndex: 4 },
  { source: require("../../../assets/onboarding/yoga-mat.png"),    x: 48,  y: 5,   width: 140, rotation: 22,  depth: 0.8, zIndex: 2 },
  { source: require("../../../assets/onboarding/sneaker.png"),     x: 55,  y: 30,  width: 170, rotation: 8,   depth: 1.6, zIndex: 7 },
  { source: require("../../../assets/onboarding/stethoscope.png"), x: -3,  y: 35,  width: 145, rotation: -5,  depth: 1.3, zIndex: 6 },
  { source: require("../../../assets/onboarding/building.png"),    x: 30,  y: 45,  width: 140, rotation: 5,   depth: 1.0, zIndex: 3 },
  { source: require("../../../assets/onboarding/piggy-bank.png"),  x: 60,  y: 60,  width: 150, rotation: -6,  depth: 2.0, zIndex: 7 },
  { source: require("../../../assets/onboarding/suitcase.png"),    x: 35,  y: 68,  width: 155, rotation: 12,  depth: 1.4, zIndex: 5 },
  { source: require("../../../assets/onboarding/ring.png"),        x: 65,  y: -2,  width: 130, rotation: -10, depth: 0.9, zIndex: 3 },
  { source: require("../../../assets/onboarding/golfball.png"),    x: -2,  y: 55,  width: 110, rotation: 0,   depth: 1.7, zIndex: 4 },
  { source: require("../../../assets/onboarding/cards.png"),       x: 42,  y: 25,  width: 160, rotation: -8,  depth: 1.1, zIndex: 3 },
  { source: require("../../../assets/onboarding/ali-nino.png"),    x: 10,  y: 75,  width: 145, rotation: 10,  depth: 1.5, zIndex: 6 },
  { source: require("../../../assets/onboarding/hm-shirt.png"),   x: 75,  y: 40,  width: 155, rotation: 12,  depth: 1.3, zIndex: 4 },
];

const { width: SW, height: SH } = Dimensions.get("window");

/* ───────── PHYSICS BODY ───────── */

interface Body {
  x: number; y: number;       // absolute position (top-left corner)
  vx: number; vy: number;     // velocity px/frame
  r: number;                  // rotation degrees
  vr: number;                 // rotational velocity
  w: number;                  // width (for collision radius)
}

const GRAVITY_SCALE = 1200;   // how strongly tilt maps to acceleration
const FRICTION = 0.97;
const BOUNCE = 0.55;
const COLLISION_RESPONSE = 0.45;
const WALL_PADDING = -5;      // allow items to slightly touch edges
const MAX_ROTATION_OFFSET = 25; // max degrees rotation from rest — realistic wobble, not spinner
const ROTATION_FRICTION = 0.88; // heavy angular friction so rotation settles fast
const HAPTIC_COOLDOWN = 80;     // ms between haptic fires to avoid buzzing

/* ───────── COMPONENT ───────── */

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<any>>();
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(true);

  // Keep ref in sync so physics loop can read it without re-creating
  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  // We use direct DOM-style refs updated in a rAF loop — no React state for physics
  const viewRefs = useRef<(View | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const accel = useRef({ x: 0, y: 0, z: 0 });
  const prevAccel = useRef({ x: 0, y: 0, z: 0 });
  const entranceDone = useRef(false);
  const frameId = useRef<number>(0);
  const lastTime = useRef(0);
  const lastHapticTime = useRef(0);
  // Track which item pairs are currently touching — only vibrate on NEW contact
  const contactPairs = useRef(new Set<string>());
  // Track which items are touching walls
  const wallContacts = useRef(new Set<string>());

  // Fade-in opacity refs (we'll use setNativeProps)
  const fadeRefs = useRef({
    login: null as View | null,
    logo: null as View | null,
    title: null as View | null,
    button: null as View | null,
  });

  // Initialize bodies at their starting positions
  const initBodies = useCallback(() => {
    bodies.current = ITEMS.map((item) => ({
      x: (item.x / 100) * SW,
      y: ((45 + item.y * 0.55) / 100) * SH,
      vx: 0,
      vy: 0,
      r: item.rotation,
      vr: 0,
      w: item.width,
    }));
  }, []);

  useEffect(() => {
    initBodies();

    // ── Accelerometer ──
    Accelerometer.setUpdateInterval(16); // ~60fps
    const sub = Accelerometer.addListener((data) => {
      prevAccel.current = { ...accel.current };
      accel.current = data;
    });

    // ── Entrance animation (simple fade via opacity timeout) ──
    // We start items invisible and fade them in over 1s, then enable physics
    const entranceTimer = setTimeout(() => {
      entranceDone.current = true;
    }, 1200);

    // ── Physics loop ──
    lastTime.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTime.current) / 16.67, 3); // normalize to 60fps, cap at 3x
      lastTime.current = now;

      // Pause physics entirely when screen is not focused
      if (!entranceDone.current || !isFocusedRef.current) {
        lastTime.current = now; // prevent dt spike when resuming
        frameId.current = requestAnimationFrame(loop);
        return;
      }

      const n = ITEMS.length;

      // Dead zone — ignore tiny accelerometer noise when phone is still
      const DEAD_ZONE = 0.08;
      let ax = accel.current.x;
      let ay = accel.current.y;
      if (Math.abs(ax) < DEAD_ZONE) ax = 0;
      if (Math.abs(ay) < DEAD_ZONE) ay = 0;

      // Detect shake: sudden acceleration spike
      const dx = accel.current.x - prevAccel.current.x;
      const dy = accel.current.y - prevAccel.current.y;
      const dz = (accel.current.z || 0) - (prevAccel.current.z || 0);
      const shakeForce = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const isShake = shakeForce > 1.2;

      for (let i = 0; i < n; i++) {
        const b = bodies.current[i];

        const minX = WALL_PADDING;
        const maxX = SW - b.w - WALL_PADDING;
        const minY = WALL_PADDING;
        const maxY = SH - b.w - WALL_PADDING;

        // Shake impulse FIRST — override resting state, blast items away
        if (isShake) {
          const intensity = shakeForce * 30;
          b.vx += (Math.random() - 0.5) * intensity;
          b.vy += (Math.random() - 0.5) * intensity;
          b.vr += (Math.random() - 0.5) * shakeForce * 4;
          // Unlatch from walls so they can fly
          wallContacts.current.delete(`${i}-L`);
          wallContacts.current.delete(`${i}-R`);
          wallContacts.current.delete(`${i}-T`);
          wallContacts.current.delete(`${i}-B`);
        }

        // Only apply gravity if there's meaningful tilt
        // AND don't push into a wall the item is already touching
        if (ax !== 0 || ay !== 0) {
          const gravX = ax * GRAVITY_SCALE * dt * 0.001;
          const gravY = -ay * GRAVITY_SCALE * dt * 0.001;

          // Don't apply gravity component that pushes into a wall
          const atLeft = b.x <= minX + 1;
          const atRight = b.x >= maxX - 1;
          const atTop = b.y <= minY + 1;
          const atBottom = b.y >= maxY - 1;

          if (!(atLeft && gravX < 0) && !(atRight && gravX > 0)) {
            b.vx += gravX;
          }
          if (!(atTop && gravY < 0) && !(atBottom && gravY > 0)) {
            b.vy += gravY;
          }
        }



        // Friction
        b.vx *= FRICTION;
        b.vy *= FRICTION;
        b.vr *= ROTATION_FRICTION;

        // Kill small velocities aggressively — prevents micro-jitter chain reactions
        if (Math.abs(b.vx) < 0.5) b.vx = 0;
        if (Math.abs(b.vy) < 0.5) b.vy = 0;
        if (Math.abs(b.vr) < 0.15) b.vr = 0;

        // Integrate position only if moving
        if (b.vx !== 0) b.x += b.vx * dt;
        if (b.vy !== 0) b.y += b.vy * dt;
        if (b.vr !== 0) b.r += b.vr * dt;

        // Clamp rotation offset to realistic wobble range
        const baseR = ITEMS[i].rotation;
        const rOffset = b.r - baseR;
        if (rOffset > MAX_ROTATION_OFFSET) {
          b.r = baseR + MAX_ROTATION_OFFSET;
          b.vr = -Math.abs(b.vr) * 0.3;
        } else if (rOffset < -MAX_ROTATION_OFFSET) {
          b.r = baseR - MAX_ROTATION_OFFSET;
          b.vr = Math.abs(b.vr) * 0.3;
        }

        // Spring back toward base rotation when nearly still
        if (Math.abs(b.vr) < 1.5) {
          const springForce = (baseR - b.r) * 0.02;
          if (Math.abs(springForce) > 0.01) {
            b.vr += springForce;
          } else {
            b.r = baseR; // snap to rest
          }
        }

        // ── Wall bouncing ──
        // (minX, maxX, minY, maxY already defined above)

        // Wall collision with first-contact haptic
        const wallHit = (wallKey: string, speed: number) => {
          if (!wallContacts.current.has(wallKey)) {
            wallContacts.current.add(wallKey);
            if (speed > 5 && now - lastHapticTime.current >= HAPTIC_COOLDOWN) {
              lastHapticTime.current = now;
              if (speed > 10) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              else if (speed > 5) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        };

        if (b.x < minX) {
          wallHit(`${i}-L`, Math.abs(b.vx));
          b.x = minX;
          if (Math.abs(b.vx) > 3) {
            b.vx = Math.abs(b.vx) * BOUNCE;
          } else {
            b.vx = 0;
          }
        } else { wallContacts.current.delete(`${i}-L`); }

        if (b.x > maxX) {
          wallHit(`${i}-R`, Math.abs(b.vx));
          b.x = maxX;
          if (Math.abs(b.vx) > 3) {
            b.vx = -Math.abs(b.vx) * BOUNCE;
          } else {
            b.vx = 0;
          }
        } else { wallContacts.current.delete(`${i}-R`); }

        if (b.y < minY) {
          wallHit(`${i}-T`, Math.abs(b.vy));
          b.y = minY;
          if (Math.abs(b.vy) > 3) {
            b.vy = Math.abs(b.vy) * BOUNCE;
          } else {
            b.vy = 0;
          }
        } else { wallContacts.current.delete(`${i}-T`); }

        if (b.y > maxY) {
          wallHit(`${i}-B`, Math.abs(b.vy));
          b.y = maxY;
          if (Math.abs(b.vy) > 3) {
            b.vy = -Math.abs(b.vy) * BOUNCE;
          } else {
            b.vy = 0;
          }
        } else { wallContacts.current.delete(`${i}-B`); }
      }

      // ── Item-to-item collision ──
      const activeContacts = new Set<string>();

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const bi = bodies.current[i];
          const bj = bodies.current[j];
          const ciX = bi.x + bi.w / 2;
          const ciY = bi.y + bi.w / 2;
          const cjX = bj.x + bj.w / 2;
          const cjY = bj.y + bj.w / 2;
          const ddx = cjX - ciX;
          const ddy = cjY - ciY;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          const minDist = bi.w * 0.38 + bj.w * 0.38;

          if (dist < minDist && dist > 0.5) {
            const pairKey = `${i}-${j}`;
            activeContacts.add(pairKey);

            const nx = ddx / dist;
            const ny = ddy / dist;
            const overlap = minDist - dist;

            // Relative velocity along collision normal
            const dvx = bj.vx - bi.vx;
            const dvy = bj.vy - bi.vy;
            const dvDotN = dvx * nx + dvy * ny;
            const approachSpeed = Math.abs(dvDotN);

            // Only bounce if approaching with real speed (not just resting/sliding)
            if (dvDotN < -1.5) {
              const impulse = -(1 + BOUNCE) * dvDotN * COLLISION_RESPONSE;
              bi.vx -= nx * impulse;
              bi.vy -= ny * impulse;
              bj.vx += nx * impulse;
              bj.vy += ny * impulse;

              // Gentle wobble — subtle, not a spin
              const tangential = dvx * (-ny) + dvy * nx;
              const wobble = Math.min(1.2, Math.abs(tangential) * 0.08);
              const wobbleDir = tangential >= 0 ? 1 : -1;
              bi.vr -= wobbleDir * wobble;
              bj.vr += wobbleDir * wobble;
            }

            // Haptic ONLY on first contact with real impact speed
            if (!contactPairs.current.has(pairKey) && approachSpeed > 4) {
              if (now - lastHapticTime.current >= HAPTIC_COOLDOWN) {
                lastHapticTime.current = now;
                if (approachSpeed > 10) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                } else if (approachSpeed > 5) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } else {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }
            }

            // Separate overlapping items — position only, no velocity added
            const pushForce = overlap * 0.5;
            bi.x -= nx * pushForce;
            bi.y -= ny * pushForce;
            bj.x += nx * pushForce;
            bj.y += ny * pushForce;

            // Fully cancel any velocity pushing items into each other
            const biToward = bi.vx * nx + bi.vy * ny;
            if (biToward > 0) {
              bi.vx -= nx * biToward;
              bi.vy -= ny * biToward;
            }
            const bjToward = bj.vx * (-nx) + bj.vy * (-ny);
            if (bjToward > 0) {
              bj.vx -= (-nx) * bjToward;
              bj.vy -= (-ny) * bjToward;
            }
          }
        }
      }

      // Update contact pairs — clear old ones so next new contact triggers haptic
      contactPairs.current = activeContacts;

      // ── Apply transforms via setNativeProps ──
      for (let i = 0; i < n; i++) {
        const ref = viewRefs.current[i];
        if (!ref) continue;
        const b = bodies.current[i];
        (ref as any).setNativeProps({
          style: {
            transform: [
              { translateX: b.x },
              { translateY: b.y },
              { rotate: `${b.r}deg` },
            ],
          },
        });
      }

      frameId.current = requestAnimationFrame(loop);
    };

    frameId.current = requestAnimationFrame(loop);

    return () => {
      sub.remove();
      cancelAnimationFrame(frameId.current);
      clearTimeout(entranceTimer);
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* ── Top bar: Log In ── */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => nav.navigate("PhoneEntry", { mode: "login" })}
          style={({ pressed }) => [styles.loginLink, pressed && { opacity: 0.5 }]}
        >
          <Text style={styles.loginText}>Log In</Text>
        </Pressable>
      </View>

      {/* ── Logo ── */}
      <View style={styles.logoWrap}>
        <Image source={require("../../../assets/shansi-logo.png")} style={styles.logo} />
      </View>

      {/* ── Title ── */}
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Welcome to Shansi!</Text>
      </View>

      {/* ── Floating physics items ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {ITEMS.map((item, idx) => (
          <View
            key={idx}
            ref={(r) => { viewRefs.current[idx] = r; }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: item.width,
              height: item.width,
              zIndex: item.zIndex,
              transform: [
                { translateX: (item.x / 100) * SW },
                { translateY: ((45 + item.y * 0.55) / 100) * SH },
                { rotate: `${item.rotation}deg` },
              ],
            }}
          >
            <Image
              source={item.source}
              style={{ width: item.width, height: item.width, resizeMode: "contain" }}
            />
          </View>
        ))}
      </View>

      {/* ── Spacer ── */}
      <View style={{ flex: 1 }} />

      {/* ── Sign up button ── */}
      <View style={[styles.buttonWrap, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => nav.navigate("PhoneEntry", { mode: "signup" })}
          style={({ pressed }) => [styles.signUpButton, pressed && { transform: [{ scale: 0.96 }] }]}
        >
          <Text style={styles.signUpText}>Sign up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFE500",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 4,
    zIndex: 50,
  },
  loginLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  loginText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontFamily: fonts.outfit.bold,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 96,
    zIndex: 50,
  },
  logo: {
    width: 52,
    height: 52,
  },
  titleWrap: {
    paddingHorizontal: 12,
    marginTop: 12,
    zIndex: 50,
    alignItems: "center",
  },
  title: {
    color: "#1A1A1A",
    fontFamily: fonts.outfit.extraBold,
    fontSize: Math.min(52, SW * 0.095),
    letterSpacing: 1.5,
    textAlign: "center",
  },
  buttonWrap: {
    alignItems: "center",
    marginBottom: 8,
    zIndex: 40,
  },
  signUpButton: {
    width: 145,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  signUpText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: fonts.outfit.bold,
  },
});
