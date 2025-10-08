import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { themeService } from '@/lib/themeService';

/**
 * Hook pour gérer l'application automatique du thème du workspace
 */
export function useWorkspaceTheme() {
  const { workspace } = useAuth();

  useEffect(() => {
    if (workspace?.settings) {
      const settings = workspace.settings as any;
      const { primaryColor, secondaryColor, accentColor } = settings;
      
      // Appliquer les couleurs personnalisées si elles existent
      if (primaryColor || secondaryColor || accentColor) {
        themeService.applyCustomColors({
          primaryColor,
          secondaryColor,
          accentColor
        });
      } else {
        // Réinitialiser aux couleurs par défaut
        themeService.resetToDefaultColors();
      }
    }
  }, [workspace]);

  return {
    applyColors: (colors: { primaryColor?: string; secondaryColor?: string; accentColor?: string }) => {
      themeService.applyCustomColors(colors);
    },
    resetColors: () => {
      themeService.resetToDefaultColors();
    },
    getCurrentColors: () => {
      return themeService.getCurrentColors();
    }
  };
}