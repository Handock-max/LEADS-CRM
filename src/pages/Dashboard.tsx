import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/KPICard';
import { mockKPIs, mockWeeklyData, mockStatusDistribution, mockProspects } from '@/lib/mockData';
import { getCurrentUser } from '@/lib/auth';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const handleExportCSV = () => {
    const headers = ['Entreprise', 'Contact', 'Poste', 'Email', 'Téléphone', 'Statut', 'Prochaine action', 'Notes'];
    const rows = mockProspects.map((p) => [
      p.entreprise,
      p.contact,
      p.poste,
      p.email,
      p.telephone,
      p.statut,
      p.prochaineAction,
      p.notes,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prospects_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({ title: 'Export réussi', description: 'Le fichier CSV a été téléchargé' });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble des performances</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>
      {/* KPIs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Vue d'ensemble</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockKPIs.map((kpi) => (
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
              <BarChart data={mockWeeklyData}>
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
                  data={mockStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
