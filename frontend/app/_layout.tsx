import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox, Platform } from 'react-native';

// Suprimir warnings molestos de React Native Web y dependencias externas que no nos afectan
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'shadow* style props are deprecated',
  'textShadow* style props are deprecated',
  'contains an invalid package.json configuration',
  '[expo-av]: Expo AV has been deprecated',
]);

if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string') {
      const msg = args[0];
      if (
        msg.includes('props.pointerEvents is deprecated') ||
        msg.includes('shadow* style props are deprecated') ||
        msg.includes('invalid package.json') ||
        msg.includes('textShadow*')
      ) {
        return;
      }
    }
    originalWarn(...args);
  };
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

