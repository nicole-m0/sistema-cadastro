import { ReactNode } from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
  success: 'bg-forest-50 text-forest-700 border-forest-200',
  warning: 'bg-gold-50 text-gold-800 border-gold-300',
  danger: 'bg-garnet-50 text-garnet-700 border-garnet-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
