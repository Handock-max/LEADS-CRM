import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'nouveau' | 'contacte' | 'relance' | 'rdv' | 'gagne' | 'perdu';
}

const statusConfig = {
  nouveau: { label: 'Nouveau', className: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  contacte: { label: 'Contacté', className: 'bg-sky-100 text-sky-700 hover:bg-sky-200' },
  relance: { label: 'Relance', className: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  rdv: { label: 'RDV', className: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  gagne: { label: 'Gagné', className: 'bg-green-100 text-green-700 hover:bg-green-200' },
  perdu: { label: 'Perdu', className: 'bg-red-100 text-red-700 hover:bg-red-200' },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
};
