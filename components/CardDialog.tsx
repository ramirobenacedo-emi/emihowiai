"use client";

import { useState } from "react";
import type { Card } from "@/lib/types";

export type CardValues = {
  title: string;
  description: string;
  assignee: string;
  due_date: string;
};

export default function CardDialog({
  card,
  columnLabel,
  saving,
  onSave,
  onArchive,
  onClose,
}: {
  card: Card | null;
  columnLabel: string;
  saving: boolean;
  onSave: (values: CardValues) => void;
  onArchive: () => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<CardValues>({
    title: card?.title ?? "",
    description: card?.description ?? "",
    assignee: card?.assignee ?? "",
    due_date: card?.due_date ?? "",
  });

  const set = (key: keyof CardValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (values.title.trim()) onSave(values);
        }}
        className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {card ? "Editar tarjeta" : "Nueva tarjeta"}
          </h2>
          <span className="text-xs text-slate-500">{columnLabel}</span>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Título">
            <input
              autoFocus
              required
              value={values.title}
              onChange={set("title")}
              placeholder="Ej: Configurar integración de nómina"
              className={inputClass}
            />
          </Field>

          <Field label="Descripción corta">
            <textarea
              rows={3}
              value={values.description}
              onChange={set("description")}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Field label="Responsable" className="flex-1">
              <input
                value={values.assignee}
                onChange={set("assignee")}
                placeholder="Ej: Rami"
                className={inputClass}
              />
            </Field>
            <Field label="Fecha límite" className="flex-1">
              <input
                type="date"
                value={values.due_date}
                onChange={set("due_date")}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {card ? (
            <button
              type="button"
              onClick={onArchive}
              disabled={saving}
              className="text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
            >
              Archivar
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !values.title.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500";

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
