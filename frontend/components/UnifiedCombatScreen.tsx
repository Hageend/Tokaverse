// components/UnifiedCombatScreen.tsx
// TokaVerse RPG — Sistema de Combate Unificado JRPG (Arena + Historia)

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Image, Dimensions, ScrollView,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring, withRepeat,
  FadeIn, FadeInUp, FadeOut, Easing, SharedValue,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

// RPG Engines & Stores
import { TurnManager, CombatState, CombatAction } from '../engine/TurnManager';
import { Fighter, Boss } from '../types/combat';
import { QUEST_ENEMIES, useCombatStore } from '../store/useCombatStore';
import { STATUS_INFO, AnyStatus } from '../engine/StatusEngine';
import { Colors } from '../constants/Colors';
import { ELEMENT_INFO } from '../types/elements';
import type { PlayerCard } from '../types/fusion';
import { useInventoryStore, BOSS_DROPS, selectRandomDrop, BossDropItem, RARITY_COLORS } from '../store/useInventoryStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { COIN_SPRITES, ITEM_SPRITES } from '../data/classSkills';
import { EnemyMapper } from '../utils/EnemyMapper';

// Components
import { DamageNumber } from './quest/DamageNumber';
import CharacterAvatar from './CharacterAvatar';
import TrophyDefeatAnimation from './quest/TrophyDefeatAnimation';
import { LootDropModal, LootDropDisplay } from './quest/LootDropModal';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COMBAT_TRACKS = [
  require('../assets/music/combat/Ascent_to_Victory.mp3'),
  require('../assets/music/combat/Beyond_The_Threshold.mp3'),
  require('../assets/music/combat/Kurenai_no_Kessen.mp3'),
  require('../assets/music/combat/Last_Hand_at_the_Gate.mp3'),
  require('../assets/music/combat/One_Last_Tile.mp3'),
  require('../assets/music/combat/The_Final_Tile.mp3'),
];

const PHASE_THEME_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#8B5CF6',
  3: '#EF4444',
  4: '#FF6B35',
};

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface UnifiedCombatProps {
  opponent: Boss | (typeof QUEST_ENEMIES[number]);
  player: Fighter;
  equippedCards?: PlayerCard[];
  onVictory?: (opponent: any) => void;
  onDefeat?: () => void;
  onExit: () => void;
  globalVolume?: number;
  heroSprite?: any;
}

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────

const StatBar = React.memo(({ current, max, color, label, showText = true }: {
  current: number; max: number; color: string; label: string; showText?: boolean
}) => {
  const safeCur = isNaN(current) ? 0 : current;
  const safeMax = isNaN(max) || max <= 0 ? 100 : max;
  const pct     = Math.max(0, Math.min(1, safeCur / safeMax));

  const opacity = useSharedValue(1);
  useEffect(() => {
    if (pct < 0.2) {
      opacity.value = withRepeat(withTiming(0.3, { duration: 500 }), -1, true);
    } else { opacity.value = 1; }
  }, [pct, opacity]);

  const barWidth = useSharedValue(pct);
  useEffect(() => { barWidth.value = withTiming(pct, { duration: 400 }); }, [pct, barWidth]);

  const barStyle = useAnimatedStyle(() => ({ opacity: opacity.value, width: `${barWidth.value * 100}%` }));

  return (
    <View style={barStyles.wrapper}>
      {showText && (
        <View style={barStyles.labelRow}>
          <Text style={[barStyles.label, { color }]}>{label}</Text>
          <Text style={barStyles.value}>{safeCur}/{safeMax}</Text>
        </View>
      )}
      <View style={barStyles.bg}><Animated.View style={[barStyles.fill, { backgroundColor: color }, barStyle]} /></View>
    </View>
  );
});

const AnimatedSprite = React.memo(({ spriteUrl, onHit, sizeScale = 1, shakeAnim }: { 
  spriteUrl: any; onHit: boolean; sizeScale?: number; shakeAnim?: SharedValue<number> 
}) => {
  const sc = useSharedValue(1);
  useEffect(() => {
    if (onHit) {
      sc.value = withSequence(withTiming(0.92, { duration: 60 }), withSpring(1));
    }
  }, [onHit, sc]);

  const animated = useAnimatedStyle(() => ({ 
    transform: [
      { translateX: shakeAnim?.value ?? 0 }, 
      { scale: sc.value * sizeScale }
    ] 
  }));
  
  return (
    <Animated.View style={animated}>
      <Image source={typeof spriteUrl === 'number' ? spriteUrl : { uri: spriteUrl }} style={{ width: 120, height: 120 }} resizeMode="contain" />
    </Animated.View>
  );
});

const StatusChips = React.memo(({ effects }: { effects: { type: AnyStatus; duration: number }[] }) => {
  if (!effects || effects.length === 0) return null;
  return (
    <View style={chipStyles.row}>
      {effects.map((e, i) => {
        const info = STATUS_INFO[e.type as AnyStatus];
        if (!info) return null;
        return (
          <Animated.View key={`${e.type}_${i}`} style={[chipStyles.chip, { borderColor: info.color + '66', backgroundColor: info.color + '18' }]}>
            <Text style={chipStyles.emoji}>{info.emoji}</Text>
            <Text style={[chipStyles.label, { color: info.color }]}>{e.duration}t</Text>
          </Animated.View>
        );
      })}
    </View>
  );
});

const ActionBtn = React.memo(({ label, sub, color, icon, onPress, disabled, showDurability }: {
  label: string; sub?: string; color: string; icon?: string; onPress: () => void; disabled?: boolean; showDurability?: boolean
}) => {
  const sc = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const durabilityPct = useInventoryStore(s => {
    if (!showDurability) return 0;
    const item = s.items.find(i => i.isEquipped && i.type === 'weapon');
    return (item?.durability && item.maxDurability) ? (item.durability / item.maxDurability) * 100 : 0;
  });

  return (
    <Animated.View style={[animated, { flex: 1 }]}>
      <TouchableOpacity
        style={[actionBtnStyles.btn, { backgroundColor: color + '22', borderColor: color + '66' }, disabled && actionBtnStyles.disabled]}
        onPress={() => { sc.value = withSequence(withTiming(0.94, { duration: 80 }), withSpring(1)); onPress(); }}
        disabled={disabled}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {icon && <Ionicons name={icon as any} size={14} color={color} />}
          <Text style={[actionBtnStyles.label, { color }]}>{label}</Text>
        </View>
        {sub && <Text style={actionBtnStyles.sub}>{sub}</Text>}
        {showDurability && durabilityPct > 0 && <View style={actionBtnStyles.durability}><View style={[actionBtnStyles.fill, { width: `${durabilityPct}%` }]} /></View>}
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── LOOT MAGNET ─────────────────────────────────────────────────────────────

export interface LootItem extends BossDropItem { id: string; }

const LootMagnetEffect = React.memo(({ item, startX, startY, endX, endY, onComplete }: {
  item: BossDropItem & { id: string }; startX: number; startY: number; endX: number; endY: number; onComplete: (id: string) => void;
}) => {
  const tx = useSharedValue(startX); const ty = useSharedValue(startY); const sc = useSharedValue(0);
  useEffect(() => {
    sc.value = withSequence(withTiming(1.5, { duration: 200 }), withTiming(1, { duration: 200 }));
    tx.value = withTiming(startX + 40, { duration: 600 });
    ty.value = withSequence(withTiming(startY - 40, { duration: 300 }), withTiming(startY + 20, { duration: 400, easing: Easing.bounce }));
    setTimeout(() => {
      tx.value = withTiming(endX, { duration: 800 }); ty.value = withTiming(endY, { duration: 800 });
      sc.value = withTiming(0, { duration: 800 });
      setTimeout(() => onComplete(item.id), 850);
    }, 1200);
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }] }));
  return (
    <Animated.View style={[lootStyles.container, anim]}>
      {item.pixelArt ? <Image source={ITEM_SPRITES[item.pixelArt as keyof typeof ITEM_SPRITES]} style={lootStyles.img} /> : <Text style={lootStyles.icon}>{item.icon}</Text>}
    </Animated.View>
  );
});

// ─── MAIN ENGINE ─────────────────────────────────────────────────────────────

export default function UnifiedCombatScreen(props: UnifiedCombatProps) {
  const bossOpponent = useMemo(() => {
    const opp = props.opponent;
    if ((opp as any).debtType && (opp as any).skills) return opp as Boss;
    return EnemyMapper.simpleToBoss(opp as any);
  }, [props.opponent]);
  const [vol, setVol] = useState(props.globalVolume ?? 0.7);
  const { damageNumbers, clearDamageEvent, addDamageEvent } = useCombatStore();
  const flash = useSharedValue(0);
  const flashAnim = useAnimatedStyle(() => ({ opacity: flash.value }));
  const [loots, setLoots] = useState<(BossDropItem & { id: string })[]>([]);

  // Shake effects
  const heroShake = useSharedValue(0);
  const enemyShake = useSharedValue(0);
  const triggerShake = (target: 'hero' | 'enemy') => {
    const val = target === 'hero' ? heroShake : enemyShake;
    val.value = withSequence(
      withTiming(-10, { duration: 40 }), withTiming(10, { duration: 40 }),
      withTiming(-6, { duration: 30 }), withTiming(6, { duration: 30 }),
      withTiming(0, { duration: 30 })
    );
  };

  // Avatar states
  const [isHeroAttacking, setHeroAttacking] = useState(false);
  const [isHeroHit, setHeroHit] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [animatingVictory, setAnimatingVictory] = useState(false);

  const inventory = useInventoryStore(s => s.items);
  const consumables = useMemo(() => inventory.filter(i => i.type === 'consumable'), [inventory]);

  const [victoryRewards, setVictoryRewards] = useState<{ xp: number, starCoins: number, items: BossDropItem[], inventoryFull?: boolean } | null>(null);
  const [showLootModal, setShowLootModal] = useState(false);
  const [lootData, setLootData] = useState<LootDropDisplay | null>(null);

  const combatPlayer = useAudioPlayer(COMBAT_TRACKS[Math.floor(Math.random() * 6)]);
  useEffect(() => {
    if (combatPlayer) {
      combatPlayer.loop = true;
      combatPlayer.volume = vol;
      combatPlayer.play();
    }
  }, [combatPlayer]);

  useEffect(() => {
    if (combatPlayer) combatPlayer.volume = vol;
  }, [vol, combatPlayer]);

  const [state, setState] = useState<CombatState>(() => TurnManager.initCombat(props.player, bossOpponent, props.equippedCards));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const handleAction = (a: CombatAction) => {
    if (state.phase !== 'player_turn' || busyRef.current || busy) return;
    busyRef.current = true; setBusy(true);
    if (a.type === 'ATTACK' || a.type === 'SKILL' || a.type === 'FUSION') setHeroAttacking(true);
    
    try {
      const next = TurnManager.executePlayerAction(state, a);
      const log = next.log[next.log.length - 1];
      
      if (log?.damage && (log.actor === 'player' || log.action === 'FINANCIAL_ACTION' || a.type === 'SKILL')) {
        addDamageEvent(log.damage, 'enemy', log.isCritical ? 'critical' : (log.isWeakness ? 'weakness' : 'normal'));
        triggerShake('enemy');
      }
      
      if (a.type === 'USE_ITEM') {
        useInventoryStore.getState().removeItem(a.itemId);
        setShowBag(false);
      }

      setState(next);
      setTimeout(() => setHeroAttacking(false), 600);
      if (next.phase === 'victory') {
        flash.value = withSequence(withTiming(1, { duration: 50 }), withTiming(0, { duration: 300 }));
        setAnimatingVictory(true); // <--- Nueva animación de trofeo solicitada
        
        // Mobb vs Boss check
        const isMob = next.boss.skills.length <= 2;
        const bossIdRaw = next.boss.id?.replace('boss_','') || 'toka_despensa';
        
        // Always try to get a drop if bossType/Id exists in BOSS_DROPS
        const drop = BOSS_DROPS[bossIdRaw]?.guaranteed ?? selectRandomDrop(bossIdRaw);
        const xp = isMob ? ((props.opponent as any).xpReward || 80) : 500;
        const starCoins = isMob ? 25 : 150; // Recompensa en Monedas de Estrella
        
        let finalItems: (BossDropItem & { id: string })[] = [];
        let invFull = false;
        if (drop) {
          const loot = { ...drop, id: `L_${Date.now()}` };
          setLoots([loot]);
          finalItems.push(loot);
          
          // Persistencia inmediata
          const success = useInventoryStore.getState().addItem(loot as any, next.boss.name);
          if (!success) invFull = true;
        }
        
        // Garantía de recompensas
        usePlayerStore.getState().addXp(xp);
        usePlayerStore.getState().addStarCoins(starCoins);
        
        setVictoryRewards({ xp, starCoins, items: finalItems, inventoryFull: invFull });

        // Colectar el drop aleatorio también
        const randomDrop = selectRandomDrop(bossIdRaw);

        // Mostrar LootDropModal con fan animation
        setLootData({
          guaranteed: drop ?? { icon: '🧪', name: 'Poción Menor', rarity: 'common', type: 'consumable' },
          random: randomDrop,
          bossName: next.boss.name,
        });
        setShowLootModal(true);

        setTimeout(() => props.onVictory?.(next.boss), 5000); 
      }
    } finally { busyRef.current = false; setBusy(false); }
  };

  useEffect(() => {
    if (state.phase !== 'boss_turn') return;
    const t = setTimeout(() => {
      const next = TurnManager.executeBossTurn(state);
      next.log.slice(state.log.length).forEach((e: any) => { 
        if (e.damage) {
          addDamageEvent(e.damage, 'hero', 'normal'); 
          triggerShake('hero');
          setHeroHit(true);
          setTimeout(() => setHeroHit(false), 500);
        }
      });
      setState(next);
      if (next.phase === 'defeat') setTimeout(() => props.onDefeat?.(), 1200);
    }, 800);
    return () => clearTimeout(t);
  }, [state.turn, state.phase]);

  const isVic = state.phase === 'victory';
  const isDef = state.phase === 'defeat';

  if (animatingVictory) {
    return <TrophyDefeatAnimation onFinish={() => setAnimatingVictory(false)} />;
  }

  if (isVic && victoryRewards) {
    return (
      <View style={endStyles.screen}>
        {isVic && <LottieView source={require('../assets/confetti.json')} autoPlay loop={false} style={StyleSheet.absoluteFill} />}

        {/* LootDropModal reemplaza la pantalla básica de loot */}
        <LootDropModal
          visible={showLootModal}
          loot={lootData}
          onClaim={(guaranteed, random) => {
            // Añadir drops al inventario si no se añadieron aún
            const store = useInventoryStore.getState();
            if (!victoryRewards.items.find(i => i.name === guaranteed.name)) {
              store.addItem(guaranteed as any, lootData?.bossName ?? 'Jefe');
            }
            if (random) store.addItem(random as any, lootData?.bossName ?? 'Jefe');
            setShowLootModal(false);
          }}
          onClose={() => setShowLootModal(false)}
        />

        {!showLootModal && (
          <Animated.View entering={FadeInUp.springify()} style={endStyles.resBox}>
            <Text style={endStyles.resTitle}>🏆 ¡VICTORIA!</Text>

            {victoryRewards.inventoryFull && (
              <Animated.View entering={FadeIn} style={endStyles.fullWarning}>
                <Text style={endStyles.fullWarningText}>⚠️ INVENTARIO LLENO. No se pudo guardar el botín.</Text>
              </Animated.View>
            )}

            <View style={endStyles.xpRow}>
              <Text style={endStyles.xpLabel}>EXPERIENCIA</Text>
              <Text style={endStyles.xpVal}>+{victoryRewards.xp} XP</Text>
            </View>

            <View style={[endStyles.xpRow, { marginTop: -8 }]}>
              <Text style={endStyles.xpLabel}>ESTRELLAS OBTENIDAS</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Image source={COIN_SPRITES.star} style={{ width: 14, height: 14 }} />
                <Text style={[endStyles.xpVal, { color: '#FFD700' }]}>+{victoryRewards.starCoins}</Text>
              </View>
            </View>

            <TouchableOpacity style={endStyles.continueBtn} onPress={props.onExit}>
              <Text style={endStyles.btnTxt}>ACEPTAR Y VOLVER</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  }

  if (isDef) return (
    <View style={[endStyles.screen, { backgroundColor: '#1a0000' }]}>
      <Text style={[endStyles.kanji, { color: '#EF4444' }]}>💀</Text>
      <Text style={[endStyles.title, { color: '#EF4444' }]}>Derrota</Text>
      <TouchableOpacity style={[endStyles.btn, { backgroundColor: '#7F1D1D' }]} onPress={props.onExit}><Text style={endStyles.btnTxt}>Continuar</Text></TouchableOpacity>
    </View>
  );

  const bpc = PHASE_THEME_COLORS[state.boss.phase] ?? '#fbbf24';
  const lastLog = state.log[state.log.length - 1];
  const frozen = state.player.statusEffects.some(e => e.type === 'frozen');

  return (
    <View style={styles.root}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF', zIndex: 99 }, flashAnim]} />
      <View style={styles.topBar}>
        <View style={styles.vol}><TouchableOpacity onPress={() => setVol(v => Math.max(0, v - 0.1))}><Ionicons name="volume-low" color="#FFF" size={14} /></TouchableOpacity><Text style={styles.volT}>{Math.round(vol * 100)}%</Text><TouchableOpacity onPress={() => setVol(v => Math.min(1, v + 0.1))}><Ionicons name="volume-high" color="#FFF" size={14} /></TouchableOpacity></View>
        <View style={styles.turn}><Text style={styles.turnT}>TURNO {state.turn}</Text></View>
        <TouchableOpacity onPress={props.onExit} style={styles.exit}><Text style={styles.exitT}>Huir</Text></TouchableOpacity>
      </View>

      <View style={uiStyles.cardHud}>
        {state.equippedCards.map((c, i) => (
          <Animated.View entering={FadeInUp.delay(i * 100)} key={`${c.cardId}_${i}`} style={uiStyles.cardChip}>
            <Text style={uiStyles.cardEmoji}>
              {ELEMENT_INFO[c.element || 'thunder']?.emoji || '🃏'}
            </Text>
          </Animated.View>
        ))}
      </View>

      <View style={[styles.box, { borderColor: bpc + '44' }]}>
        {/* Telegraph Alerta — MEJORADO */}
        {state.phase === 'player_turn' && state.telegraphMsg && (
          <Animated.View entering={FadeInUp} style={styles.telegraphBanner}>
            <Ionicons name="warning" size={14} color="#EF4444" />
            <Text style={styles.telegraphT}>PRÓXIMO: {state.telegraphMsg.toUpperCase()}</Text>
          </Animated.View>
        )}
        
        <View style={styles.row}>
          <Text style={[styles.name, { color: bpc }]}>{state.boss.name}</Text>
          {state.boss.debtAmount > 0 && <View style={[styles.badge, { backgroundColor: bpc + '15', borderColor: bpc + '55' }]}><Text style={[styles.badT, { color: bpc }]}>FASE {state.boss.phase}</Text></View>}
        </View>
        <StatBar current={state.boss.hp} max={state.boss.maxHp} color={bpc} label="HP" />
        {/* ATB Boss */}
        <View style={styles.atbTrack}>
          <View style={[styles.atbFill, { width: state.phase === 'boss_turn' ? '100%' : '30%', backgroundColor: bpc }]} />
        </View>

        <StatusChips effects={state.boss.statusEffects} />
        <View style={styles.center}>
          <AnimatedSprite 
            spriteUrl={state.boss.sprite} 
            onHit={state.phase === 'boss_turn'} 
            sizeScale={1.3} 
            shakeAnim={enemyShake}
          />
        </View>
      </View>

      <View style={styles.box}>
        <View style={styles.row}>
          <View style={{ alignItems: 'center' }}>
            <CharacterAvatar 
              spriteUrl={props.heroSprite || require('../assets/images/chars/char_rogue.png')} 
              isAttacking={isHeroAttacking}
              isTakingDamage={isHeroHit}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.pName}>{state.player.name}</Text>
              {/* Combo Counter UI */}
              <View style={styles.comboRow}>
                {[1,2,3,4].map(i => (
                  <View key={i} style={[styles.comboDot, state.comboCounter >= i && styles.comboDotActive]} />
                ))}
              </View>
            </View>
            <StatBar current={state.player.hp} max={state.player.maxHp} color="#22c55e" label="HP" />
            <StatBar current={state.player.mana} max={state.player.maxMana} color="#3b82f6" label="MP" />
            {/* ATB Player */}
            <View style={styles.atbTrack}>
              <View style={[styles.atbFill, { width: state.phase === 'player_turn' ? '100%' : '10%', backgroundColor: '#22c55e' }]} />
            </View>
          </View>
        </View>
        <StatusChips effects={state.player.statusEffects} />
      </View>

      {/* Log Multilínea — Mejorado */}
      <View style={styles.log}>
        <ScrollView 
          ref={ref => ref?.scrollToEnd()} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        >
          {state.log.slice(-3).map((m, i) => (
            <Text key={i} style={[styles.logT, i < 2 && { opacity: 0.5, fontSize: 10 }]}>
              {m.message}
            </Text>
          ))}
        </ScrollView>
      </View>

      <View style={styles.actions}>
        {state.phase === 'player_turn' && !busy ? (
          <>
            <View style={styles.aRow}>
              <ActionBtn label="ATACAR" icon="flash" color="#ef4444" onPress={() => handleAction({ type: 'ATTACK' })} disabled={frozen} showDurability />
              <ActionBtn label="DEFENDER" icon="shield" color="#3b82f6" onPress={() => handleAction({ type: 'DEFEND' })} disabled={frozen} />
            </View>
            <View style={styles.aRow}>
              {state.player.skills.slice(0, 1).map(s => <ActionBtn key={s.id} label={s.name} icon="sparkles" sub={`${s.manaCost}MP`} color="#a855f7" onPress={() => handleAction({ type: 'SKILL', skillId: s.id })} disabled={frozen || state.player.mana < s.manaCost} />)}
              <ActionBtn label="BOLSA" icon="briefcase" color="#A855F7" onPress={() => setShowBag(true)} />
            </View>
          </>
        ) : <View style={styles.wait}><Text style={styles.waitT}>TURNO ENEMIGO...</Text></View>}
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {damageNumbers.map(e => <DamageNumber key={e.id} id={e.id} amount={e.amount} kind={e.kind} x={SCREEN_W * 0.5} y={e.target === 'enemy' ? SCREEN_H * 0.3 : SCREEN_H * 0.6} onFinish={clearDamageEvent} />)}
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {loots.map(l => <LootMagnetEffect key={l.id} item={l} startX={SCREEN_W * 0.5} startY={SCREEN_H * 0.3} endX={SCREEN_W - 60} endY={40} onComplete={id => {
          setLoots(p => p.filter(i => i.id !== id)); useInventoryStore.getState().addItem(l as any, state.boss.name);
        }} />)}
      </View>

      {/* ── BAG OVERLAY ── */}
      {showBag && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={uiStyles.bagOverlay}>
          <View style={uiStyles.bagBox}>
            <View style={uiStyles.bagHeader}>
              <Text style={uiStyles.bagTitle}>🧪 Objetos de Combate</Text>
              <TouchableOpacity onPress={() => setShowBag(false)}><Ionicons name="close-circle" size={24} color="#FFF" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {consumables.length === 0 ? (
                <Text style={uiStyles.emptyBag}>No tienes objetos usables.</Text>
              ) : (
                <View style={uiStyles.bagGrid}>
                  {consumables.map(item => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={uiStyles.bagItem} 
                      onPress={() => handleAction({ type: 'USE_ITEM', itemId: item.id, hpHeal: item.stats?.hp, manaHeal: item.stats?.mana })}
                    >
                      <Text style={uiStyles.bagItemIcon}>{item.icon}</Text>
                      <Text style={uiStyles.bagItemName}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617', paddingTop: Platform.OS === 'ios' ? 48 : 28 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  vol: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff10', padding: 6, borderRadius: 10, gap: 6 },
  volT: { color: '#ffffff60', fontSize: 10, width: 26, textAlign: 'center' },
  turn: { backgroundColor: '#4f46e520', borderWidth: 1, borderColor: '#6366f160', paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
  turnT: { color: '#818cf8', fontWeight: '900', fontSize: 10 },
  exit: { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef444450', paddingHorizontal: 10, borderRadius: 8, justifyContent: 'center' },
  exitT: { color: '#f87171', fontWeight: '700', fontSize: 10 },
  box: { marginHorizontal: 12, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '900' },
  badge: { borderWidth: 1, paddingHorizontal: 6, borderRadius: 6 },
  badT: { fontSize: 9, fontWeight: '800' },
  center: { alignItems: 'center', marginTop: 10 },
  pName: { color: '#fff', fontSize: 13, fontWeight: '900', marginBottom: 4 },
  log: { marginHorizontal: 12, backgroundColor: '#000', borderRadius: 10, padding: 8, marginBottom: 10, height: 60, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  logT: { color: '#10b981', fontSize: 11, marginBottom: 2 },
  actions: { paddingHorizontal: 12, gap: 8 },
  aRow: { flexDirection: 'row', gap: 8 },
  wait: { height: 60, justifyContent: 'center', alignItems: 'center' },
  waitT: { color: '#ffffff40', fontWeight: '900', letterSpacing: 1 },

  // Nuevos estilos Premium
  telegraphBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    marginBottom: 10,
  },
  telegraphT: { color: '#ef4444', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  atbTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  atbFill:  { height: '100%', borderRadius: 2 },

  comboRow: { flexDirection: 'row', gap: 4 },
  comboDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  comboDotActive: { backgroundColor: '#FFD700', borderColor: '#DAA520' },
});

const barStyles = StyleSheet.create({
  wrapper: { marginBottom: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  label: { fontSize: 10, fontWeight: '800' },
  value: { fontSize: 9, color: '#ffffff60' },
  bg: { height: 6, backgroundColor: '#000', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, gap: 2 },
  emoji: { fontSize: 10 },
  label: { fontSize: 9, fontWeight: '800' },
});

const actionBtnStyles = StyleSheet.create({
  btn: { borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center', minHeight: 60 },
  disabled: { opacity: 0.3 },
  label: { fontWeight: '900', fontSize: 12 },
  sub: { fontSize: 8, color: '#ffffff50', marginTop: 2 },
  durability: { width: '80%', height: 2, backgroundColor: '#ffffff10', marginTop: 4 },
  fill: { height: '100%', backgroundColor: '#22c55e' },
});

const endStyles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
  resBox: {
    width: SCREEN_W * 0.85,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#334155',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15,
  },
  resTitle: { color: '#fbbf24', fontSize: 24, fontWeight: '900', marginBottom: 20, letterSpacing: 2 },
  chestRow: { marginBottom: 20 },
  chestImg: { width: 80, height: 80 },
  xpRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#ffffff08', padding: 12, borderRadius: 12, marginBottom: 15 },
  xpLabel: { color: '#ffffff60', fontWeight: '800', fontSize: 12 },
  xpVal: { color: '#22c55e', fontWeight: '900', fontSize: 16 },
  lootHexGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, width: '100%', marginBottom: 20 },
  lootItem: { alignItems: 'center', width: 60 },
  lootIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#ffffff08', borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  lootImg: { width: 34, height: 34 },
  lootName: { color: '#ffffff80', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  continueBtn: { backgroundColor: '#4f46e5', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnTxt: { color: '#fff', fontWeight: '900', fontSize: 13 },
  kanji: { fontSize: 80, fontWeight: '900', color: '#fbbf24' },
  title: { fontSize: 30, color: '#fff', fontWeight: '900', marginBottom: 20 },
  btn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  fullWarning: { backgroundColor: '#7f1d1d', padding: 8, borderRadius: 8, marginBottom: 15, width: '100%', alignItems: 'center' },
  fullWarningText: { color: '#f87171', fontSize: 10, fontWeight: '900' },
});

const lootStyles = StyleSheet.create({
  container: { position: 'absolute', left: 0, top: 0, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  img: { width: 30, height: 30 },
  icon: { fontSize: 26, textShadowColor: '#000', textShadowRadius: 2 },
});

const uiStyles = StyleSheet.create({
  cardHud: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  cardChip: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ffffff10', borderWidth: 1, borderColor: '#ffffff20', justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 16 },
  bagOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 20 },
  bagBox: { width: '100%', backgroundColor: '#1e293b', borderRadius: 20, padding: 16, maxHeight: '70%', borderWidth: 1, borderColor: '#334155' },
  bagHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  bagTitle: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  bagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bagItem: { width: '30%', backgroundColor: '#0f172a', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  bagItemIcon: { fontSize: 24, marginBottom: 4 },
  bagItemName: { color: '#ffffff80', fontSize: 10, textAlign: 'center' },
  emptyBag: { color: '#ffffff40', textAlign: 'center', marginTop: 20 },
});
