import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++toastCounter;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const showSuccess = useCallback((message: string) => push('success', message), [push]);
  const showError = useCallback((message: string) => push('error', message), [push]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
        role="region"
        aria-live="polite"
        aria-label="Notificações"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 rounded-lg border p-4 shadow-card ${
              toast.type === 'success'
                ? 'border-forest-200 bg-forest-50 text-forest-800'
                : 'border-garnet-200 bg-garnet-50 text-garnet-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              aria-label="Fechar notificação"
              className="rounded p-0.5 hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider.');
  }
  return ctx;
}
