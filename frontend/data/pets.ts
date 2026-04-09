// data/pets.ts
// TokaVerse RPG — Sistema de Mascotas (Dragones)

export interface PetStage {
    levelRequired: number;
    sprite: any;
    buffText: string;
    buffMultiplier: number;
}

export interface Pet {
    id: string;
    name: string;
    lore: string;
    cost: number;
    type: 'basic' | 'special';
    stage1: PetStage;
    stage2_evolved: PetStage;
}

export const RPG_PETS: Pet[] = [
    // ─── Dragones Básicos ───
    {
        id: 'pet_green_dragon',
        name: 'Dragón Esmeralda',
        type: 'basic',
        lore: 'Las antiguas balanzas comerciales cobraron vida en sus escamas verdes. Esta noble bestia prefiere anidar en cuentas de ahorro y se fortalece con cada día libre de endeudamientos.',
        cost: 1500,
        stage1: {
            levelRequired: 1,
            sprite: require('../assets/pets/Basic Dragon Animations/Baby Green Dragon/BabyGreenDragon.gif'),
            buffText: '+5% XP Constante',
            buffMultiplier: 1.05
        },
        stage2_evolved: {
            levelRequired: 10,
            sprite: require('../assets/pets/Basic Dragon Animations/Adult Green Dragon/AdultGreenDragon.gif'),
            buffText: '+15% XP Constante',
            buffMultiplier: 1.15
        }
    },
    {
        id: 'pet_white_dragon',
        name: 'Dragón de Escarcha',
        type: 'basic',
        lore: 'Sereno e imperturbable ante la volatilidad. El Dragón de Escarcha congela los gastos impulsivos con un aliento polar, enseñándote el frío y calculador arte de preservar la riqueza.',
        cost: 1800,
        stage1: {
            levelRequired: 1,
            sprite: require('../assets/pets/Basic Dragon Animations/Baby White Dragon/BabyWhiteDragon.gif'),
            buffText: '+5% Resistencia Extra',
            buffMultiplier: 1.05
        },
        stage2_evolved: {
            levelRequired: 12,
            sprite: require('../assets/pets/Basic Dragon Animations/Adult White Dragon/AdultWhiteDragon.gif'),
            buffText: '+18% Resistencia Extra',
            buffMultiplier: 1.18
        }
    },
    {
        id: 'pet_brass_dragon',
        name: 'Dragón de Latón',
        type: 'basic',
        lore: 'Bañado en aleaciones antiguas, este guardián se nutre del comercio. Siempre curioso por las tendencias del mercado, resuena cada vez que una inversión florece.',
        cost: 2000,
        stage1: {
            levelRequired: 1,
            sprite: require('../assets/pets/Basic Dragon Animations/Baby Brass Dragon/BabyBrassDragon.gif'),
            buffText: '+10% Daño Físico',
            buffMultiplier: 1.10
        },
        stage2_evolved: {
            levelRequired: 14,
            sprite: require('../assets/pets/Basic Dragon Animations/Young Brass Dragon/YoungBrassDragon.gif'),
            buffText: '+22% Daño Físico',
            buffMultiplier: 1.22
        }
    },

    // ─── Dragones Especiales ───
    {
        id: 'pet_bronze_dragon',
        name: 'Dragón de Bronce',
        type: 'special',
        lore: 'El inquebrantable señor del tiempo y las inversiones a largo plazo. Su caparazón madura reflejando el incesante paso de la magia del interés compuesto.',
        cost: 4500,
        stage1: {
            levelRequired: 1,
            sprite: require('../assets/pets/Basic Dragon Animations/Juvenile Bronze Dragon/JuvenileBronzeDragon.gif'),
            buffText: '+15% Multiplicador Oro',
            buffMultiplier: 1.15
        },
        stage2_evolved: {
            levelRequired: 18,
            sprite: require('../assets/pets/Basic Dragon Animations/Mature Bronze Dragon/MatureBronzeDragon.gif'),
            buffText: '+35% Multiplicador Oro',
            buffMultiplier: 1.35
        }
    },
    {
        id: 'pet_wyvern',
        name: 'Wyvern de Barro',
        type: 'special',
        lore: 'Evoluciona desde un formato miniatura hasta convertirse en una letal máquina de pantano. Absorbe el daño de los contratiempos financieros y lo devuelve en fuerza.',
        cost: 3500,
        stage1: {
            levelRequired: 1,
            sprite: require('../assets/pets/Basic Dragon Animations/Pygmy Wyvern/PygmyWyvern.gif'),
            buffText: '+10% Defensa',
            buffMultiplier: 1.10
        },
        stage2_evolved: {
            levelRequired: 15,
            sprite: require('../assets/pets/Basic Dragon Animations/Mud Wyvern/MudWyvern.gif'),
            buffText: '+25% Defensa',
            buffMultiplier: 1.25
        }
    },
    {
        id: 'pet_drake',
        name: 'Drake Venenoso',
        type: 'special',
        lore: 'De origen acuático, transmutó sus escamas para dominar los toxinas de las malas deudas. Ahora drena la vida de los monstruos financieros en cada turno.',
        cost: 5000,
        stage1: {
            levelRequired: 1,
            sprite: require('../assets/pets/Basic Dragon Animations/Aqua Drake/AquaDrake.gif'),
            buffText: 'Ataque Drena 5 HP',
            buffMultiplier: 1.05
        },
        stage2_evolved: {
            levelRequired: 20,
            sprite: require('../assets/pets/Basic Dragon Animations/Poison Drake/PoisonDrake.gif'),
            buffText: 'Ataque Drena 20 HP',
            buffMultiplier: 1.20
        }
    }
];
