# Guide de Personnalisation Avancée du Workspace

Ce guide explique comment utiliser les fonctionnalités de personnalisation avancée du workspace, incluant les thèmes/couleurs et les champs personnalisés.

## Personnalisation des Couleurs

### Fonctionnalités

- **Couleurs personnalisées** : Définissez vos propres couleurs pour refléter votre identité de marque
- **Thèmes prédéfinis** : Choisissez parmi plusieurs thèmes professionnels
- **Aperçu en temps réel** : Visualisez les changements instantanément
- **Application automatique** : Les couleurs sont appliquées automatiquement à l'interface

### Couleurs Configurables

1. **Couleur principale** : Utilisée pour les boutons principaux, liens et éléments d'action
2. **Couleur secondaire** : Utilisée pour les éléments de navigation et les accents subtils
3. **Couleur d'accent** : Utilisée pour les notifications, statuts de succès et éléments de mise en évidence

### Thèmes Prédéfinis

- **Défaut** : Bleu professionnel standard
- **Bleu professionnel** : Tons de bleu plus foncés
- **Vert nature** : Palette verte apaisante
- **Violet créatif** : Couleurs violettes modernes
- **Rouge dynamique** : Rouge énergique
- **Orange énergique** : Orange vif et motivant

### Utilisation

1. Accédez aux **Paramètres du Workspace**
2. Cliquez sur l'onglet **Personnalisation**
3. Dans la section **Couleurs du workspace** :
   - Utilisez les sélecteurs de couleur pour choisir vos couleurs
   - Ou cliquez sur un thème prédéfini
   - Visualisez l'aperçu en temps réel
4. Cliquez sur **Sauvegarder** pour appliquer les changements

## Champs Personnalisés

### Fonctionnalités

- **Types de champs variés** : Texte, nombre, email, téléphone, date, liste déroulante, zone de texte, case à cocher
- **Validation automatique** : Validation selon le type de champ
- **Champs obligatoires** : Marquez les champs comme requis
- **Options personnalisées** : Configurez les options pour les listes déroulantes
- **Réorganisation** : Changez l'ordre des champs par glisser-déposer

### Types de Champs Disponibles

1. **Texte** : Champ de texte simple
2. **Zone de texte** : Texte multiligne pour les descriptions
3. **Nombre** : Valeurs numériques avec validation
4. **Email** : Adresses email avec validation automatique
5. **Téléphone** : Numéros de téléphone
6. **Date** : Sélecteur de date
7. **Liste déroulante** : Options prédéfinies
8. **Case à cocher** : Valeurs booléennes (oui/non)

### Configuration d'un Champ

Pour chaque champ, vous pouvez configurer :

- **Nom technique** : Identifiant unique (généré automatiquement)
- **Libellé** : Nom affiché à l'utilisateur
- **Type** : Type de données
- **Obligatoire** : Si le champ est requis
- **Placeholder** : Texte d'aide
- **Valeur par défaut** : Valeur pré-remplie
- **Options** : Pour les listes déroulantes

### Utilisation

1. Accédez aux **Paramètres du Workspace**
2. Cliquez sur l'onglet **Personnalisation**
3. Dans la section **Champs personnalisés** :
   - Cliquez sur **Ajouter un champ**
   - Remplissez la configuration du champ
   - Pour les listes déroulantes, ajoutez les options
   - Cliquez sur **Créer le champ**
4. Réorganisez les champs en les faisant glisser
5. Cliquez sur **Sauvegarder** pour appliquer les changements

### Validation des Champs

Le système valide automatiquement :

- **Champs obligatoires** : Vérification de la présence de valeur
- **Format email** : Validation du format d'adresse email
- **Format téléphone** : Validation du format de numéro
- **Type numérique** : Vérification que la valeur est un nombre
- **Options de liste** : Vérification que la valeur est dans les options autorisées

## Intégration Technique

### Services Utilisés

- **ThemeService** : Gestion des couleurs et thèmes
- **CustomFieldsService** : Gestion des champs personnalisés
- **WorkspaceService** : Sauvegarde des paramètres

### Composants

- **CustomFieldRenderer** : Rendu d'un champ personnalisé
- **CustomFieldsManager** : Gestion d'un ensemble de champs
- **useWorkspaceTheme** : Hook pour l'application automatique des thèmes

### Stockage

Les paramètres sont stockés dans la colonne `settings` de la table `workspaces` :

```json
{
  "primaryColor": "#3b82f6",
  "secondaryColor": "#64748b", 
  "accentColor": "#10b981",
  "customFields": [
    {
      "id": "field_123",
      "name": "secteur_activite",
      "label": "Secteur d'activité",
      "type": "select",
      "required": true,
      "options": ["Technologie", "Finance", "Santé"],
      "order": 0
    }
  ]
}
```

## Bonnes Pratiques

### Couleurs

- **Contraste** : Assurez-vous que les couleurs offrent un bon contraste pour la lisibilité
- **Cohérence** : Utilisez des couleurs qui s'harmonisent entre elles
- **Accessibilité** : Testez avec des utilisateurs ayant des déficiences visuelles

### Champs Personnalisés

- **Noms explicites** : Utilisez des libellés clairs et compréhensibles
- **Validation appropriée** : Choisissez le bon type de champ pour vos données
- **Organisation logique** : Ordonnez les champs de manière intuitive
- **Champs obligatoires** : Ne rendez obligatoires que les champs vraiment nécessaires

## Dépannage

### Couleurs ne s'appliquent pas

1. Vérifiez que vous avez sauvegardé les paramètres
2. Rechargez la page
3. Vérifiez la console pour les erreurs JavaScript

### Champs personnalisés non visibles

1. Vérifiez que les champs sont bien sauvegardés
2. Assurez-vous que le composant CustomFieldsManager est intégré
3. Vérifiez les permissions utilisateur

### Erreurs de validation

1. Vérifiez la configuration du champ
2. Assurez-vous que les options sont bien définies pour les listes
3. Vérifiez les formats de données (email, téléphone, etc.)

## Support

Pour toute question ou problème avec la personnalisation du workspace, consultez :

1. Cette documentation
2. Les logs de la console navigateur
3. Les messages d'erreur affichés dans l'interface
4. L'équipe de support technique