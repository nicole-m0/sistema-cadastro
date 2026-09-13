import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <div className="rounded-full bg-gold-50 p-3 text-gold-600">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  );
}
