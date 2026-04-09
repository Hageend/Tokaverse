// engine/DialogueEngine.ts
// Motor Auxiliar para resolución de narrativa dinámica

import { WeatherType } from './WeatherEngine';
import { DifficultyLevel, PlayerPerformance } from '../utils/AdaptiveDifficulty';
import { LORE_ENTRIES } from '../data/lore';
import type { LoreNPC } from '../data/lore';

export interface DialogueContext {
  weather: WeatherType;
  difficulty: DifficultyLevel;
  playerLevel: number;
}

export class DialogueEngine {
  /** Selecciona una IA "oradora" y una línea basada puramente en el contexto ambiental/dificultad */
  static getDynamicDialogue(context: DialogueContext, availableNPCs: LoreNPC[]): { speaker: LoreNPC, line: string } {
    if (availableNPCs.length === 0) {
      return { speaker: { id: 'sys', name: 'System', title: 'Error', faction: 'N/A', backstory: '', quests_involved: [], dialogue_lines: [] }, line: 'La estática deforma el sonido...' };
    }

    // 1. Filtrado Preferencial por Clima y Dificultad
    const { weather, difficulty } = context;
    let preferredNPC: LoreNPC | undefined;

    if (weather === 'interest_storm' || weather === 'debt_fog') {
      preferredNPC = availableNPCs.find(n => n.id === 'npc_kael_stormweaver');
    } else if (weather === 'financial_heatwave') {
      preferredNPC = availableNPCs.find(n => n.id === 'npc_lyra_nova');
    } else if (difficulty === 'expert') {
      preferredNPC = availableNPCs.find(n => n.id === 'npc_silas_grin');
    }

    // Fallback aleatorio si no hay match específico
    if (!preferredNPC) {
      preferredNPC = availableNPCs[Math.floor(Math.random() * availableNPCs.length)];
    }

    // 2. Selección de línea específica del NPC
    let lineIndex = 0;
    
    // Reglas rudimentarias de mapeo de líneas a contexto (basadas en nuestro prompt narrativo)
    if (preferredNPC.id === 'npc_kael_stormweaver') {
      if (weather === 'debt_fog') lineIndex = 0;
      else if (difficulty === 'expert') lineIndex = 1;
      else lineIndex = 2;
    } else if (preferredNPC.id === 'npc_lyra_nova') {
      if (weather === 'financial_heatwave') lineIndex = 1;
      else if (difficulty === 'easy') lineIndex = 0;
      else lineIndex = 2;
    } else if (preferredNPC.id === 'npc_silas_grin') {
      if (difficulty === 'expert') lineIndex = 0;
      else if (weather === 'bureaucratic_rain') lineIndex = 1;
      else lineIndex = 2;
    } else {
       lineIndex = Math.floor(Math.random() * preferredNPC.dialogue_lines.length);
    }

    return {
      speaker: preferredNPC,
      line: preferredNPC.dialogue_lines[lineIndex] || preferredNPC.dialogue_lines[0] || '...'
    };
  }
}
