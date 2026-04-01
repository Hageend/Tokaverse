// app/(tabs)/quests.tsx
// TokaVerse RPG — Quests + Combat JRPG Screen
// Diseño: JRPG Japonés Dark Mode · Habitica-style Habits · Turn-based Combat

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Image, Platform,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CombatScreen }    from '../components/CombatScreen';
import { BossEngine }      from '../../engine/BossEngine';
import { CLASS_FIGHTERS }  from '../../data/classSkills';
import { Boss, Fighter } from '../../types/combat';

// ─── Clases JRPG ─────────────────────────────────────────────────────────
const JRPG_CLASSES = [
  { id: 'mage',    name: 'Mahōtsukai', subtitle: '(Mago)',      stat: 'Sabiduría',   bonus: '+15% XP en ahorro',              sprite: CLASS_FIGHTERS.mage.sprite    },
  { id: 'warrior', name: 'Samurai',    subtitle: '(Guerrero)',   stat: 'Fuerza',      bonus: '+25% Resistencia a daño',         sprite: CLASS_FIGHTERS.warrior.sprite },
  { id: 'rogue',   name: 'Shinobi',    subtitle: '(Ninja)',      stat: 'Agilidad',    bonus: '+20% Recompensas Cashback',       sprite: CLASS_FIGHTERS.rogue.sprite   },
  { id: 'archer',  name: 'Yushu',      subtitle: '(Arquero)',    stat: 'Destreza',    bonus: 'x2 recompensa metas largas',      sprite: CLASS_FIGHTERS.archer.sprite  },
] as const;

type ClassId = typeof JRPG_CLASSES[number]['id'];  // 'mage' | 'warrior' | 'rogue' | 'archer'


// ─── Datos de Hábitos / Dailies ────────────────────────────────────────────
const HABITS = [
  { id: 'h1', title: '💸 Revisar saldo Toka',      type: 'positive' as const, xp: 15 },
  { id: 'h2', title: '🏦 Depositar al ahorro',      type: 'positive' as const, xp: 25 },
  { id: 'h3', title: '🎰 Gasto en apuestas',         type: 'negative' as const, hpPenalty: 25 },
];

const DAILIES = [
  { id: 'd1', title: '🔔 Leer notificación Toka',   completed: false, xp: 50,  hpPenalty: 15 },
  { id: 'd2', title: '📊 Respetar presupuesto hoy', completed: false, xp: 80,  hpPenalty: 30 },
  { id: 'd3', title: '🏧 No crédito extra hoy',      completed: false, xp: 100, hpPenalty: 40 },
];

// ─── Jefes disponibles (demo sin wallet real) ──────────────────────────────
const DEMO_BOSSES = [
  { label: '🃏 Tarjeta Maldita',    type: 'credit_card' as const, amount: 5000, daysOverdue: 45, interestRate: 36 },
  { label: '⚡ Factura Pendiente',   type: 'service'     as const, amount: 1500, daysOverdue: 10 },
  { label: '💀 Préstamo Devorador', type: 'loan'        as const, amount: 15000, daysOverdue: 70, interestRate: 24 },
  { label: '🌀 Sobregiro Eterno',   type: 'overdraft'   as const, amount: 800,  daysOverdue: 5  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function QuestsScreen() {
  const [classIndex, setClassIndex]     = useState(0);
  const [level, setLevel]               = useState(12);
  const [xp, setXp]                     = useState(6450);
  const [xpMax]                         = useState(10000);
  const [hp, setHp]                     = useState(85);
  const [hpMax]                         = useState(100);
  const [mana]                          = useState(25);
  const [manaMax]                       = useState(50);
  const [multiplier]                    = useState(1.5);
  const [defenseStreak]                 = useState(4);

  const [activeTab, setActiveTab]       = useState<'HABITS' | 'DAILIES' | 'PARTY'>('HABITS');
  const [showStatusModal, setShowStatus] = useState(false);
  const [showBossSelect, setShowBossSelect] = useState(false);
  const [inCombat, setInCombat]         = useState(false);
  const [activeBoss, setActiveBoss]     = useState<Boss | null>(null);
  const [activeFighter, setActiveFighter] = useState<Fighter | null>(null);

  const [habits, setHabits]             = useState(HABITS);
  const [dailies, setDailies]           = useState(DAILIES);
  const [isTakingDamage, setDamage]     = useState(false);
  const [isAttacking, setAttacking]     = useState(false);

  const currentClass = JRPG_CLASSES[classIndex];

  // ── RPG helpers ──────────────────────────────────────────────────────────
  const gainXp = (amount: number) => {
    setAttacking(true);
    const gained = Math.floor(amount * multiplier);
    const newXp  = xp + gained;
    if (newXp >= xpMax) {
      Alert.alert('レベルアップ！', `¡Nivel ${level + 1} alcanzado!`);
      setLevel(l => l + 1);
      setXp(0);
    } else {
      setXp(newXp);
    }
    setTimeout(() => setAttacking(false), 500);
  };

  const takeDamage = (amount: number) => {
    setDamage(true);
    const newHp = hp - amount;
    if (newHp <= 0) {
      Alert.alert('ゲームオーバー (¡Caíste!)', 'Perdiste un nivel por descuido financiero.');
      setHp(hpMax);
      setLevel(l => Math.max(1, l - 1));
    } else {
      setHp(newHp);
    }
    setTimeout(() => setDamage(false), 500);
  };

  // ── Iniciar combate ──────────────────────────────────────────────────────
  const startCombat = (bossConfig: typeof DEMO_BOSSES[number]) => {
    const boss    = BossEngine.generateFromDebt({ id: `boss_${bossConfig.type}`, ...bossConfig });
    const fighter = CLASS_FIGHTERS[currentClass.id as ClassId];
    setActiveBoss(boss);
    setActiveFighter({ ...fighter, name: currentClass.name });
    setShowBossSelect(false);
    setInCombat(true);
  };

  const handleVictory = (boss: Boss) => {
    gainXp(500);
    Alert.alert('🏆 ¡Victoria!', `Derrotaste a ${boss.name}\n+500 XP · Loot Box desbloqueada`);
  };

  const handleDefeat = () => {
    takeDamage(30);
  };

  // ─── COMBAT MODE — cubre toda la pantalla ──────────────────────────────
  if (inCombat && activeBoss && activeFighter) {
    return (
      <CombatScreen
        player={activeFighter}
        boss={activeBoss}
        onVictory={handleVictory}
        onDefeat={handleDefeat}
        onExit={() => setInCombat(false)}
      />
    );
  }

  // ─── MAIN QUESTS UI ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ━━ MODAL BOSS SELECT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Modal visible={showBossSelect} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHdr}>
              <Text style={styles.modalTitle}>⚔️ 挑戦 — Seleccionar Jefe</Text>
              <TouchableOpacity onPress={() => setShowBossSelect(false)}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Elige la deuda enemiga que quieres confrontar hoy:</Text>
            <View style={{ gap: 10 }}>
              {DEMO_BOSSES.map((b, i) => (
                <TouchableOpacity key={i} style={styles.bossPickCard} onPress={() => startCombat(b)}>
                  <Text style={styles.bossPickName}>{b.label}</Text>
                  <Text style={styles.bossPickSub}>
                    ${b.amount.toLocaleString('es-MX')} MXN · {b.daysOverdue} días de atraso
                  </Text>
                  <Text style={styles.bossPickHp}>HP del jefe: {Math.min(Math.floor(b.amount / 10) + b.daysOverdue * 5, 9999)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ━━ MODAL STATUS / PERSONAJE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Modal visible={showStatusModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHdr}>
              <Text style={styles.modalTitle}>ステータス (STATUS)</Text>
              <TouchableOpacity onPress={() => setShowStatus(false)}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Selecciona tu Camino Financiero:</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
              {JRPG_CLASSES.map((cls, i) => {
                const selected = classIndex === i;
                return (
                  <TouchableOpacity
                    key={cls.id}
                    style={[styles.classCard, selected && styles.classCardActive]}
                    onPress={() => setClassIndex(i)}
                  >
                    {selected && (
                      <View style={styles.activeTag}>
                        <Text style={styles.activeTagTxt}>ACTIVO</Text>
                      </View>
                    )}
                    <Image
                      source={{ uri: cls.sprite }}
                      style={[styles.classImg, Platform.OS === 'web' && { imageRendering: 'pixelated' } as any]}
                      resizeMode="contain"
                    />
                    <Text style={styles.className}>{cls.name}</Text>
                    <Text style={styles.classSubtitle}>{cls.subtitle}</Text>
                    <Text style={styles.classStat}>Stat: {cls.stat}</Text>
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusText}>{cls.bonus}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              {[
                { lbl: 'HP',    val: `${hp}/${hpMax}` },
                { lbl: 'MP',    val: `${mana}/${manaMax}` },
                { lbl: 'NIV',   val: `${level}` },
                { lbl: 'XP',    val: `${xp}` },
              ].map(s => (
                <View key={s.lbl} style={styles.statBox}>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                  <Text style={styles.statVal}>{s.val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ━━ CONTENIDO PRINCIPAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* — HUD RPG ——————————————————————————————————————————————— */}
        <View style={styles.hud}>
          <View style={styles.hudHdr}>
            <View>
              <Text style={styles.hudName}>Lv.{level} {currentClass.name}</Text>
              <Text style={styles.hudMul}>🔥 Renkei: x{multiplier}</Text>
            </View>
            <View style={{ gap: 6 }}>
              <TouchableOpacity style={styles.statusBtn} onPress={() => setShowStatus(true)}>
                <Ionicons name="person-circle" size={14} color="#FFF" />
                <Text style={styles.statusBtnTxt}> ステータス</Text>
              </TouchableOpacity>
              <View style={styles.defenseBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.tertiary} />
                <Text style={styles.defenseTxt}> {defenseStreak}d</Text>
              </View>
            </View>
          </View>

          <View style={styles.avatarRow}>
            <CharacterAvatar
              spriteUrl={currentClass.sprite}
              isTakingDamage={isTakingDamage}
              isAttacking={isAttacking}
            />

            <View style={styles.barsCol}>
              {[
                { label: 'HP', cur: hp,   max: hpMax,   color: '#EF4444' },
                { label: 'MP', cur: mana, max: manaMax, color: '#3B82F6' },
                { label: 'XP', cur: xp,   max: xpMax,   color: '#F59E0B' },
              ].map(b => (
                <View key={b.label} style={styles.barWrap}>
                  <View style={styles.barHdr}>
                    <Text style={[styles.barLbl, { color: b.color }]}>{b.label}</Text>
                    <Text style={styles.barVal}>{b.cur}/{b.max}</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${Math.min(100, (b.cur / b.max) * 100)}%` as any, backgroundColor: b.color }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* — BOTÓN COMBATE ─────────────────────────────────────────── */}
        <TouchableOpacity style={styles.combatButton} onPress={() => setShowBossSelect(true)}>
          <Text style={styles.combatButtonIcon}>⚔️</Text>
          <View>
            <Text style={styles.combatButtonTxt}>Entrar en Combate</Text>
            <Text style={styles.combatButtonSub}>Derrota tus deudas · Sistema por Turnos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* — TABS JRPG ─────────────────────────────────────────────── */}
        <View style={styles.tabs}>
          {[
            { key: 'HABITS',  label: '習慣 (Hábitos)' },
            { key: 'DAILIES', label: '日課 (Dailies)'  },
            { key: 'PARTY',   label: '仲間 (Party)'   },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key as any)}
            >
              <Text style={[styles.tabTxt, activeTab === t.key && styles.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* — LISTA ─────────────────────────────────────────────────── */}
        <View style={styles.list}>

          {activeTab === 'HABITS' && habits.map((h, i) => (
            <Animated.View entering={FadeInUp.delay(i * 80)} key={h.id} style={styles.card}>
              <View style={[styles.cardAccent, { backgroundColor: h.type === 'positive' ? '#10B981' : '#EF4444' }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{h.title}</Text>
                <Text style={styles.cardSub}>
                  {h.type === 'positive' ? `EXP: +${h.xp}` : `DMG: -${h.hpPenalty} HP`}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cardBtn, { backgroundColor: h.type === 'positive' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}
                onPress={() => h.type === 'positive' ? gainXp(h.xp) : takeDamage(h.hpPenalty!)}
              >
                <Ionicons name={h.type === 'positive' ? 'add' : 'remove'} size={22} color={h.type === 'positive' ? '#10B981' : '#EF4444'} />
              </TouchableOpacity>
            </Animated.View>
          ))}

          {activeTab === 'DAILIES' && dailies.map((d, i) => (
            <Animated.View entering={FadeInUp.delay(i * 80)} key={d.id} style={[styles.card, d.completed && styles.cardDone]}>
              <View style={[styles.cardAccent, { backgroundColor: '#F59E0B' }]} />
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, d.completed && { textDecorationLine: 'line-through', opacity: 0.6 }]}>{d.title}</Text>
                <Text style={styles.cardSub}>+{d.xp} XP</Text>
              </View>
              {!d.completed
                ? (
                  <TouchableOpacity style={styles.checkBtnYellow} onPress={() => {
                    setDailies(ds => ds.map(x => x.id === d.id ? { ...x, completed: true } : x));
                    gainXp(d.xp);
                  }}>
                    <Ionicons name="checkmark" size={18} color="#000" />
                  </TouchableOpacity>
                )
                : <Ionicons name="checkmark-circle" size={26} color="#10B981" style={{ marginRight: 14 }} />
              }
            </Animated.View>
          ))}

          {activeTab === 'PARTY' && (
            <Animated.View entering={FadeInUp}>
              <View style={styles.partyHeader}>
                <Text style={styles.partyTitle}>Guild: 赤い竜 (Dragón Rojo)</Text>
                <Text style={styles.partySub}>Si alguien falla, todos pierden HP. ¡Cooperen!</Text>
              </View>

              {[
                { name: 'Yamato',  cls: 'Samurai',    hp: 180, hpMax: 200 },
                { name: 'Sakura', cls: 'Mahōtsukai', hp: 18,  hpMax: 80  },
                { name: 'Riku',   cls: 'Shinobi',    hp: 130, hpMax: 140 },
              ].map((m, i) => {
                const isLow = m.hp < m.hpMax * 0.3;
                return (
                  <View key={i} style={styles.partyCard}>
                    <Ionicons name="person" size={18} color={isLow ? '#EF4444' : Colors.tertiary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.partyMemberName}>{m.name} <Text style={{ color: Colors.textMuted, fontSize: 11 }}>({m.cls})</Text></Text>
                        <Text style={[styles.partyHp, isLow && { color: '#EF4444' }]}>{m.hp}/{m.hpMax}</Text>
                      </View>
                      <View style={styles.partyBarBg}>
                        <View style={[styles.partyBarFill, { width: `${(m.hp / m.hpMax) * 100}%` as any, backgroundColor: isLow ? '#EF4444' : '#10B981' }]} />
                      </View>
                    </View>
                    {isLow && (
                      <TouchableOpacity style={styles.healBtn}>
                        <Text style={styles.healBtnTxt}>HEAL</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0F0F13' },
  scrollContent: { paddingTop: 40, paddingBottom: 50 },

  // HUD
  hud:          { marginHorizontal: 14, backgroundColor: '#1E1E24', borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.07)', borderLeftWidth: 4, borderLeftColor: Colors.primary, padding: 14, marginBottom: 14 },
  hudHdr:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  hudName:      { color: '#FFF', fontSize: 18, fontWeight: '900' },
  hudMul:       { color: '#F59E0B', fontSize: 12, fontWeight: '800', marginTop: 2 },
  statusBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statusBtnTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  defenseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,212,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)' },
  defenseTxt:   { color: Colors.tertiary, fontSize: 11, fontWeight: '800' },
  avatarRow:    { flexDirection: 'row', alignItems: 'center' },
  barsCol:      { flex: 1, marginLeft: 14, gap: 8 },
  barWrap:      {},
  barHdr:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  barLbl:       { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  barVal:       { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  barBg:        { height: 7, backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  barFill:      { height: '100%' },

  // Combat Button
  combatButton:    { marginHorizontal: 14, marginBottom: 16, backgroundColor: '#7F1D1D', borderWidth: 1, borderColor: '#EF4444', borderRadius: 10, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  combatButtonIcon: { fontSize: 28 },
  combatButtonTxt:  { color: '#FFF', fontWeight: '900', fontSize: 16 },
  combatButtonSub:  { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  // Tabs
  tabs:         { flexDirection: 'row', marginHorizontal: 14, marginBottom: 14, gap: 6 },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive:    { backgroundColor: 'rgba(77,97,252,0.1)', borderBottomColor: Colors.primary },
  tabTxt:       { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  tabTxtActive: { color: '#FFF', fontWeight: '900' },

  // Cards
  list:         { marginHorizontal: 14, gap: 10 },
  card:         { backgroundColor: '#1E1E24', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' },
  cardDone:     { opacity: 0.5 },
  cardAccent:   { width: 5, alignSelf: 'stretch' },
  cardBody:     { flex: 1, padding: 14 },
  cardTitle:    { color: '#FFF', fontWeight: '700', fontSize: 14, marginBottom: 3 },
  cardSub:      { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  cardBtn:      { width: 42, height: 42, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkBtnYellow: { width: 30, height: 30, backgroundColor: '#F59E0B', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 14 },

  // Party
  partyHeader:     { backgroundColor: '#1E1E24', padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', marginBottom: 10 },
  partyTitle:      { color: '#FFF', fontWeight: '900', fontSize: 16 },
  partySub:        { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  partyCard:       { backgroundColor: '#1E1E24', flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', marginBottom: 8 },
  partyMemberName: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  partyHp:         { color: Colors.textMuted, fontWeight: '700', fontSize: 12 },
  partyBarBg:      { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  partyBarFill:    { height: '100%', borderRadius: 3 },
  healBtn:         { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginLeft: 10 },
  healBtnTxt:      { color: '#FFF', fontWeight: 'bold', fontSize: 11 },

  // Modals
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', paddingHorizontal: 14 },
  modalBox:        { backgroundColor: '#1E1E24', borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, padding: 20, maxHeight: '85%' },
  modalHdr:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle:      { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  modalSub:        { color: Colors.textMuted, fontSize: 13, marginBottom: 16 },

  classCard:       { width: 140, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, alignItems: 'center', position: 'relative' },
  classCardActive: { borderColor: Colors.tertiary, backgroundColor: 'rgba(0,212,255,0.08)' },
  classImg:        { width: 80, height: 80, marginBottom: 8 },
  className:       { color: '#FFF', fontWeight: '900', fontSize: 14, textAlign: 'center' },
  classSubtitle:   { color: Colors.textMuted, fontSize: 11, marginBottom: 4 },
  classStat:       { color: Colors.textMuted, fontSize: 11 },
  bonusBadge:      { marginTop: 8, backgroundColor: 'rgba(249,115,22,0.1)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, width: '100%', alignItems: 'center' },
  bonusText:       { color: '#F97316', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  activeTag:       { position: 'absolute', top: -8, backgroundColor: Colors.tertiary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, zIndex: 1 },
  activeTagTxt:    { color: '#000', fontSize: 9, fontWeight: 'bold' },

  divider:         { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox:         { width: '47%', backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLbl:         { color: Colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  statVal:         { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 4 },

  // Boss select
  bossPickCard:    { backgroundColor: 'rgba(127,29,29,0.2)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 8, padding: 14 },
  bossPickName:    { color: '#FFF', fontWeight: '900', fontSize: 16 },
  bossPickSub:     { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  bossPickHp:      { color: '#EF4444', fontSize: 11, fontWeight: '700', marginTop: 6 },
});
