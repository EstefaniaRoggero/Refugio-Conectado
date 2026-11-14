import { X } from 'lucide-react';

export default function BackofficeModal({ title, subtitle, onClose, children, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`card w-full ${maxWidth} max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 sm:p-6`}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div><h2 className="text-lg font-bold">{title}</h2>{subtitle && <p className="text-xs text-brown-soft mt-1">{subtitle}</p>}</div>
          <button type="button" onClick={onClose} className="p-1 text-brown-soft hover:text-terracotta" aria-label="Cerrar"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
