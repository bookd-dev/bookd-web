import { Loader2 } from 'lucide-react';
import { useI18n } from '../i18n';

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="state muted">
      <Loader2 className="spin" size={18} />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <div className="state muted">{label}</div>;
}
