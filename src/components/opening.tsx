import * as SplashScreen from "expo-splash-screen";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet } from "react-native";

/** 시스템이 띄운 첫 화면을 앱이 그릴 준비가 될 때까지 붙잡아 둔다. */
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const HOLD_MS = 1100;
const FADE_MS = 900;

/**
 * 시스템 첫 화면이 사라지는 자리에 같은 그림을 이어 붙인다.
 * 가운데 그릇 하나에서 시작해 이름이 떠오르고, 천천히 걷힌다.
 */
export function Opening({ children }: PropsWithChildren) {
  const [covered, setCovered] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => setCovered(false));
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <>
      {children}
      {covered ? (
        <Animated.View
          style={[styles.cover, { opacity }]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Image
            source={require("../../assets/splash.png")}
            style={styles.image}
            resizeMode="cover"
          />
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  cover: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0E1526",
  },
  image: { width: "100%", height: "100%" },
});
