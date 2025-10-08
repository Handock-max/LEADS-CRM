/**
 * Service pour gérer les thèmes et couleurs personnalisés du workspace
 */

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface WorkspaceTheme {
  name: string;
  colors: ThemeColors;
}

class ThemeService {
  private readonly CSS_VARIABLES = {
    primary: '--color-primary',
    secondary: '--color-secondary', 
    accent: '--color-accent'
  };

  /**
   * Appliquer les couleurs personnalisées au workspace
   */
  applyCustomColors(colors: Partial<ThemeColors>): void {
    const root = document.documentElement;
    
    if (colors.primaryColor) {
      root.style.setProperty(this.CSS_VARIABLES.primary, colors.primaryColor);
    }
    
    if (colors.secondaryColor) {
      root.style.setProperty(this.CSS_VARIABLES.secondary, colors.secondaryColor);
    }
    
    if (colors.accentColor) {
      root.style.setProperty(this.CSS_VARIABLES.accent, colors.accentColor);
    }
  }

  /**
   * Réinitialiser les couleurs aux valeurs par défaut
   */
  resetToDefaultColors(): void {
    const root = document.documentElement;
    root.style.removeProperty(this.CSS_VARIABLES.primary);
    root.style.removeProperty(this.CSS_VARIABLES.secondary);
    root.style.removeProperty(this.CSS_VARIABLES.accent);
  }

  /**
   * Obtenir les couleurs actuellement appliquées
   */
  getCurrentColors(): ThemeColors {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    return {
      primaryColor: computedStyle.getPropertyValue(this.CSS_VARIABLES.primary) || '#3b82f6',
      secondaryColor: computedStyle.getPropertyValue(this.CSS_VARIABLES.secondary) || '#64748b',
      accentColor: computedStyle.getPropertyValue(this.CSS_VARIABLES.accent) || '#10b981'
    };
  }

  /**
   * Valider qu'une couleur est au format hexadécimal valide
   */
  isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  /**
   * Convertir une couleur hex en RGB
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    if (!this.isValidHexColor(hex)) {
      return null;
    }

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Calculer la luminosité d'une couleur pour déterminer si le texte doit être clair ou sombre
   */
  getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    
    // Formule de luminance relative
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Déterminer si une couleur de texte claire ou sombre doit être utilisée
   */
  getContrastColor(backgroundColor: string): string {
    const luminance = this.getLuminance(backgroundColor);
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Thèmes prédéfinis
   */
  getPresetThemes(): WorkspaceTheme[] {
    return [
      {
        name: 'Défaut',
        colors: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          accentColor: '#10b981'
        }
      },
      {
        name: 'Bleu professionnel',
        colors: {
          primaryColor: '#1e40af',
          secondaryColor: '#475569',
          accentColor: '#0ea5e9'
        }
      },
      {
        name: 'Vert nature',
        colors: {
          primaryColor: '#059669',
          secondaryColor: '#6b7280',
          accentColor: '#34d399'
        }
      },
      {
        name: 'Violet créatif',
        colors: {
          primaryColor: '#7c3aed',
          secondaryColor: '#6b7280',
          accentColor: '#a78bfa'
        }
      },
      {
        name: 'Rouge dynamique',
        colors: {
          primaryColor: '#dc2626',
          secondaryColor: '#6b7280',
          accentColor: '#f87171'
        }
      },
      {
        name: 'Orange énergique',
        colors: {
          primaryColor: '#ea580c',
          secondaryColor: '#6b7280',
          accentColor: '#fb923c'
        }
      }
    ];
  }

  /**
   * Appliquer un thème prédéfini
   */
  applyPresetTheme(themeName: string): void {
    const theme = this.getPresetThemes().find(t => t.name === themeName);
    if (theme) {
      this.applyCustomColors(theme.colors);
    }
  }
}

export const themeService = new ThemeService();
export default themeService;