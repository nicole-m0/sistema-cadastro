import { Loader2 } from 'lucide-react';

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export function Spinner({
  size = 'md',
  className = 'text-garnet-500',
}: {
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  return (
    <Loader2
      className={`animate-spin ${sizeMap[size]} ${className}`}
      aria-label="Carregando"
      role="status"
    />
  );
}
