import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Opening } from "../components/opening";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/*
          해시계를 보는 동안에는 위쪽의 시계를 감춘다. 시각을 읽으러 온 화면에
          진짜 시계가 나란히 떠 있으면 눈이 그리로 먼저 간다.
        */}
        <StatusBar hidden />
        <Opening>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </Opening>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
