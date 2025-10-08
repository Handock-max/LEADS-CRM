/**
 * Service pour gérer les champs personnalisés du workspace
 */

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[]; // Pour les champs select
  placeholder?: string;
  defaultValue?: string;
  order: number;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface CustomFieldValue {
  fieldId: string;
  value: string | number | boolean;
}

class CustomFieldsService {
  /**
   * Valider la configuration d'un champ personnalisé
   */
  validateFieldConfig(field: Partial<CustomField>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!field.name || field.name.trim() === '') {
      errors.push('Le nom du champ est requis');
    }

    if (!field.label || field.label.trim() === '') {
      errors.push('Le libellé du champ est requis');
    }

    if (!field.type) {
      errors.push('Le type de champ est requis');
    }

    // Validation spécifique pour les champs select
    if (field.type === 'select') {
      if (!field.options || field.options.length === 0) {
        errors.push('Les champs de type "select" doivent avoir au moins une option');
      } else if (field.options.some(option => !option || option.trim() === '')) {
        errors.push('Toutes les options doivent avoir une valeur');
      }
    }

    // Validation du nom de champ (doit être un identifiant valide)
    if (field.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
      errors.push('Le nom du champ doit être un identifiant valide (lettres, chiffres et underscore uniquement)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valider la valeur d'un champ personnalisé
   */
  validateFieldValue(field: CustomField, value: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifier si le champ est requis
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push(`Le champ "${field.label}" est obligatoire`);
      return { isValid: false, errors };
    }

    // Si la valeur est vide et le champ n'est pas requis, c'est valide
    if (!value && !field.required) {
      return { isValid: true, errors: [] };
    }

    // Validation selon le type de champ
    switch (field.type) {
      case 'email':
        if (value && !this.isValidEmail(value.toString())) {
          errors.push(`Le champ "${field.label}" doit être une adresse email valide`);
        }
        break;

      case 'phone':
        if (value && !this.isValidPhone(value.toString())) {
          errors.push(`Le champ "${field.label}" doit être un numéro de téléphone valide`);
        }
        break;

      case 'number':
        if (value && isNaN(Number(value))) {
          errors.push(`Le champ "${field.label}" doit être un nombre`);
        }
        if (field.validation?.min !== undefined && Number(value) < field.validation.min) {
          errors.push(`Le champ "${field.label}" doit être supérieur ou égal à ${field.validation.min}`);
        }
        if (field.validation?.max !== undefined && Number(value) > field.validation.max) {
          errors.push(`Le champ "${field.label}" doit être inférieur ou égal à ${field.validation.max}`);
        }
        break;

      case 'text':
      case 'textarea':
        const stringValue = value.toString();
        if (field.validation?.minLength && stringValue.length < field.validation.minLength) {
          errors.push(`Le champ "${field.label}" doit contenir au moins ${field.validation.minLength} caractères`);
        }
        if (field.validation?.maxLength && stringValue.length > field.validation.maxLength) {
          errors.push(`Le champ "${field.label}" ne peut pas dépasser ${field.validation.maxLength} caractères`);
        }
        if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(stringValue)) {
          errors.push(`Le champ "${field.label}" ne respecte pas le format requis`);
        }
        break;

      case 'select':
        if (value && field.options && !field.options.includes(value.toString())) {
          errors.push(`La valeur du champ "${field.label}" n'est pas dans la liste des options autorisées`);
        }
        break;

      case 'date':
        if (value && !this.isValidDate(value.toString())) {
          errors.push(`Le champ "${field.label}" doit être une date valide`);
        }
        break;

      case 'checkbox':
        if (typeof value !== 'boolean') {
          errors.push(`Le champ "${field.label}" doit être une valeur booléenne`);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Générer un identifiant unique pour un nouveau champ
   */
  generateFieldId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convertir un libellé en nom de champ technique
   */
  labelToFieldName(label: string): string {
    return label
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Réorganiser les champs selon un nouvel ordre
   */
  reorderFields(fields: CustomField[], fromIndex: number, toIndex: number): CustomField[] {
    const reorderedFields = [...fields];
    const [movedField] = reorderedFields.splice(fromIndex, 1);
    reorderedFields.splice(toIndex, 0, movedField);

    // Mettre à jour les ordres
    return reorderedFields.map((field, index) => ({
      ...field,
      order: index
    }));
  }

  /**
   * Obtenir la valeur par défaut selon le type de champ
   */
  getDefaultValue(field: CustomField): any {
    if (field.defaultValue !== undefined && field.defaultValue !== '') {
      switch (field.type) {
        case 'number':
          return Number(field.defaultValue);
        case 'checkbox':
          return field.defaultValue === 'true';
        default:
          return field.defaultValue;
      }
    }

    switch (field.type) {
      case 'checkbox':
        return false;
      case 'number':
        return 0;
      default:
        return '';
    }
  }

  /**
   * Formater une valeur pour l'affichage
   */
  formatValueForDisplay(field: CustomField, value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (field.type) {
      case 'checkbox':
        return value ? 'Oui' : 'Non';
      case 'date':
        try {
          return new Date(value).toLocaleDateString('fr-FR');
        } catch {
          return value.toString();
        }
      default:
        return value.toString();
    }
  }

  /**
   * Valider une adresse email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider un numéro de téléphone
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]{8,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Valider une date
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Exporter la configuration des champs personnalisés
   */
  exportFieldsConfig(fields: CustomField[]): string {
    return JSON.stringify(fields, null, 2);
  }

  /**
   * Importer la configuration des champs personnalisés
   */
  importFieldsConfig(configJson: string): { fields: CustomField[] | null; errors: string[] } {
    try {
      const fields = JSON.parse(configJson) as CustomField[];
      const errors: string[] = [];

      // Valider chaque champ
      fields.forEach((field, index) => {
        const validation = this.validateFieldConfig(field);
        if (!validation.isValid) {
          errors.push(`Champ ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (errors.length > 0) {
        return { fields: null, errors };
      }

      return { fields, errors: [] };
    } catch (error) {
      return { 
        fields: null, 
        errors: ['Format JSON invalide'] 
      };
    }
  }
}

export const customFieldsService = new CustomFieldsService();
export default customFieldsService;