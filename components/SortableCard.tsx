"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/lib/types";
import CardView from "./CardView";

export default function SortableCard({
  card,
  onOpen,
}: {
  card: Card;
  onOpen: (card: Card) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`touch-none ${isDragging ? "opacity-40" : ""}`}
      {...attributes}
      {...listeners}
    >
      <CardView card={card} onClick={() => onOpen(card)} />
    </li>
  );
}
