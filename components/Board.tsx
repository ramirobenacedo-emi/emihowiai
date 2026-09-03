"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  GAP,
  archiveCard,
  createCard,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  updateCard,
} from "@/lib/storage";
import { COLUMNS, type Card, type ColumnKey } from "@/lib/types";
import Column from "./Column";
import CardView from "./CardView";
import CardDialog, { type CardValues } from "./CardDialog";

type DialogState =
  { mode: "new"; columnKey: ColumnKey } | { mode: "edit"; card: Card } | null;

export default function Board() {
  // El tablero se lee de localStorage; React se resuscribe solo a los cambios.
  const cards = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  /** Guarda avisando si el navegador no deja escribir (modo incognito, espacio
   *  lleno), en vez de perder el cambio en silencio. */
  const save = useCallback((mutate: () => void) => {
    try {
      mutate();
      setError(null);
      return true;
    } catch {
      setError(
        "Este navegador no está guardando los cambios (puede ser modo incógnito o falta de espacio).",
      );
      return false;
    }
  }, []);

  const byColumn = useMemo(() => {
    const map = Object.fromEntries(
      COLUMNS.map((c) => [c.key, [] as Card[]]),
    ) as Record<ColumnKey, Card[]>;

    for (const card of cards) map[card.column_key]?.push(card);
    for (const col of COLUMNS)
      map[col.key].sort((a, b) => a.position - b.position);
    return map;
  }, [cards]);

  // En desktop se arrastra al mover el mouse; en celular hay que mantener
  // apretado un instante, asi el scroll del tablero sigue funcionando.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function columnOf(id: string): ColumnKey | null {
    if (id.startsWith("col:")) return id.slice(4) as ColumnKey;
    return cards.find((c) => c.id === id)?.column_key ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const card = cards.find((c) => c.id === active.id);
    const toColumn = columnOf(String(over.id));
    if (!card || !toColumn) return;

    const column = byColumn[toColumn];
    const siblings = column.filter((c) => c.id !== card.id);

    // Donde queda insertada dentro de la columna destino.
    let index = siblings.length;
    const overIndex = siblings.findIndex((c) => c.id === over.id);
    if (overIndex !== -1) {
      const movingDown =
        card.column_key === toColumn &&
        column.findIndex((c) => c.id === card.id) <
          column.findIndex((c) => c.id === over.id);
      index = movingDown ? overIndex + 1 : overIndex;
    }

    const prev = siblings[index - 1];
    const next = siblings[index];
    const position = !prev
      ? (next?.position ?? GAP) - GAP
      : !next
        ? prev.position + GAP
        : (prev.position + next.position) / 2;

    if (card.column_key === toColumn && card.position === position) return;

    save(() => updateCard(card.id, { column_key: toColumn, position }));
  }

  function saveCard(values: CardValues) {
    if (!dialog) return;

    const fields = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      assignee: values.assignee.trim() || null,
      due_date: values.due_date || null,
    };

    const ok = save(() => {
      if (dialog.mode === "new") {
        const last = byColumn[dialog.columnKey].at(-1);
        createCard({
          ...fields,
          column_key: dialog.columnKey,
          position: (last?.position ?? 0) + GAP,
        });
      } else {
        updateCard(dialog.card.id, fields);
      }
    });

    if (ok) setDialog(null);
  }

  function archive() {
    if (dialog?.mode !== "edit") return;
    if (save(() => archiveCard(dialog.card.id))) setDialog(null);
  }

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-base font-semibold text-slate-900">
          Implementaciones
        </h1>
        <button
          type="button"
          onClick={() => setDialog({ mode: "new", columnKey: "todo" })}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nueva tarjeta
        </button>
      </header>

      {error && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-1 gap-3 overflow-x-auto p-4 sm:gap-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              columnKey={col.key}
              label={col.label}
              cards={byColumn[col.key]}
              onOpenCard={(card) => setDialog({ mode: "edit", card })}
              onAddCard={(columnKey) => setDialog({ mode: "new", columnKey })}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && <CardView card={activeCard} dragging />}
        </DragOverlay>
      </DndContext>

      {dialog && (
        <CardDialog
          card={dialog.mode === "edit" ? dialog.card : null}
          columnLabel={
            COLUMNS.find(
              (c) =>
                c.key ===
                (dialog.mode === "edit"
                  ? dialog.card.column_key
                  : dialog.columnKey),
            )?.label ?? ""
          }
          saving={false}
          onSave={saveCard}
          onArchive={archive}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
