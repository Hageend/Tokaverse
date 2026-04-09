import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { TabKey } from './BottomNavBar';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebTopBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  title?: string;
}

// ─── Tab Definitions ──────────────────────────────────────────────────────────

interface NavItem {
  key: TabKey;
  label: string;
  icon: (color: string, size: number) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'quests',
    label: 'Quests',
    icon: (color, size) => (
      <MaterialCommunityIcons name="compass-outline" size={size} color={color} />
    ),
  },
  {
    key: 'league',
    label: 'League',
    icon: (color, size) => (
      <Ionicons name="trophy-outline" size={size} color={color} />
    ),
  },
  {
    key: 'spins',
    label: 'Spins',
    icon: (color, size) => (
      <MaterialCommunityIcons name="dice-multiple-outline" size={size} color={color} />
    ),
  },
  {
    key: 'wallet',
    label: 'Wallet',
    icon: (color, size) => (
      <Ionicons name="wallet-outline" size={size} color={color} />
    ),
  },
];

// ─── Animated NavLink ─────────────────────────────────────────────────────────

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
}

function NavLink({ item, isActive, onPress }: NavLinkProps) {
  const progress = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive, progress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0, { duration: 200 }),
    transform: [
      { scaleX: withTiming(isActive ? 1 : 0.4, { duration: 220 }) },
    ],
  }));

  const iconColor = isActive ? Colors.primary : Colors.navInactive;
  const labelColor = isActive ? Colors.textPrimary : Colors.navInactive;
  const labelWeight = isActive ? '700' : '400';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.navLink,
        pressed && styles.navLinkPressed,
      ]}
    >
      {/* Icon */}
      <View style={styles.navLinkIcon}>
        {item.icon(iconColor, 18)}
      </View>

      {/* Label */}
      <Text style={[styles.navLinkLabel, { color: labelColor, fontWeight: labelWeight as any }]}>
        {item.label}
      </Text>

      {/* Active underline indicator */}
      <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WebTopBar({ activeTab, onTabPress, title = 'TOKAVERSE' }: WebTopBarProps) {
  // Only render on web
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.wrapper}>
      {/* Glassmorphism surface */}
      <View style={[styles.bar, glassStyle]}>
        {/* Left — Logo / wordmark */}
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Image
              source={require('../../assets/images/iconToka.png')}
              style={{ width: '100%', height: '100%', borderRadius: 10 }}
              contentFit="cover"
            />
          </View>
          <Text style={styles.logoText}>{title}</Text>
        </View>

        {/* Center — Navigation links */}
        <View style={styles.navSection}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              item={item}
              isActive={activeTab === item.key}
              onPress={() => onTabPress(item.key)}
            />
          ))}
        </View>

        {/* Right — Action zone */}
        <View style={styles.actionSection}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityLabel="Search"
            accessibilityRole="button"
          >
            <Ionicons name="search-outline" size={20} color={Colors.navInactive} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.navInactive} />
          </Pressable>

          {/* Avatar / Profile */}
          <Pressable
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.avatarBtnPressed]}
            accessibilityLabel="Profile"
            accessibilityRole="button"
          >
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={16} color={Colors.primary} />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Bottom border with gradient-like glow */}
      <View style={styles.barBorder} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// Glassmorphism inline style (avoids StyleSheet type check for web-only CSS props)
const glassStyle = {
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
} as any;

const styles = StyleSheet.create({
  wrapper: {
    position: 'sticky' as any,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20000,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(13,18,32,0.85)',
  },
  barBorder: {
    height: 1,
    backgroundColor: Colors.navBorder,
  },

  // Logo
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 140,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(77,97,252,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,97,252,0.3)',
  },
  logoText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textPrimary,
  },

  // Navigation
  navSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    position: 'relative',
    minHeight: 44,
    cursor: 'pointer' as any,
  },
  navLinkPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navLinkIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLinkLabel: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  // Action buttons
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 140,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  actionBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatarBtn: {
    marginLeft: 8,
    cursor: 'pointer' as any,
  },
  avatarBtnPressed: {
    opacity: 0.8,
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(77,97,252,0.2)',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
