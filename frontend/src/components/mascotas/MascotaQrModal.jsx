import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, X } from 'lucide-react';
import Button from '../ui/Button';
import { getMascotaPublicUrl } from '../../utils/urls';

export default function MascotaQrModal({ mascota, slug, onClose }) {
  const canvasRef = useRef(null);

  if (!mascota || !slug) return null;

  const url = getMascotaPublicUrl(slug, mascota.id);

  const downloadQr = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${mascota.nombre.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-dark/50" onClick={onClose}>
      <div
        className="card p-5 sm:p-8 max-w-sm w-full relative max-h-[calc(100vh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-brown-soft hover:text-brown-dark"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-brown-dark mb-1 pr-8">QR de {mascota.nombre}</h2>
        <p className="text-sm text-brown-soft mb-6">
          Escaneá para abrir la ficha con fotos, historia y formulario de adopción.
        </p>

        <div ref={canvasRef} className="flex justify-center p-4 bg-white rounded-xl border border-cream-200">
          <QRCodeCanvas
            value={url}
            size={200}
            level="M"
            includeMargin
            imageSettings={{
              src: '/favicon.svg',
              height: 36,
              width: 36,
              excavate: true,
            }}
          />
        </div>

        <p className="text-xs text-brown-soft break-all text-center mt-4 px-2">{url}</p>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-5 sm:mt-6">
          <Button type="button" className="flex-1" onClick={downloadQr}>
            <Download className="w-4 h-4" /> Descargar PNG
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
