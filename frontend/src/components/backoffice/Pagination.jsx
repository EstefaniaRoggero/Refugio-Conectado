import Button from '../ui/Button';

export default function Pagination({ page=1, pages=1, total, onChange }) {
  if (pages <= 1) return total != null ? <p className="text-xs text-brown-soft text-center mt-4">{total} registro(s)</p> : null;
  return <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
    <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</Button>
    <span className="text-sm">Página {page} de {pages}{total != null ? ` · ${total} registros` : ''}</span>
    <Button type="button" variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Siguiente</Button>
  </div>;
}
