import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabKey = 'quests' | 'league' | 'spins' | 'wallet';

export interface BottomNavBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

// ─── Tab Definitions ──────────────────────────────────────────────────────────

interface TabItem {
  key: TabKey;
  label: string;
  icon: (color: string, size: number) => React.ReactNode;
}

const TABS: TabItem[] = [
  {
    key: 'quests',
    label: 'QUESTS',
    icon: (color, size) => (
      <MaterialCommunityIcons name="compass-outline" size={size} color={color} />
    ),
  },
  {
    key: 'league',
    label: 'LEAGUE',
    icon: (color, size) => (
      <Ionicons name="trophy-outline" size={size} color={color} />
    ),
  },
  {
    key: 'spins',
    label: 'SPINS',
    icon: (color, size) => (
      <MaterialCommunityIcons name="dice-multiple-outline" size={size} color={color} />
    ),
  },
  {
    key: 'wallet',
    label: 'WALLET',
    icon: (color, size) => (
      <Ionicons name="wallet-outline" size={size} color={color} />
    ),
  },
];

// ─── Animated Tab Item ────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabItemProps {
  item: TabItem;
  isActive: boolean;
  onPress: () => void;
}

function TabItemComponent({ item, isActive, onPress }: TabItemProps) {
  const scale = useSharedValue(1);
  const activeAnim = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    activeAnim.value = withTiming(isActive ? 1 : 0, { duration: 220 });
  }, [activeAnim, isActive]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.90, { damping: 14, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 250 });
    onPress();
  }, [onPress, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeAnim.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scaleX: interpolate(activeAnim.value, [0, 1], [0.6, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeAnim.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(activeAnim.value, [0, 1], [0.5, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const iconColor = isActive ? '#FFFFFF' : Colors.navInactive;
  const labelColor = isActive ? '#FFFFFF' : Colors.navInactive;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.tabItem, containerStyle]}
    >
      {/* Glow behind active pill */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Active pill background */}
      <Animated.View style={[styles.activePill, pillStyle]}>
        <View style={styles.activePillInner} />
      </Animated.View>

      {/* Icon */}
      <View style={styles.iconWrapper}>
        {item.icon(iconColor, 24)}
      </View>

      {/* Label */}
      <Text style={[styles.label, { color: labelColor }]}>{item.label}</Text>
    </AnimatedPressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  // Don't render on web — web uses the top bar instead
  if (Platform.OS === 'web') return null;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Separator line */}
      <View style={styles.separator} />

      <View style={styles.bar}>
        {TABS.map((tab) => (
          <TabItemComponent
            key={tab.key}
            item={tab}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PILL_WIDTH = 72;
const PILL_HEIGHT = 52;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.navBg,
    zIndex: 100,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.navBorder,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 4,
    minHeight: 64,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 64,
    minHeight: 56,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: PILL_WIDTH + 16,
    height: PILL_HEIGHT + 16,
    borderRadius: 20,
    backgroundColor: Colors.glowPrimary,
    // Shadow for iOS
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 8,
  },
  activePill: {
    position: 'absolute',
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  activePillInner: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 3,
    zIndex: 2,
  },
});
