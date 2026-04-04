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
  charClass:   'warrior' | 'archer' | 'mage' | 'rogue' | 'banker' | 'kitsune' | 'thief' | 'knight' | 'magedark' | 'dog' | 'cat' | 'fox';
  starCoins:   number;         // Moneda de la tienda (Estrella)
  unlockedClasses: string[];   // Clases desbloqueadas
  
  // Acciones
  addXp:       (amount: number) => { leveledUp: boolean; newLevel: number };
  addStarCoins:(amount: number) => void;
  unlockClass: (cls: string) => boolean;
  setCharClass: (cls: any) => void;
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
      starCoins:   1000,      // 1000 Monedas iniciales
      unlockedClasses: ['warrior', 'archer', 'knight', 'mage', 'kitsune', 'thief'], // 3 M / 3 F default

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

      addStarCoins: (amount) => set(s => ({ starCoins: s.starCoins + amount })),

      unlockClass: (cls) => {
        const { unlockedClasses } = get();
        if (unlockedClasses.includes(cls)) return false;
        set(s => ({ unlockedClasses: [...s.unlockedClasses, cls] }));
        return true;
      },

      setCharClass: (cls) => set({ charClass: cls }),

      resetPlayer: () => set({
        level: 1, xp: 0, nextLevelXp: XP_BASE, baseMaxHp: 100, baseMaxMana: 60, charClass: 'warrior',
        starCoins: 1000, unlockedClasses: ['warrior', 'archer', 'knight', 'mage', 'kitsune', 'thief']
      }),
    }),
    {
      name: 'toka-player-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
