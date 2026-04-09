import React, { useState, useMemo } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, 
    Dimensions, Platform, Alert, useWindowDimensions 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';

// Datos e Stores
import { usePlayerStore } from '../../store/usePlayerStore';
import { useInventoryStore, BOSS_DROPS, RARITY_COLORS } from '../../store/useInventoryStore';
import { QUEST_ENEMIES } from '../../store/useCombatStore';
import { ISLANDS_DB } from '../../data/islands';
import { ELEMENT_INFO, BOSS_ELEMENTS } from '../../types/elements';

const fontFam = Platform.OS === 'ios' ? 'Courier' : 'monospace';
const { height: SCREEN_H } = Dimensions.get('window');

interface EnemyAlmanaqueProps {
    visible: boolean;
    onClose: () => void;
    onSelectBoss: (boss: any) => void;
}

export const EnemyAlmanaque = ({ visible, onClose, onSelectBoss }: EnemyAlmanaqueProps) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    // Estados de filtros
    const [showCodexFilters, setShowCodexFilters] = useState(false);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [dropFilter, setDropFilter] = useState<'ALL' | 'weapon' | 'card' | 'consumable' | 'protection'>('ALL');
    const [codexFilter, setCodexFilter] = useState<'ALL' | 'ARENA'>('ALL');

    // ─── Lógica de Datos ─────────────────────────────────────────────────────
    
    // Extraer Bosses de ISLANDS_DB y combinarlos con QUEST_ENEMIES si es necesario
    const allBosses = useMemo(() => {
        const extracted: any[] = [];
        // Bosses de la DB de Islas
        ISLANDS_DB.forEach(zone => {
            zone.nodes.forEach(node => {
                if (node.type === 'boss' && node.boss) {
                    extracted.push({
                        ...node.boss,
                        id: node.id,
                        type: node.bossType || node.boss.bossType,
                        label: node.boss.name,
                        amount: node.id * 2000, // Simulación de deuda
                        daysOverdue: 10,
                    });
                }
            });
        });
        return extracted;
    }, []);

    const filteredBosses = useMemo(() => {
        let list = [...allBosses];

        // Filtro por Drop
        if (dropFilter !== 'ALL') {
            list = list.filter(b => {
                const drops = BOSS_DROPS[b.type];
                if (!drops) return false;
                const hasGuaranteed = drops.guaranteed.type === dropFilter;
                const hasRandom = drops.random.some(d => d.type === dropFilter);
                return hasGuaranteed || hasRandom;
            });
        }

        // Ordenar por dificultad (HP como proxy de dificultad dinámica)
        list.sort((a, b) => {
            const hpA = a.hp;
            const hpB = b.hp;
            return sortDir === 'asc' ? hpA - hpB : hpB - hpA;
        });

        return list;
    }, [allBosses, dropFilter, sortDir]);

    if (!visible) return null;

    return (
<Modal visible={visible} animationType="slide" transparent>
  <View style={S.overlay}>
    <View style={[S.modalBox, isDesktop && S.modalBoxWeb]}>
      <View style={S.modalHdr}>
        <Text style={S.modalTitle}>📖 ALMANAQUE DE AMENAZAS</Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Cerrar"
        >
          <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>
      <Text style={S.modalSub}>Consulta la información de tus enemigos, sus estadísticas y posibles botines antes de enfrentarlos en combate.</Text>
      
      {/* ━━ Panel de Filtros Desplegable ━━ */}
      <TouchableOpacity
        style={S.filterToggleBtn}
        onPress={() => setShowCodexFilters(v => !v)}
        activeOpacity={0.75}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Ionicons name="options" size={14} color={Colors.tertiary} />
          <Text style={S.filterToggleTxt}>Filtros</Text>
          {/* Active filter badges */}
          {sortDir === 'desc' && (
            <View style={S.filterActiveBadge}><Text style={S.filterActiveBadgeTxt}>↓ Dificultad</Text></View>
          )}
          {dropFilter !== 'ALL' && (
            <View style={S.filterActiveBadge}><Text style={S.filterActiveBadgeTxt}>
              {{ weapon: '🗡️ Armas', card: '🎴 Cartas', consumable: '🧪 Consumibles', protection: '🛡️ Armadura' }[dropFilter]}
            </Text></View>
          )}
          {codexFilter === 'ARENA' && (
            <View style={S.filterActiveBadge}><Text style={S.filterActiveBadgeTxt}>🌀 Arena</Text></View>
          )}
        </View>
        <Ionicons
          name={showCodexFilters ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="rgba(255,255,255,0.4)"
        />
      </TouchableOpacity>

      {showCodexFilters && (
        <Animated.View entering={FadeIn.duration(180)} style={S.filterPanel}>
          {/* ── Ordenar por dificultad ── */}
          <Text style={S.filterLabel}>Ordenar por dificultad</Text>
          <View style={S.filterRow}>
            <TouchableOpacity
              style={[S.sortBtn, sortDir === 'asc' && S.sortBtnActive]}
              onPress={() => setSortDir('asc')}
            >
              <Ionicons name="arrow-up" size={11} color={sortDir === 'asc' ? '#F97316' : 'rgba(255,255,255,0.4)'} />
              <Text style={[S.sortTxt, sortDir === 'asc' && S.sortTxtActive]}>FÁCIL → INFERNAL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.sortBtn, sortDir === 'desc' && S.sortBtnActive]}
              onPress={() => setSortDir('desc')}
            >
              <Ionicons name="arrow-down" size={11} color={sortDir === 'desc' ? '#eab308' : 'rgba(255,255,255,0.4)'} />
              <Text style={[S.sortTxt, sortDir === 'desc' && S.sortTxtActive]}>INFERNAL → FÁCIL</Text>
            </TouchableOpacity>
          </View>

          <View style={S.filterSeparator} />

          {/* ── Filtrar por tipo de drop ── */}
          <Text style={S.filterLabel}>Tipo de Drop</Text>
          <View style={S.filterRow}>
            {([
              { id: 'ALL',        label: 'Todos',       icon: '✨' },
              { id: 'weapon',     label: 'Armas',       icon: '🗡️' },
              { id: 'card',       label: 'Cartas',      icon: '🎴' },
              { id: 'consumable', label: 'Consumibles', icon: '🧪' },
              { id: 'protection', label: 'Armadura',    icon: '🛡️' },
            ] as const).map(f => (
              <TouchableOpacity
                key={f.id}
                style={[S.filterBtn, dropFilter === f.id && S.filterBtnActive]}
                onPress={() => setDropFilter(f.id as any)}
              >
                <Text style={[S.filterTxt, dropFilter === f.id && S.filterTxtActive]}>{f.icon} {f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={S.filterSeparator} />

          {/* ── Tipo de encuentro ── */}
          <Text style={S.filterLabel}>Tipo de Encuentro</Text>
          <View style={S.filterRow}>
            {([
              { id: 'ALL',   label: '🏛️ Jefes + Arena' },
              { id: 'ARENA', label: '🌀 Solo Arena' },
            ] as const).map(f => (
              <TouchableOpacity
                key={f.id}
                style={[S.filterBtn, codexFilter === f.id && S.filterBtnActive]}
                onPress={() => setCodexFilter(f.id as any)}
              >
                <Text style={[S.filterTxt, codexFilter === f.id && S.filterTxtActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      <ScrollView showsVerticalScrollIndicator={Platform.OS === 'web'} style={{ maxHeight: SCREEN_H * 0.7 }}>
        <View style={{ gap: 20, paddingBottom: 20 }}>
          
          {(codexFilter === 'ALL') && (
            <View>
              <Text style={S.modalSectionTitle}>🏛️ Deudas Legendarias · {filteredBosses.length} resultado(s)</Text>
              <View style={S.bentoGrid}>
            {filteredBosses.map((b, i) => {
            const bossElemData = BOSS_ELEMENTS[b.type as unknown as keyof typeof BOSS_ELEMENTS];
            const elemInfo     = bossElemData ? (ELEMENT_INFO as any)[bossElemData.primary] : null;
            const bossHp       = Math.min(Math.floor(b.amount / 10) + b.daysOverdue * 5, 9999);
            const isEpic       = b.type === 'credit_card';
            const dropData     = BOSS_DROPS[b.type as unknown as keyof typeof BOSS_DROPS] || BOSS_DROPS['generic_mob'];

            return (
              <Animated.View key={`boss_${i}`} entering={FadeInUp.delay(i * 50)} style={S.bossCardContainer}>
                <View style={[S.bossCard, isEpic && { borderColor: 'rgba(255,107,53,0.5)', backgroundColor: 'rgba(255,107,53,0.08)' }]}>
                  <View style={S.bossCardTop}>
                    {b.sprite ? (
                      <Image 
                        source={b.sprite} 
                        style={{ width: 50, height: 50, marginRight: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' }} 
                        contentFit="contain" 
                      />
                    ) : (
                      <Text style={S.bossCardIcon}>{b.icon}</Text>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={S.bossCardName}>{b.label}</Text>
                      <Text style={S.bossCardSub}>
                        Deuda: ${b.amount.toLocaleString('es-MX')} MXN · {b.daysOverdue} días
                      </Text>
                    </View>
                    <View style={[S.diffBadge, { backgroundColor: b.diffColor + '22', borderColor: b.diffColor + '55' }]}>
                      <Text style={[S.diffTxt, { color: b.diffColor }]}>Rank: {b.difficulty}</Text>
                    </View>
                  </View>
                  
                  <View style={S.bossCardBot}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <Text style={S.bossHpTxt}>❤️ {bossHp} HP</Text>
                      <Text style={S.bossPhaseTxt}>⚡ 4 Fases</Text>
                      {elemInfo && (
                        <View style={[S.elemPill, { backgroundColor: elemInfo.color + '18', borderColor: elemInfo.color + '44' }]}>
                          <Text style={[S.elemPillTxt, { color: elemInfo.color }]}>{elemInfo.emoji} {elemInfo.label}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Drops Dex */}
                  <View style={S.dropsContainer}>
                    <Text style={S.dropsTitle}>Drops Posibles:</Text>
                    <View style={S.dropsList}>
                      {dropData?.guaranteed && (
                        <View style={S.dropBadge} key="guaranteed">
                          <Text style={S.dropEmoji}>{dropData.guaranteed.icon}</Text>
                          <Text style={[S.dropName, { color: (RARITY_COLORS as any)[dropData.guaranteed.rarity] || '#FFF' }]} numberOfLines={1}>
                            {dropData.guaranteed.name} (100%)
                          </Text>
                        </View>
                      )}
                      {dropData?.random?.slice(0, 2).map((rndDrop: any, dropIdx: number) => (
                        <View style={S.dropBadge} key={`random_${dropIdx}`}>
                          <Text style={S.dropEmoji}>{rndDrop.icon}</Text>
                          <Text style={[S.dropName, { color: (RARITY_COLORS as any)[rndDrop.rarity] || '#FFF' }]} numberOfLines={1}>
                            {rndDrop.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity style={S.fightActionBtn} onPress={() => onSelectBoss(b)}>
                    <Text style={S.fightActionTxt}>⚔️ Enfrentar Jefe</Text>
                  </TouchableOpacity>

                </View>
              </Animated.View>
            );
          })}
            </View>
          </View>
          )}

        {(codexFilter === 'ALL' || codexFilter === 'ARENA') && (
          <View style={{ gap: 12, paddingBottom: 20 }}>
            <Text style={S.modalSectionTitle}>🌀 Amenazas de Arena</Text>
            <View style={S.bentoGrid}>
          {QUEST_ENEMIES.map((e, i) => {
            // Mobs use generic drop
            const mobDrops = BOSS_DROPS['generic_mob'];
            return (
              <Animated.View key={`mob_${i}`} entering={FadeInUp.delay((i + 4) * 50)} style={S.bossCardContainer}>
                <View style={[S.bossCard, { backgroundColor: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }]}>
                  <View style={S.bossCardTop}>
                    {e.sprite ? (
                      <Image 
                        source={e.sprite} 
                        style={{ width: 50, height: 50, marginRight: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' }} 
                        contentFit="contain" 
                      />
                    ) : (
                      <Text style={S.bossCardIcon}>{e.emoji}</Text>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={S.bossCardName}>{e.name}</Text>
                      <Text style={S.bossCardSub}>Enemigo Arena · Recompensa: {e.xpReward} XP</Text>
                    </View>
                    <View style={[S.diffBadge, { backgroundColor: '#3B82F622', borderColor: '#3B82F655' }]}>
                      <Text style={[S.diffTxt, { color: '#3B82F6' }]}>Lv. Variable</Text>
                    </View>
                  </View>
                  
                  <View style={S.bossCardBot}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <Text style={S.bossHpTxt}>❤️ {e.hp} HP</Text>
                      <Text style={S.bossPhaseTxt}>⚡ {e.maxPhases ?? 1} Fase(s)</Text>
                      <View style={[S.elemPill, { backgroundColor: '#94a3b818', borderColor: '#94a3b844' }]}>
                        <Text style={[S.elemPillTxt, { color: '#94a3b8' }]}>🌚 Dark</Text>
                      </View>
                    </View>
                  </View>

                  {/* Drops Dex */}
                  <View style={S.dropsContainer}>
                    <Text style={S.dropsTitle}>Drops Posibles:</Text>
                    <View style={S.dropsList}>
                      {mobDrops?.guaranteed && (
                        <View style={S.dropBadge} key="guaranteed">
                          <Text style={S.dropEmoji}>{mobDrops.guaranteed.icon}</Text>
                          <Text style={[S.dropName, { color: (RARITY_COLORS as any)[mobDrops.guaranteed.rarity] || '#FFF' }]} numberOfLines={1}>
                            {mobDrops.guaranteed.name}
                          </Text>
                        </View>
                      )}
                      {mobDrops?.random?.slice(0, 2).map((rndDrop: any, dropIdx: number) => (
                        <View style={S.dropBadge} key={`random_${dropIdx}`}>
                          <Text style={S.dropEmoji}>{rndDrop.icon}</Text>
                          <Text style={[S.dropName, { color: (RARITY_COLORS as any)[rndDrop.rarity] || '#FFF' }]} numberOfLines={1}>
                            {rndDrop.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity style={[S.fightActionBtn, { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3B82F6' }]} onPress={() => onSelectBoss(e)}>
                    <Text style={[S.fightActionTxt, { color: '#60A5FA' }]}>⚔️ Entrenar en Arena</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}
            </View>
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>
    );
};

const S = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    modalBox: {
        backgroundColor: '#0d0d22',
        borderRadius: 8,
        padding: 24,
        maxHeight: '96%',
        borderWidth: 4,
        borderColor: '#eab308', // Retro gold HUD
        marginHorizontal: 16,
    },
    modalBoxWeb: {
        width: 800,
        alignSelf: 'center',
    },
    modalHdr: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#eab308',
        letterSpacing: 1,
        fontFamily: fontFam,
    },
    modalSub: {
        fontSize: 11,
        color: '#ccc',
        lineHeight: 16,
        marginBottom: 20,
        fontFamily: fontFam,
    },
    filterToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    filterToggleTxt: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 11,
        fontFamily: fontFam,
    },
    filterActiveBadge: {
        backgroundColor: Colors.accent + '22',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.accent + '44',
    },
    filterActiveBadgeTxt: {
        color: Colors.accent,
        fontSize: 10,
        fontWeight: '900',
    },
    filterPanel: {
        backgroundColor: 'rgba(15,23,42,0.8)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    filterLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        fontFamily: fontFam,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    filterBtnActive: {
        backgroundColor: Colors.primary + '22',
        borderColor: Colors.primary,
    },
    filterTxt: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '700',
        fontFamily: fontFam,
    },
    filterTxtActive: {
        color: '#fff',
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    sortBtnActive: {
        backgroundColor: 'rgba(234,179,8,0.15)',
        borderWidth: 1,
        borderColor: '#eab308',
    },
    sortTxt: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '800',
        fontFamily: fontFam,
    },
    sortTxtActive: {
        color: '#eab308',
    },
    filterSeparator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginVertical: 16,
    },
    modalSectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
        opacity: 0.8,
        fontFamily: fontFam,
    },
    bentoGrid: {
        gap: 16,
    },
    bossCardContainer: {
        width: '100%',
    },
    bossCard: {
        backgroundColor: '#111',
        borderRadius: 8,
        padding: 16,
        borderWidth: 2,
        borderColor: '#1e1e24',
    },
    bossCardEpic: {
        borderColor: 'rgba(255,107,53,0.5)',
        backgroundColor: 'rgba(255,107,53,0.08)',
    },
    bossCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    bossImage: {
        width: 50,
        height: 50,
        marginRight: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    bossCardIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    bossCardName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#fff',
        fontFamily: fontFam,
    },
    bossCardSub: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 4,
        fontFamily: fontFam,
    },
    diffBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
    },
    diffTxt: {
        fontSize: 8,
        fontWeight: '900',
        fontFamily: fontFam,
    },
    bossCardBot: {
        marginBottom: 16,
    },
    bossHpTxt: {
        color: '#F87171',
        fontSize: 10,
        fontWeight: '900',
        fontFamily: fontFam,
    },
    bossPhaseTxt: {
        color: '#eab308',
        fontSize: 10,
        fontWeight: '900',
        fontFamily: fontFam,
    },
    elemPill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
    },
    elemPillTxt: {
        fontSize: 9,
        fontWeight: '900',
        fontFamily: fontFam,
    },
    dropsContainer: {
        backgroundColor: '#0a0a1a',
        borderRadius: 4,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1e1e24',
    },
    dropsTitle: {
        fontSize: 9,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 8,
        textTransform: 'uppercase',
        fontFamily: fontFam,
    },
    dropsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dropBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
        maxWidth: 160,
    },
    dropEmoji: {
        fontSize: 14,
    },
    dropName: {
        fontSize: 9,
        fontWeight: '800',
        fontFamily: fontFam,
    },
    fightActionBtn: {
        backgroundColor: 'rgba(234,179,8,0.1)',
        paddingVertical: 12,
        borderRadius: 4,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#eab308', // Retro HUD Accent
    },
    fightActionTxt: {
        color: '#eab308',
        fontWeight: '900',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: fontFam,
    },
    mobCard: {
        backgroundColor: 'rgba(59,130,246,0.05)',
        borderColor: 'rgba(59,130,246,0.2)',
    },
    mobActionBtn: {
        backgroundColor: 'rgba(59,130,246,0.15)',
        borderColor: '#3B82F6',
    },
});
