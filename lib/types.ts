export const COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To do" },
  { key: "doing", label: "Doing" },
  { key: "done", label: "Done" },
] as const;

export type ColumnKey = (typeof COLUMNS)[number]["key"];

export type Client = {
  id: string;
  name: string;
  color: string;
  go_live_date: string | null;
  created_at: string;
};

export type Card = {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  assignee: string | null;
  due_date: string | null;
  column_key: ColumnKey;
  position: number;
  done_at: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};
