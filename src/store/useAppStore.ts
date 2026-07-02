import { useCallback, useEffect, useMemo, useState } from "react";
import { createVersion, seedState } from "../domain/seed";
import type { AppState, Attachment, CanvasEdge, CanvasNode, Folder, Note, Tag, Task, ThemeMode } from "../domain/types";
import { createEnvelope, LEGACY_STORAGE_KEYS, migrateEnvelope, STORAGE_KEY } from "../services/storage/migrations";
import { createLocalStorageAdapter } from "../services/storage/localStorageAdapter";
import { StorageReadError } from "../services/storage/types";

const storage = createLocalStorageAdapter<AppState>(STORAGE_KEY);
const corruptedStorageKey = "atlas-notes-corrupted-backup";

function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  const legacyRaw = LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  const source = raw ?? legacyRaw;
  if (!source) return seedState;

  try {
    const parsed = JSON.parse(source);
    return migrateEnvelope(parsed);
  } catch {
    localStorage.setItem(corruptedStorageKey, source);
    return {
      ...seedState,
      notifications: [
        {
          id: crypto.randomUUID(),
          type: "sync",
          title: "Veri kurtarma gerekli",
          body: "Yerel kayıt bozuk görünüyor. Bozuk veri yedeklendi ve demo veriyle açıldı.",
          read: false,
          createdAt: new Date().toISOString()
        },
        ...seedState.notifications
      ]
    };
  }
}

async function persistState(state: AppState) {
  await storage.write(createEnvelope(state));
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setSyncStatus("saving");
    const handle = window.setTimeout(() => {
      persistState({ ...state, lastSyncAt: new Date().toISOString() }).then(() => {
        setSyncStatus("saved");
      }).catch((error) => {
        if (error instanceof StorageReadError) {
          setSyncStatus("error");
          return;
        }
        setSyncStatus("error");
      });
    }, state.settings.autosaveMs);
    return () => window.clearTimeout(handle);
  }, [state]);

  const activeNotes = useMemo(() => state.notes.filter((note) => !note.deletedAt && !note.isArchived), [state.notes]);

  const createNote = useCallback((templateId?: string) => {
    setState((current) => {
      const template = current.templates.find((item) => item.id === templateId) ?? current.templates.find((item) => item.isDefault);
      const createdAt = new Date().toISOString();
      const note: Note = {
        id: crypto.randomUUID(),
        ownerId: current.user.id,
        title: "Başlıksız not",
        content: template?.content ?? "# Başlıksız not\n\n",
        folderId: current.settings.defaultFolderId,
        tagIds: [],
        isFavorite: false,
        isPinned: false,
        isArchived: false,
        isEncrypted: false,
        isShared: false,
        createdAt,
        updatedAt: createdAt
      };
      return {
        ...current,
        notes: [note, ...current.notes],
        versions: [createVersion(note, current.user.id), ...current.versions],
        auditLogs: [
          { id: crypto.randomUUID(), actorId: current.user.id, action: "note.create", entityType: "Note", entityId: note.id, createdAt },
          ...current.auditLogs
        ]
      };
    });
  }, []);

  const updateNote = useCallback((noteId: string, patch: Partial<Note>) => {
    setState((current) => {
      const updatedAt = new Date().toISOString();
      const previous = current.notes.find((note) => note.id === noteId);
      const shouldSnapshot = previous && (patch.content ?? "").length > 0 && previous.content !== patch.content;
      return {
        ...current,
        notes: current.notes.map((note) => (note.id === noteId ? { ...note, ...patch, updatedAt } : note)),
        versions: shouldSnapshot && previous ? [createVersion(previous, current.user.id), ...current.versions].slice(0, 80) : current.versions
      };
    });
  }, []);

  const createTask = useCallback((task: Pick<Task, "title" | "description" | "priority" | "status" | "dueDate" | "noteId" | "tagIds">) => {
    setState((current) => {
      const now = new Date().toISOString();
      return {
        ...current,
        tasks: [{ ...task, id: crypto.randomUUID(), createdAt: now, updatedAt: now }, ...current.tasks]
      };
    });
  }, []);

  const updateTask = useCallback((taskId: string, patch: Partial<Task>) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task))
    }));
  }, []);

  const createFolder = useCallback((name: string, parentId?: string) => {
    setState((current) => {
      const now = new Date().toISOString();
      const folder: Folder = {
        id: crypto.randomUUID(),
        name,
        parentId,
        color: "#2f6fed",
        createdAt: now,
        updatedAt: now
      };
      return { ...current, folders: [folder, ...current.folders] };
    });
  }, []);

  const createTag = useCallback((name: string) => {
    setState((current) => {
      const now = new Date().toISOString();
      const tag: Tag = {
        id: crypto.randomUUID(),
        name,
        color: "#0f9f6e",
        createdAt: now,
        updatedAt: now
      };
      return { ...current, tags: [tag, ...current.tags] };
    });
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({ ...notification, read: true }))
    }));
  }, []);

  const updateCanvasNode = useCallback((canvasId: string, nodeId: string, patch: Partial<CanvasNode>) => {
    setState((current) => ({
      ...current,
      canvases: current.canvases.map((canvas) =>
        canvas.id === canvasId
          ? {
              ...canvas,
              updatedAt: new Date().toISOString(),
              nodes: canvas.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node))
            }
          : canvas
      )
    }));
  }, []);

  const createCanvasNoteNode = useCallback((canvasId: string) => {
    setState((current) => {
      const now = new Date().toISOString();
      const note: Note = {
        id: crypto.randomUUID(),
        ownerId: current.user.id,
        title: "Canvas notu",
        content: "# Canvas notu\n\nBu not canvas üzerinden oluşturuldu.",
        folderId: current.settings.defaultFolderId,
        tagIds: [],
        isFavorite: false,
        isPinned: false,
        isArchived: false,
        isEncrypted: false,
        isShared: false,
        createdAt: now,
        updatedAt: now
      };
      const node: CanvasNode = {
        id: crypto.randomUUID(),
        canvasId,
        type: "note",
        refId: note.id,
        title: note.title,
        x: 160 + current.canvases[0].nodes.length * 24,
        y: 140 + current.canvases[0].nodes.length * 18,
        width: 210,
        height: 118,
        color: "#2f6fed"
      };
      return {
        ...current,
        notes: [note, ...current.notes],
        canvases: current.canvases.map((canvas) =>
          canvas.id === canvasId ? { ...canvas, nodes: [...canvas.nodes, node], updatedAt: now } : canvas
        ),
        versions: [createVersion(note, current.user.id), ...current.versions]
      };
    });
  }, []);

  const createCanvasTextNode = useCallback((canvasId: string) => {
    setState((current) => {
      const now = new Date().toISOString();
      const node: CanvasNode = {
        id: crypto.randomUUID(),
        canvasId,
        type: "text",
        title: "Metin kartı",
        x: 220 + current.canvases[0].nodes.length * 24,
        y: 190 + current.canvases[0].nodes.length * 18,
        width: 220,
        height: 110,
        color: "#0f9f6e"
      };
      return {
        ...current,
        canvases: current.canvases.map((canvas) =>
          canvas.id === canvasId ? { ...canvas, nodes: [...canvas.nodes, node], updatedAt: now } : canvas
        )
      };
    });
  }, []);

  const createCanvasNode = useCallback((canvasId: string, type: CanvasNode["type"], position?: { x: number; y: number }) => {
    setState((current) => {
      const now = new Date().toISOString();
      const canvas = current.canvases.find((item) => item.id === canvasId) ?? current.canvases[0];
      const count = canvas.nodes.length;
      const labels: Record<CanvasNode["type"], string> = {
        note: "Not kartı",
        text: "Metin kartı",
        sticky: "Sticky note",
        task: "Görev kartı",
        checklist: "Checklist",
        image: "Görsel kartı",
        pdf: "PDF kartı",
        file: "Dosya kartı",
        link: "Link önizleme",
        code: "Kod kartı",
        quote: "Alıntı",
        callout: "Uyarı",
        group: "Grup",
        kanban: "Kanban kolonu",
        table: "Mini tablo",
        mind: "Zihin düğümü"
      };
      const colors: Record<CanvasNode["type"], string> = {
        note: "#2f6fed",
        text: "#64748b",
        sticky: "#f5c542",
        task: "#0f9f6e",
        checklist: "#14b8a6",
        image: "#a855f7",
        pdf: "#ef4444",
        file: "#64748b",
        link: "#06b6d4",
        code: "#334155",
        quote: "#8b5cf6",
        callout: "#f97316",
        group: "#94a3b8",
        kanban: "#2563eb",
        table: "#0891b2",
        mind: "#db2777"
      };
      let linkedTaskId: string | undefined;
      let tasks = current.tasks;
      if (type === "task") {
        const task: Task = {
          id: crypto.randomUUID(),
          title: "Canvas görevi",
          description: "Canvas üzerinden oluşturuldu.",
          priority: "medium",
          status: "todo",
          tagIds: [],
          createdAt: now,
          updatedAt: now
        };
        linkedTaskId = task.id;
        tasks = [task, ...tasks];
      }
      const node: CanvasNode = {
        id: crypto.randomUUID(),
        canvasId,
        type,
        title: labels[type],
        content:
          type === "checklist"
            ? "- [ ] İlk madde\n- [ ] İkinci madde"
            : type === "code"
              ? "const idea = 'Atlas Canvas';"
              : type === "link"
                ? "https://example.com"
                : type === "quote"
                  ? "Kısa ve güçlü bir alıntı."
                  : "Kart içeriği",
        x: position?.x ?? 180 + count * 28,
        y: position?.y ?? 160 + count * 22,
        width: type === "group" ? 360 : 230,
        height: type === "group" ? 220 : 132,
        color: colors[type],
        linkedTaskId,
        zIndex: count + 1,
        createdAt: now,
        updatedAt: now
      };
      return {
        ...current,
        tasks,
        canvases: current.canvases.map((item) =>
          item.id === canvasId ? { ...item, nodes: [...item.nodes, node], updatedAt: now } : item
        )
      };
    });
  }, []);

  const deleteCanvasNode = useCallback((canvasId: string, nodeId: string) => {
    setState((current) => ({
      ...current,
      canvases: current.canvases.map((canvas) =>
        canvas.id === canvasId
          ? {
              ...canvas,
              updatedAt: new Date().toISOString(),
              nodes: canvas.nodes.filter((node) => node.id !== nodeId),
              edges: canvas.edges.filter((edge) => edge.fromNodeId !== nodeId && edge.toNodeId !== nodeId)
            }
          : canvas
      )
    }));
  }, []);

  const duplicateCanvasNode = useCallback((canvasId: string, nodeId: string) => {
    setState((current) => ({
      ...current,
      canvases: current.canvases.map((canvas) => {
        if (canvas.id !== canvasId) return canvas;
        const node = canvas.nodes.find((item) => item.id === nodeId);
        if (!node) return canvas;
        const now = new Date().toISOString();
        return {
          ...canvas,
          updatedAt: now,
          nodes: [
            ...canvas.nodes,
            { ...node, id: crypto.randomUUID(), title: `${node.title} kopya`, x: node.x + 28, y: node.y + 28, zIndex: canvas.nodes.length + 1, createdAt: now, updatedAt: now }
          ]
        };
      })
    }));
  }, []);

  const updateCanvasEdge = useCallback((canvasId: string, edgeId: string, patch: Partial<CanvasEdge>) => {
    setState((current) => ({
      ...current,
      canvases: current.canvases.map((canvas) =>
        canvas.id === canvasId
          ? {
              ...canvas,
              updatedAt: new Date().toISOString(),
              edges: canvas.edges.map((edge) => (edge.id === edgeId ? { ...edge, ...patch, updatedAt: new Date().toISOString() } : edge))
            }
          : canvas
      )
    }));
  }, []);

  const deleteCanvasEdge = useCallback((canvasId: string, edgeId: string) => {
    setState((current) => ({
      ...current,
      canvases: current.canvases.map((canvas) =>
        canvas.id === canvasId ? { ...canvas, edges: canvas.edges.filter((edge) => edge.id !== edgeId), updatedAt: new Date().toISOString() } : canvas
      )
    }));
  }, []);

  const connectCanvasNodes = useCallback((canvasId: string, fromNodeId: string, toNodeId: string) => {
    setState((current) => {
      const canvas = current.canvases.find((item) => item.id === canvasId);
      if (!canvas || fromNodeId === toNodeId || canvas.edges.some((edge) => edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId)) {
        return current;
      }
      const now = new Date().toISOString();
      return {
        ...current,
        canvases: current.canvases.map((item) =>
          item.id === canvasId
            ? {
                ...item,
                updatedAt: now,
                edges: [
                  ...item.edges,
                  {
                    id: crypto.randomUUID(),
                    canvasId,
                    fromNodeId,
                    toNodeId,
                    label: "bağlantı",
                    color: "#79a7ff"
                  }
                ]
              }
            : item
        )
      };
    });
  }, []);

  const addAttachment = useCallback((noteId: string, file: File) => {
    setState((current) => {
      const attachment: Attachment = {
        id: crypto.randomUUID(),
        noteId,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        url: URL.createObjectURL(file),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { ...current, attachments: [attachment, ...current.attachments] };
    });
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((current) => ({ ...current, settings: { ...current.settings, theme } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppState["settings"]>) => {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    setState(seedState);
  }, []);

  const recoverCorruptedData = useCallback(() => localStorage.getItem(corruptedStorageKey), []);

  return {
    state,
    setState,
    activeNotes,
    syncStatus,
    createNote,
    updateNote,
    createTask,
    updateTask,
    createFolder,
    createTag,
    markNotificationRead,
    markAllNotificationsRead,
    updateCanvasNode,
    createCanvasNoteNode,
    createCanvasTextNode,
    createCanvasNode,
    deleteCanvasNode,
    duplicateCanvasNode,
    updateCanvasEdge,
    deleteCanvasEdge,
    connectCanvasNodes,
    addAttachment,
    setTheme,
    updateSettings,
    resetDemo,
    recoverCorruptedData
  };
}
