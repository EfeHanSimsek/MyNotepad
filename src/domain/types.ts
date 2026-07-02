export type ThemeMode = "light" | "dark" | "system";
export type ViewKey =
  | "dashboard"
  | "all"
  | "recent"
  | "favorites"
  | "pinned"
  | "archive"
  | "trash"
  | "folders"
  | "tags"
  | "tasks"
  | "calendar"
  | "daily"
  | "templates"
  | "graph"
  | "canvas"
  | "attachments"
  | "settings"
  | "help";

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in-progress" | "done";
export type BlockType =
  | "paragraph"
  | "heading"
  | "todo"
  | "quote"
  | "code"
  | "callout"
  | "table"
  | "divider"
  | "media";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteBlock {
  id: string;
  noteId: string;
  type: BlockType;
  content: string;
  order: number;
  checked?: boolean;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  noteId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  ocrText?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Note {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  folderId?: string;
  tagIds: string[];
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isEncrypted: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Task {
  id: string;
  noteId?: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: Priority;
  status: TaskStatus;
  tagIds: string[];
  reminderAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteVersion {
  id: string;
  noteId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface SharedNote {
  id: string;
  noteId: string;
  permission: "view" | "comment" | "edit";
  publicToken?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  noteId: string;
  blockId?: string;
  authorId: string;
  body: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: "reminder" | "task" | "share" | "comment" | "mention" | "sync" | "export" | "import";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface CanvasNode {
  id: string;
  canvasId: string;
  type:
    | "note"
    | "text"
    | "sticky"
    | "task"
    | "checklist"
    | "image"
    | "pdf"
    | "file"
    | "link"
    | "code"
    | "quote"
    | "callout"
    | "group"
    | "kanban"
    | "table"
    | "mind";
  refId?: string;
  title: string;
  content?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon?: string;
  metadata?: Record<string, string | number | boolean>;
  linkedNoteId?: string;
  linkedTaskId?: string;
  locked?: boolean;
  collapsed?: boolean;
  zIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CanvasEdge {
  id: string;
  canvasId: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  description?: string;
  type?: "related" | "cause" | "source" | "task" | "reference" | "idea" | "decision" | "risk";
  direction?: "one-way" | "two-way";
  color: string;
  strokeStyle?: "solid" | "curved" | "dashed" | "bold";
  metadata?: Record<string, string | number | boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Canvas {
  id: string;
  name: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchSavedQuery {
  id: string;
  name: string;
  query: string;
  createdAt: string;
}

export interface UserSettings {
  theme: ThemeMode;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  autosaveMs: number;
  defaultFolderId?: string;
  defaultTemplateId?: string;
  aiEnabled: boolean;
  aiConsent: boolean;
  notificationsEnabled: boolean;
  syncEnabled: boolean;
  lockAfterMinutes: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface AppState {
  user: User;
  folders: Folder[];
  tags: Tag[];
  notes: Note[];
  tasks: Task[];
  templates: Template[];
  attachments: Attachment[];
  versions: NoteVersion[];
  sharedNotes: SharedNote[];
  comments: Comment[];
  notifications: Notification[];
  canvases: Canvas[];
  savedQueries: SearchSavedQuery[];
  auditLogs: AuditLog[];
  settings: UserSettings;
  lastSyncAt?: string;
}
