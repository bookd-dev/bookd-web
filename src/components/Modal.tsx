import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n';

export function Modal({
  open,
  title,
  children,
  onClose,
  wide = false
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="modal-backdrop active" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-panel ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true">
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
