export default function ToastContainer({ toasts, onClose }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur transition-all duration-300 animate-[toast-in_0.25s_ease-out] ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-slate-200 bg-white text-slate-800"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">
              {toast.type === "success" ? "✅" : toast.type === "error" ? "⚠️" : "ℹ️"}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-6">{toast.message}</p>
            </div>

            <button
              type="button"
              onClick={() => onClose(toast.id)}
              className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-black/5 hover:text-slate-700"
              aria-label="Tutup notifikasi"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
