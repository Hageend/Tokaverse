import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
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
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Colors } from '../../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabKey = 'quests' | 'league';

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
];

// ─── Animated Tab Item ────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabItemProps {
  item: TabItem;
  isActive: boolean;
  onPress: () => void;
}

function TabItemComponent({ item, isActive, onPress }: TabItemProps) {
  const activeAnim = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    activeAnim.value = withSpring(isActive ? 1 : 0, { damping: 15, stiffness: 120 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(activeAnim.value, [0, 1], [64, 120], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(
        activeAnim.value,
        [0, 1],
        ['transparent', 'rgba(255, 255, 255, 0.12)']
      ),
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: interpolate(activeAnim.value, [0, 1], [0, -28], Extrapolation.CLAMP) }],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    return {
      opacity: activeAnim.value,
      transform: [
        { translateX: interpolate(activeAnim.value, [0, 1], [30, 0], Extrapolation.CLAMP) }
      ],
    };
  });

  const iconColor = isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)';

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      style={[styles.tabItem, animatedStyle]}
    >
      <Animated.View style={[styles.iconWrapper, iconStyle]}>
        {item.icon(iconColor, 22)}
      </Animated.View>

      <Animated.View style={[styles.labelWrapper, labelStyle]} pointerEvents="none">
        <Text style={styles.label}>{item.label}</Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

import { interpolateColor } from 'react-native-reanimated';

export function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'web') return null;

  return (
    <View style={[styles.outerWrapper, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.wrapper}>
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
    alignItems: 'center',
  },
  wrapper: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 22,
    height: 64,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 12,
  },
  tabItem: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  labelWrapper: {
    position: 'absolute',
    left: 46,
    width: 64,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
});
