import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavBar, TabKey } from '../../components/navigation/BottomNavBar';
import { WebTopBar } from '../../components/navigation/WebTopBar';
import { Colors } from '../../constants/Colors';

// Map pathname → TabKey
function pathnameToTab(pathname: string): TabKey {
  if (pathname.includes('league')) return 'league';
  if (pathname.includes('spins')) return 'spins';
  if (pathname.includes('wallet')) return 'wallet';
  return 'quests';
}

function TabsLayout() {
  const pathname = usePathname();
  const activeTab = pathnameToTab(pathname);
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: TabKey) => {
    router.push(`/(tabs)/${tab}` as any);
  };

  return (
    <View style={styles.root}>
      {/* Web top bar */}
      <WebTopBar activeTab={activeTab} onTabPress={handleTabPress} />

      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Hide default tab bar; we use our own
          }}
        />
      </View>

      {/* Mobile bottom nav */}
      <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

export default function TabsRootLayout() {
  return (
    <SafeAreaProvider>
      <TabsLayout />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
});
