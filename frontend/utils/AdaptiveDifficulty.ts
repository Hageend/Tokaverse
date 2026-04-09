// utils/AdaptiveDifficulty.ts
// TokaVerse — IA adaptativa de dificultad basada en el rendimiento del jugador

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert'

export interface PlayerPerformance {
 winRate:          number   // 0-1
 avgTurnsToWin:    number
 avgDamageTaken:   number   // % de HP perdido por combate
 consecutiveLosses: number
 consecutiveWins:  number
 totalCombats:     number
}

export interface DifficultyModifiers {
 bossHpMult:      number   // multiplicador de HP del jefe
 bossAtkMult:     number   // multiplicador de ataque del jefe
 bossDefMult:     number   // multiplicador de defensa
 xpMult:          number   // multiplicador de XP ganada
 dropRateMult:    number   // multiplicador de tasa de drops
 label:           string
 color:           string
 emoji:           string
}

export const DIFFICULTY_MODIFIERS: Record<DifficultyLevel, DifficultyModifiers> = {
 easy: {
  bossHpMult:   0.75,
  bossAtkMult:  0.75,
  bossDefMult:  0.80,
  xpMult:       0.80,
  dropRateMult: 1.0,
  label:        'Fácil',
  color:        '#22C55E',
  emoji:        '🌱',
 },
 normal: {
  bossHpMult:   1.0,
  bossAtkMult:  1.0,
  bossDefMult:  1.0,
  xpMult:       1.0,
  dropRateMult: 1.0,
  label:        'Normal',
  color:        '#3B82F6',
  emoji:        '⚔️',
 },
 hard: {
  bossHpMult:   1.25,
  bossAtkMult:  1.20,
  bossDefMult:  1.15,
  xpMult:       1.30,
  dropRateMult: 1.25,
  label:        'Difícil',
  color:        '#F97316',
  emoji:        '🔥',
 },
 expert: {
  bossHpMult:   1.60,
  bossAtkMult:  1.50,
  bossDefMult:  1.40,
  xpMult:       1.75,
  dropRateMult: 1.50,
  label:        'Experto',
  color:        '#EF4444',
  emoji:        '💀',
 },
}

export class AdaptiveDifficulty {
 // ── Calcular dificultad recomendada según rendimiento ─────────────────────
 static recommend(perf: PlayerPerformance): DifficultyLevel {
  if (perf.totalCombats < 3) return 'normal'
  // Si pierde 3+ veces seguidas → bajar dificultad
  if (perf.consecutiveLosses >= 3) return 'easy'
  // Si gana 5+ veces seguidas con poco daño → subir dificultad
  if (perf.consecutiveWins >= 5 && perf.avgDamageTaken < 0.2) return 'hard'
  // Si gana 10+ veces seguidas con muy poco daño → experto
  if (perf.consecutiveWins >= 10 && perf.avgDamageTaken < 0.1) return 'expert'
  
  // Basado en win rate
  if (perf.winRate < 0.35) return 'easy'
  if (perf.winRate > 0.80 && perf.avgDamageTaken < 0.25) return 'hard'
  
  return 'normal'
 }

 // ── Aplicar modificadores al jefe ─────────────────────────────────────────
 static applyToBoss<T extends { hp: number; maxHp: number; attack: number; defense: number }>(
  boss: T,
  difficulty: DifficultyLevel,
 ): T {
  const mods = DIFFICULTY_MODIFIERS[difficulty]
  return {
   ...boss,
   hp:      Math.floor(boss.hp      * mods.bossHpMult),
   maxHp:   Math.floor(boss.maxHp   * mods.bossHpMult),
   attack:  Math.floor(boss.attack  * mods.bossAtkMult),
   defense: Math.floor(boss.defense * mods.bossDefMult),
  }
 }

 // ── Calcular XP con modificador de dificultad ─────────────────────────────
 static applyXpMult(baseXp: number, difficulty: DifficultyLevel): number {
  return Math.floor(baseXp * DIFFICULTY_MODIFIERS[difficulty].xpMult)
 }

 // ── Mensaje motivacional según rendimiento ────────────────────────────────
 static getMotivationalMessage(perf: PlayerPerformance): string {
  if (perf.consecutiveLosses >= 3) {
   return '¡No te rindas! Cada derrota es una lección. Intenta con dificultad Fácil.'
  }
  if (perf.consecutiveWins >= 5) {
   return '¡Increíble racha! ¿Listo para un mayor desafío?'
  }
  if (perf.winRate < 0.4) {
   return 'Recuerda usar tus habilidades elementales. ¡Las debilidades del jefe son clave!'
  }
  return '¡Sigue así, Aventurero Toka!'
 }
}
