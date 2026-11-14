export default function Loader({ fullScreen = false, text = 'Cargando...' }) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
      <p className="text-brown-soft text-sm">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-50/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }
  return <div className="flex justify-center py-12">{content}</div>;
}
