import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    if (!pending) return;
    pending.resolve(value);
    setPending(null);
  };

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <div className="modal-backdrop active" role="presentation">
          <div className="modal-panel confirm-panel" role="dialog" aria-modal="true">
            <h2>{pending.title ?? '确认操作'}</h2>
            <p>{pending.message}</p>
            <div className="dialog-actions">
              <button type="button" className="button secondary" onClick={() => close(false)}>
                {pending.cancelText ?? '取消'}
              </button>
              <button type="button" className={`button ${pending.danger ? 'danger' : 'primary'}`} onClick={() => close(true)}>
                {pending.confirmText ?? '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used inside ConfirmProvider');
  return context;
}
