// engine/WeatherEngine.ts
// TokaVerse RPG — Motor Climático Financiero
// Inyecta condiciones ambientales reactivas que afectan mecánicas y narrativa.

export type WeatherType = 
  | 'clear'               // Soleado Financiero: Sin efectos, día normal
  | 'interest_storm'      // Tormenta de Interés: Daño gradual a escudos/stamina, costos altos
  | 'debt_fog'            // Neblina de Deuda: Reduce precisión o visibilidad de UI, aumenta evasión enemiga
  | 'financial_heatwave'  // Ola de Calor Financiero: Objetos equipados se degradan más rápido, maná se evapora
  | 'magnetic_storm'      // Tormenta Magnética de Servidores: Errores técnicos, ataques aleatorios fallan
  | 'bureaucratic_rain'   // Lluvia Burocrática: Reduce velocidad de todas las acciones
  | 'market_crash';       // Colapso del Mercado: Todo el daño (recibido y causado) es letal y extremo

export interface WeatherEffect {
  name: string;
  description: string;
  icon: string;
  color: string;
  uiIntensity: number; // 0 a 1 para VFX
}

export const WEATHER_INFO: Record<WeatherType, WeatherEffect> = {
  clear: {
    name: 'Cielo Despejado',
    description: 'El mercado está estable. Condiciones normales.',
    icon: '☀️',
    color: '#38BDF8',
    uiIntensity: 0.0,
  },
  interest_storm: {
    name: 'Tormenta de Interés',
    description: 'El interés compuesto azota el aire. Tus escudos se debilitan pasivamente.',
    icon: '🌩️',
    color: '#8B5CF6',
    uiIntensity: 0.8,
  },
  debt_fog: {
    name: 'Neblina de Deuda',
    description: 'La visión a largo plazo se oscurece. Enemigos ganan +15% de evasión.',
    icon: '🌫️',
    color: '#64748B',
    uiIntensity: 0.5,
  },
  financial_heatwave: {
    name: 'Ola de Calor Financiero',
    description: 'Inflación ardiente. El coste de Maná aumenta un 20%.',
    icon: '🔥',
    color: '#EF4444',
    uiIntensity: 0.6,
  },
  magnetic_storm: {
    name: 'Sobrecarga de Servidores',
    description: 'Errores en la matriz. Las curaciones pueden fallar o invertirse.',
    icon: '⚡',
    color: '#F59E0B',
    uiIntensity: 0.9,
  },
  bureaucratic_rain: {
    name: 'Lluvia Burocrática',
    description: 'Trámites lentos. La barra de turno de todos los combatientes carga más lento.',
    icon: '🌧️',
    color: '#94A3B8',
    uiIntensity: 0.4,
  },
  market_crash: {
    name: 'Colapso del Mercado',
    description: 'Peligro extremo. El daño crítico base es x3 para ambos bandos.',
    icon: '☄️',
    color: '#DC2626',
    uiIntensity: 1.0,
  },
};

export class WeatherEngine {
  private static weatherSequence: WeatherType[] = [
    'clear', 'interest_storm', 'clear', 'debt_fog', 'clear', 'financial_heatwave', 'clear', 'bureaucratic_rain', 'magnetic_storm', 'market_crash'
  ];

  /** Genera el clima actual basado vagamente en una "fecha/hora" simulada o ciclo diario */
  static getCurrentWeather(): WeatherType {
    // Por simplicidad en la demo, obtenemos un clima basado en el día (timestamp / algo grande)
    // Para probar, cambiaremos dinámicamente cada X minutos (o basado en la hora actual del reloj)
    const cyclePeriodMs = 15 * 60 * 1000; // 15 minutos por ciclo
    const epoch = Date.now();
    const cycleIndex = Math.floor(epoch / cyclePeriodMs) % this.weatherSequence.length;
    
    return this.weatherSequence[cycleIndex];
  }

  static getWeatherInfo(type: WeatherType): WeatherEffect {
    return WEATHER_INFO[type];
  }

  /** Función para forzar un clima en pruebas */
  static forceLocalWeather(type: WeatherType): void {
    // En el futuro, podría haber ítems que fuercen climas por N turnos.
    console.log('[WeatherEngine] Forzando el clima local a:', type);
  }
}
