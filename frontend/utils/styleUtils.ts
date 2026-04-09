import { Platform, ViewStyle } from 'react-native';

/**
 * Genera propiedades de sombra compatibles con Móvil y Web (sin warnings).
 */
export const createShadow = (
  color: string = '#000',
  offsetX: number = 0,
  offsetY: number = 4,
  opacity: number = 0.2,
  radius: number = 4,
  elevation: number = 4
): ViewStyle => {
  return Platform.select({
    web: {
      // @ts-ignore - Propiedad específica de RNW para evitar warnings de shadow*
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    },
    default: {
      shadowColor: color,
      shadowOffset: { width: offsetX, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation: elevation,
    },
  }) as ViewStyle;
};

/**
 * Genera propiedades de sombra de texto compatibles.
 */
export const createTextShadow = (
  color: string = 'rgba(0,0,0,0.5)',
  offsetX: number = 0,
  offsetY: number = 1,
  radius: number = 2
) => {
  return Platform.select({
    web: {
      textShadow: `${offsetX}px ${offsetY}px ${radius}px ${color}`,
    },
    default: {
      textShadowColor: color,
      textShadowOffset: { width: offsetX, height: offsetY },
      textShadowRadius: radius,
    },
  });
};
