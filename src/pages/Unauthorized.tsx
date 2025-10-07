import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Accès non autorisé
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {user && userRole && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Utilisateur:</span> {user.email}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Rôle:</span>{' '}
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  userRole.role === 'admin' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : userRole.role === 'manager'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {userRole.role === 'admin' ? 'Administrateur' : 
                   userRole.role === 'manager' ? 'Manager' : 'Agent'}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleGoHome}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
            
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Page précédente
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Se déconnecter
            </Button>
          </div>

          <div className="text-center">
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