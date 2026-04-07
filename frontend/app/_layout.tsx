import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />

      <Stack>
        {/* Tabs normales */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Modal tienda */}
        <Stack.Screen
          name="store"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}