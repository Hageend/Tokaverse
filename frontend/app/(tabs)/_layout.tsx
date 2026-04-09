import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavBar, TabKey } from '../../components/navigation/BottomNavBar';
import { WebTopBar } from '../../components/navigation/WebTopBar';
import { Colors } from '../../constants/Colors';

import { WebBackground } from '../../components/WebBackground';

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
    <>
      <WebBackground />
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
    </>
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
    backgroundColor: Platform.OS === 'web' ? 'rgba(2, 6, 23, 0.75)' : (Colors.background || '#020617'),
    maxWidth: Platform.OS === 'web' ? 1400 : '100%',
    alignSelf: 'center',
    width: '100%',
    ...(Platform.OS === 'web' ? {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      boxShadow: '0 0 100px rgba(0,0,0,0.9), 0 0 200px rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(20px)',
      height: '100vh',
      overflow: 'hidden'
    } as any : {})
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
