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
  equippedPet: string | null;  // ID de la mascota actual
  ownedPets:   string[];       // IDs de las mascotas desbloqueadas
  unlockedRecipes: string[];   // IDs de recetas de fusión ocultas
  
  // Acciones
  addXp:       (amount: number) => { leveledUp: boolean; newLevel: number };
  addStarCoins:(amount: number) => void;
  unlockClass: (cls: string) => boolean;
  setCharClass: (cls: any) => void;
  unlockPet:   (petId: string) => boolean;
  setEquippedPet: (petId: string | null) => void;
  unlockRecipe: (recipeId: string) => boolean;
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
      starCoins:   100,       // Tweak a economía rebalanceada (100 base)
      unlockedClasses: ['warrior', 'archer', 'knight', 'mage', 'kitsune', 'thief'], // 3 M / 3 F default
      equippedPet: null,
      ownedPets:   [],
      unlockedRecipes: [],

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

      unlockPet: (petId) => {
        const { ownedPets } = get();
        if (ownedPets.includes(petId)) return false;
        set(s => ({ ownedPets: [...s.ownedPets, petId] }));
        return true;
      },

      setEquippedPet: (petId) => set({ equippedPet: petId }),

      unlockRecipe: (recipeId) => {
        const { unlockedRecipes } = get();
        if (unlockedRecipes.includes(recipeId)) return false;
        set(s => ({ unlockedRecipes: [...s.unlockedRecipes, recipeId] }));
        return true;
      },

      resetPlayer: () => set({
        level: 1, xp: 0, nextLevelXp: XP_BASE, baseMaxHp: 100, baseMaxMana: 60, charClass: 'warrior',
        starCoins: 100, unlockedClasses: ['warrior', 'archer', 'knight', 'mage', 'kitsune', 'thief'],
        equippedPet: null, ownedPets: [], unlockedRecipes: []
      }),
    }),
    {
      name: 'toka-player-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
