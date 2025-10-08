import React, { useState, useEffect } from 'react';
import { CustomField, customFieldsService } from '@/lib/customFieldsService';
import { CustomFieldRenderer } from './CustomFieldRenderer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomFieldsManagerProps {
  fields: CustomField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  title?: string;
  description?: string;
}

export const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
  title = 'Champs personnalisés',
  description = 'Informations supplémentaires'
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(values);

  useEffect(() => {
    setFieldValues(values);
  }, [values]);

  const handleFieldChange = (fieldId: string, value: any) => {
    const newValues = {
      ...fieldValues,
      [fieldId]: value
    };
    setFieldValues(newValues);
    onChange(newValues);
  };

  const validateAllFields = (): { isValid: boolean; errors: Record<string, string> } => {
    const validationErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = fieldValues[field.id];
      const validation = customFieldsService.validateFieldValue(field, value);
      
      if (!validation.isValid) {
        validationErrors[field.id] = validation.errors.join(', ');
        isValid = false;
      }
    });

    return { isValid, errors: validationErrors };
  };

  const getFieldsByOrder = () => {
    return [...fields].sort((a, b) => a.order - b.order);
  };

  if (fields.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {getFieldsByOrder().map(field => (
          <CustomFieldRenderer
            key={field.id}
            field={field}
            value={fieldValues[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            error={errors[field.id]}
            disabled={disabled}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default CustomFieldsManager;