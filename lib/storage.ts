import type { Card, ColumnKey } from "./types";

/** Todo el tablero vive en el navegador, bajo esta clave. Si algun dia movemos
 *  los datos a una base, solo hay que reescribir este archivo. */
const KEY = "emi-kanban:v1";

/** Separacion entre posiciones consecutivas. Dejar huecos permite insertar una
 *  tarjeta en el medio calculando el promedio, sin renumerar toda la columna. */
export const GAP = 1000;

type Store = { cards: Card[] };

const EMPTY: Store = { cards: [] };

function readStore(): Store {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Store>;
    return { cards: Array.isArray(parsed.cards) ? parsed.cards : [] };
  } catch {
    // Dato corrupto o localStorage bloqueado: arrancamos vacio en vez de romper.
    return EMPTY;
  }
}

function writeStore(store: Store) {
  window.localStorage.setItem(KEY, JSON.stringify(store));
  invalidate();
}

/* --------------------------------------------------------------------------
 * Suscripcion: React lee el tablero desde aca con useSyncExternalStore, asi la
 * pantalla se actualiza sola cuando cambian los datos — incluso si el cambio
 * vino de otra pestaña abierta con el mismo tablero.
 * ----------------------------------------------------------------------- */

const listeners = new Set<() => void>();

/** getSnapshot tiene que devolver siempre el mismo array mientras nada cambie,
 *  o React entra en un bucle de renders. Por eso lo cacheamos. */
let cache: Card[] | null = null;
const SERVER_SNAPSHOT: Card[] = [];

function invalidate() {
  cache = null;
  for (const listener of listeners) listener();
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key === KEY || event.key === null) invalidate();
}

export function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", handleStorageEvent);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0)
      window.removeEventListener("storage", handleStorageEvent);
  };
}

export function getSnapshot(): Card[] {
  if (cache === null) {
    cache = readStore()
      .cards.filter((c) => !c.archived)
      .sort((a, b) => a.position - b.position);
  }
  return cache;
}

/** En el servidor no hay localStorage: el primer render sale vacio y el
 *  navegador lo completa enseguida. */
export function getServerSnapshot(): Card[] {
  return SERVER_SNAPSHOT;
}

/* --------------------------------------------------------------------------
 * Escrituras
 * ----------------------------------------------------------------------- */

export function createCard(input: {
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  column_key: ColumnKey;
  position: number;
}): Card {
  const now = new Date().toISOString();
  const card: Card = {
    id: crypto.randomUUID(),
    client_id: null,
    done_at: input.column_key === "done" ? now : null,
    archived: false,
    created_at: now,
    updated_at: now,
    ...input,
  };

  const store = readStore();
  writeStore({ cards: [...store.cards, card] });
  return card;
}

export function updateCard(id: string, patch: Partial<Card>) {
  const store = readStore();

  const cards = store.cards.map((card) => {
    if (card.id !== id) return card;

    const next: Card = { ...card, ...patch, updated_at: new Date().toISOString() };

    // Al entrar a Done se guarda la fecha de cierre; al salir, se borra.
    if (next.column_key === "done" && card.column_key !== "done") {
      next.done_at = new Date().toISOString();
    } else if (next.column_key !== "done") {
      next.done_at = null;
    }

    return next;
  });

  writeStore({ cards });
}

export function archiveCard(id: string) {
  updateCard(id, { archived: true });
}
