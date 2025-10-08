import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX, ArrowLeft, Home, Users, Settings, BarChart3, FileText, AlertTriangle } from 'lucide-react';
import { PermissionErrorContext, AccessiblePage } from '@/types/errors';

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, signOut, isSuperAdmin } = useAuth();

  // Extract error context from location state or URL params
  const errorContext: PermissionErrorContext = location.state?.errorContext || {};
  const currentPath = location.pathname;

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (userRole) {
      // Redirect based on role
      switch (userRole.role) {
        case 'admin':
          navigate('/crm');
          break;
        case 'manager':
          navigate('/dashboard');
          break;
        case 'agent':
          navigate('/dashboard');
          break;
        default:
          navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get specific error message and suggestions based on context
  const getErrorDetails = () => {
    const role = userRole?.role;
    
    // Determine error type based on current path if not provided
    let errorType = errorContext.type;
    if (!errorType) {
      if (currentPath.includes('/user-management')) {
        errorType = 'page_access';
      } else if (currentPath.includes('/workspace-settings')) {
        errorType = 'page_access';
      } else if (currentPath.includes('/workspace-management')) {
        errorType = 'role_insufficient';
      } else {
        errorType = 'page_access';
      }
    }

    switch (errorType) {
      case 'page_access':
        if (currentPath.includes('/user-management')) {
          return {
            title: 'Accès à la gestion des utilisateurs refusé',
            message: role === 'agent' 
              ? 'Seuls les administrateurs et managers peuvent gérer les utilisateurs.'
              : role === 'manager'
              ? 'Seuls les administrateurs peuvent gérer les utilisateurs.'
              : 'Vous n\'avez pas les permissions nécessaires pour gérer les utilisateurs.',
            icon: Users,
            suggestions: role === 'agent' 
              ? ['Consultez vos prospects dans le CRM', 'Visualisez vos statistiques dans le Dashboard']
              : role === 'manager'
              ? ['Gérez vos prospects dans le CRM', 'Consultez les statistiques de votre équipe']
              : ['Contactez votre administrateur pour obtenir les permissions nécessaires']
          };
        } else if (currentPath.includes('/workspace-settings')) {
          return {
            title: 'Accès aux paramètres du workspace refusé',
            message: 'Seuls les administrateurs peuvent modifier les paramètres du workspace.',
            icon: Settings,
            suggestions: role === 'agent' 
              ? ['Consultez vos prospects dans le CRM', 'Visualisez vos statistiques dans le Dashboard']
              : role === 'manager'
              ? ['Gérez vos prospects dans le CRM', 'Assignez des prospects à votre équipe']
              : ['Contactez votre administrateur pour modifier les paramètres']
          };
        } else if (currentPath.includes('/workspace-management')) {
          return {
            title: 'Accès à la gestion des workspaces refusé',
            message: 'Seuls les super administrateurs peuvent gérer les workspaces.',
            icon: Settings,
            suggestions: ['Gérez votre workspace actuel', 'Consultez le CRM et le Dashboard']
          };
        }
        break;
        
      case 'action_denied':
        const action = errorContext.action;
        if (action === 'delete_prospect') {
          return {
            title: 'Suppression de prospect refusée',
            message: role === 'agent' 
              ? 'Vous ne pouvez supprimer que vos propres prospects.'
              : 'Vous ne pouvez supprimer que les prospects que vous avez créés.',
            icon: AlertTriangle,
            suggestions: ['Modifiez le prospect si vous en êtes propriétaire', 'Contactez le créateur du prospect']
          };
        } else if (action === 'modify_prospect') {
          return {
            title: 'Modification de prospect refusée',
            message: role === 'agent'
              ? 'Vous ne pouvez modifier que vos propres prospects ou ceux qui vous sont assignés.'
              : 'Vous ne pouvez modifier que vos prospects ou ceux qui vous sont assignés.',
            icon: AlertTriangle,
            suggestions: ['Vérifiez que le prospect vous est assigné', 'Contactez un manager pour l\'assignation']
          };
        }
        break;
        
      case 'workspace_access':
        return {
          title: 'Accès au workspace refusé',
          message: 'Vous n\'avez pas accès à ce workspace.',
          icon: ShieldX,
          suggestions: ['Retournez à votre workspace', 'Contactez un administrateur']
        };
        
      case 'role_insufficient':
        return {
          title: 'Permissions insuffisantes',
          message: errorContext.requiredRole 
            ? `Cette action nécessite le rôle ${errorContext.requiredRole}.`
            : 'Votre rôle actuel ne permet pas cette action.',
          icon: ShieldX,
          suggestions: ['Contactez votre administrateur pour obtenir les permissions nécessaires']
        };
    }

    // Default error
    return {
      title: 'Accès non autorisé',
      message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.',
      icon: ShieldX,
      suggestions: ['Retournez à la page d\'accueil', 'Contactez votre administrateur']
    };
  };

  // Get accessible pages based on user role
  const getAccessiblePages = (): AccessiblePage[] => {
    if (!userRole) return [];
    
    const pages: AccessiblePage[] = [
      { name: 'CRM', path: '/crm', icon: FileText, description: 'Gérer vos prospects' },
      { name: 'Dashboard', path: '/dashboard', icon: BarChart3, description: 'Visualiser vos statistiques' }
    ];

    if (userRole.role === 'admin' || isSuperAdmin) {
      pages.push(
        { name: 'Gestion utilisateurs', path: '/user-management', icon: Users, description: 'Gérer les utilisateurs' },
        { name: 'Paramètres workspace', path: '/workspace-settings', icon: Settings, description: 'Configurer le workspace' }
      );
    }

    if (isSuperAdmin) {
      pages.push(
        { name: 'Gestion workspaces', path: '/workspace-management', icon: Settings, description: 'Gérer tous les workspaces' }
      );
    }

    return pages;
  };

  const errorDetails = getErrorDetails();
  const accessiblePages = getAccessiblePages();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
            <errorDetails.icon className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorDetails.title}
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            {errorDetails.message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* User Info */}
          {user && userRole && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Utilisateur:</span> {user.email}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Rôle:</span>
                <Badge 
                  variant={
                    userRole.role === 'admin' || isSuperAdmin ? 'default' :
                    userRole.role === 'manager' ? 'secondary' : 'outline'
                  }
                >
                  {isSuperAdmin ? 'Super Admin' :
                   userRole.role === 'admin' ? 'Administrateur' : 
                   userRole.role === 'manager' ? 'Manager' : 'Agent'}
                </Badge>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {errorDetails.suggestions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Suggestions :</h4>
              <ul className="space-y-1">
                {errorDetails.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accessible Pages */}
          {accessiblePages.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pages accessibles :</h4>
              <div className="grid gap-2">
                {accessiblePages.map((page) => (
                  <Button
                    key={page.path}
                    onClick={() => navigate(page.path)}
                    variant="outline"
                    className="justify-start h-auto p-3 text-left"
                  >
                    <page.icon className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{page.name}</div>
                      <div className="text-xs text-gray-500">{page.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleGoHome}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Home className="mr-2 h-4 w-4" />
                Accueil
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </div>

            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Se déconnecter
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;