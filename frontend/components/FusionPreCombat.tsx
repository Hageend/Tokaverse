// components/FusionPreCombat.tsx
// Pantalla pre-combate — selección de cartas y preview de fusiones

import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal,
} from 'react-native'
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/Colors'
import { DEMO_CARDS } from '../engine/FusionEngine'
import { FusionEngine } from '../engine/FusionEngine'
import { ELEMENT_INFO } from '../types/elements'
import type { PlayerCard, FusionResult } from '../types/fusion'
import type { Boss } from '../types/combat'

interface Props {
  boss:       Boss
  onStart:    (cards: PlayerCard[]) => void
  onCancel:   () => void
}

const RARITY_CONFIG = {
  common:    { label: 'Común',    color: '#9CA3AF', glow: 'rgba(156,163,175,0.3)' },
  rare:      { label: 'Rara',     color: '#3B82F6', glow: 'rgba(59,130,246,0.4)' },
  epic:      { label: 'Épica',    color: '#8B5CF6', glow: 'rgba(139,92,246,0.5)' },
  legendary: { label: 'Legendaria', color: '#F59E0B', glow: 'rgba(245,158,11,0.6)' },
}

export default function FusionPreCombat({ boss, onStart, onCancel }: Props) {
  const [equippedCards, setEquippedCards] = useState<(PlayerCard | null)[]>([null, null, null])
  const [detectedFusions, setDetectedFusions] = useState<FusionResult[]>([])
  const [showCardPicker, setShowCardPicker] = useState<number | null>(null)

  // Glow animation para las fusiones detectadas
  const glowAnim = useSharedValue(0.4)
  useEffect(() => {
    glowAnim.value = withRepeat(withTiming(1.0, { duration: 1200 }), -1, true)
  }, [])

  // Recalcular fusiones al cambiar cartas
  useEffect(() => {
    const equipped = equippedCards.filter(Boolean) as PlayerCard[]
    const ids      = equipped.map(c => c.cardId)
    setDetectedFusions(FusionEngine.detectFusions(ids))
  }, [equippedCards])

  const passiveBonus = FusionEngine.calculatePassiveBonus(equippedCards.filter(Boolean) as PlayerCard[])

  const equipCard = (slotIndex: number, card: PlayerCard | null) => {
    const newSlots = [...equippedCards]
    newSlots[slotIndex] = card
    setEquippedCards(newSlots)
    setShowCardPicker(null)
  }

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowAnim.value,
    shadowRadius:   12 * glowAnim.value,
  }))

  const bossElemInfo = boss.element ? ELEMENT_INFO[boss.element] : null

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>⚗️ Pre-Combate</Text>
            <Text style={styles.subtitle}>Equipa tus cartas antes de la batalla</Text>
          </View>
        </Animated.View>

        {/* Boss info card */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.bossCard}>
          <View style={styles.bossCardLeft}>
            <Text style={styles.bossCardName}>{boss.name}</Text>
            <Text style={styles.bossCardHp}>❤️ {boss.hp} HP</Text>
            {bossElemInfo && (
              <View style={[styles.elemBadge, { backgroundColor: bossElemInfo.color + '22', borderColor: bossElemInfo.color + '55' }]}>
                <Text style={[styles.elemBadgeTxt, { color: bossElemInfo.color }]}>
                  {bossElemInfo.emoji} {bossElemInfo.label}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.phaseInfo}>
            <Text style={styles.phaseLabel}>4 FASES</Text>
            <Text style={styles.phaseSub}>Combate intenso</Text>
          </View>
        </Animated.View>

        {/* Slots de fusión */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>🃏 Equipa tus Cartas (máx. 3)</Text>
          <Text style={styles.sectionSub}>Cada carta da bonuses pasivos. Combina 2+ para activar Fusiones especiales.</Text>
          <View style={styles.slotsRow}>
            {equippedCards.map((card, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.slot, card && styles.slotFilled]}
                onPress={() => setShowCardPicker(i)}
              >
                {card ? (
                  <>
                    <Text style={styles.slotCardEmoji}>{ELEMENT_INFO[card.element]?.emoji ?? '🃏'}</Text>
                    <Text style={styles.slotCardName} numberOfLines={2}>{card.name}</Text>
                    <Text style={[styles.slotRarity, { color: RARITY_CONFIG[card.rarity].color }]}>
                      {RARITY_CONFIG[card.rarity].label}
                    </Text>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => equipCard(i, null)}>
                      <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Ionicons name="add" size={28} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.slotEmpty}>Carta {i + 1}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Bonuses pasivos */}
        {(passiveBonus.damageBonus > 0 || passiveBonus.speedBonus > 0 || passiveBonus.manaBonus > 0) && (
          <Animated.View entering={FadeInUp.delay(280).duration(350)} style={styles.passiveBox}>
            <Text style={styles.passiveTitle}>📊 Bonuses Pasivos Activos</Text>
            <View style={styles.passiveRow}>
              {passiveBonus.damageBonus > 0 && (
                <View style={styles.passiveBadge}>
                  <Text style={styles.passiveBadgeTxt}>⚔️ +{Math.round(passiveBonus.damageBonus * 100)}% DMG</Text>
                </View>
              )}
              {passiveBonus.speedBonus > 0 && (
                <View style={[styles.passiveBadge, { borderColor: '#FF6B35' }]}>
                  <Text style={styles.passiveBadgeTxt}>⚡ +{Math.round(passiveBonus.speedBonus * 100)}% VEL</Text>
                </View>
              )}
              {passiveBonus.manaBonus > 0 && (
                <View style={[styles.passiveBadge, { borderColor: '#3B82F6' }]}>
                  <Text style={styles.passiveBadgeTxt}>💧 +{Math.round(passiveBonus.manaBonus * 100)}% MANA</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Fusiones detectadas */}
        {detectedFusions.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <Text style={styles.sectionTitle}>✨ Fusiones Disponibles</Text>
            {detectedFusions.map(fusion => {
              const info = FusionEngine.getFusionDisplayInfo(fusion)
              return (
                <Animated.View key={fusion.id} style={[styles.fusionCard, glowStyle, { shadowColor: info.color }]}>
                  <View style={[styles.fusionIcon, { backgroundColor: info.color + '22', borderColor: info.color }]}>
                    <Text style={{ fontSize: 22 }}>{info.icon}</Text>
                  </View>
                  <View style={styles.fusionBody}>
                    <Text style={[styles.fusionName, { color: info.color }]}>{fusion.name}</Text>
                    <Text style={styles.fusionDesc}>{fusion.description}</Text>
                    <Text style={styles.fusionDuration}>⏱ {info.badgeText}</Text>
                  </View>
                  <View style={[styles.fusionAvailBadge, { backgroundColor: info.color + '22', borderColor: info.color }]}>
                    <Text style={[styles.fusionAvailTxt, { color: info.color }]}>LISTO</Text>
                  </View>
                </Animated.View>
              )
            })}
          </Animated.View>
        )}

        {/* Sin fusiones — sugerencia */}
        {detectedFusions.length === 0 && equippedCards.filter(Boolean).length >= 2 && (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.noFusionHint}>
            <Text style={styles.noFusionTxt}>💡 Intenta equipar 2 cartas del mismo producto para desbloquear fusiones</Text>
          </Animated.View>
        )}

        {/* Botón iniciar */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={{ marginTop: 24 }}>
          <TouchableOpacity style={styles.startBtn} onPress={() => onStart(equippedCards.filter(Boolean) as PlayerCard[])}>
            <Text style={styles.startBtnIcon}>⚔️</Text>
            <View>
              <Text style={styles.startBtnTxt}>¡Iniciar Combate!</Text>
              <Text style={styles.startBtnSub}>
                {equippedCards.filter(Boolean).length} carta(s) equipada(s) · {detectedFusions.length} fusión(es)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>

      {/* Modal de selección de cartas */}
      <Modal visible={showCardPicker !== null} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerBox}>
            <View style={styles.pickerHdr}>
              <Text style={styles.pickerTitle}>🃏 Seleccionar Carta</Text>
              <TouchableOpacity onPress={() => setShowCardPicker(null)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {DEMO_CARDS.map(card => {
                const rarCfg  = RARITY_CONFIG[card.rarity]
                const elemInf = ELEMENT_INFO[card.element]
                const alreadyEquipped = equippedCards.some((c, i) => c?.cardId === card.cardId && i !== showCardPicker)
                return (
                  <TouchableOpacity
                    key={card.cardId}
                    style={[styles.cardPickItem, alreadyEquipped && styles.cardPickItemDisabled, { borderColor: rarCfg.color + '55' }]}
                    onPress={() => !alreadyEquipped && showCardPicker !== null && equipCard(showCardPicker, card)}
                    disabled={alreadyEquipped}
                  >
                    <View style={[styles.cardPickIcon, { backgroundColor: elemInf?.color + '22' }]}>
                      <Text style={{ fontSize: 24 }}>{elemInf?.emoji ?? '🃏'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardPickName, { color: rarCfg.color }]}>{card.name}</Text>
                      <Text style={styles.cardPickElem}>{elemInf?.label} · {rarCfg.label}</Text>
                      {card.passiveBonus && (
                        <Text style={styles.cardPickBonus}>
                          ✨ {card.passiveBonus.type === 'damage' ? `+${Math.round(card.passiveBonus.value * 100)}% daño elemental` :
                              card.passiveBonus.type === 'speed'  ? `+${Math.round(card.passiveBonus.value * 100)}% velocidad` :
                              card.passiveBonus.type === 'mana'   ? `+${Math.round(card.passiveBonus.value * 100)}% mana máximo` :
                              `+${Math.round(card.passiveBonus.value * 100)}% elem. ${card.passiveBonus.element}`}
                        </Text>
                      )}
                    </View>
                    {alreadyEquipped && <Text style={styles.equippedTag}>EN USO</Text>}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0A0F1E' },
  scroll:       { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 40 },

  header:       { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  backBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  title:        { color: '#FFF', fontSize: 22, fontWeight: '900' },
  subtitle:     { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },

  bossCard:     { backgroundColor: '#1A2235', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 14, marginBottom: 24, flexDirection: 'row', alignItems: 'center' },
  bossCardLeft: { flex: 1 },
  bossCardName: { color: '#EF4444', fontWeight: '900', fontSize: 16, marginBottom: 4 },
  bossCardHp:   { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  elemBadge:    { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  elemBadgeTxt: { fontSize: 11, fontWeight: '700' },
  phaseInfo:    { alignItems: 'center', paddingLeft: 12 },
  phaseLabel:   { color: '#EF4444', fontWeight: '900', fontSize: 14 },
  phaseSub:     { color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 },

  sectionTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', marginBottom: 6, letterSpacing: 0.5 },
  sectionSub:   { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 14, lineHeight: 16 },

  slotsRow:     { flexDirection: 'row', gap: 10, marginBottom: 20 },
  slot:         { flex: 1, aspectRatio: 0.7, backgroundColor: '#111827', borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', padding: 8, position: 'relative' },
  slotFilled:   { borderStyle: 'solid', borderColor: Colors.primary, backgroundColor: 'rgba(77,97,252,0.08)' },
  slotCardEmoji:{ fontSize: 26, marginBottom: 6 },
  slotCardName: { color: '#FFF', fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  slotRarity:   { fontSize: 9, fontWeight: '900', textAlign: 'center' },
  slotEmpty:    { color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 4 },
  removeBtn:    { position: 'absolute', top: 4, right: 4 },

  passiveBox:   { backgroundColor: '#111827', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 12, marginBottom: 20 },
  passiveTitle: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  passiveRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  passiveBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' },
  passiveBadgeTxt: { color: '#22C55E', fontSize: 11, fontWeight: '700' },

  fusionCard:   { backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowOffset: { width: 0, height: 0 } },
  fusionIcon:   { width: 48, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  fusionBody:   { flex: 1 },
  fusionName:   { fontWeight: '900', fontSize: 14, marginBottom: 2 },
  fusionDesc:   { color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 15, marginBottom: 4 },
  fusionDuration:{ color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  fusionAvailBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  fusionAvailTxt: { fontSize: 9, fontWeight: '900' },

  noFusionHint: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', padding: 12, marginBottom: 16 },
  noFusionTxt:  { color: '#F59E0B', fontSize: 12, lineHeight: 17 },

  startBtn:     { backgroundColor: '#7F1D1D', borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  startBtnIcon: { fontSize: 28 },
  startBtnTxt:  { color: '#FFF', fontWeight: '900', fontSize: 17 },
  startBtnSub:  { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },

  // Picker
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  pickerBox:    { backgroundColor: '#111827', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', maxHeight: '75%', padding: 16 },
  pickerHdr:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerTitle:  { color: '#FFF', fontSize: 18, fontWeight: '900' },
  cardPickItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 10, gap: 12 },
  cardPickItemDisabled: { opacity: 0.4 },
  cardPickIcon: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardPickName: { fontWeight: '800', fontSize: 14, marginBottom: 2 },
  cardPickElem: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  cardPickBonus:{ color: '#22C55E', fontSize: 10, marginTop: 3 },
  equippedTag:  { color: '#F59E0B', fontSize: 9, fontWeight: '900', borderWidth: 1, borderColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
})
