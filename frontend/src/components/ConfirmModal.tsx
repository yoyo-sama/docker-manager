interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-elevated border border-line rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-semibold tracking-tight mb-2">{title}</h2>
        <p className="text-sm text-muted mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 h-9 rounded-lg border border-line text-sm font-medium hover:bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/20"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 h-9 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
