export const LORE_ENTRIES = [
  {
    id: 'l1',
    title: 'El Origen de Toka',
    content: 'Toka nació de la necesidad de equilibrar el flujo financiero del multiverso.',
  },
  {
    id: 'l2',
    title: 'La Gran Deuda',
    content: 'Hace siglos, una sombra de intereses acumulados casi consume el Distrito Neón.',
  },
  {
    id: 'l3',
    title: 'El Guardián del Tesoro',
    content: 'Se dice que aquel que controle su presupuesto, controlará su destino.',
  },
];

export const NPCS = {
  guia: {
    name: 'Guía Toka',
    emoji: '🧑🏫',
    description: 'Un sabio mentor que enseña las artes del ahorro.',
  },
};

export interface LoreNPC {
  id: string;
  name: string;
  title: string;
  faction: string;
  backstory: string;
  quests_involved: string[];
  dialogue_lines: string[];
}

export const EXPERIMENTAL_NPCS: LoreNPC[] = [
  {
    id: "npc_kael_stormweaver",
    name: "Kael Vane",
    title: "El Oráculo de la Hiperinflación",
    faction: "Sindicato de la Deuda Oxidada",
    backstory: "Antaño un banquero de nivel corporativo que experimentó con algoritmos prohibidos. Su ambición rompió el tejido de la economía local. Kael adquirió una sensibilidad enfermiza hacia las fluctuaciones crudas del mercado.",
    quests_involved: ["quest_void_ledger", "quest_inflation_eye"],
    dialogue_lines: [
      "¿Sientes cómo la Neblina de Deuda nos asfixia hoy? Tus transacciones están escritas en relámpagos...",
      "He analizado tu libro mayor, Aventurero. Tu alta tasa de victorias solo ha enfurecido a los Dioses del Mercado.",
      "El interés muta, la carne cede. Tu escudo no resistirá el porcentaje de esta tormenta."
    ]
  },
  {
    id: "npc_lyra_nova",
    name: "Lyra Nova",
    title: "Arquitecta de Evasión Térmica",
    faction: "Los Inversores del Vacío",
    backstory: "Lyra es una ingeniera especializada en manipular micro-climas para optimizar los rendimientos de energía. Fue exiliada de su gremio cuando descubrieron que su tecnología ponía en riesgo la matriz económica al anular daños por estrés financiero.",
    quests_involved: ["quest_cooling_the_market", "quest_nova_barrier"],
    dialogue_lines: [
      "Las estadísticas no perdonan, y estás peleando muy por encima de tu margen de vida.",
      "Este clima sofocante quemará tus activos si no inviertes ahora en mi refrigeración criogénica.",
      "El algoritmo está ajustando su balanza para aniquilarte. Déjame ecualizar tus probabilidades."
    ]
  },
  {
    id: "npc_silas_grin",
    name: "Silas Grin",
    title: "El Recaudador Estocástico",
    faction: "Los Sabuesos de la Auditoría",
    backstory: "Silas es el avatar de un software de inteligencia artificial diseñado para ejecutar auditorías implacables. Persigue incansablemente a los endeudados a través de la frontera virtual del TokaVerse.",
    quests_involved: ["quest_audit_of_souls", "quest_balance_the_scales"],
    dialogue_lines: [
      "Tus márgenes de victoria son consistentes... estadísticamente, sospechosamente consistentes.",
      "La lluvia digital oscurece tus comprobantes de nómina, pero yo huelo el déficit oculto a kilómetros.",
      "Abona el peaje de la comodidad antes de que la directriz sistémica emita una ejecución hipotecaria."
    ]
  }
];

