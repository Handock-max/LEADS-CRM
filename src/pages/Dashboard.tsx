import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/KPICard';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    dashboardData, 
    loading, 
    error, 
    exportCSV, 
    refreshData, 
    userRole, 
    canExport 
  } = useDashboard();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleExportCSV = async () => {
    try {
      await exportCSV();
      toast({ 
        title: 'Export réussi', 
        description: 'Le fichier CSV a été téléchargé avec vos données autorisées' 
      });
    } catch (err) {
      toast({ 
        title: 'Erreur d\'export', 
        description: err instanceof Error ? err.message : 'Erreur lors de l\'export',
        variant: 'destructive'
      });
    }
  };

  const handleRefresh = () => {
    refreshData();
    toast({ 
      title: 'Actualisation', 
      description: 'Les données ont été actualisées' 
    });
  };

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Erreur lors du chargement des données: {error}</p>
            <Button onClick={handleRefresh} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Afficher un indicateur de chargement
  if (loading || !dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Obtenir le titre selon le rôle
  const getRoleBasedTitle = () => {
    switch (userRole) {
      case 'super_admin':
        return 'Dashboard Global (Super Admin)';
      case 'admin':
        return 'Dashboard Workspace (Admin)';
      case 'manager':
        return 'Dashboard Équipe (Manager)';
      case 'agent':
        return 'Dashboard Personnel (Agent)';
      default:
        return 'Dashboard';
    }
  };

  const getRoleBasedDescription = () => {
    switch (userRole) {
      case 'super_admin':
        return 'Vue d\'ensemble de tous les workspaces';
      case 'admin':
        return 'Vue d\'ensemble de votre workspace';
      case 'manager':
        return 'Vue d\'ensemble de votre équipe et vos prospects';
      case 'agent':
        return 'Vue d\'ensemble de vos prospects personnels';
      default:
        return 'Vue d\'ensemble des performances';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{getRoleBasedTitle()}</h1>
          <p className="text-sm text-muted-foreground">{getRoleBasedDescription()}</p>
          {dashboardData.totalProspects > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.totalProspects} prospect{dashboardData.totalProspects > 1 ? 's' : ''} visible{dashboardData.totalProspects > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          {canExport && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          )}
        </div>
      </div>

      {dashboardData.totalProspects === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun prospect visible selon vos permissions.</p>
          {userRole === 'agent' && (
            <p className="text-sm text-muted-foreground mt-2">
              Vous ne voyez que vos propres prospects et ceux qui vous sont assignés.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Vue d'ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.kpis.map((kpi) => (
                <KPICard key={kpi.label} {...kpi} />
              ))}
            </div>
          </section>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution hebdomadaire</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semaine" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="nouveaux" fill="hsl(var(--status-nouveau))" name="Nouveaux" />
                    <Bar dataKey="rdv" fill="hsl(var(--status-rdv))" name="RDV" />
                    <Bar dataKey="gagnes" fill="hsl(var(--status-gagne))" name="Gagnés" />
                    <Bar dataKey="perdus" fill="hsl(var(--status-perdu))" name="Perdus" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
