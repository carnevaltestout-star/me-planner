interface BookReviewDeleteConfirmProps {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function BookReviewDeleteConfirm({ title, onCancel, onConfirm }: BookReviewDeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[300px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme"
      >
        <h2 className="m-0 text-base text-ink">Delete "{title || "this book review"}"?</h2>
        <p className="m-0 text-sm text-ink-muted">The cover, rating, and everything written for it will be deleted. This can't be undone.</p>
        <div className="mt-0.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-theme-sm border border-[color-mix(in_srgb,#c22a4d_40%,var(--color-border))] px-3.5 py-2 text-sm text-[#c22a4d] hover:bg-[color-mix(in_srgb,#c22a4d_10%,transparent)]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
