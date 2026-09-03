import type { Card } from "@/lib/types";

/** La tarjeta como se ve. Sin logica de arrastre: la usa el tablero y tambien
 *  el "fantasma" que sigue al dedo mientras arrastras. */
export default function CardView({
  card,
  dragging = false,
  onClick,
}: {
  card: Card;
  dragging?: boolean;
  onClick?: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${
        dragging ? "rotate-2 shadow-lg" : "hover:border-slate-300"
      }`}
    >
      <h3 className="text-sm font-semibold leading-snug text-slate-900">
        {card.title}
      </h3>

      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {card.description}
        </p>
      )}

      {(card.assignee || card.due_date) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {card.assignee && <span>{card.assignee}</span>}
          {card.due_date && <span>{formatDate(card.due_date)}</span>}
        </div>
      )}
    </article>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
