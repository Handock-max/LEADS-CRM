export interface Prospect {
  id: string;
  entreprise: string;
  contact: string;
  poste: string;
  email: string;
  telephone: string;
  statut: 'nouveau' | 'contacte' | 'relance' | 'rdv' | 'gagne' | 'perdu';
  prochaineAction: string;
  notes: string;
}

export const mockProspects: Prospect[] = [
  {
    id: '1',
    entreprise: 'Globex Corp',
    contact: 'Jean Dupont',
    poste: 'Directeur Achat',
    email: 'jean.dupont@globex.com',
    telephone: '+228 90 00 11 22',
    statut: 'contacte',
    prochaineAction: '2025-10-10',
    notes: 'Attente retour devis',
  },
  {
    id: '2',
    entreprise: 'Initech',
    contact: 'Marie Koffi',
    poste: 'Responsable IT',
    email: 'marie.koffi@initech.com',
    telephone: '+228 92 33 44 55',
    statut: 'nouveau',
    prochaineAction: '2025-10-08',
    notes: 'Premier contact LinkedIn',
  },
  {
    id: '3',
    entreprise: 'Umbrella Corporation',
    contact: 'Pierre Mensah',
    poste: 'CEO',
    email: 'p.mensah@umbrella.com',
    telephone: '+228 93 22 11 00',
    statut: 'rdv',
    prochaineAction: '2025-10-12',
    notes: 'RDV confirmé mardi 14h',
  },
  {
    id: '4',
    entreprise: 'Soylent Corp',
    contact: 'Fatou Diallo',
    poste: 'Directrice Commerciale',
    email: 'f.diallo@soylent.com',
    telephone: '+228 91 44 55 66',
    statut: 'gagne',
    prochaineAction: '2025-10-15',
    notes: 'Contrat signé - suivi onboarding',
  },
  {
    id: '5',
    entreprise: 'Hooli',
    contact: 'Koffi Adzovi',
    poste: 'Responsable Achat',
    email: 'k.adzovi@hooli.com',
    telephone: '+228 90 77 88 99',
    statut: 'perdu',
    prochaineAction: '',
    notes: 'Budget insuffisant - recontacter Q1 2026',
  },
];

export interface KPI {
  label: string;
  value: number;
  trend?: string;
  color: string;
}

export const mockKPIs: KPI[] = [
  { label: 'Nouveaux', value: 12, trend: '+3', color: 'text-blue-600' },
  { label: 'RDV planifiés', value: 4, trend: '+1', color: 'text-purple-600' },
  { label: 'Gagnés', value: 3, trend: '+2', color: 'text-green-600' },
  { label: 'Perdus', value: 2, trend: '-1', color: 'text-red-600' },
];

export const mockWeeklyData = [
  { semaine: 'S1', nouveaux: 8, rdv: 2, gagnes: 1, perdus: 1 },
  { semaine: 'S2', nouveaux: 10, rdv: 3, gagnes: 2, perdus: 0 },
  { semaine: 'S3', nouveaux: 15, rdv: 5, gagnes: 3, perdus: 2 },
  { semaine: 'S4', nouveaux: 12, rdv: 4, gagnes: 3, perdus: 2 },
];

export const mockStatusDistribution = [
  { name: 'Nouveau', value: 12, color: 'hsl(var(--status-nouveau))' },
  { name: 'Contacté', value: 8, color: 'hsl(var(--status-contacte))' },
  { name: 'Relance', value: 5, color: 'hsl(var(--status-relance))' },
  { name: 'RDV', value: 4, color: 'hsl(var(--status-rdv))' },
  { name: 'Gagné', value: 3, color: 'hsl(var(--status-gagne))' },
  { name: 'Perdu', value: 2, color: 'hsl(var(--status-perdu))' },
];
