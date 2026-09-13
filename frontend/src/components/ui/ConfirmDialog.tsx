import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  isLoading,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-garnet-50 p-2 text-garnet-600">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </Modal>
  );
}
