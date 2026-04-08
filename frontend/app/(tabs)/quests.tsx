// app/(tabs)/quests.tsx
// TokaVerse RPG — Pantalla de Misiones + Combate JRPG
// Sistema Híbrido: Elementos · Fusiones · Fases · Estados Alterados

import React, { useState, useEffect, useRef } from 'react';
import { InventoryModal } from '../../components/quest/InventoryModal';
import { HeroCarousel3D } from '../../components/quest/HeroCarousel3D';
import { CharacterStatusModal } from '../../components/quest/CharacterStatusModal';
import { useInventoryStore, BOSS_DROPS, selectRandomDrop, BossDropItem, RARITY_COLORS } from '../../store/useInventoryStore';
import { useCrossPlatformAudio } from '../../hooks/useCrossPlatformAudio';
import { AdventurerCodex } from '../../components/quest/AdventurerCodex';
import { usePlayerStore } from '../../store/usePlayerStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COIN_SPRITES } from '../../data/classSkills';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Platform, Dimensions, useWindowDimensions
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import Animated, { 
  FadeInUp, FadeIn, 
  useSharedValue, useAnimatedStyle, withSpring 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import UnifiedCombatScreen from '../../components/UnifiedCombatScreen';
import FusionPreCombat from '../../components/FusionPreCombat';
import { BossEngine } from '../../engine/BossEngine';
import { CLASS_FIGHTERS, CHAR_SPRITES } from '../../data/classSkills';
import type { ClassKey } from '../../data/classSkills';
import { Boss, Fighter } from '../../types/combat';
import { ELEMENT_INFO, BOSS_ELEMENTS, CLASS_ELEMENTS } from '../../types/elements';
import type { PlayerCard } from '../../types/fusion';
import { EnemyMapper } from '../../utils/EnemyMapper';
import { QUEST_ENEMIES } from '../../store/useCombatStore';
const AMBIENT_MUSIC = [
  require('../../assets/music/ambient/Beneath_the_Velvet_Canopy.mp3'),
  require('../../assets/music/ambient/Clock_With_A_Human_Face.mp3'),
  require('../../assets/music/ambient/Innocence_Is_The_Sharpest_Blade.mp3'),
  require('../../assets/music/ambient/The_Stranger_Inside.mp3'),
  require('../../assets/music/ambient/Toka_Skies.mp3'),
  require('../../assets/music/ambient/Where_the_Maps_End.mp3'),
];

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Clases JRPG ─────────────────────────────────────────────────────────
const JRPG_CLASSES = [
  { id: 'mage',     name: 'Mahōtsukai', subtitle: '(Mago)',      stat: 'Sabiduría',   bonus: '+15% XP en ahorro',           sprite: CHAR_SPRITES.mage    },
  { id: 'warrior',  name: 'Samurai',    subtitle: '(Guerrero)',   stat: 'Fuerza',      bonus: '+25% Resistencia a daño',      sprite: CHAR_SPRITES.warrior },
  { id: 'hacker',   name: 'Hacker',     subtitle: '(Ciber-Mago)', stat: 'Lógica',      bonus: '+15% Crit Rate',              sprite: CHAR_SPRITES.hacker  },
  { id: 'knight',   name: 'Caballero',  subtitle: '(Tanque)',     stat: 'Voluntad',    bonus: '+40% HP Máximo',               sprite: CHAR_SPRITES.knight  },
  { id: 'rogue',    name: 'Shinobi',    subtitle: '(Ninja)',      stat: 'Agilidad',    bonus: '+20% Recompensas Cashback',    sprite: CHAR_SPRITES.rogue   },
  { id: 'archer',   name: 'Yushu',      subtitle: '(Arquero)',    stat: 'Destreza',    bonus: 'x2 recompensa metas largas',   sprite: CHAR_SPRITES.archer  },
  { id: 'banker',   name: 'Shōnin',     subtitle: '(Mercader)',   stat: 'Riqueza',     bonus: '+30% XP en inversiones',       sprite: CHAR_SPRITES.banker  },
  { id: 'kitsune',  name: 'Kitsune',    subtitle: '(Espiritual)', stat: 'Misticismo',  bonus: 'Veneno + curación automática', sprite: CHAR_SPRITES.kitsune },
  { id: 'thief',    name: 'Gōtō',       subtitle: '(Ladrón)',     stat: 'Sigilo',      bonus: '+50% Drop Rate',               sprite: CHAR_SPRITES.thief   },
  { id: 'magedark', name: 'Ankoku',     subtitle: '(Mago Oscuro)',stat: 'Caos',        bonus: '+25% Daño Mágico',             sprite: CHAR_SPRITES.magedark},
  { id: 'elf',      name: 'Erufu',      subtitle: '(Explorador)', stat: 'Naturaleza',  bonus: '+15% Velocidad Base',          sprite: CHAR_SPRITES.elf },
  { id: 'maid',     name: 'Meido',      subtitle: '(Sirvienta)',  stat: 'Orden',       bonus: 'Cura +10 HP tras cada turno',  sprite: CHAR_SPRITES.maid },
  { id: 'mermaid',  name: 'Ningyo',     subtitle: '(Sirena)',     stat: 'Flujo',       bonus: '+25% Recarga Maná',            sprite: CHAR_SPRITES.mermaid },
  { id: 'witch',    name: 'Majo',       subtitle: '(Bruja)',      stat: 'Alquimia',    bonus: '+20% Daño de Estado',          sprite: CHAR_SPRITES.witch },
  { id: 'santa',    name: 'Kurisumasu', subtitle: '(San Nicolás)',stat: 'Regalo',      bonus: '+10% Loot Rate Extra',         sprite: CHAR_SPRITES.santa },
  { id: 'leona',    name: 'Reona',      subtitle: '(Guerrera)',   stat: 'Fuerza',      bonus: '+15% Crítico',                 sprite: CHAR_SPRITES.leona },
  { id: 'knigh_girl', name: 'Valquiria', subtitle: '(Paladín)',   stat: 'Luz',         bonus: '+30% HP Máximo',               sprite: CHAR_SPRITES.knigh_girl },
  { id: 'knigh_red',  name: 'Búfalo',    subtitle: '(Cab. Rojo)', stat: 'Fuego',       bonus: '+20% Daño Físico',             sprite: CHAR_SPRITES.knigh_red },
  { id: 'dog',      name: 'Inu',        subtitle: '(Perro)',      stat: 'Lealtad',     bonus: '+15% Defensa Base',            sprite: CHAR_SPRITES.dog },
  { id: 'cat',      name: 'Neko',       subtitle: '(Gato)',       stat: 'Suerte',      bonus: '+20% Evasión',                 sprite: CHAR_SPRITES.cat },
  { id: 'fox',      name: 'Kitsune-bi', subtitle: '(Zorro)',      stat: 'Espíritu',    bonus: '+15% Regeneración Maná',       sprite: CHAR_SPRITES.fox },
] as const;

type ClassId = typeof JRPG_CLASSES[number]['id'];

// ─── Hábitos y Dailies ────────────────────────────────────────────────────
const HABITS = [
  { id: 'h1', title: 'Compra de Despensa Toka',     icon: '🛒', pixelIcon: 'item_chest', type: 'positive' as const, xp: 20  },
  { id: 'h2', title: 'Carga Eficiente de Gasolina', icon: '⛽', type: 'positive' as const, xp: 25  },
  { id: 'h3', title: 'Comprobación a Tiempo',        icon: '📋', type: 'positive' as const, xp: 30  },
  { id: 'h4', title: 'Gasto Impulsivo Extra',        icon: '🎰', type: 'negative' as const, hpPenalty: 25 },
];

const DAILIES = [
  { id: 'd1', title: 'Subir comprobante Connect',  icon: '📸', completed: false, xp: 60,  hpPenalty: 20 },
  { id: 'd2', title: 'Registrar odómetro diario',  icon: '📊', completed: false, xp: 70,  hpPenalty: 25 },
  { id: 'd3', title: 'Completar "Quest Mercadito"', icon: '🛒', pixelIcon: 'item_chest', completed: false, xp: 100, hpPenalty: 40 },
];

// ─── Jefes disponibles ───────────────────────────────────────────────────
const DEMO_BOSSES = [
  { label: 'El Carrito Vacío',        icon: '🛒', pixelIcon: 'item_chest', sprite: require('../../assets/images/bosses/boss_bill.png'), type: 'toka_despensa' as const, amount: 2500,  daysOverdue: 0,  difficulty: 'Fácil',    diffColor: '#22C55E' },
  { label: 'El Tanque Vacío',         icon: '⛽', sprite: require('../../assets/images/bosses/rpg_boss_documents.png'), type: 'toka_fuel'     as const, amount: 1500,  daysOverdue: 5,  difficulty: 'Normal',   diffColor: '#F59E0B' },
  { label: 'El Gasto Sin Comprobar',  icon: '📑', sprite: require('../../assets/images/bosses/rpg_boss_documents.png'), type: 'toka_connect'  as const, amount: 8000,  daysOverdue: 15, difficulty: 'Difícil',  diffColor: '#EF4444', interestRate: 10 },
  { label: 'El Abismo de Deuda',      icon: '🕳️', pixelIcon: 'item_card', sprite: require('../../assets/images/bosses/boss_abyss.png'), type: 'abyss' as const,         amount: 15000, daysOverdue: 30, difficulty: '🌋 Épico', diffColor: '#9333ea' },
  { label: 'Golem de Facturas',       icon: '🧱', sprite: require('../../assets/images/bosses/boss_golem.png'), type: 'golem' as const,         amount: 12000, daysOverdue: 20, difficulty: 'Difícil',  diffColor: '#475569' },
  { label: 'Lluvia de Tickets',       icon: '🌧️', sprite: require('../../assets/images/bosses/boss_tickets.png'), type: 'tickets' as const,       amount: 3000,  daysOverdue: 10, difficulty: 'Normal',   diffColor: '#2563eb' },
  { label: 'Monstruo de Efectivo',    icon: '💵', sprite: require('../../assets/images/bosses/boss_cash.png'), type: 'cash' as const,          amount: 25000, daysOverdue: 60, difficulty: '👹 Infernal', diffColor: '#16a34a' },
  { label: 'Tarjeta Maldita',         icon: '🃏', pixelIcon: 'item_card', sprite: require('../../assets/images/bosses/boss_credit_card.png'), type: 'credit_card'   as const, amount: 5000,  daysOverdue: 45, difficulty: '🌋 Épico', diffColor: '#FF6B35', interestRate: 36 },
];

// ─── Mapeo de Assets Pixel Art ────────────────────────────────────────────────
const PIXEL_ART_ASSETS: Record<string, any> = {
  item_sword:  require('../../assets/images/items/item_sword.png'),
  item_shield: require('../../assets/images/items/item_shield.png'),
  item_potion: require('../../assets/images/items/item_potion.png'),
  item_card:   require('../../assets/images/items/item_card.png'),
  item_chest:  require('../../assets/images/items/item_chest.png'),
};

// ─── Estilos (Hoisted for Web) ────────────────────────────────────────────────
const S = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#020617' },
  scroll:     { paddingHorizontal: 14, paddingBottom: 60 },
  mainLayout: { flex: 1, flexDirection: 'column' },
  mainLayoutDesktop: { flexDirection: 'row', gap: 20, paddingHorizontal: 20 },
  sidebar: { width: 320, paddingTop: 20, gap: 15 },
  avatarSidebarRow: { width: '100%', alignItems: 'center', marginVertical: 30 },
  scrollDesktop: { paddingHorizontal: 0 },
  contentGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 20, paddingTop: 20 },
  gridSection: { width: '48%', gap: 15 },
  gridSectionFull: { width: '100%', gap: 15 },
  habitsGridDesktop: { gap: 12 },
  habitCardDesktop: { marginBottom: 0 },
  bossPreviewGridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  bossMiniCardDesktop: { width: '31%', marginBottom: 0 },

  // Base styles (continuación)
  musicBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 14, marginTop: 6, marginBottom: 4,
    backgroundColor: 'rgba(0,212,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.12)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  musicLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  musicText:   { flex: 1 },
  musicTrack:  { color: '#FFF', fontSize: 12, fontWeight: '700' },
  musicStatus: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 },
  inventoryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
  },
  inventoryBtnTxt: { color: '#fbbf24', fontSize: 10, fontWeight: '800' },
  volBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  volBtnTxt: { color: Colors.tertiary, fontSize: 11, fontWeight: '800', minWidth: 28 },
  volPanel: {
    marginHorizontal: 14, marginBottom: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
    borderRadius: 12, padding: 14,
  },
  volPanelLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10, textAlign: 'center' },
  volRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  volArrow: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  volTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'visible', position: 'relative' },
  volFill:  { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.tertiary, borderRadius: 3 },
  volMark:  { position: 'absolute', width: 2, height: 10, top: -2, borderRadius: 1, marginLeft: -1 },
  volPresets: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  volPreset:  { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  volPresetActive: { borderColor: Colors.tertiary, backgroundColor: 'rgba(0,212,255,0.12)' },
  volPresetTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', paddingHorizontal: 14 },
  modalBox:  { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary + '88', borderRadius: 14, padding: 20, maxHeight: '90%' },
  modalHdr:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle:{ color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.4 },
  modalSub:  { color: Colors.textMuted, fontSize: 12, marginBottom: 14 },
  bossCard:    { backgroundColor: 'rgba(127,29,29,0.14)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 12, padding: 14 },
  bossCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  bossCardIcon:{ fontSize: 22 },
  bossCardName:{ color: '#FFF', fontWeight: '900', fontSize: 14 },
  bossCardSub: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  bossCardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  bossHpTxt:   { color: '#EF4444', fontSize: 11, fontWeight: '700' },
  diffBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  diffTxt:     { fontSize: 10, fontWeight: '900' },
  elemPill:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  elemPillTxt: { fontSize: 9, fontWeight: '700' },
  
  // HUD y Misiones
  hud: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 15, position: 'relative', overflow: 'hidden' },
  hudAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: Colors.primary },
  hudHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  hudName: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  hudSub: { color: Colors.textSecondary, fontSize: 11 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(77,97,252,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(77,97,252,0.2)' },
  statusBtnTxt: { color: Colors.primary, fontSize: 10, fontWeight: '800' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  streakTxt: { color: Colors.tertiary, fontSize: 10, fontWeight: '800' },
  mulRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  mulTxt: { color: '#F59E0B', fontSize: 11, fontWeight: '800' },
  elemTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  elemTagTxt: { fontSize: 9, fontWeight: '800' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  barsCol: { flex: 1, gap: 10 },
  barWrap: { gap: 4 },
  barHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLbl: { fontSize: 10, fontWeight: '900' },
  barVal: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  combatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 12, padding: 14, marginBottom: 20 },
  combatBtnGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.primary, opacity: 0.1, borderRadius: 12 },
  combatBtnTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  combatBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  sectionSub: { color: Colors.textSecondary, fontSize: 11 },
  habitsGrid: { gap: 10 },
  habitCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  habitIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center' },
  habitTitle: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  habitReward: { color: '#10B981', fontSize: 11, fontWeight: '800' },
  allBossesBtn: { padding: 4 },
  allBossesBtnTxt: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  bossPreviewGrid: { gap: 10 },
  bossMiniCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(239,68,68,0.05)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.1)' },
  bossMiniSprite: { width: 36, height: 36 },
  bossMiniName: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  miniBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  bossMiniAmt: { color: Colors.textSecondary, fontSize: 10, fontWeight: '700' },

  // ── Modales adicionales y Estado ──
  modalSectionTitle: { color: Colors.tertiary, fontSize: 12, fontWeight: '900', marginTop: 10, marginBottom: 4, letterSpacing: 1 },
  epicWarn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: 6, padding: 7, borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)' },
  epicWarnTxt: { color: '#FF6B35', fontSize: 10, fontWeight: '700', flex: 1 },
  
  classCard:      { width: 140, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, alignItems: 'center', position: 'relative' },
  classCardActive:{ borderColor: Colors.tertiary, backgroundColor: 'rgba(0,212,255,0.08)' },
  classCardLocked: { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.4)', opacity: 0.8 },
  lockBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  classImg:       { width: 80, height: 80, marginBottom: 8 },
  className:      { color: '#FFF', fontWeight: '900', fontSize: 14, textAlign: 'center' },
  classSubtitle:  { color: Colors.textMuted, fontSize: 11, marginBottom: 4 },
  classStat:      { color: Colors.textMuted, fontSize: 11 },
  bonusBadge:     { marginTop: 8, backgroundColor: 'rgba(249,115,22,0.1)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, width: '100%', alignItems: 'center' },
  bonusTxt:       { color: '#F97316', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  activeTag:      { position: 'absolute', top: -10, backgroundColor: Colors.tertiary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, zIndex: 1 },
  activeTagTxt:   { color: '#000', fontSize: 9, fontWeight: '900' },
  divider:        { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox:        { width: '47%', backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLbl:        { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statVal:        { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 4 },

  // ── Tabs y Listas ──
  tabs: { flexDirection: 'row', marginBottom: 12, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden', position: 'relative' },
  tabActive:     { backgroundColor: 'rgba(77,97,252,0.1)' },
  tabTxt:        { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  tabTxtActive:  { color: '#FFF', fontWeight: '900' },
  tabIndicator:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.primary, borderRadius: 2 },
  
  list:   { gap: 8 },
  card:   { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', flexDirection: 'column' },
  cardDone:  { opacity: 0.5 },
  cardAccent:{ height: 3 },
  cardBody:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardIcon:  { fontSize: 22 },
  cardTitle: { color: '#FFF', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  cardTitleDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  cardSub:   { fontSize: 11, fontWeight: '700' },
  cardActionBtn: { position: 'absolute', right: 12, top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1 },
  cardActionTxt: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  compactAction: { paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1 },
  circleBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  checkBtn: { position: 'absolute', right: 14, top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 8, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' },
  doneIcon: { position: 'absolute', right: 14, top: '50%', marginTop: -14 },

  // ── Party ──
  partyHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
  partyTitle: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  partySub:   { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  partyCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
  partyAvatar:  { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  partyNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  partyName:    { color: '#FFF', fontWeight: '900', fontSize: 14 },
  partyCls:     { color: Colors.textMuted, fontSize: 11 },
  partyHpTxt:   { color: Colors.textMuted, fontWeight: '700', fontSize: 12, marginLeft: 'auto' },
  partyBarBg:   { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  partyBarFill: { height: '100%', borderRadius: 3 },
  partyLowWarn: { color: '#EF4444', fontSize: 10, fontWeight: '700', marginTop: 4 },
  healBtn:      { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  healBtnTxt:   { color: '#FFF', fontWeight: '900', fontSize: 11 },
});

const USER_ID = 'user_123';
// ... (rest of the setup logic stays the same)
// ...

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const address = Constants.expoConfig?.hostUri?.split(':')[0];
  if (address && address !== 'localhost' && address !== '127.0.0.1') {
    return `http://${address}:3000`;
  }
  if (Platform.OS !== 'web') {
    return 'http://192.168.1.78:3000'; // IP de tu red Wi-Fi
  }
  return 'http://localhost:3000';
};
const API_URL = getApiUrl();
const XP_THRESHOLDS = [0, 2500, 10000, 35000, 100000];

// ─────────────────────────────────────────────────────────────────────────────
export default function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024 && Platform.OS === 'web';

  // ── Audio ──────────────────────────────────────────────────────────────
  const [volume, setVolume] = useState(0.7);
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const [trackName, setTrackName] = useState('Música Ambiente');

  // hook personalizado para música ambiental (Web + Móvil)
  const ambientSound = useCrossPlatformAudio(AMBIENT_MUSIC[Math.floor(Math.random() * AMBIENT_MUSIC.length)]);

  useEffect(() => {
    if (ambientSound.volume !== volume) {
      ambientSound.setVolume(volume);
    }
  }, [volume, ambientSound]);

  // Sincronizar volumen
  useEffect(() => {
    ambientSound.setVolume(volume);
  }, [volume]);

  // ── Backend / Socket ───────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState<{ id: string; xp: number; level: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/users/${USER_ID}/profile`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setUserProfile(data);
        }
      } catch (e) { console.error('Profile Fetch Error:', e); }
    };
    fetchProfile();

    const socket = io(API_URL);
    socketRef.current = socket;
    socket.on('userUpdated', (updated: any) => {
      if (updated.id === USER_ID && isMounted) setUserProfile(updated);
    });
    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  // ── Estado del personaje ───────────────────────────────────────────────
  const { 
    starCoins, 
    unlockedClasses, 
    charClass: activeClassId,
    setCharClass: setPlayerCharClass 
  } = usePlayerStore();

  const currentClass = JRPG_CLASSES.find(c => c.id === activeClassId) || JRPG_CLASSES[0];

  const level       = userProfile?.level ?? 1;
  const xp          = userProfile?.xp    ?? 0;
  const xpMax       = XP_THRESHOLDS[level]     ?? 100000;
  const prevThresh  = XP_THRESHOLDS[level - 1] ?? 0;

  const [hp,       setHp]     = useState(100);
  const [hpMax]               = useState(100);
  const [mana]                = useState(50);
  const [manaMax]             = useState(50);
  const [multiplier]          = useState(1.5);
  const [defenseStreak]       = useState(4);

  const [activeTab, setActiveTab]       = useState<'HABITOS' | 'DAILIES' | 'GRUPO'>('HABITOS');
  const [showStatusModal, setShowStatus] = useState(false);
  const [showBossSelect, setShowBossSelect] = useState(false);
  const [inCombat, setInCombat]          = useState(false);
  const [inPreCombat, setInPreCombat]    = useState(false);
  const [activeBoss, setActiveBoss]      = useState<Boss | null>(null);
  const [activeFighter, setActiveFighter] = useState<Fighter | null>(null);
  const [selectedCards, setSelectedCards] = useState<PlayerCard[]>([]);

  const [habits,  setHabits]  = useState(HABITS);
  const [dailies, setDailies] = useState(DAILIES);
  const [isTakingDamage, setDamage]    = useState(false);
  const [isAttacking,    setAttacking] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showShop, setShowShop]           = useState(false);

  const { addItem: addInventoryItem, items: inventoryItems, maxSlots } = useInventoryStore();

  // Filtrar solo las clases que el usuario ha desbloqueado
  const availableClasses = JRPG_CLASSES.filter(cls => unlockedClasses.includes(cls.id));


  // ─── ANIMACIONES 60FPS (Barras) ─────────────────────────────────────────
  const hpProgress   = useSharedValue(hp / hpMax);
  const manaProgress = useSharedValue(mana / manaMax);
  const xpProgress   = useSharedValue(Math.max(0, (xp - prevThresh) / (xpMax - prevThresh || 1)));

  useEffect(() => { hpProgress.value = withSpring(hp / hpMax, { damping: 15 }); }, [hp, hpMax, hpProgress]);
  useEffect(() => { manaProgress.value = withSpring(mana / manaMax, { damping: 15 }); }, [mana, manaMax, manaProgress]);
  useEffect(() => { 
    xpProgress.value = withSpring(Math.max(0, (xp - prevThresh) / (xpMax - prevThresh || 1)), { damping: 15 }); 
  }, [xp, xpMax, prevThresh, xpProgress]);

  const hpBarStyle   = useAnimatedStyle(() => ({ width: `${hpProgress.value * 100}%` }));
  const manaBarStyle = useAnimatedStyle(() => ({ width: `${manaProgress.value * 100}%` }));
  const xpBarStyle   = useAnimatedStyle(() => ({ width: `${xpProgress.value * 100}%` }));

  // ── Helpers RPG ────────────────────────────────────────────────────────
  const gainXp = async (amount: number, source = 'Acción de Misión') => {
    setAttacking(true);
    const totalXp = Math.floor(amount * multiplier);
    try {
      await fetch(`${API_URL}/users/${USER_ID}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountXp: totalXp, source }),
      });
    } catch (e) { console.warn('XP Gain API Error:', e); }
    setTimeout(() => setAttacking(false), 500);
  };

  const takeDamage = async (amount: number) => {
    setDamage(true);
    const newHp = hp - amount;
    if (newHp <= 0) {
      Alert.alert('¡FIN DEL JUEGO! (Caíste)', 'Has perdido vitalidad y algo de experiencia por descuido financiero.');
      setHp(hpMax);
      try {
        await fetch(`${API_URL}/users/${USER_ID}/transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountXp: -500, source: 'Derrota / Descuido' }),
        });
      } catch (e) { console.warn('XP Damage Error:', e); }
    } else {
      setHp(newHp);
    }
    setTimeout(() => setDamage(false), 500);
  };

  const selectBoss = (bossConfig: any) => {
    let boss: Boss;
    if (bossConfig.id && bossConfig.emoji) {
      // Es un SimpleEnemy (Mob)
      boss = EnemyMapper.simpleToBoss(bossConfig);
    } else {
      // Es un bossConfig (Legendary Debt)
      boss = BossEngine.generateFromDebt({ id: `boss_${bossConfig.type}`, ...bossConfig });
    }
    const fighter = CLASS_FIGHTERS[currentClass.id as ClassKey];
    setActiveBoss(boss);
    setActiveFighter({ ...fighter, name: currentClass.name });
    setShowBossSelect(false);
    setInPreCombat(true);
  };

  const startCombat = (cards: PlayerCard[]) => {
    setSelectedCards(cards);
    setInPreCombat(false);
    setInCombat(true);
  };

  const handleVictory = (boss: Boss) => {
    // Ya no es necesario dar XP o Items aquí ni mostrar Alertas, 
    // todo se maneja dentro de UnifiedCombatScreen.
    console.log(`[Combat] Derrotaste a ${boss.name}. Limpiando estados.`);
  };

  const handleDefeat = () => { 
    // Penalización base por derrota en combate
    takeDamage(20); 
  };
  
  const handleUseItem = (itemId: string) => {
    const { consumeItem } = useInventoryStore.getState();
    const stats = consumeItem(itemId);
    if (!stats) return;

    if (stats.hp) {
      setHp(prev => Math.min(hpMax, prev + stats.hp!));
    }
    if (stats.mana) {
      // Nota: El mana no tiene estado local de setMana actualmente (solo mana constante)
      // Pero si quisiéramos que fuera dinámico, aquí lo actualizaríamos.
      console.log(`[Item] Restaurado ${stats.mana} MP`);
    }
    
    Alert.alert('✨ Objeto Usado', 'Has recuperado vitalidad.');
  };

  // ── Sincronizar audio con combate ───────────────────────────────────────
  useEffect(() => {
    if (inCombat) {
      ambientSound.pause();
    } else {
      ambientSound.play();
    }
  }, [inCombat]);

  // ─── Cálculos del elemento del personaje ──────────────────────────────
  const classElem     = (CLASS_ELEMENTS as any)[currentClass.id];
  const classElemInfo = classElem ? (ELEMENT_INFO as any)[classElem.primary] : null;


  if (inPreCombat && activeBoss) {
    return (
      <FusionPreCombat
        boss={activeBoss}
        onStart={startCombat}
        onCancel={() => setInPreCombat(false)}
      />
    );
  }

  if (inCombat && activeBoss && activeFighter) {
    // Cambia a 'arena' para probar el modo arena, o deja 'full' para el combate completo
    return (
      <UnifiedCombatScreen
        key={`combat_${activeBoss.id}`}
        player={activeFighter}
        opponent={activeBoss}
        equippedCards={selectedCards}
        onVictory={handleVictory}
        onDefeat={handleDefeat}
        onExit={() => setInCombat(false)}
        globalVolume={volume}
        heroSprite={currentClass.sprite}
      />
    );
  }

  return (
    <View style={[S.container, { paddingTop: Math.max(insets.top, 8) }]}>

      {/* ── Barra de música, volumen e inventario ──────────────────────── */}
      <View style={S.musicBar}>
        <View style={S.musicLeft}>
          <Ionicons name="musical-notes" size={14} color={Colors.tertiary} />
          <View style={S.musicText}>
            <Text style={S.musicTrack} numberOfLines={1}>{trackName || 'Música Ambiente'}</Text>
            <Text style={S.musicStatus}>🌅 Ambient · Reproduciendo</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {/* Botón de inventario */}
          <TouchableOpacity
            style={S.inventoryBtn}
            onPress={() => setShowInventory(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Abrir inventario"
            accessibilityRole="button"
          >
            <Image 
              source={require('../../assets/images/items/item_chest.png')} 
              style={{ width: 14, height: 14 }}
              contentFit="contain"
            />
            <Text style={S.inventoryBtnTxt}>{inventoryItems.length}/{maxSlots}</Text>
          </TouchableOpacity>

          {/* Botón de Códice (Star Coins) */}
          <TouchableOpacity
            style={[S.inventoryBtn, { borderColor: '#854d0e44' }]}
            onPress={() => setShowShop(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Image source={COIN_SPRITES.star} style={{ width: 14, height: 14 }} />
            <Text style={[S.inventoryBtnTxt, { color: '#fbbf24' }]}>{starCoins}</Text>
          </TouchableOpacity>

          {/* Botón de volumen mejorado */}
          <TouchableOpacity
            style={S.volBtn}
            onPress={() => setShowVolumePanel(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Menú de volumen"
            accessibilityRole="button"
          >
            <Ionicons
              name={volume === 0 ? 'volume-mute' : volume < 0.5 ? 'volume-low' : 'volume-high'}
              size={16}
              color={Colors.tertiary}
            />
            <Text style={S.volBtnTxt}>{Math.round(volume * 100)}%</Text>
            <Ionicons
              name={showVolumePanel ? 'chevron-up' : 'chevron-down'}
              size={11}
              color="rgba(255,255,255,0.4)"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CÓDICE DE AVENTUREROS ────────────────────────────────────────── */}
      <AdventurerCodex visible={showShop} onClose={() => setShowShop(false)} />

      {/* ── Modal de Inventario ─────────────────────────────────────────── */}
      <InventoryModal 
        visible={showInventory} 
        onClose={() => setShowInventory(false)} 
        onUseItem={handleUseItem}
      />

      {/* Panel de volumen expandible */}
      {showVolumePanel && (
        <Animated.View entering={FadeIn.duration(180)} style={S.volPanel}>
          <Text style={S.volPanelLabel}>Volumen de Música</Text>
          <View style={S.volRow}>
            <TouchableOpacity
              onPress={() => setVolume(v => Math.max(0, parseFloat((v - 0.1).toFixed(1))))}
              style={S.volArrow}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="volume-low" size={18} color="#FFF" />
            </TouchableOpacity>
            <View style={S.volTrack}>
              <View style={[S.volFill, { width: `${volume * 100}%` as any }]} />
              {[0, 0.25, 0.5, 0.75, 1].map(mark => (
                <View
                  key={mark}
                  style={[S.volMark, { left: `${mark * 100}%` as any, backgroundColor: volume >= mark ? Colors.tertiary : 'rgba(255,255,255,0.15)' }]}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setVolume(v => Math.min(1, parseFloat((v + 0.1).toFixed(1))))}
              style={S.volArrow}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="volume-high" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={S.volPresets}>
            {[0, 0.3, 0.5, 0.7, 1].map(p => (
              <TouchableOpacity
                key={p}
                style={[S.volPreset, Math.abs(volume - p) < 0.05 && S.volPresetActive]}
                onPress={() => setVolume(p)}
              >
                <Text style={[S.volPresetTxt, Math.abs(volume - p) < 0.05 && { color: Colors.tertiary }]}>
                  {p === 0 ? 'Mute' : `${Math.round(p * 100)}%`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* ━━ MODAL: Selección de Jefe ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Modal visible={showBossSelect} animationType="slide" transparent>
        <View style={S.overlay}>
          <View style={S.modalBox}>
            <View style={S.modalHdr}>
              <Text style={S.modalTitle}>⚔️ Selección de Jefe</Text>
              <TouchableOpacity
                onPress={() => setShowBossSelect(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            <Text style={S.modalSub}>Elige la deuda o el obstáculo que quieres confrontar hoy:</Text>
            
            <ScrollView showsVerticalScrollIndicator={Platform.OS === 'web'} style={{ maxHeight: SCREEN_H * 0.6 }}>
              <View style={{ gap: 12, paddingBottom: 20 }}>
                
                <Text style={S.modalSectionTitle}>🏛️ Deudas Legendarias (Historia)</Text>
                {DEMO_BOSSES.map((b, i) => {
                  const bossElemData = BOSS_ELEMENTS[b.type];
                  const elemInfo     = bossElemData ? (ELEMENT_INFO as any)[bossElemData.primary] : null;
                  const bossHp       = Math.min(Math.floor(b.amount / 10) + b.daysOverdue * 5, 9999);
                  const isEpic       = b.type === 'credit_card';
                  return (
                    <Animated.View key={`boss_${i}`} entering={FadeInUp.delay(i * 50)}>
                      <TouchableOpacity
                        style={[S.bossCard, isEpic && { borderColor: 'rgba(255,107,53,0.5)', backgroundColor: 'rgba(255,107,53,0.08)' }]}
                        onPress={() => selectBoss(b)}
                        activeOpacity={0.75}
                      >
                        <View style={S.bossCardTop}>
                          {b.sprite ? (
                            <Image 
                              source={b.sprite} 
                              style={{ width: 44, height: 44, marginRight: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' }} 
                              contentFit="contain" 
                            />
                          ) : (
                            <Text style={S.bossCardIcon}>{b.icon}</Text>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={S.bossCardName}>{b.label}</Text>
                            <Text style={S.bossCardSub}>
                              ${b.amount.toLocaleString('es-MX')} MXN · {b.daysOverdue} días
                            </Text>
                          </View>
                          <View style={[S.diffBadge, { backgroundColor: b.diffColor + '22', borderColor: b.diffColor + '55' }]}>
                            <Text style={[S.diffTxt, { color: b.diffColor }]}>Boss</Text>
                          </View>
                        </View>
                        <View style={S.bossCardBot}>
                          <Text style={S.bossHpTxt}>❤️ {bossHp} HP · 4 fases</Text>
                          {elemInfo && (
                            <View style={[S.elemPill, { backgroundColor: elemInfo.color + '18', borderColor: elemInfo.color + '44' }]}>
                              <Text style={[S.elemPillTxt, { color: elemInfo.color }]}>{elemInfo.emoji} {elemInfo.label}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}

                <Text style={S.modalSectionTitle}>🌀 Obstáculos Comunes (Arena)</Text>
                {QUEST_ENEMIES.map((e, i) => (
                  <Animated.View key={`mob_${i}`} entering={FadeInUp.delay((i + 4) * 50)}>
                    <TouchableOpacity
                      style={S.bossCard}
                      onPress={() => selectBoss(e)}
                      activeOpacity={0.75}
                    >
                      <View style={S.bossCardTop}>
                        {e.sprite ? (
                          <Image 
                            source={e.sprite} 
                            style={{ width: 44, height: 44, marginRight: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' }} 
                            contentFit="contain" 
                          />
                        ) : (
                          <Text style={S.bossCardIcon}>{e.emoji}</Text>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={S.bossCardName}>{e.name}</Text>
                          <Text style={S.bossCardSub}>Enemigo de práctica · {e.xpReward} XP</Text>
                        </View>
                        <View style={[S.diffBadge, { backgroundColor: '#3B82F622', borderColor: '#3B82F655' }]}>
                          <Text style={[S.diffTxt, { color: '#3B82F6' }]}>Mob</Text>
                        </View>
                      </View>
                      <View style={S.bossCardBot}>
                        <Text style={S.bossHpTxt}>❤️ {e.hp} HP · {e.maxPhases ?? 1} fase(s)</Text>
                        <View style={[S.elemPill, { backgroundColor: '#94a3b818', borderColor: '#94a3b844' }]}>
                          <Text style={[S.elemPillTxt, { color: '#94a3b8' }]}>🌚 Dark</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>


      {/* ━━ MODAL: Estado del Personaje ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <CharacterStatusModal
        visible={showStatusModal}
        heroes={JRPG_CLASSES as any}
        unlockedClasses={unlockedClasses}
        activeHeroId={currentClass.id}
        hp={hp} hpMax={hpMax}
        mana={mana} manaMax={manaMax}
        level={level}
        xp={xp} xpMax={xpMax}
        multiplier={multiplier}
        defenseStreak={defenseStreak}
        onSelectHero={(cls: any) => {
          if (unlockedClasses.includes(cls.id)) {
            setPlayerCharClass(cls.id);
            // Validar equipo tras cambio de clase
            useInventoryStore.getState().validateEquippedItems();
          } else {
            Alert.alert('❄️ Clase Bloqueada', 'Debes adquirir este conocimiento en el Códice de Aventureros.');
          }
        }}
        onClose={() => setShowStatus(false)}
      />


      {/* ━━ CONTENIDO PRINCIPAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={[S.mainLayout, isDesktop && S.mainLayoutDesktop]}>
        
        {/* SIDEBAR (Solo Desktop) */}
        {isDesktop && (
          <View style={S.sidebar}>
            <View style={S.hud}>
              <View style={S.hudAccent} />
              <View style={S.hudHdr}>
                <View>
                  <Text style={S.hudName}>Lv.{level} {currentClass.name}</Text>
                  <Text style={S.hudSub}>{currentClass.subtitle}</Text>
                </View>
                <TouchableOpacity
                  style={S.statusBtn}
                  onPress={() => setShowStatus(true)}
                >
                  <Ionicons name="person-circle" size={14} color={Colors.primary} />
                  <Text style={S.statusBtnTxt}>Estado</Text>
                </TouchableOpacity>
              </View>

              <View style={S.mulRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                  <Ionicons name="flame" size={14} color="#F59E0B" />
                  <Text style={S.mulTxt}>Renkei x{multiplier}</Text>
                </View>
                {classElemInfo && (
                  <View style={[S.elemTag, { backgroundColor: classElemInfo.color + '1A', borderColor: classElemInfo.color + '44' }]}>
                    <Text style={[S.elemTagTxt, { color: classElemInfo.color }]}>{classElemInfo.emoji} {classElemInfo.label}</Text>
                  </View>
                )}
              </View>

              <View style={S.avatarSidebarRow}>
                <CharacterAvatar
                  spriteUrl={currentClass.sprite}
                  isTakingDamage={isTakingDamage}
                  isAttacking={isAttacking}
                />
              </View>

              <View style={S.barsCol}>
                {[
                  { label: 'HP', cur: hp,   max: hpMax,   color: '#EF4444', style: hpBarStyle },
                  { label: 'MP', cur: mana, max: manaMax, color: '#3B82F6', style: manaBarStyle },
                  { label: 'XP', cur: xp - prevThresh, max: xpMax - prevThresh, color: '#F59E0B', style: xpBarStyle },
                ].map(b => (
                  <View key={b.label} style={S.barWrap}>
                    <View style={S.barHdr}>
                      <Text style={[S.barLbl, { color: b.color }]}>{b.label}</Text>
                      <Text style={S.barVal}>{Math.floor(b.cur)}/{Math.floor(b.max)}</Text>
                    </View>
                    <View style={S.barBg}>
                      <Animated.View style={[S.barFill, { backgroundColor: b.color }, b.style]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[S.combatBtn, { marginTop: 20 }]}
              onPress={() => setShowBossSelect(true)}
              activeOpacity={0.8}
            >
              <Image source={require('../../assets/images/items/item_sword.png')} style={{ width: 20, height: 20, marginRight: 8 }} contentFit="contain" />
              <Text style={[S.combatBtnTitle, { fontSize: 14 }]}>Iniciar Combate</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView 
          contentContainerStyle={[S.scroll, isDesktop && S.scrollDesktop]} 
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* HUD (Solo Mobile) */}
          {!isDesktop && (
            <>
              <View style={S.hud}>
                <View style={S.hudAccent} />
                <View style={S.hudHdr}>
                  <View>
                    <Text style={S.hudName}>Lv.{level} {currentClass.name}</Text>
                    <Text style={S.hudSub}>{currentClass.subtitle}</Text>
                  </View>
                  <View style={{ gap: 6, alignItems: 'flex-end' }}>
                    <TouchableOpacity
                      style={S.statusBtn}
                      onPress={() => setShowStatus(true)}
                    >
                      <Ionicons name="person-circle" size={14} color={Colors.primary} />
                      <Text style={S.statusBtnTxt}>Estado</Text>
                    </TouchableOpacity>
                    <View style={S.streakBadge}>
                      <Ionicons name="shield-checkmark" size={12} color={Colors.tertiary} />
                      <Text style={S.streakTxt}>{defenseStreak}d racha</Text>
                    </View>
                  </View>
                </View>

                <View style={S.mulRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                    <Ionicons name="flame" size={14} color="#F59E0B" />
                    <Text style={S.mulTxt}>Renkei x{multiplier}</Text>
                  </View>
                  {classElemInfo && (
                    <View style={[S.elemTag, { backgroundColor: classElemInfo.color + '1A', borderColor: classElemInfo.color + '44' }]}>
                      <Text style={[S.elemTagTxt, { color: classElemInfo.color }]}>{classElemInfo.emoji} {classElemInfo.label}</Text>
                    </View>
                  )}
                </View>

                <View style={S.avatarRow}>
                  <CharacterAvatar
                    spriteUrl={currentClass.sprite}
                    isTakingDamage={isTakingDamage}
                    isAttacking={isAttacking}
                  />
                  <View style={S.barsCol}>
                    {[
                      { label: 'HP', cur: hp,   max: hpMax,   color: '#EF4444', style: hpBarStyle },
                      { label: 'MP', cur: mana, max: manaMax, color: '#3B82F6', style: manaBarStyle },
                      { label: 'XP', cur: xp - prevThresh, max: xpMax - prevThresh, color: '#F59E0B', style: xpBarStyle },
                    ].map(b => (
                      <View key={b.label} style={S.barWrap}>
                        <View style={S.barHdr}>
                          <Text style={[S.barLbl, { color: b.color }]}>{b.label}</Text>
                          <Text style={S.barVal}>{Math.floor(b.cur)}/{Math.floor(b.max)}</Text>
                        </View>
                        <View style={S.barBg}>
                          <Animated.View style={[S.barFill, { backgroundColor: b.color }, b.style]} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={S.combatBtn}
                onPress={() => setShowBossSelect(true)}
                activeOpacity={0.8}
              >
                <View style={S.combatBtnGlow} />
                <Image source={require('../../assets/images/items/item_sword.png')} style={{ width: 24, height: 24, marginRight: 12 }} contentFit="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={S.combatBtnTitle}>¡A Combatir!</Text>
                  <Text style={S.combatBtnSub}>Enfrenta tus deudas · Elige cartas</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </>
          )}

          <View style={[isDesktop && S.contentGrid]}>
            {/* ── SECCIÓN: Hábitos ────────────────────────────────────── */}
            <View style={[isDesktop && S.gridSection]}>
              <View style={S.sectionHdr}>
                <View>
                  <Text style={S.sectionTitle}>💎 Hábitos Diarios</Text>
                  <Text style={S.sectionSub}>Acciones rápidas para ganar XP</Text>
                </View>
              </View>

              <View style={[S.habitsGrid, isDesktop && S.habitsGridDesktop]}>
                {habits.map(h => (
                  <TouchableOpacity
                    key={h.id}
                    style={[S.habitCard, isDesktop && S.habitCardDesktop]}
                    onPress={() => h.type === 'positive' ? gainXp(h.xp, h.title) : takeDamage(h.hpPenalty!)}
                  >
                    <View style={[S.habitIconBox, h.type === 'negative' && { backgroundColor: '#EF444422' }]}>
                      {h.pixelIcon ? (
                        <Image source={PIXEL_ART_ASSETS[h.pixelIcon]} style={{ width: 24, height: 24 }} contentFit="contain" />
                      ) : (
                        <Text style={{ fontSize: 20 }}>{h.icon}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.habitTitle}>{h.title}</Text>
                      <Text style={[S.habitReward, h.type === 'negative' && { color: '#EF4444' }]}>
                        {h.type === 'positive' ? `+${h.xp} XP` : `-${h.hpPenalty} HP`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── SECCIÓN: Dailies ────────────────────────────────────── */}
            <View style={[isDesktop && S.gridSection]}>
              <View style={S.sectionHdr}>
                <View>
                  <Text style={S.sectionTitle}>📅 Misiones del Día</Text>
                  <Text style={S.sectionSub}>Objetivos fijos · Reseteo 24h</Text>
                </View>
              </View>

              <View style={[S.habitsGrid, isDesktop && S.habitsGridDesktop]}>
                {dailies.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[S.habitCard, isDesktop && S.habitCardDesktop]}
                    onPress={() => gainXp(d.xp, d.title)}
                  >
                    <View style={S.habitIconBox}>
                      <Text style={{ fontSize: 20 }}>{d.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.habitTitle}>{d.title}</Text>
                      <Text style={S.habitReward}>+{d.xp} XP</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── SECCIÓN: Bosses ─────────────────────────────────────── */}
            <View style={[isDesktop && S.gridSectionFull]}>
              <View style={S.sectionHdr}>
                <View>
                  <Text style={S.sectionTitle}>⚔️ Desafíos de Jefe</Text>
                  <Text style={S.sectionSub}>Enfrenta tus deudas más grandes</Text>
                </View>
                <TouchableOpacity style={S.allBossesBtn} onPress={() => setShowBossSelect(true)}>
                  <Text style={S.allBossesBtnTxt}>Ver todos</Text>
                </TouchableOpacity>
              </View>

              <View style={[S.bossPreviewGrid, isDesktop && S.bossPreviewGridDesktop]}>
                {DEMO_BOSSES.slice(0, isDesktop ? 4 : 2).map((b, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[S.bossMiniCard, isDesktop && S.bossMiniCardDesktop]} 
                    onPress={() => selectBoss(b)}
                  >
                    <Image source={b.sprite} style={S.bossMiniSprite} contentFit="contain" />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={S.bossMiniName}>{b.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={[S.miniBadge, { backgroundColor: b.diffColor + '22' }]}>
                          <Text style={{ color: b.diffColor, fontSize: 8, fontWeight: '700' }}>{b.difficulty}</Text>
                        </View>
                        <Text style={S.bossMiniAmt}>${b.amount.toLocaleString()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

