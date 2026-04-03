// components/league/LeagueRanking.tsx
// TokaVerse — Ranking de liga que muestra solo los usuarios de esa liga
// Respeta el diseño visual de league.tsx (Colors tokens, mismo estilo)

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';

// ─── Tipos (subconjunto de league.tsx) ───────────────────────────────────────
export interface LeagueRankEntry {
  userId:   string;
  points:   number;
  position: number;
  rewards:  string[];
  xp?:      number;
}

export type LeagueTier = 'cobre' | 'plata' | 'oro' | 'estrella';

// ─── Colores de tier (mismos del diseño de league) ────────────────────────────
const TIER_ACCENT: Record<LeagueTier, string> = {
  cobre:    '#CD7F32',
  plata:    '#C0C0C0',
  oro:      '#F97316',   // Colors.accent
  estrella: '#A855F7',   // Colors.secondary
};

// Medalla para top 3
function getMedal(position: number): string | null {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface LeagueRankingProps {
  ranking:       LeagueRankEntry[];
  currentUserId: string;
  tier:          LeagueTier;
  leagueId:      string;
  onResolve?:    (leagueId: string) => void;
}

export function LeagueRanking({
  ranking,
  currentUserId,
  tier,
  leagueId,
  onResolve,
}: LeagueRankingProps) {
  const tierColor  = TIER_ACCENT[tier] ?? Colors.primary;
  const meEntry    = ranking.find(r => r.userId === currentUserId);
  const sorted     = [...ranking].sort((a, b) => a.position - b.position);

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>Nadie ha puntuado en esta liga todavía.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Encabezado del ranking ─────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: tierColor + '33' }]}>
        <Text style={[styles.headerTitle, { color: tierColor }]}>
          Clasificación de la Liga
        </Text>
        <Text style={styles.headerSub}>{sorted.length} competidores</Text>
      </View>

      {/* ── Columnas ──────────────────────────────────────────── */}
      <View style={styles.colRow}>
        <Text style={[styles.colLabel, { width: 40 }]}>#</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>Jugador</Text>
        <Text style={[styles.colLabel, { width: 70, textAlign: 'right' }]}>Puntos</Text>
      </View>

      {/* ── Filas del ranking ──────────────────────────────────── */}
      {sorted.map((entry, index) => {
        const isMe    = entry.userId === currentUserId;
        const medal   = getMedal(entry.position);
        const isTop3  = entry.position <= 3;

        return (
          <View
            key={entry.userId}
            style={[
              styles.row,
              isMe && styles.rowMe,
              isMe && { borderColor: tierColor + '55' },
              isTop3 && !isMe && styles.rowTop3,
              index === 0 && { borderTopWidth: 0 },
            ]}
          >
            {/* Posición / medalla */}
            <View style={styles.posCol}>
              {medal ? (
                <Text style={styles.medal}>{medal}</Text>
              ) : (
                <Text style={[styles.pos, isMe && { color: tierColor }]}>
                  #{entry.position}
                </Text>
              )}
            </View>

            {/* ID del usuario */}
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.username,
                  isMe && { color: tierColor, fontWeight: '800' },
                  isTop3 && !isMe && { color: Colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {isMe ? `⚡ Tú` : entry.userId}
              </Text>
              {isMe && (
                <Text style={[styles.youLabel, { color: tierColor }]}>
                  Tu posición actual
                </Text>
              )}
            </View>

            {/* Puntos */}
            <Text
              style={[
                styles.points,
                isMe && { color: tierColor },
                isTop3 && { fontWeight: '900' },
              ]}
            >
              {entry.points.toLocaleString()}
            </Text>
          </View>
        );
      })}

      {/* ── Sticky row del usuario si está fuera del top visible ─ */}
      {meEntry && meEntry.position > 5 && (
        <View style={[styles.stickyMe, { borderColor: tierColor + '55' }]}>
          <Text style={styles.stickyLabel}>Tu posición</Text>
          <View style={styles.stickyRow}>
            <Text style={[styles.pos, { color: tierColor, width: 40 }]}>
              #{meEntry.position}
            </Text>
            <Text style={[styles.username, { flex: 1, color: tierColor, fontWeight: '800' }]}>
              ⚡ Tú
            </Text>
            <Text style={[styles.points, { color: tierColor }]}>
              {meEntry.points.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* ── Recompensas del usuario ────────────────────────────── */}
      {meEntry && meEntry.rewards.length > 0 && (
        <View style={styles.rewardsBox}>
          <Text style={styles.rewardsTitle}>Tus recompensas:</Text>
          {meEntry.rewards.map((rew, i) => (
            <Text key={i} style={styles.rewardItem}>🏆 {rew}</Text>
          ))}
        </View>
      )}

      {/* ── Botón admin: resolver torneo ─────────────────────── */}
      {onResolve && (
        <TouchableOpacity
          style={styles.adminBtn}
          onPress={() => onResolve(leagueId)}
        >
          <Text style={styles.adminBtnText}>Cerrar torneo y otorgar premios</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Estilos (coherentes con league.tsx) ──────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingTop: 4,
  },

  // Encabezado
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // Cabecera de columnas
  colRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 2,
  },
  colLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Fila de ranking
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  rowTop3: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    marginHorizontal: -4,
    paddingHorizontal: 8,
  },
  rowMe: {
    backgroundColor: 'rgba(77,97,252,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    marginVertical: 2,
  },

  // Columna de posición
  posCol: {
    width: 40,
    alignItems: 'flex-start',
  },
  medal: {
    fontSize: 20,
  },
  pos: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textMuted,
  },

  // Info del jugador
  username: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  youLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: 0.4,
  },

  // Puntos
  points: {
    width: 70,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  // Sticky row (si el usuario está fuera del top 5)
  stickyMe: {
    marginTop: 12,
    backgroundColor: 'rgba(77,97,252,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  stickyLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  stickyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Estado vacío
  emptyBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Recompensas
  rewardsBox: {
    marginTop: 14,
    backgroundColor: 'rgba(249,115,22,0.1)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
  },
  rewardsTitle: {
    fontWeight: '800',
    color: Colors.accent,
    marginBottom: 6,
    fontSize: 13,
  },
  rewardItem: {
    color: '#FFEED2',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '600',
  },

  // Botón admin
  adminBtn: {
    marginTop: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  adminBtnText: {
    color: '#FCA5A5',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default LeagueRanking;
