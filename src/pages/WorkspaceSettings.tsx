import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { workspaceService } from '@/lib/workspaceService';

import { customFieldsService, CustomField } from '@/lib/customFieldsService';
import { themeService } from '@/lib/themeService';

import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { Plus, GripVertical, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Switch } from '@/components/ui/switch';
import userService from '@/lib/userService';
import userService from '@/lib/userService';
import userService from '@/lib/userService';
import userService from '@/lib/userService';
import { CreateUserData } from '@/lib/userService';
import userService from '@/lib/userService';

interface WorkspaceSettingsForm {
  display_name: string;
  settings: {
    theme?: string;
    timezone?: string;
    language?: string;
    notifications?: boolean;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    customFields?: CustomField[];
    [key: string]: any;
  };
}





const WorkspaceSettings: React.FC = () => {
  const { workspace, userRole } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<WorkspaceSettingsForm>({
    display_name: '',
    settings: {}
  });



  // Custom fields management state
  const [showCreateFieldDialog, setShowCreateFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    defaultValue: '',
    options: []
  });

  // Charger les données du workspace au montage
  useEffect(() => {
    if (workspace) {
      setFormData({
        display_name: workspace.display_name || workspace.name,
        settings: workspace.settings || {}
      });
    }
  }, [workspace]);



  // Vérifier les permissions (admin uniquement)
  if (!userRole || userRole.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
          <p className="text-gray-600 mb-4">
            Vous devez être administrateur pour accéder aux paramètres du workspace.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      display_name: e.target.value
    }));
  };

  const handleSettingChange = (key: string, value: string | boolean | CustomField[]) => {
    setFormData((prev: WorkspaceSettingsForm) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!workspace) {
      toast.error('Aucun workspace sélectionné');
      return;
    }

    setSaving(true);
    try {
      // Mettre à jour le nom d'affichage
      if (formData.display_name !== workspace.display_name) {
        const { error: displayNameError } = await workspaceService.updateDisplayName(
          workspace.id,
          formData.display_name
        );
        
        if (displayNameError) {
          throw displayNameError;
        }
      }

      // Mettre à jour les paramètres personnalisés
      const { error: settingsError } = await workspaceService.updateWorkspaceSettings(
        workspace.id,
        formData.settings
      );

      if (settingsError) {
        throw settingsError;
      }

      // Appliquer les couleurs personnalisées si elles ont été modifiées
      if (formData.settings.primaryColor || formData.settings.secondaryColor || formData.settings.accentColor) {
        themeService.applyCustomColors({
          primaryColor: formData.settings.primaryColor,
          secondaryColor: formData.settings.secondaryColor,
          accentColor: formData.settings.accentColor
        });
      }

      toast.success('Paramètres du workspace mis à jour avec succès');
      
      // Recharger la page pour refléter les changements
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Erreur lors de la sauvegarde des paramètres'
      );
    } finally {
      setSaving(false);
    }
  };



  // Gestion des champs personnalisés
  const getCustomFields = (): CustomField[] => {
    return formData.settings.customFields || [];
  };

  const handleCreateField = () => {
    // Valider la configuration du champ
    const validation = customFieldsService.validateFieldConfig(newField);
    if (!validation.isValid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    const customFields = getCustomFields();
    const fieldId = customFieldsService.generateFieldId();
    
    const field: CustomField = {
      id: fieldId,
      name: newField.name || '',
      label: newField.label || '',
      type: newField.type || 'text',
      required: newField.required || false,
      placeholder: newField.placeholder || '',
      defaultValue: newField.defaultValue || '',
      options: newField.options || [],
      order: customFields.length
    };

    const updatedFields = [...customFields, field];
    handleSettingChange('customFields', updatedFields);

    // Reset form
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      defaultValue: '',
      options: []
    });
    setShowCreateFieldDialog(false);
    toast.success('Champ personnalisé créé avec succès');
  };

  const handleUpdateField = (fieldId: string, updates: Partial<CustomField>) => {
    const customFields = getCustomFields();
    const updatedFields = customFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    handleSettingChange('customFields', updatedFields);
  };

  const handleDeleteField = (fieldId: string) => {
    const customFields = getCustomFields();
    const updatedFields = customFields.filter(field => field.id !== fieldId);
    handleSettingChange('customFields', updatedFields);
    toast.success('Champ personnalisé supprimé');
  };

  const handleReorderFields = (dragIndex: number, hoverIndex: number) => {
    const customFields = getCustomFields();
    const draggedField = customFields[dragIndex];
    const updatedFields = [...customFields];
    updatedFields.splice(dragIndex, 1);
    updatedFields.splice(hoverIndex, 0, draggedField);
    
    // Mettre à jour les ordres
    const reorderedFields = updatedFields.map((field, index) => ({
      ...field,
      order: index
    }));
    
    handleSettingChange('customFields', reorderedFields);
  };

  const addFieldOption = () => {
    const currentOptions = newField.options || [];
    setNewField(prev => ({
      ...prev,
      options: [...currentOptions, '']
    }));
  };

  const updateFieldOption = (index: number, value: string) => {
    const currentOptions = newField.options || [];
    const updatedOptions = [...currentOptions];
    updatedOptions[index] = value;
    setNewField(prev => ({
      ...prev,
      options: updatedOptions
    }));
  };

  const removeFieldOption = (index: number) => {
    const currentOptions = newField.options || [];
    const updatedOptions = currentOptions.filter((_, i) => i !== index);
    setNewField(prev => ({
      ...prev,
      options: updatedOptions
    }));
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Paramètres du Workspace
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gérez les paramètres et les utilisateurs de votre workspace
            </p>
          </div>

          <div className="px-6 py-6">
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Paramètres généraux</TabsTrigger>
                <TabsTrigger value="customization">Personnalisation</TabsTrigger>
              </TabsList>

              {/* Onglet Paramètres */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                    <CardDescription>
                      Configurez les paramètres de base de votre workspace
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="workspace-name">Nom du workspace</Label>
                        <Input
                          id="workspace-name"
                          value={workspace?.name || ''}
                          disabled
                          className="bg-gray-50 text-gray-500"
                        />
                        <p className="text-xs text-gray-500">
                          Le nom du workspace ne peut pas être modifié
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="display-name">Nom d'affichage</Label>
                        <Input
                          id="display-name"
                          value={formData.display_name}
                          onChange={handleDisplayNameChange}
                          placeholder="Nom affiché dans l'interface"
                        />
                        <p className="text-xs text-gray-500">
                          Ce nom sera affiché dans l'interface utilisateur
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Paramètres personnalisés</CardTitle>
                    <CardDescription>
                      Personnalisez l'apparence et le comportement de votre workspace
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Thème</Label>
                        <Select
                          value={formData.settings.theme || 'default'}
                          onValueChange={(value: string) => handleSettingChange('theme', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un thème" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Par défaut</SelectItem>
                            <SelectItem value="dark">Sombre</SelectItem>
                            <SelectItem value="light">Clair</SelectItem>
                            <SelectItem value="blue">Bleu professionnel</SelectItem>
                            <SelectItem value="green">Vert nature</SelectItem>
                            <SelectItem value="purple">Violet créatif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Fuseau horaire</Label>
                        <Select
                          value={formData.settings.timezone || 'Europe/Paris'}
                          onValueChange={(value: string) => handleSettingChange('timezone', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un fuseau horaire" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Langue</Label>
                        <Select
                          value={formData.settings.language || 'fr'}
                          onValueChange={(value: string) => handleSettingChange('language', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une langue" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notifications"
                          checked={formData.settings.notifications !== false}
                          onCheckedChange={(checked: boolean) => handleSettingChange('notifications', checked)}
                        />
                        <Label htmlFor="notifications">Activer les notifications</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>



                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </TabsContent>

              {/* Onglet Personnalisation */}
              <TabsContent value="customization" className="space-y-6">
                {/* Personnalisation des couleurs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Couleurs du workspace</CardTitle>
                    <CardDescription>
                      Personnalisez les couleurs de votre workspace pour refléter votre identité
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color">Couleur principale</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            id="primary-color"
                            value={formData.settings.primaryColor || '#3b82f6'}
                            onChange={(e) => {
                              handleSettingChange('primaryColor', e.target.value);
                              // Aperçu en temps réel
                              themeService.applyCustomColors({ primaryColor: e.target.value });
                            }}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <Input
                            value={formData.settings.primaryColor || '#3b82f6'}
                            onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                            placeholder="#3b82f6"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary-color">Couleur secondaire</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            id="secondary-color"
                            value={formData.settings.secondaryColor || '#64748b'}
                            onChange={(e) => {
                              handleSettingChange('secondaryColor', e.target.value);
                              // Aperçu en temps réel
                              themeService.applyCustomColors({ secondaryColor: e.target.value });
                            }}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <Input
                            value={formData.settings.secondaryColor || '#64748b'}
                            onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                            placeholder="#64748b"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accent-color">Couleur d'accent</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            id="accent-color"
                            value={formData.settings.accentColor || '#10b981'}
                            onChange={(e) => {
                              handleSettingChange('accentColor', e.target.value);
                              // Aperçu en temps réel
                              themeService.applyCustomColors({ accentColor: e.target.value });
                            }}
                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <Input
                            value={formData.settings.accentColor || '#10b981'}
                            onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                            placeholder="#10b981"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Thèmes prédéfinis */}
                    <div className="mt-4">
                      <Label className="text-sm font-medium mb-2 block">Thèmes prédéfinis</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {themeService.getPresetThemes().map((theme) => (
                          <button
                            key={theme.name}
                            type="button"
                            onClick={() => {
                              handleSettingChange('primaryColor', theme.colors.primaryColor);
                              handleSettingChange('secondaryColor', theme.colors.secondaryColor);
                              handleSettingChange('accentColor', theme.colors.accentColor);
                              themeService.applyCustomColors(theme.colors);
                            }}
                            className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: theme.colors.primaryColor }}
                              ></div>
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: theme.colors.secondaryColor }}
                              ></div>
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: theme.colors.accentColor }}
                              ></div>
                            </div>
                            <div className="text-xs font-medium">{theme.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aperçu des couleurs */}
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <Label className="text-sm font-medium mb-2 block">Aperçu des couleurs actuelles</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: formData.settings.primaryColor || '#3b82f6' }}
                          ></div>
                          <span className="text-sm">Principale</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: formData.settings.secondaryColor || '#64748b' }}
                          ></div>
                          <span className="text-sm">Secondaire</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: formData.settings.accentColor || '#10b981' }}
                          ></div>
                          <span className="text-sm">Accent</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Configuration des champs personnalisés */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Champs personnalisés</CardTitle>
                        <CardDescription>
                          Configurez des champs supplémentaires pour vos prospects
                        </CardDescription>
                      </div>
                      <Dialog open={showCreateFieldDialog} onOpenChange={setShowCreateFieldDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un champ
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Créer un champ personnalisé</DialogTitle>
                            <DialogDescription>
                              Ajoutez un nouveau champ personnalisé pour enrichir vos données prospects
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="field-name">Nom du champ (technique)</Label>
                                <Input
                                  id="field-name"
                                  value={newField.name}
                                  onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="ex: secteur_activite"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="field-label">Libellé (affiché)</Label>
                                <Input
                                  id="field-label"
                                  value={newField.label}
                                  onChange={(e) => {
                                    const label = e.target.value;
                                    setNewField(prev => ({ 
                                      ...prev, 
                                      label,
                                      // Auto-générer le nom technique si il est vide
                                      name: prev.name || customFieldsService.labelToFieldName(label)
                                    }));
                                  }}
                                  placeholder="ex: Secteur d'activité"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="field-type">Type de champ</Label>
                                <Select
                                  value={newField.type}
                                  onValueChange={(value: any) => setNewField(prev => ({ ...prev, type: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Texte</SelectItem>
                                    <SelectItem value="textarea">Texte long</SelectItem>
                                    <SelectItem value="number">Nombre</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="phone">Téléphone</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="select">Liste déroulante</SelectItem>
                                    <SelectItem value="checkbox">Case à cocher</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center space-x-2 pt-6">
                                <Switch
                                  id="field-required"
                                  checked={newField.required}
                                  onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: checked }))}
                                />
                                <Label htmlFor="field-required">Champ obligatoire</Label>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="field-placeholder">Texte d'aide (placeholder)</Label>
                              <Input
                                id="field-placeholder"
                                value={newField.placeholder}
                                onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                                placeholder="ex: Saisissez le secteur d'activité"
                              />
                            </div>

                            {newField.type === 'select' && (
                              <div className="space-y-2">
                                <Label>Options de la liste déroulante</Label>
                                <div className="space-y-2">
                                  {(newField.options || []).map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <Input
                                        value={option}
                                        onChange={(e) => updateFieldOption(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeFieldOption(index)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addFieldOption}
                                    className="w-full"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ajouter une option
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="field-default">Valeur par défaut</Label>
                              <Input
                                id="field-default"
                                value={newField.defaultValue}
                                onChange={(e) => setNewField(prev => ({ ...prev, defaultValue: e.target.value }))}
                                placeholder="Valeur par défaut (optionnel)"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setShowCreateFieldDialog(false)}
                            >
                              Annuler
                            </Button>
                            <Button onClick={handleCreateField}>
                              Créer le champ
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getCustomFields().length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Aucun champ personnalisé configuré</p>
                        <p className="text-sm text-gray-400">
                          Créez des champs personnalisés pour enrichir vos données prospects
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getCustomFields()
                          .sort((a, b) => a.order - b.order)
                          .map((field, index) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="cursor-move">
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <div className="font-medium">{field.label}</div>
                                <div className="text-sm text-gray-500">
                                  {field.name} • {field.type} 
                                  {field.required && ' • Obligatoire'}
                                </div>
                                {field.placeholder && (
                                  <div className="text-xs text-gray-400">
                                    Placeholder: {field.placeholder}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={field.required ? 'default' : 'secondary'}>
                                {field.required ? 'Obligatoire' : 'Optionnel'}
                              </Badge>
                              <Badge variant="outline">
                                {field.type}
                              </Badge>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer le champ personnalisé</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer le champ "{field.label}" ?
                                      Cette action supprimera également toutes les données associées.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteField(field.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </TabsContent>


            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;