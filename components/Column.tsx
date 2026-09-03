"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Card, ColumnKey } from "@/lib/types";
import SortableCard from "./SortableCard";

export default function Column({
  columnKey,
  label,
  cards,
  onOpenCard,
  onAddCard,
}: {
  columnKey: ColumnKey;
  label: string;
  cards: Card[];
  onOpenCard: (card: Card) => void;
  onAddCard: (columnKey: ColumnKey) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${columnKey}` });

  return (
    <section className="flex w-[85vw] shrink-0 flex-col sm:w-auto sm:flex-1">
      <header className="mb-2 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {label}
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
            {cards.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => onAddCard(columnKey)}
          aria-label={`Nueva tarjeta en ${label}`}
          className="rounded px-2 text-lg leading-none text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        >
          +
        </button>
      </header>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl border-2 border-dashed p-2 transition-colors ${
          isOver ? "border-slate-400 bg-slate-100" : "border-transparent bg-slate-100/60"
        }`}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex min-h-24 flex-col gap-2">
            {cards.map((card) => (
              <SortableCard key={card.id} card={card} onOpen={onOpenCard} />
            ))}
          </ul>
        </SortableContext>

        {cards.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-slate-400">
            Arrastrá tarjetas acá
          </p>
        )}
      </div>
    </section>
  );
}
