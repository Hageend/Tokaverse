// store/usePlayerStore.ts
// TokaVerse — Sistema de Progresión, Niveles y Estadísticas Base

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PlayerState {
  level:       number;
  xp:          number;
  nextLevelXp: number;
  baseMaxHp:   number;
  baseMaxMana: number;
  charClass:   'warrior' | 'archer' | 'mage' | 'rogue' | 'banker' | 'kitsune';
  
  // Acciones
  addXp:       (amount: number) => { leveledUp: boolean; newLevel: number };
  setCharClass: (cls: 'warrior' | 'archer' | 'mage' | 'rogue' | 'banker' | 'kitsune') => void;
  resetPlayer:  () => void;
}

const XP_BASE = 100;
const MAX_LEVEL = 250;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      level:       1,
      xp:          0,
      nextLevelXp: XP_BASE,
      baseMaxHp:   100,
      baseMaxMana: 60,
      charClass:   'warrior', // Default

      addXp: (amount: number) => {
        const s = get();
        if (s.level >= MAX_LEVEL) return { leveledUp: false, newLevel: s.level };

        let newXp    = s.xp + amount;
        let newLevel = s.level;
        let newNext  = s.nextLevelXp;
        let newHp    = s.baseMaxHp;
        let newMana  = s.baseMaxMana;
        let leveled  = false;

        while (newXp >= newNext && newLevel < MAX_LEVEL) {
          newXp -= newNext;
          newLevel++;
          leveled = true;
          // Escalado: +20 HP, +10 Mana por nivel
          newHp   += 20;
          newMana += 10;
          // El XP para el siguiente nivel aumenta un 15% (curva de dificultad)
          newNext = Math.floor(XP_BASE * Math.pow(1.15, newLevel - 1));
        }

        set({
          level:       newLevel,
          xp:          newXp,
          nextLevelXp: newNext,
          baseMaxHp:   newHp,
          baseMaxMana: newMana,
        });

        return { leveledUp: leveled, newLevel };
      },

      setCharClass: (cls) => set({ charClass: cls }),

      resetPlayer: () => set({
        level: 1, xp: 0, nextLevelXp: XP_BASE, baseMaxHp: 100, baseMaxMana: 60, charClass: 'warrior'
      }),
    }),
    {
      name: 'toka-player-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
