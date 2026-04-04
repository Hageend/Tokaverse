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
  const expansion = useSharedValue(0);

  const toggleMenu = useCallback(() => {
    expansion.value = withTiming(expansion.value === 0 ? 1 : 0, { duration: 250 });
  }, [expansion]);

  const handleTabPress = (tab: TabKey) => {
    onTabPress(tab);
    // Auto-close removed as requested: "mejor que se cierre o abra manualmente"
  };

  // Gesto estilo iPhone: Deslizar un poco hacia arriba para abrir
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < -15 && expansion.value === 0) {
        expansion.value = withTiming(1, { duration: 200 });
      }
      if (e.translationY > 15 && expansion.value === 1) {
        expansion.value = withTiming(0, { duration: 200 });
      }
    })
    .runOnJS(true);

  const wrapperStyle = useAnimatedStyle(() => {
    const width = interpolate(expansion.value, [0, 1], [40, SCREEN_WIDTH - 40]);
    const borderRadius = interpolate(expansion.value, [0, 1], [20, 16]);
    const translateY = interpolate(expansion.value, [0, 1], [8, 0]);
    return {
      width,
      borderRadius,
      transform: [{ translateY }],
      paddingHorizontal: interpolate(expansion.value, [0, 1], [0, 6]),
    };
  });

  const barStyle = useAnimatedStyle(() => ({
    opacity: expansion.value,
    transform: [{ scale: interpolate(expansion.value, [0, 1], [0.9, 1]) }],
    pointerEvents: expansion.value > 0.6 ? 'auto' : 'none',
  }));

  const triggerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expansion.value, [0, 0.2], [1, 0]),
    pointerEvents: expansion.value < 0.1 ? 'auto' : 'none',
  }));

  if (Platform.OS === 'web') return null;

  return (
    <View style={[styles.outerWrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.wrapper, wrapperStyle]}>
          
          {/* Expanded Tabs */}
          <Animated.View style={[styles.bar, barStyle]}>
            {TABS.map((tab) => (
              <TabItemComponent
                key={tab.key}
                item={tab}
                isActive={activeTab === tab.key}
                onPress={() => handleTabPress(tab.key)}
              />
            ))}
            <Pressable onPress={toggleMenu} style={styles.closeBtn}>
              <Ionicons name="chevron-down" size={20} color="#FFF" />
            </Pressable>
          </Animated.View>

          {/* iPhone Style Handle (Collapsed State) */}
          <Animated.View style={[styles.trigger, triggerStyle]}>
            <Pressable onPress={toggleMenu} style={styles.triggerInner} hitSlop={20}>
              <View style={styles.iphoneHandle} />
            </Pressable>
          </Animated.View>

        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PILL_WIDTH = 72;
const PILL_HEIGHT = 52;

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    zIndex: 1000,
  },
  wrapper: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    height: 60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  separator: {
    display: 'none',
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
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    zIndex: 2,
  },
  trigger: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerInner: {
    width: 40,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iphoneHandle: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowRadius: 2,
    shadowOpacity: 0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
});
