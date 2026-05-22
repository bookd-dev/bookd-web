import { Loader2 } from 'lucide-react';

export function LoadingState({ label = '加载中...' }: { label?: string }) {
  return (
    <div className="state muted">
      <Loader2 className="spin" size={18} />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <div className="state muted">{label}</div>;
}
